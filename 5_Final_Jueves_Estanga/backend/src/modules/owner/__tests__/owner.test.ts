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
    },
    board: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rental: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    insuranceClaim: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    payout: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 'payout-1', ...args.data })),
    },
  },
}));

describe('Owner Module Tests (MP8 Panel del Dueño, 95% Ganancias, Suscripción $1000 y Ciclo 45 Días)', () => {
  const app = createApp();

  const mockOwnerUser = {
    id: 'owner-test-1',
    email: 'owner@test.com',
    nombre: 'Martín Dueño MDP',
    role: 'OWNER',
    activo: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Hace 15 días (dentro de los 3 meses gratis)
  };

  const mockConsumerUser = {
    id: 'consumer-test-1',
    email: 'consumer@test.com',
    nombre: 'Surfista Consumidor',
    role: 'CONSUMER',
    activo: true,
    createdAt: new Date(),
  };

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

  beforeEach(() => {
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }: any) => {
      if (where.id === mockOwnerUser.id) return Promise.resolve(mockOwnerUser);
      if (where.id === mockConsumerUser.id) return Promise.resolve(mockConsumerUser);
      return Promise.resolve(null);
    });
    (prisma.payout.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.payout.create as jest.Mock).mockImplementation((args: any) =>
      Promise.resolve({ id: 'payout-1', ...(args?.data || {}) })
    );
  });

  describe('1. Seguridad y Control de Acceso por Roles', () => {
    it('debe rechazar solicitudes no autenticadas con 401', async () => {
      const res = await request(app).get('/api/owner/boards');
      expect(res.status).toBe(401);
    });

    it('debe rechazar a usuarios con rol CONSUMER con 403', async () => {
      const res = await request(app)
        .get('/api/owner/boards')
        .set('Authorization', `Bearer ${consumerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Acceso denegado');
    });
  });

  describe('2. Ciclo de Mantenimiento Preventivo (45 Días) - GET /api/owner/boards', () => {
    it('debe listar tablas con cálculo de días restantes y alerta de mantenimiento', async () => {
      const now = new Date();
      const mockBoards = [
        {
          id: 'board-1',
          ownerId: mockOwnerUser.id,
          titulo: 'UVA Classic Nose Rider 9\'2',
          marca: 'UVA Surfboards',
          modelo: 'Nose Rider',
          medidas: "9'2 x 23 x 3",
          precioHora: 4500,
          valorTasadoUsd: 450,
          estado: 'DISPONIBLE',
          createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          ultimoMantenimiento: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
          proximoMantenimiento: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000), // En 35 días
          rentals: [
            { id: 'r-1', estado: 'DEVUELTA', gananciaOwner: 8550, horas: 2 },
          ],
        },
        {
          id: 'board-2',
          ownerId: mockOwnerUser.id,
          titulo: 'Camet Fish 5\'8',
          marca: 'Camet Shapers',
          modelo: 'Retro Twin',
          medidas: "5'8 x 20 x 2.5",
          precioHora: 3800,
          valorTasadoUsd: 380,
          estado: 'DISPONIBLE',
          createdAt: new Date(now.getTime() - 44 * 24 * 60 * 60 * 1000),
          ultimoMantenimiento: new Date(now.getTime() - 44 * 24 * 60 * 60 * 1000),
          proximoMantenimiento: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // En 1 día (por vencer)
          rentals: [],
        },
      ];

      (prisma.board.findMany as jest.Mock).mockResolvedValue(mockBoards);

      const res = await request(app)
        .get('/api/owner/boards')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveLength(2);

      const b1 = res.body.data[0];
      expect(b1.mantenimiento.diasRestantes).toBe(35);
      expect(b1.mantenimiento.isOverdue).toBe(false);
      expect(b1.mantenimiento.estadoCiclo).toBe('AL_DIA');
      expect(b1.metricas.totalAlquileres).toBe(1);
      expect(b1.metricas.gananciasGeneradas).toBe(8550);

      const b2 = res.body.data[1];
      expect(b2.mantenimiento.diasRestantes).toBe(1);
      expect(b2.mantenimiento.needsMaintenanceSoon).toBe(true);
      expect(b2.mantenimiento.estadoCiclo).toBe('POR_VENCER');
    });
  });

  describe('3. Ganancias al 95% y Suscripción ($1000/mes) - GET /api/owner/earnings', () => {
    it('debe calcular el desglose 95% Owner / 5% Agencia y bonificación de 3 meses gratis', async () => {
      const mockOwnerWithBoards = {
        ...mockOwnerUser,
        boards: [
          {
            id: 'board-1',
            titulo: 'UVA Classic 9\'2',
            tipoTabla: 'Longboard',
            rentals: [
              {
                id: 'r-1',
                estado: 'DEVUELTA',
                horas: 4,
                precioTotal: 18000,
                gananciaOwner: 17100, // 95%
                gananciaAgencia: 900,  // 5%
                fechaInicio: new Date(),
                consumer: { nombre: 'Facundo Gómez', email: 'facu@surf.com' },
              },
              {
                id: 'r-2',
                estado: 'DEVUELTA',
                horas: 2,
                precioTotal: 9000,
                gananciaOwner: 8550, // 95%
                gananciaAgencia: 450, // 5%
                fechaInicio: new Date(),
                consumer: { nombre: 'Lucía Mar', email: 'lucia@surf.com' },
              },
            ],
          },
        ],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockOwnerWithBoards);

      const res = await request(app)
        .get('/api/owner/earnings')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');

      const { resumen, suscripcion } = res.body.data;

      // Desglose del 95% y 5%
      expect(resumen.totalBruto).toBe(27000);
      expect(resumen.gananciaOwner).toBe(25650); // 17100 + 8550 = 25650 (exactamente 95%)
      expect(resumen.comisionAgencia).toBe(1350); // 900 + 450 = 1350 (exactamente 5%)
      expect(resumen.porcentajeOwner).toBe(95);
      expect(resumen.porcentajeAgencia).toBe(5);
      expect(resumen.totalHoras).toBe(6);

      // Suscripción: dentro de los 3 meses gratis
      expect(suscripcion.estado).toBe('BONIFICADA_GRATIS');
      expect(suscripcion.costoMensual).toBe(0);
      expect(suscripcion.mesesGratisRestantes).toBeGreaterThanOrEqual(1);
    });

    it('debe cobrar $1000 ARS/mes si el owner superó los 3 meses de antigüedad', async () => {
      const oldOwner = {
        ...mockOwnerUser,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 días (~4 meses)
        boards: [],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(oldOwner);

      const res = await request(app)
        .get('/api/owner/earnings')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const { suscripcion } = res.body.data;
      expect(suscripcion.estado).toBe('ACTIVA_PAGA');
      expect(suscripcion.costoMensual).toBe(1000);
      expect(suscripcion.mesesGratisRestantes).toBe(0);
    });
  });

  describe('4. Solicitud de Extracción / Payout - POST /api/owner/payout', () => {
    it('debe rechazar montos superiores al saldo disponible', async () => {
      const mockOwnerWithBoards = {
        ...mockOwnerUser,
        boards: [
          {
            id: 'b-1',
            rentals: [
              {
                id: 'r-1',
                estado: 'DEVUELTA',
                horas: 2,
                precioTotal: 10000,
                gananciaOwner: 9500,
                gananciaAgencia: 500,
                fechaInicio: new Date(),
                consumer: { nombre: 'User 1', email: 'u1@test.com' },
              },
            ],
          },
        ],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockOwnerWithBoards);

      const res = await request(app)
        .post('/api/owner/payout')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          monto: 20000, // Supera los 9500 disponibles
          cbuAlias: 'SURF.MDP.MARTINDIS',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INSUFFICIENT_FUNDS');
    });

    it('debe emitir comprobante de transferencia al solicitar retiro válido', async () => {
      const mockOwnerWithBoards = {
        ...mockOwnerUser,
        boards: [
          {
            id: 'b-1',
            rentals: [
              {
                id: 'r-1',
                estado: 'DEVUELTA',
                horas: 4,
                precioTotal: 30000,
                gananciaOwner: 28500,
                gananciaAgencia: 1500,
                fechaInicio: new Date(),
                consumer: { nombre: 'User 1', email: 'u1@test.com' },
              },
            ],
          },
        ],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockOwnerWithBoards);
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-payout' });

      const res = await request(app)
        .post('/api/owner/payout')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          monto: 15000,
          cbuAlias: 'SURF.MDP.MARTINDIS',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.transferId).toMatch(/^TRF-/);
      expect(res.body.data.monto).toBe(15000);
      expect(res.body.data.saldoRestante).toBe(13500);
    });
  });

  describe('5. Comparador de Fotos e Inspección - GET /api/owner/rentals/:rentalId/inspection', () => {
    it('debe devolver fotos de retiro y devolución con plazo de 24 horas', async () => {
      const mockRental = {
        id: 'rental-inspect-1',
        estado: 'PENDIENTE_REVISION',
        fechaInicio: new Date(Date.now() - 4 * 60 * 60 * 1000),
        fechaDevolucionReal: new Date(Date.now() - 2 * 60 * 60 * 1000),
        horas: 2,
        lavada: true,
        multaLavado: 0,
        fotosRetiro: ['https://storage.surf.com/retiro1.jpg', 'https://storage.surf.com/retiro2.jpg'],
        fotosDevolucion: ['https://storage.surf.com/devol1.jpg', 'https://storage.surf.com/devol2.jpg'],
        firmaRetiroUrl: 'https://storage.surf.com/firma.png',
        claims: [],
        board: {
          id: 'board-inspect-1',
          ownerId: mockOwnerUser.id,
          titulo: 'Camet Retro Fish 5\'8',
          marca: 'Camet',
          modelo: 'Retro Fish',
          tipoTabla: 'Fish',
          medidas: "5'8 x 20 x 2.5",
          valorTasadoUsd: 400,
        },
        consumer: {
          id: 'cons-1',
          nombre: 'Santiago Surf',
          email: 'santi@gmail.com',
          telefono: '2235559988',
          dni: '38111222',
        },
      };

      (prisma.rental.findUnique as jest.Mock).mockResolvedValue(mockRental);

      const res = await request(app)
        .get('/api/owner/rentals/rental-inspect-1/inspection')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.fotosRetiro).toHaveLength(2);
      expect(res.body.data.fotosDevolucion).toHaveLength(2);
      expect(res.body.data.disputa.horasRestantes).toBeGreaterThan(0);
      expect(res.body.data.disputa.reglaSilencio).toContain('24h');
    });
  });

  describe('6. Registro de Mantenimiento Preventivo - POST /api/owner/boards/:boardId/maintenance', () => {
    it('debe renovar la fecha de mantenimiento por 45 días más y reactivar tabla', async () => {
      const mockBoard = {
        id: 'board-maint-1',
        ownerId: mockOwnerUser.id,
        titulo: 'UVA Classic 9\'2',
        estado: 'MANTENIMIENTO',
      };

      (prisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
      (prisma.board.update as jest.Mock).mockImplementation(({ data }: any) =>
        Promise.resolve({
          ...mockBoard,
          ...data,
        })
      );
      (prisma.notification.create as jest.Mock).mockResolvedValue({ id: 'notif-1' });

      const res = await request(app)
        .post('/api/owner/boards/board-maint-1/maintenance')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          notas: 'Parafina renovada, quillas inspeccionadas sin astillas',
          piezasReemplazadas: ['Parafina Warm Water'],
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.diasCiclo).toBe(45);
      expect(res.body.data.board.estado).toBe('DISPONIBLE');
    });
  });
});
