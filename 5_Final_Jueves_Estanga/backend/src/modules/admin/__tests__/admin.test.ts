import request from 'supertest';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../config/prisma';
import { JWT_CONFIG } from '../../../config/jwt';
import { createApp } from '../../../app';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    zone: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    agency: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    board: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    rental: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([1]),
  },
}));

describe('Super Admin SaaS API (/api/admin)', () => {
  const app = createApp();

  const superAdminToken = jwt.sign(
    { id: 'admin-1', email: 'superadmin@surf.com', role: 'SUPER_ADMIN', agencyId: null },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  const agencyToken = jwt.sign(
    { id: 'ag-user-1', email: 'mostrador@surf.com', role: 'AGENCIA', agencyId: 'agency-1' },
    JWT_CONFIG.accessSecret,
    { expiresIn: '1h' }
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe bloquear acceso a /api/admin/overview para rol AGENCIA con 403', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'ag-user-1',
      email: 'mostrador@surf.com',
      role: 'AGENCIA',
      nombre: 'Operador',
      activo: true,
      agencyId: 'agency-1',
    });

    const res = await request(app)
      .get('/api/admin/overview')
      .set('Authorization', `Bearer ${agencyToken}`);

    expect(res.status).toBe(403);
  });

  it('POST /api/admin/zones permite a SUPER_ADMIN crear una nueva zona costera', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'superadmin@surf.com',
      role: 'SUPER_ADMIN',
      nombre: 'Admin SaaS',
      activo: true,
      agencyId: null,
    });
    (prisma.zone.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.zone.create as jest.Mock).mockResolvedValue({
      id: 'zone-gesell',
      slug: 'villa-gesell-muelle-norte',
      ciudad: 'Villa Gesell',
      nombre: 'Muelle Norte',
      pais: 'Argentina',
      latitud: -37.2584,
      longitud: -56.9685,
      timezone: 'America/Argentina/Buenos_Aires',
      activa: true,
    });

    const res = await request(app)
      .post('/api/admin/zones')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        ciudad: 'Villa Gesell',
        nombre: 'Muelle Norte',
        latitud: -37.2584,
        longitud: -56.9685,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe('villa-gesell-muelle-norte');
  });

  it('POST /api/admin/agencies crea negocio y su cuenta de rango AGENCIA en transacción', async () => {
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'admin-1',
        email: 'superadmin@surf.com',
        role: 'SUPER_ADMIN',
        nombre: 'Admin SaaS',
        activo: true,
        agencyId: null,
      })
      .mockResolvedValueOnce(null);

    (prisma.zone.findUnique as jest.Mock).mockResolvedValue({
      id: 'zone-gesell',
      ciudad: 'Villa Gesell',
      nombre: 'Muelle Norte',
    });
    (prisma.agency.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => {
      const tx = {
        agency: {
          create: jest.fn().mockResolvedValue({
            id: 'agency-gesell',
            slug: 'gesell-surf-club',
            nombre: 'Gesell Surf Club',
            comisionPorcentaje: 6,
            multaSalitreArs: 11000,
            zoneId: 'zone-gesell',
            zone: { id: 'zone-gesell', ciudad: 'Villa Gesell', nombre: 'Muelle Norte' },
          }),
        },
        user: {
          create: jest.fn().mockResolvedValue({
            id: 'user-op-gesell',
            email: 'gesell@surf.com',
            nombre: 'Operador Gesell',
            role: 'AGENCIA',
            agencyId: 'agency-gesell',
          }),
        },
      };
      return cb(tx);
    });

    const res = await request(app)
      .post('/api/admin/agencies')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        nombre: 'Gesell Surf Club',
        direccion: 'Av. 1 y Paseo 105, Villa Gesell',
        zoneId: 'zone-gesell',
        operatorEmail: 'gesell@surf.com',
        operatorPassword: 'Password123!',
        operatorNombre: 'Operador Gesell',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.agency.slug).toBe('gesell-surf-club');
    expect(res.body.data.operator.role).toBe('AGENCIA');
  });

  it('POST /api/admin/users/agency-account crea cuenta adicional de rango AGENCIA', async () => {
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'admin-1',
        email: 'superadmin@surf.com',
        role: 'SUPER_ADMIN',
        nombre: 'Admin SaaS',
        activo: true,
        agencyId: null,
      })
      .mockResolvedValueOnce(null);

    (prisma.agency.findUnique as jest.Mock).mockResolvedValue({ id: 'agency-gesell', nombre: 'Gesell Surf Club' });
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-op-2',
      email: 'caja2.gesell@surf.com',
      nombre: 'Caja 2 Gesell',
      role: 'AGENCIA',
      agencyId: 'agency-gesell',
      activo: true,
    });

    const res = await request(app)
      .post('/api/admin/users/agency-account')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        email: 'caja2.gesell@surf.com',
        password: 'Password123!',
        nombre: 'Caja 2 Gesell',
        agencyId: 'agency-gesell',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('AGENCIA');
    expect(res.body.data.agencyId).toBe('agency-gesell');
  });

  it('PATCH /api/admin/boards/:id/location reubica una tabla a otra zona y agencia', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'superadmin@surf.com',
      role: 'SUPER_ADMIN',
      nombre: 'Admin SaaS',
      activo: true,
      agencyId: null,
    });
    (prisma.board.findUnique as jest.Mock).mockResolvedValue({ id: 'board-1', titulo: 'Pyzel 6.0' });
    (prisma.agency.findUnique as jest.Mock).mockResolvedValue({ id: 'agency-gesell', nombre: 'Gesell Surf Club' });
    (prisma.zone.findUnique as jest.Mock).mockResolvedValue({ id: 'zone-gesell', nombre: 'Muelle Norte' });
    (prisma.board.update as jest.Mock).mockResolvedValue({
      id: 'board-1',
      agencyId: 'agency-gesell',
      zoneId: 'zone-gesell',
      precioHora: 7000,
      valorTasadoUsd: 800,
      zone: { id: 'zone-gesell', ciudad: 'Villa Gesell', nombre: 'Muelle Norte' },
      agency: { id: 'agency-gesell', nombre: 'Gesell Surf Club', slug: 'gesell-surf-club' },
    });

    const res = await request(app)
      .patch('/api/admin/boards/board-1/location')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        agencyId: 'agency-gesell',
        zoneId: 'zone-gesell',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.zoneId).toBe('zone-gesell');
    expect(res.body.data.agencyId).toBe('agency-gesell');
  });
});
