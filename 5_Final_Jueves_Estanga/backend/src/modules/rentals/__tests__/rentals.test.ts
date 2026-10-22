import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../app';
import { prisma } from '../../../config/prisma';
import { JWT_CONFIG } from '../../../config/jwt';

// Mocks de Prisma
jest.mock('../../../config/prisma', () => ({
  prisma: {
    board: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rental: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    payment: {
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Rentals Module Tests (MP5 Cotizaciones, Reservas y Cancelación Escalonada)', () => {
  const app = createApp();

  const mockConsumer = {
    id: 'user-consumer-1',
    email: 'consumer@surf.com',
    role: 'CONSUMER',
    activo: true,
  };

  const mockBoard = {
    id: 'board-test-1',
    ownerId: 'owner-test-1',
    titulo: 'UVA Classic Nose Rider 9\'2',
    marca: 'UVA Surfboards',
    modelo: 'Nose Rider',
    precioHora: 4000,
    valorTasadoUsd: 450,
    estado: 'DISPONIBLE',
  };

  const consumerToken = jwt.sign(
    { sub: mockConsumer.id, email: mockConsumer.email, role: mockConsumer.role },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockConsumer);
  });

  describe('POST /api/rentals/quote', () => {
    it('debe cotizar alquiler aplicando descuento de día completo (25%) para 8 horas', async () => {
      (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
      (prisma.rental.findFirst as jest.Mock).mockResolvedValue(null); // sin conflicto

      // Mañana a las 10:00 (dentro de 6:00 a 21:00)
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 1);
      fecha.setHours(10, 0, 0, 0);

      const res = await request(app)
        .post('/api/rentals/quote')
        .send({
          boardId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          horas: 8,
          fechaInicio: fecha.toISOString(),
          puntosUsados: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.quote.precioBase).toBe(32000); // 8 * 4000
      expect(res.body.data.quote.descuentoTotal).toBe(8000); // 25% de 32000
      expect(res.body.data.quote.precioTotal).toBe(24000);
      expect(res.body.data.quote.gananciaAgencia).toBe(1600); // 5% de 32000
      expect(res.body.data.quote.gananciaOwner).toBe(22400); // 24000 - 1600
    });

    it('debe rechazar cotización si el horario de devolución supera las 21:00 hs', async () => {
      (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);

      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 1);
      fecha.setHours(18, 0, 0, 0); // 18hs + 5hs = 23hs (> 21hs)

      const res = await request(app)
        .post('/api/rentals/quote')
        .send({
          boardId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          horas: 5,
          fechaInicio: fecha.toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_OPERATING_HOURS');
      expect(res.body.message).toContain('21:00');
    });

    it('debe devolver 409 si hay solapamiento con otra reserva en la sede', async () => {
      (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
      // Simula conflicto existente
      (prisma.rental.findFirst as jest.Mock).mockResolvedValue({ id: 'conflicting-1' });

      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 1);
      fecha.setHours(10, 0, 0, 0);

      const res = await request(app)
        .post('/api/rentals/quote')
        .send({
          boardId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          horas: 3,
          fechaInicio: fecha.toISOString(),
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('RENTAL_CONFLICT');
    });
  });

  describe('POST /api/rentals (Creación de Reserva)', () => {
    it('debe rechazar creación sin token con 401 UNAUTHORIZED', async () => {
      const res = await request(app)
        .post('/api/rentals')
        .send({
          boardId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          horas: 2,
          fechaInicio: new Date().toISOString(),
        });

      expect(res.status).toBe(401);
    });

    it('debe crear reserva exitosamente con hash criptográfico y notificaciones', async () => {
      (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
      (prisma.rental.findFirst as jest.Mock).mockResolvedValue(null);

      const fakeCreatedRental = {
        id: 'rental-new-1',
        consumerId: mockConsumer.id,
        boardId: mockBoard.id,
        horas: 4,
        precioBase: 16000,
        precioTotal: 16000,
        gananciaOwner: 15200,
        gananciaAgencia: 800,
        estado: 'ACTIVA',
        contratoHash: 'sha256-hash-sample',
        board: mockBoard,
      };

      (prisma.rental.create as jest.Mock).mockResolvedValue(fakeCreatedRental);
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const fecha = new Date();
      fecha.setDate(fecha.getDate() + 2);
      fecha.setHours(11, 0, 0, 0);

      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          boardId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          horas: 4,
          fechaInicio: fecha.toISOString(),
          versionTerminos: '1.0',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.rental.id).toBe('rental-new-1');
      expect(prisma.rental.create).toHaveBeenCalled();
      expect(prisma.notification.createMany).toHaveBeenCalled();
    });

    it('debe rechazar con 422 PAST_TIME_SLOT si la hora seleccionada ya pasó o tiene menos de 1h de anticipación', async () => {
      (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);

      // Fecha en el pasado o dentro de los próximos 30 minutos
      const fechaInvalida = new Date(Date.now() + 20 * 60 * 1000);

      const res = await request(app)
        .post('/api/rentals')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          boardId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          horas: 2,
          fechaInicio: fechaInvalida.toISOString(),
          versionTerminos: '1.0',
        });

      expect(res.status).toBe(422);
      expect(res.body.code).toBe('PAST_TIME_SLOT');
      expect(res.body.message).toContain('60 min');
    });
  });

  describe('POST /api/rentals/:id/cancel (Cancelación Escalonada)', () => {
    it('debe cancelar y calcular reembolso según horas restantes', async () => {
      // Alquiler que inicia dentro de 80 horas -> reembolso 100%
      const fechaFutura = new Date(Date.now() + 80 * 3600 * 1000);
      const mockRental = {
        id: 'rental-to-cancel-1',
        consumerId: mockConsumer.id,
        precioTotal: 10000,
        fechaInicio: fechaFutura,
        estado: 'ACTIVA',
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.rental.update as jest.Mock).mockResolvedValue({ ...mockRental, estado: 'CANCELADA' });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

      const res = await request(app)
        .post('/api/rentals/rental-to-cancel-1/cancel')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          motivo: 'Condiciones de olas desfavorables',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.estado).toBe('CANCELADA');
      expect(res.body.data.refund.porcentajeReembolso).toBe(1.0);
      expect(res.body.data.refund.montoReembolso).toBe(10000);
      expect(res.body.data.reembolso.porcentaje).toBe(100);
      expect(res.body.data.reembolso.monto).toBe(10000);
      expect(prisma.rental.update).toHaveBeenCalled();
    });

    it('debe calcular 70% de reembolso entre 24h y 72h de anticipación', async () => {
      const fechaFutura = new Date(Date.now() + 48 * 3600 * 1000);
      const mockRental = {
        id: 'rental-48h',
        consumerId: mockConsumer.id,
        precioTotal: 20000,
        fechaInicio: fechaFutura,
        estado: 'ACTIVA',
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.rental.update as jest.Mock).mockResolvedValue({ ...mockRental, estado: 'CANCELADA' });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-2' });

      const res = await request(app)
        .post('/api/rentals/rental-48h/cancel')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ motivo: 'Cambio de planes' });

      expect(res.status).toBe(200);
      expect(res.body.data.reembolso.porcentaje).toBe(70);
      expect(res.body.data.reembolso.monto).toBe(14000);
    });

    it('debe calcular 40% de reembolso entre 6h y 24h de anticipación', async () => {
      const fechaFutura = new Date(Date.now() + 10 * 3600 * 1000);
      const mockRental = {
        id: 'rental-10h',
        consumerId: mockConsumer.id,
        precioTotal: 20000,
        fechaInicio: fechaFutura,
        estado: 'ACTIVA',
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.rental.update as jest.Mock).mockResolvedValue({ ...mockRental, estado: 'CANCELADA' });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-3' });

      const res = await request(app)
        .post('/api/rentals/rental-10h/cancel')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ motivo: 'Lluvia repentina' });

      expect(res.status).toBe(200);
      expect(res.body.data.reembolso.porcentaje).toBe(40);
      expect(res.body.data.reembolso.monto).toBe(8000);
    });

    it('debe calcular 0% de reembolso con menos de 6h de anticipación', async () => {
      const fechaFutura = new Date(Date.now() + 2 * 3600 * 1000);
      const mockRental = {
        id: 'rental-2h',
        consumerId: mockConsumer.id,
        precioTotal: 15000,
        fechaInicio: fechaFutura,
        estado: 'ACTIVA',
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.rental.update as jest.Mock).mockResolvedValue({ ...mockRental, estado: 'CANCELADA' });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-4' });

      const res = await request(app)
        .post('/api/rentals/rental-2h/cancel')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ motivo: 'Aviso de último momento' });

      expect(res.status).toBe(200);
      expect(res.body.data.reembolso.porcentaje).toBe(0);
      expect(res.body.data.reembolso.monto).toBe(0);
    });

    it('debe rechazar cancelación si el alquiler ya está en estado DEVUELTA', async () => {
      const mockRentalDevuelta = {
        id: 'rental-devuelta-1',
        consumerId: mockConsumer.id,
        estado: 'DEVUELTA',
        precioTotal: 10000,
        fechaInicio: new Date(),
      };
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRentalDevuelta);

      const res = await request(app)
        .post('/api/rentals/rental-devuelta-1/cancel')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({ motivo: 'Intento cancelacion posterior' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CANNOT_CANCEL');
    });

    it('debe devolver 403 si un consumidor intenta cancelar el alquiler de otro', async () => {
      const mockRentalOtro = {
        id: 'rental-otro-1',
        consumerId: 'otro-consumer-id',
        estado: 'ACTIVA',
        precioTotal: 10000,
        fechaInicio: new Date(),
      };
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRentalOtro);

      const res = await request(app)
        .post('/api/rentals/rental-otro-1/cancel')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          motivo: 'Cancelación no autorizada',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
