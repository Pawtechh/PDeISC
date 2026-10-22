import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../app';
import { prisma } from '../../../config/prisma';
import { JWT_CONFIG } from '../../../config/jwt';
import { mpPreference, mpPayment } from '../../../config/mercadopago';

// Mocks de Prisma
jest.mock('../../../config/prisma', () => ({
  prisma: {
    rental: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
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

// Mock de MercadoPago SDK
jest.mock('../../../config/mercadopago', () => ({
  MP_CONFIG: {
    currency: 'ARS',
    webhookSecret: 'test_secret',
    backUrls: { success: 'url', failure: 'url', pending: 'url' },
    notificationUrl: 'https://test/webhook',
  },
  mpPreference: {
    create: jest.fn().mockResolvedValue({
      id: 'pref-mock-12345',
      init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-mock-12345',
      sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-mock-12345',
    }),
  },
  mpPayment: {
    get: jest.fn().mockResolvedValue({
      id: '99887766',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 18000,
      metadata: {
        rental_id: 'rental-mp-1',
      },
    }),
  },
}));

describe('Payments Module Tests (MP6 MercadoPago Checkout, Pre-Auth & Webhook Idempotency)', () => {
  const app = createApp();

  const mockConsumer = {
    id: 'user-consumer-mp',
    email: 'surfer@mdp.com',
    nombre: 'Martín Surfista',
    role: 'CONSUMER',
    activo: true,
  };

  const mockRental = {
    id: 'rental-mp-1',
    consumerId: mockConsumer.id,
    boardId: 'board-1',
    horas: 4,
    precioTotal: 18000,
    gananciaOwner: 17100,
    gananciaAgencia: 900,
    estado: 'PENDIENTE',
    board: {
      id: 'board-1',
      titulo: 'UVA Classic 9\'2',
      marca: 'UVA Surfboards',
      modelo: 'Classic',
      valorTasadoUsd: 450,
      ownerId: 'owner-1',
    },
    consumer: mockConsumer,
  };

  const consumerToken = jwt.sign(
    { sub: mockConsumer.id, email: mockConsumer.email, role: mockConsumer.role },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockConsumer);
    (mpPreference.create as jest.Mock).mockResolvedValue({
      id: 'pref-mock-12345',
      init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-mock-12345',
      sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-mock-12345',
    });
    (mpPayment.get as jest.Mock).mockResolvedValue({
      id: '99887766',
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 18000,
      metadata: {
        rental_id: 'rental-mp-1',
      },
    });
  });

  describe('POST /api/payments/preference', () => {
    it('debe denegar acceso sin autenticación con 401', async () => {
      const res = await request(app)
        .post('/api/payments/preference')
        .send({ rentalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' });

      expect(res.status).toBe(401);
    });

    it('debe generar preferencia de pago con monto en ARS y registrar Payment en estado PENDIENTE', async () => {
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'pay-1',
        rentalId: mockRental.id,
        mpPreferenceId: 'pref-mock-12345',
        monto: 18000,
        estado: 'PENDIENTE',
      });

      const res = await request(app)
        .post('/api/payments/preference')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          rentalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          installments: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.preferenceId).toBe('pref-mock-12345');
      expect(res.body.data.initPoint).toContain('mercadopago.com.ar');
      expect(res.body.data.currency).toBe('ARS');
      expect(prisma.payment.create).toHaveBeenCalled();
    });
  });

  describe('POST /api/payments/pre-auth (Garantía de daño)', () => {
    it('debe registrar pre-autorización retenida para cobertura de daños', async () => {
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'hold-1',
        rentalId: mockRental.id,
        monto: 90000,
        tipo: 'PRE_AUTH_DANO',
        estado: 'PRE_AUTORIZADO',
      });

      const res = await request(app)
        .post('/api/payments/pre-auth')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          rentalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          cardToken: 'tok_card_12345678_4444',
          montoGarantia: 90000,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.estado).toBe('PRE_AUTORIZADO');
      expect(res.body.data.montoGarantia).toBe(90000);
      expect(prisma.payment.create).toHaveBeenCalled();
    });
  });

  describe('POST /api/payments/webhook (IPN & Idempotencia)', () => {
    it('debe procesar pago aprobado, transicionar Rental a ACTIVA y emitir notificaciones', async () => {
      // Primera vez: no existe mpPaymentId
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.payment.findFirst as jest.Mock).mockResolvedValue({
        id: 'pay-pending-1',
        rentalId: mockRental.id,
        estado: 'PENDIENTE',
      });
      (prisma.payment.update as jest.Mock).mockResolvedValue({
        id: 'pay-pending-1',
        estado: 'APROBADO',
        mpPaymentId: '99887766',
      });
      (prisma.rental.update as jest.Mock).mockResolvedValue({
        ...mockRental,
        estado: 'ACTIVA',
      });
      (prisma.notification.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const res = await request(app)
        .post('/api/payments/webhook')
        .send({
          action: 'payment.created',
          data: { id: '99887766' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('approved');
      expect(prisma.rental.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rental-mp-1' },
          data: { estado: 'ACTIVA' },
        })
      );
      expect(prisma.notification.createMany).toHaveBeenCalled();
    });

    it('IDEMPOTENCIA: no debe duplicar transiciones ni notificaciones si el webhook se repite', async () => {
      // Simula que el pago ya se encuentra APROBADO en la DB
      (prisma.payment.findUnique as jest.Mock).mockResolvedValue({
        id: 'pay-already-approved',
        mpPaymentId: '99887766',
        estado: 'APROBADO',
      });

      const res = await request(app)
        .post('/api/payments/webhook')
        .send({
          action: 'payment.updated',
          data: { id: '99887766' },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('idempotente');
      // No debe llamar a update ni createMany de nuevo
      expect(prisma.rental.update).not.toHaveBeenCalled();
      expect(prisma.notification.createMany).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/payments/simulate', () => {
    it('debe simular acreditación de pago y activar la reserva en entorno sandbox', async () => {
      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);
      (prisma.payment.create as jest.Mock).mockResolvedValue({
        id: 'sim-pay-1',
        rentalId: mockRental.id,
        estado: 'APROBADO',
      });
      (prisma.rental.update as jest.Mock).mockResolvedValue({
        ...mockRental,
        estado: 'ACTIVA',
      });

      const res = await request(app)
        .post('/api/payments/simulate')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          rentalId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
          status: 'approved',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.status).toBe('APROBADO');
    });
  });
});
