import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../app';
import { prisma } from '../../../config/prisma';
import { JWT_CONFIG } from '../../../config/jwt';

// Mocks de Prisma
jest.mock('../../../config/prisma', () => ({
  prisma: {
    rental: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    board: {
      update: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      aggregate: jest.fn(),
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

describe('Agency Module Tests (MP7 Mostrador Sede Central Playa Grande, Check-in/Out & Multa Salitre)', () => {
  const app = createApp();

  const mockAgencyUser = {
    id: 'operator-agency-1',
    email: 'mostrador@surfrentalmdp.com',
    nombre: 'Recepción Playa Grande',
    role: 'AGENCIA',
    activo: true,
  };

  const mockConsumerUser = {
    id: 'consumer-user-1',
    email: 'consumer@test.com',
    role: 'CONSUMER',
    activo: true,
  };

  const agencyToken = jwt.sign(
    { id: mockAgencyUser.id, sub: mockAgencyUser.id, email: mockAgencyUser.email, role: mockAgencyUser.role },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  const consumerToken = jwt.sign(
    { id: mockConsumerUser.id, sub: mockConsumerUser.id, email: mockConsumerUser.email, role: mockConsumerUser.role },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  const mockBoard = {
    id: 'board-test-1',
    ownerId: 'owner-test-1',
    titulo: 'UVA Classic Nose Rider 9\'2',
    estado: 'DISPONIBLE',
  };

  const mockRental = {
    id: 'rental-checkin-1',
    consumerId: 'consumer-user-1',
    boardId: 'board-test-1',
    horas: 4,
    fechaInicio: new Date(),
    fechaFinEstimada: new Date(Date.now() + 4 * 3600 * 1000),
    precioTotal: 18000,
    estado: 'ACTIVA',
    board: mockBoard,
    consumer: mockConsumerUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: { where: { id: string } }) => {
      if (where.id === mockAgencyUser.id) return Promise.resolve(mockAgencyUser);
      return Promise.resolve(mockConsumerUser);
    });
  });

  describe('POST /api/agency/checkin (Entrega en Sede)', () => {
    it('debe rechazar acceso si el usuario no tiene rol AGENCIA (403 FORBIDDEN)', async () => {
      const res = await request(app)
        .post('/api/agency/checkin')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          rentalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          fotosRetiro: ['https://images.unsplash.com/photo-1.jpg'],
          firmaRetiroUrl: 'data:image/png;base64,mocksignature',
          dniVerificado: true,
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('debe registrar entrega exitosa, marcar rental EN_CURSO y tabla ALQUILADA', async () => {
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.rental.update as jest.Mock).mockResolvedValue({
        ...mockRental,
        estado: 'EN_CURSO',
        fotosRetiro: ['https://images.unsplash.com/photo-1.jpg'],
        firmaRetiroUrl: 'data:image/png;base64,mocksignature',
      });
      (prisma.board.update as jest.Mock).mockResolvedValue({
        ...mockBoard,
        estado: 'ALQUILADA',
      });
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const res = await request(app)
        .post('/api/agency/checkin')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          rentalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          fotosRetiro: ['https://images.unsplash.com/photo-1.jpg'],
          firmaRetiroUrl: 'data:image/png;base64,mocksignature',
          dniVerificado: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(prisma.rental.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ estado: 'EN_CURSO' }),
        })
      );
      expect(prisma.board.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { estado: 'ALQUILADA' },
        })
      );
    });
  });

  describe('POST /api/agency/checkout (Devolución en Sede & Multa Salitre)', () => {
    const mockRentalEnCurso = {
      ...mockRental,
      estado: 'EN_CURSO',
    };

    it('REGLA CRÍTICA: debe cobrar automáticamente $10.000 ARS de multa si la tabla NO fue lavada', async () => {
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRentalEnCurso);
      (prisma.rental.update as jest.Mock).mockResolvedValue({
        ...mockRentalEnCurso,
        estado: 'DEVUELTA',
        lavada: false,
        multaLavado: 10000,
      });
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'fine-1',
        tipo: 'MULTA',
        monto: 10000,
        estado: 'DEBITADO',
      });
      (prisma.board.update as jest.Mock).mockResolvedValue({ ...mockBoard, estado: 'DISPONIBLE' });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

      const res = await request(app)
        .post('/api/agency/checkout')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          rentalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          fotosDevolucion: ['https://images.unsplash.com/dev-photo.jpg'],
          lavada: false, // ¡Devuelta con salitre!
          tieneDanio: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.multaLavado).toBe(10000);
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo: 'MULTA',
            monto: 10000,
            estado: 'DEBITADO',
          }),
        })
      );
    });

    it('debe recibir tabla lavada sin multas (multaLavado: 0)', async () => {
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRentalEnCurso);
      (prisma.rental.update as jest.Mock).mockResolvedValue({
        ...mockRentalEnCurso,
        estado: 'DEVUELTA',
        lavada: true,
        multaLavado: 0,
      });
      (prisma.board.update as jest.Mock).mockResolvedValue({ ...mockBoard, estado: 'DISPONIBLE' });

      const res = await request(app)
        .post('/api/agency/checkout')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          rentalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          fotosDevolucion: ['https://images.unsplash.com/dev-photo.jpg'],
          lavada: true,
          tieneDanio: false,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.multaLavado).toBe(0);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it('debe marcar PENDIENTE_REVISION si se reportan daños en la tabla', async () => {
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRentalEnCurso);
      (prisma.rental.update as jest.Mock).mockResolvedValue({
        ...mockRentalEnCurso,
        estado: 'PENDIENTE_REVISION',
        lavada: true,
      });
      (prisma.board.update as jest.Mock).mockResolvedValue({ ...mockBoard, estado: 'MANTENIMIENTO' });
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const res = await request(app)
        .post('/api/agency/checkout')
        .set('Authorization', `Bearer ${agencyToken}`)
        .send({
          rentalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          fotosDevolucion: ['https://images.unsplash.com/damage-photo.jpg'],
          lavada: true,
          tieneDanio: true,
          descripcionDanio: 'Fisura en quilla central',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.estadoFinal).toBe('PENDIENTE_REVISION');
      expect(prisma.board.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { estado: 'MANTENIMIENTO' },
        })
      );
    });
  });

  describe('GET /api/agency/schedule y /metrics', () => {
    it('debe retornar grilla operativa del día en sede', async () => {
      (prisma.rental.findMany as jest.Mock).mockResolvedValue([mockRental]);

      const res = await request(app)
        .get('/api/agency/schedule')
        .set('Authorization', `Bearer ${agencyToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('debe retornar métricas del mostrador de la agencia', async () => {
      (prisma.rental.count as jest.Mock).mockResolvedValue(3);
      (prisma.board.count as jest.Mock).mockResolvedValue(12);
      (prisma.payment.aggregate as jest.Mock).mockResolvedValue({
        _sum: { monto: 30000 },
        _count: { id: 3 },
      });

      const res = await request(app)
        .get('/api/agency/metrics')
        .set('Authorization', `Bearer ${agencyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.comisionAgenciaPorcentaje).toBe(5);
      expect(res.body.data.multaLavadoEstándar).toBe(10000);
    });
  });
});
