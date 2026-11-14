import request from 'supertest';
import { prisma } from '../../../config/prisma';
import { createApp } from '../../../app';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    zone: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    agency: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    board: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([1]),
  },
}));

describe('Agencies & Zones SaaS API', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/zones debería devolver zonas costeras activas con conteos', async () => {
    (prisma.zone.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'zone-mdp-playa-grande',
        slug: 'mar-del-plata-playa-grande',
        ciudad: 'Mar del Plata',
        nombre: 'Playa Grande',
        pais: 'Argentina',
        latitud: -38.0278,
        longitud: -57.5306,
        timezone: 'America/Argentina/Buenos_Aires',
        activa: true,
        _count: { agencies: 1, boards: 8 },
        agencies: [
          {
            id: 'agency-playa-grande',
            slug: 'playa-grande-central',
            nombre: 'Playa Grande Central',
            accentColor: '#0E6B74',
            verificada: true,
          },
        ],
      },
    ]);

    const res = await request(app).get('/api/zones');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].ciudad).toBe('Mar del Plata');
    expect(res.body.data[0].agencyCount).toBe(1);
    expect(res.body.data[0].boardCount).toBe(8);
  });

  it('GET /api/agencies debería filtrar agencias por zoneId', async () => {
    (prisma.agency.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'agency-chapadmalal-cliff',
        slug: 'chapadmalal-cliff-club',
        nombre: 'Chapadmalal Cliff Club',
        descripcion: 'Base en Ruta 11 Km 539',
        accentColor: '#1D6F5A',
        direccion: 'Ruta 11 Km 539',
        whatsapp: '+54 9 223 555-0518',
        horario: '07:30 a 19:30',
        comisionPorcentaje: 6,
        multaSalitreArs: 12000,
        verificada: true,
        activa: true,
        zoneId: 'zone-chapadmalal',
        zone: {
          id: 'zone-chapadmalal',
          ciudad: 'Chapadmalal',
          nombre: 'Luna Roja & Los Lobos',
        },
        _count: { boards: 3, rentals: 1 },
      },
    ]);

    const res = await request(app).get('/api/agencies?zoneId=zone-chapadmalal');

    expect(res.status).toBe(200);
    expect(res.body.data[0].slug).toBe('chapadmalal-cliff-club');
    expect(res.body.data[0].boardCount).toBe(3);
  });

  it('GET /api/agencies/:slugOrId debería devolver perfil completo con sus tablas', async () => {
    (prisma.agency.findFirst as jest.Mock).mockResolvedValue({
      id: 'agency-playa-grande',
      slug: 'playa-grande-central',
      nombre: 'Playa Grande Central',
      descripcion: 'Guardería en Bajada 3',
      logoUrl: null,
      portadaUrl: null,
      accentColor: '#0E6B74',
      direccion: 'Escollera Norte',
      whatsapp: '+54 9 223 555-0303',
      horario: '07:00 a 20:30',
      comisionPorcentaje: 5,
      multaSalitreArs: 10000,
      verificada: true,
      activa: true,
      zoneId: 'zone-mdp-playa-grande',
      zone: {
        id: 'zone-mdp-playa-grande',
        slug: 'mar-del-plata-playa-grande',
        ciudad: 'Mar del Plata',
        nombre: 'Playa Grande',
        latitud: -38.0278,
        longitud: -57.5306,
      },
      boards: [
        {
          id: 'board-1',
          titulo: 'FishBeard 5\'8',
          fotos: ['/images/boards/fish-1.jpg'],
          reviews: [{ calificacion: 5 }],
          owner: { id: 'owner-1', nombre: 'Martín' },
        },
      ],
      _count: { boards: 1, rentals: 4 },
    });

    const res = await request(app).get('/api/agencies/playa-grande-central');

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Playa Grande Central');
    expect(res.body.data.boards).toHaveLength(1);
    expect(res.body.data.boards[0].calificacionPromedio).toBe(5);
  });

  it('GET /api/boards con zoneId debería reenviar filtro por zona a Prisma', async () => {
    (prisma.board.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.board.count as jest.Mock).mockResolvedValue(0);

    const res = await request(app).get('/api/boards?zoneId=zone-pinamar');

    expect(res.status).toBe(200);
    expect(prisma.board.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          zoneId: 'zone-pinamar',
        }),
      })
    );
  });

  it('POST /api/agencies/register permite alta self-service con plan PRO (3%) en estado pendiente de aprobación', async () => {
    (prisma.zone.findUnique as jest.Mock).mockResolvedValue({
      id: 'zone-pinamar',
      slug: 'pinamar-muelle-norte',
      ciudad: 'Pinamar',
      nombre: 'Muelle Norte',
      latitud: -37.1079,
      longitud: -56.8548,
    });
    (prisma.agency.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) =>
      cb({
        agency: {
          create: jest.fn().mockResolvedValue({
            id: 'ag-self-1',
            slug: 'pinamar-pro-quiver',
            nombre: 'Pinamar Pro Quiver',
            descripcion: 'Alquiler frente al muelle',
            direccion: 'Av. del Mar 300',
            comisionPorcentaje: 3,
            multaSalitreArs: 10000,
            planEstado: 'PRO_PENDIENTE',
            verificada: false,
            activa: true,
            zoneId: 'zone-pinamar',
            zone: { id: 'zone-pinamar', ciudad: 'Pinamar', nombre: 'Muelle Norte' },
          }),
        },
        user: {
          create: jest.fn().mockResolvedValue({
            id: 'usr-ag-self-1',
            email: 'pro@pinamar.com',
            nombre: 'Sofía Costa',
            telefono: null,
            role: 'AGENCIA',
            puntos: 0,
            agencyId: 'ag-self-1',
            agency: { id: 'ag-self-1', zoneId: 'zone-pinamar' },
          }),
        },
      })
    );
    (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

    const res = await request(app).post('/api/agencies/register').send({
      nombre: 'Pinamar Pro Quiver',
      direccion: 'Av. del Mar 300',
      zoneId: 'zone-pinamar',
      planTier: 'PRO',
      nombreResponsable: 'Sofía Costa',
      email: 'pro@pinamar.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.agency.planEstado).toBe('PRO_PENDIENTE');
    expect(res.body.data.agency.verificada).toBe(false);
    expect(res.body.data.agency.comisionPorcentaje).toBe(3);
    expect(res.body.data.user.role).toBe('AGENCIA');
  });
});
