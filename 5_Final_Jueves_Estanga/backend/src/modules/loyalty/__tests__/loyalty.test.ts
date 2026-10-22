import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../app';
import { prisma } from '../../../config/prisma';
import { JWT_CONFIG } from '../../../config/jwt';

// Mocks de Prisma
jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rental: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
  },
}));

describe('Loyalty & Verified Reviews Module Tests (MP10 Puntos 10/hora, Vencimiento 12 Meses y Reseñas)', () => {
  const app = createApp();

  const mockConsumer = {
    id: 'consumer-loyalty-1',
    email: 'surfista@mdp.com',
    nombre: 'Tomás Rider',
    role: 'CONSUMER',
    puntos: 180, // Nivel Intermedio
    puntosSancion: 0,
    activo: true,
    updatedAt: new Date(),
  };

  const consumerToken = jwt.sign(
    {
      id: mockConsumer.id,
      sub: mockConsumer.id,
      email: mockConsumer.email,
      role: mockConsumer.role,
    },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.id === mockConsumer.id) return Promise.resolve(mockConsumer);
      return Promise.resolve(null);
    });
  });

  describe('1. Saldo de Puntos y Niveles - GET /api/loyalty/balance', () => {
    it('debe devolver balance de puntos, equivalencia en pesos y nivel Intermedio', async () => {
      const mockConsumerWithRentals = {
        ...mockConsumer,
        rentalsConsumer: [
          {
            id: 'rent-1',
            fechaInicio: new Date(),
            horas: 4,
            puntosGanados: 40, // 4 hs * 10 pts/hora
            puntosUsados: 0,
            precioTotal: 16000,
            board: { titulo: 'Camet Retro Fish 5\'8', tipoTabla: 'Fish' },
          },
        ],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockConsumerWithRentals);

      const res = await request(app)
        .get('/api/loyalty/balance')
        .set('Authorization', `Bearer ${consumerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.puntos).toBe(180);
      expect(res.body.data.equivalenciaArs).toBe(1800); // 180 pts * $10 ARS
      expect(res.body.data.nivel.nombre).toBe('Intermedio');
      expect(res.body.data.cuentaRestringida).toBe(false);
      expect(res.body.data.vencimiento.mesesVigencia).toBe(12);
      expect(res.body.data.historial).toHaveLength(1);
    });

    it('debe marcar cuenta restringida si supera los 100 puntos de sanción', async () => {
      const sanctionedUser = {
        ...mockConsumer,
        puntosSancion: 100, // Bloqueo por faltas reiteradas / salitre
        rentalsConsumer: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(sanctionedUser);

      const res = await request(app)
        .get('/api/loyalty/balance')
        .set('Authorization', `Bearer ${consumerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.cuentaRestringida).toBe(true);
      expect(res.body.data.puntosSancion).toBe(100);
    });
  });

  describe('2. Canje de Puntos por Descuento - POST /api/loyalty/redeem', () => {
    it('debe calcular descuento válido en pesos ARS para reserva', async () => {
      const res = await request(app)
        .post('/api/loyalty/redeem')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          puntos: 100, // 100 pts = $1.000 ARS
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.puntosCanjeados).toBe(100);
      expect(res.body.data.descuentoArs).toBe(1000);
      expect(res.body.data.puntosRestantes).toBe(80);
    });

    it('debe rechazar si el usuario intenta canjear más puntos de los que tiene', async () => {
      const res = await request(app)
        .post('/api/loyalty/redeem')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          puntos: 500, // Solo tiene 180
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INSUFFICIENT_POINTS');
    });
  });

  describe('3. Reseñas 100% Verificadas - POST /api/loyalty/reviews', () => {
    it('REGLA CRÍTICA: debe rechazar reseña si el alquiler NO está en estado DEVUELTA', async () => {
      const mockActiveRental = {
        id: 'rent-active-1',
        consumerId: mockConsumer.id,
        boardId: 'board-1',
        estado: 'EN_CURSO', // Aún no la devolvió
        board: { titulo: 'UVA Classic 9\'2' },
        review: null,
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockActiveRental);

      const res = await request(app)
        .post('/api/loyalty/reviews')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          rentalId: 'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          calificacion: 5,
          comentario: 'La tabla va increíble, todavía la estoy usando',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('RENTAL_NOT_COMPLETED');
    });

    it('debe crear reseña verificada, otorgar +20 puntos bonus y notificar al dueño', async () => {
      const mockCompletedRental = {
        id: 'rent-comp-1',
        consumerId: mockConsumer.id,
        boardId: 'board-1',
        estado: 'DEVUELTA',
        board: { id: 'board-1', titulo: 'Camet Retro Fish 5\'8', ownerId: 'owner-1' },
        review: null,
      };

      const mockCreatedReview = {
        id: 'rev-1',
        rentalId: mockCompletedRental.id,
        boardId: 'board-1',
        userId: mockConsumer.id,
        calificacion: 5,
        comentario: 'Hermosa tabla retro, excelente flotación en Playa Grande.',
        createdAt: new Date(),
        user: { nombre: mockConsumer.nombre },
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockCompletedRental);
      (prisma.review.create as jest.Mock).mockResolvedValue(mockCreatedReview);
      (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockConsumer, puntos: 200 });
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-rev' });

      const res = await request(app)
        .post('/api/loyalty/reviews')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          rentalId: 'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          calificacion: 5,
          comentario: 'Hermosa tabla retro, excelente flotación en Playa Grande.',
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.puntosBonusGanados).toBe(20);
      expect(prisma.review.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockConsumer.id },
        data: { puntos: { increment: 20 } },
      });
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('debe rechazar si ya existe una reseña previa para el mismo alquiler', async () => {
      const mockRentalWithExistingReview = {
        id: 'rent-comp-2',
        consumerId: mockConsumer.id,
        boardId: 'board-1',
        estado: 'DEVUELTA',
        board: { titulo: 'Camet Fish' },
        review: { id: 'rev-old-1' }, // Ya reseñada
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRentalWithExistingReview);

      const res = await request(app)
        .post('/api/loyalty/reviews')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          rentalId: 'c1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
          calificacion: 4,
          comentario: 'Segunda opinión sobre la misma tabla',
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('REVIEW_ALREADY_EXISTS');
    });
  });

  describe('4. Listado de Reseñas por Tabla - GET /api/loyalty/reviews/board/:boardId', () => {
    it('debe calcular promedio de calificación y distribución de estrellas', async () => {
      const mockBoardReviews = [
        { id: 'r1', calificacion: 5, comentario: 'Excelente', createdAt: new Date(), user: { id: 'u1', nombre: 'Rider 1' } },
        { id: 'r2', calificacion: 4, comentario: 'Muy buena', createdAt: new Date(), user: { id: 'u2', nombre: 'Rider 2' } },
        { id: 'r3', calificacion: 5, comentario: 'Impecable', createdAt: new Date(), user: { id: 'u3', nombre: 'Rider 3' } },
      ];

      (prisma.review.findMany as jest.Mock).mockResolvedValue(mockBoardReviews);

      const res = await request(app).get('/api/loyalty/reviews/board/board-test-1');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.total).toBe(3);
      expect(res.body.data.promedio).toBe(4.7); // (5+4+5)/3 = 4.67 -> 4.7
      expect(res.body.data.distribucion[5]).toBe(2);
      expect(res.body.data.distribucion[4]).toBe(1);
    });
  });
});
