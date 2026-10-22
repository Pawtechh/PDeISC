import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../app';
import { prisma } from '../../../config/prisma';
import { JWT_CONFIG } from '../../../config/jwt';

// Mocks de Prisma
jest.mock('../../../config/prisma', () => ({
  prisma: {
    insuranceClaim: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rental: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    board: {
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Claims & Mediation Module Tests (MP9 Máquina de Estados, Silencio 24h, Mediación y Cobro)', () => {
  const app = createApp();

  const mockConsumerUser = {
    id: 'consumer-user-1',
    email: 'consumer@surf.com',
    nombre: 'Gonzalo Surfista',
    role: 'CONSUMER',
    activo: true,
  };

  const mockOwnerUser = {
    id: 'owner-user-1',
    email: 'owner@surf.com',
    nombre: 'Martín Shaper',
    role: 'OWNER',
    activo: true,
  };

  const mockAgencyUser = {
    id: 'agency-user-1',
    email: 'mostrador@surf.com',
    nombre: 'Operador Playa Grande',
    role: 'AGENCIA',
    activo: true,
  };

  const consumerToken = jwt.sign(
    {
      id: mockConsumerUser.id,
      sub: mockConsumerUser.id,
      email: mockConsumerUser.email,
      role: mockConsumerUser.role,
    },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  const ownerToken = jwt.sign(
    {
      id: mockOwnerUser.id,
      sub: mockOwnerUser.id,
      email: mockOwnerUser.email,
      role: mockOwnerUser.role,
    },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  const agencyToken = jwt.sign(
    {
      id: mockAgencyUser.id,
      sub: mockAgencyUser.id,
      email: mockAgencyUser.email,
      role: mockAgencyUser.role,
    },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.id === mockConsumerUser.id) return Promise.resolve(mockConsumerUser);
      if (where.id === mockOwnerUser.id) return Promise.resolve(mockOwnerUser);
      if (where.id === mockAgencyUser.id) return Promise.resolve(mockAgencyUser);
      return Promise.resolve(null);
    });
  });

  describe('1. Creación de Reclamo - POST /api/claims', () => {
    it('debe crear un reclamo en estado NOTIFICADO y fijar plazo de 24 horas', async () => {
      const mockRental = {
        id: 'rental-claim-1',
        boardId: 'board-claim-1',
        consumerId: mockConsumerUser.id,
        board: {
          id: 'board-claim-1',
          titulo: 'Camet Retro Fish 5\'8',
          ownerId: mockOwnerUser.id,
        },
        consumer: mockConsumerUser,
      };

      const now = new Date();
      const mockCreatedClaim = {
        id: 'claim-1',
        rentalId: mockRental.id,
        reportadoPorId: mockOwnerUser.id,
        montoReclamado: 15000,
        descripcion: 'Fisura lateral de 10cm en canto con ingreso de salitre',
        fotosDano: ['https://storage.surf.com/dano1.jpg'],
        estado: 'NOTIFICADO',
        notificadoAt: now,
        plazoDisputaVence: new Date(now.getTime() + 24 * 3600 * 1000),
        rental: mockRental,
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.insuranceClaim.create as jest.Mock).mockResolvedValue(mockCreatedClaim);
      (prisma.rental.update as jest.Mock).mockResolvedValue({ ...mockRental, estado: 'RECLAMO' });
      (prisma.board.update as jest.Mock).mockResolvedValue({ id: 'board-claim-1', estado: 'MANTENIMIENTO' });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

      const res = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          rentalId: 'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          descripcion: 'Fisura lateral de 10cm en canto con ingreso de salitre',
          fotosDano: ['https://storage.surf.com/dano1.jpg'],
          montoReclamado: 15000,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.estado).toBe('NOTIFICADO');
      expect(prisma.rental.update).toHaveBeenCalledWith({
        where: { id: mockRental.id },
        data: { estado: 'RECLAMO' },
      });
      expect(prisma.board.update).toHaveBeenCalledWith({
        where: { id: mockRental.boardId },
        data: { estado: 'MANTENIMIENTO' },
      });
    });
  });

  describe('2. Respuesta del Consumidor - POST /api/claims/:id/respond', () => {
    it('debe permitir al consumidor ACEPTAR la responsabilidad y debitar la pre-autorización', async () => {
      const mockClaim = {
        id: 'claim-accept-1',
        montoReclamado: 12000,
        estado: 'NOTIFICADO',
        rental: {
          id: 'rental-1',
          consumerId: mockConsumerUser.id,
          board: { id: 'b-1', titulo: 'UVA Classic 9\'2', ownerId: mockOwnerUser.id },
          payments: [
            {
              id: 'pay-hold-1',
              tipo: 'PRE_AUTH_DANO',
              estado: 'PRE_AUTORIZADO',
              monto: 30000, // Pre-autorización de $30.000 ARS
            },
          ],
        },
      };

      (prisma.insuranceClaim.findUnique as jest.Mock).mockResolvedValue(mockClaim);
      (prisma.insuranceClaim.update as jest.Mock).mockResolvedValue({ ...mockClaim, estado: 'ACEPTADO' });
      (prisma.payment.update as jest.Mock).mockResolvedValue({ id: 'pay-hold-1', estado: 'DEBITADO' });
      (prisma.rental.update as jest.Mock).mockResolvedValue({ id: 'rental-1', estado: 'DEVUELTA' });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

      const res = await request(app)
        .post('/api/claims/claim-accept-1/respond')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          accion: 'ACEPTAR',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.estado).toBe('ACEPTADO');
      expect(res.body.data.cobro.montoCobrado).toBe(12000);
      expect(prisma.payment.update).toHaveBeenCalled();
    });

    it('debe transicionar a EN_MEDIACION cuando el consumidor DISPUTA el cargo', async () => {
      const mockClaim = {
        id: 'claim-dispute-1',
        montoReclamado: 15000,
        estado: 'NOTIFICADO',
        rental: {
          id: 'rental-1',
          consumerId: mockConsumerUser.id,
          board: { id: 'b-1', titulo: 'Camet Retro Fish 5\'8', ownerId: mockOwnerUser.id },
        },
      };

      (prisma.insuranceClaim.findUnique as jest.Mock).mockResolvedValue(mockClaim);
      (prisma.insuranceClaim.update as jest.Mock).mockResolvedValue({
        ...mockClaim,
        estado: 'EN_MEDIACION',
      });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-dispute' });

      const res = await request(app)
        .post('/api/claims/claim-dispute-1/respond')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          accion: 'DISPUTAR',
          motivoDisputa: 'La tabla ya tenía esa micro-fisura al momento del retiro en mostrador',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.estado).toBe('EN_MEDIACION');
    });
  });

  describe('3. Regla No Negociable: Silencio del Consumer tras 24h = Aceptación', () => {
    it('debe ejecutar cobro automático cuando vence el plazo de 24 horas sin respuesta', async () => {
      const pastDate = new Date(Date.now() - 25 * 3600 * 1000); // Venció hace 1 hora

      const mockExpiredClaim = {
        id: 'claim-expired-1',
        montoReclamado: 18000,
        estado: 'NOTIFICADO',
        plazoDisputaVence: pastDate,
        rental: {
          id: 'rental-exp-1',
          consumerId: mockConsumerUser.id,
          board: { id: 'b-1', titulo: 'UVA Classic 9\'2', ownerId: mockOwnerUser.id },
          payments: [
            {
              id: 'hold-1',
              tipo: 'PRE_AUTH_DANO',
              estado: 'PRE_AUTORIZADO',
              monto: 30000,
            },
          ],
        },
      };

      (prisma.insuranceClaim.findMany as jest.Mock).mockResolvedValue([mockExpiredClaim]);
      (prisma.insuranceClaim.findUnique as jest.Mock).mockResolvedValue(mockExpiredClaim);
      (prisma.insuranceClaim.update as jest.Mock).mockResolvedValue({
        ...mockExpiredClaim,
        estado: 'COBRADO',
      });
      (prisma.payment.update as jest.Mock).mockResolvedValue({ id: 'hold-1', estado: 'DEBITADO' });
      (prisma.rental.update as jest.Mock).mockResolvedValue({ id: 'rental-exp-1', estado: 'DEVUELTA' });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-cron' });

      const res = await request(app)
        .post('/api/claims/cron/check-expired')
        .set('Authorization', `Bearer ${agencyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.totalProcesados).toBe(1);
      expect(res.body.data.claimsAfectados).toContain('claim-expired-1');
    });
  });

  describe('4. Mediación y Arbitraje de Agencia - POST /api/claims/:id/mediate', () => {
    it('RESUELTO_OWNER: debe dar la razón al dueño y debitar el monto aprobado', async () => {
      const mockClaim = {
        id: 'claim-mediate-1',
        montoReclamado: 15000,
        estado: 'EN_MEDIACION',
        rental: {
          id: 'rental-med-1',
          consumerId: mockConsumerUser.id,
          board: { id: 'b-1', titulo: 'Camet Retro Fish 5\'8', ownerId: mockOwnerUser.id },
          payments: [
            {
              id: 'hold-med-1',
              tipo: 'PRE_AUTH_DANO',
              estado: 'PRE_AUTORIZADO',
              monto: 30000,
            },
          ],
        },
      };

      (prisma.insuranceClaim.findUnique as jest.Mock).mockResolvedValue(mockClaim);
      (prisma.insuranceClaim.update as jest.Mock).mockResolvedValue({
        ...mockClaim,
        estado: 'RESUELTO_OWNER',
        montoReclamado: 12000,
      });
      (prisma.payment.update as jest.Mock).mockResolvedValue({ id: 'hold-med-1', estado: 'DEBITADO' });
      (prisma.rental.update as jest.Mock).mockResolvedValue({ id: 'rental-med-1', estado: 'DEVUELTA' });
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const res = await request(app)
        .post('/api/claims/claim-mediate-1/mediate')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          resolucion: 'RESUELTO_OWNER',
          resolucionAgencia: 'Fotos de entrega cotejadas: la quilla no estaba astillada al retiro.',
          montoAprobado: 12000,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.resolucion).toBe('RESUELTO_OWNER');
      expect(res.body.data.cobro.montoCobrado).toBe(12000);
    });

    it('RESUELTO_CONSUMER: debe desestimar el reclamo, liberar la pre-autorización y rehabilitar tabla', async () => {
      const mockClaim = {
        id: 'claim-mediate-2',
        montoReclamado: 15000,
        estado: 'EN_MEDIACION',
        rental: {
          id: 'rental-med-2',
          boardId: 'b-2',
          consumerId: mockConsumerUser.id,
          board: { id: 'b-2', titulo: 'Camet Retro Fish 5\'8', ownerId: mockOwnerUser.id },
          payments: [],
        },
      };

      (prisma.insuranceClaim.findUnique as jest.Mock).mockResolvedValue(mockClaim);
      (prisma.insuranceClaim.update as jest.Mock).mockResolvedValue({
        ...mockClaim,
        estado: 'RESUELTO_CONSUMER',
      });
      (prisma.payment.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.rental.update as jest.Mock).mockResolvedValue({ id: 'rental-med-2', estado: 'DEVUELTA' });
      (prisma.board.update as jest.Mock).mockResolvedValue({ id: 'b-2', estado: 'DISPONIBLE' });
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const res = await request(app)
        .post('/api/claims/claim-mediate-2/mediate')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          resolucion: 'RESUELTO_CONSUMER',
          resolucionAgencia: 'Se verificó en fotos de check-in que el detalle era desgaste cosmético previo.',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.resolucion).toBe('RESUELTO_CONSUMER');
      expect(prisma.board.update).toHaveBeenCalledWith({
        where: { id: 'b-2' },
        data: { estado: 'DISPONIBLE' },
      });
    });
  });
});
