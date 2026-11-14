import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { JWT_CONFIG } from '../../config/jwt';
import { AppError } from '../../middlewares/errorHandler';
import { saveImageAsset } from '../../utils/fileStorage';
import { resolvePlanCommission, SaasPlanTier } from '../../constants/saasPlans';
import { RegisterAgencyInput, UpdateMyAgencyInput } from './agencies.schemas';

const toSlug = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'surf-shop';

const issueTokens = async (user: {
  id: string;
  email: string;
  role: string;
  agencyId: string | null;
}) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    agencyId: user.agencyId,
  };

  const accessToken = jwt.sign(payload, JWT_CONFIG.accessSecret, {
    expiresIn: JWT_CONFIG.accessExpiresIn,
  });

  const refreshToken = jwt.sign({ ...payload, jti: randomUUID() }, JWT_CONFIG.refreshSecret, {
    expiresIn: JWT_CONFIG.refreshExpiresIn,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + JWT_CONFIG.refreshDays);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_CONFIG.accessExpiresIn,
  };
};

export class AgenciesService {
  /**
   * Lista zonas/ciudades costeras activas con cantidad de agencias y tablas disponibles
   */
  async listZones() {
    const zones = await prisma.zone.findMany({
      where: { activa: true },
      orderBy: [{ ciudad: 'asc' }, { nombre: 'asc' }],
      include: {
        _count: {
          select: {
            agencies: true,
            boards: true,
          },
        },
        agencies: {
          where: { activa: true },
          select: {
            id: true,
            slug: true,
            nombre: true,
            accentColor: true,
            verificada: true,
            latitud: true,
            longitud: true,
            direccion: true,
            _count: {
              select: { boards: true },
            },
            boards: {
              where: { estado: 'DISPONIBLE' },
              orderBy: { precioHora: 'asc' },
              take: 1,
              select: { precioHora: true },
            },
          },
          take: 12,
        },
      },
    });

    return zones.map((z) => {
      const mappedAgencies = (z.agencies || []).map((ag: any, idx: number) => {
        const minBoard = Array.isArray(ag.boards) && ag.boards[0] ? Number(ag.boards[0].precioHora) : null;
        return {
          id: ag.id,
          slug: ag.slug,
          nombre: ag.nombre,
          accentColor: ag.accentColor,
          verificada: ag.verificada,
          direccion: ag.direccion,
          latitud: typeof ag.latitud === 'number' ? ag.latitud : z.latitud + idx * 0.0018,
          longitud: typeof ag.longitud === 'number' ? ag.longitud : z.longitud - idx * 0.0016,
          boardCount: ag._count?.boards ?? 0,
          minPriceArs: minBoard,
        };
      });
      const prices = mappedAgencies.map((a) => a.minPriceArs).filter((p): p is number => typeof p === 'number');
      return {
        id: z.id,
        slug: z.slug,
        ciudad: z.ciudad,
        nombre: z.nombre,
        pais: z.pais,
        latitud: z.latitud,
        longitud: z.longitud,
        timezone: z.timezone,
        agencyCount: z._count.agencies,
        boardCount: z._count.boards,
        minPriceArs: prices.length ? Math.min(...prices) : null,
        agenciesPreview: mappedAgencies,
      };
    });
  }

  /**
   * Directorio público de agencias por zona, ciudad o búsqueda textual
   */
  async listAgencies(filters: { zoneId?: string; ciudad?: string; q?: string }) {
    const where: Prisma.AgencyWhereInput = { activa: true };

    if (filters.zoneId) {
      where.zoneId = filters.zoneId;
    }

    if (filters.ciudad) {
      where.zone = {
        is: {
          ciudad: { contains: filters.ciudad },
        },
      };
    }

    if (filters.q && filters.q.trim()) {
      const q = filters.q.trim();
      where.OR = [
        { nombre: { contains: q } },
        { descripcion: { contains: q } },
        { direccion: { contains: q } },
      ];
    }

    const agencies = await prisma.agency.findMany({
      where,
      orderBy: [{ verificada: 'desc' }, { createdAt: 'asc' }],
      include: {
        zone: true,
        boards: {
          where: { estado: 'DISPONIBLE' },
          orderBy: { precioHora: 'asc' },
          take: 1,
          select: { precioHora: true },
        },
        _count: {
          select: {
            boards: true,
            rentals: true,
          },
        },
      },
    });

    return agencies.map((ag: any, idx: number) => {
      const minBoard = Array.isArray(ag.boards) && ag.boards[0] ? Number(ag.boards[0].precioHora) : null;
      const { mpCollectorId, boards: _boards, ...publicAg } = ag;
      return {
        ...publicAg,
        latitud:
          typeof ag.latitud === 'number'
            ? ag.latitud
            : typeof ag.zone?.latitud === 'number'
            ? ag.zone.latitud + idx * 0.0018
            : null,
        longitud:
          typeof ag.longitud === 'number'
            ? ag.longitud
            : typeof ag.zone?.longitud === 'number'
            ? ag.zone.longitud - idx * 0.0016
            : null,
        comisionPorcentaje: Number(ag.comisionPorcentaje),
        multaSalitreArs: Number(ag.multaSalitreArs),
        mpSplitConfigured: Boolean(mpCollectorId),
        minPriceArs: minBoard,
        boardCount: ag._count.boards,
        rentalCount: ag._count.rentals,
      };
    });
  }

  /**
   * Vidriera pública completa de una agencia (perfil + tablas disponibles + zona)
   */
  async getAgencyProfile(slugOrId: string) {
    const agency = await prisma.agency.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
        activa: true,
      },
      include: {
        zone: true,
        boards: {
          where: { estado: 'DISPONIBLE' },
          orderBy: { createdAt: 'desc' },
          include: {
            reviews: {
              select: { calificacion: true },
            },
            owner: {
              select: { id: true, nombre: true },
            },
          },
        },
        _count: {
          select: {
            boards: true,
            rentals: true,
          },
        },
      },
    });

    if (!agency) {
      throw new AppError('AGENCY_NOT_FOUND', 'La agencia o surf shop solicitado no existe.', 404);
    }

    const boardsWithRatings = agency.boards.map((b) => {
      const ratings = b.reviews.map((r) => r.calificacion);
      const ratingAvg = ratings.length
        ? Number((ratings.reduce((acc, c) => acc + c, 0) / ratings.length).toFixed(1))
        : 5.0;

      return {
        ...b,
        fotos: Array.isArray(b.fotos)
          ? b.fotos.map((f) => String(f || '').replace(/^https?:\/\/localhost:3000/i, ''))
          : [],
        calificacionPromedio: ratingAvg,
        totalReviews: ratings.length,
        agency: {
          id: agency.id,
          slug: agency.slug,
          nombre: agency.nombre,
          accentColor: agency.accentColor,
          logoUrl: agency.logoUrl,
          direccion: agency.direccion,
          whatsapp: agency.whatsapp,
          verificada: agency.verificada,
          zoneId: agency.zoneId,
        },
        zone: agency.zone,
      };
    });

    return {
      id: agency.id,
      slug: agency.slug,
      nombre: agency.nombre,
      descripcion: agency.descripcion,
      logoUrl: agency.logoUrl,
      portadaUrl: agency.portadaUrl,
      accentColor: agency.accentColor,
      direccion: agency.direccion,
      whatsapp: agency.whatsapp,
      horario: agency.horario,
      comisionPorcentaje: Number(agency.comisionPorcentaje),
      multaSalitreArs: Number(agency.multaSalitreArs),
      verificada: agency.verificada,
      zoneId: agency.zoneId,
      zone: agency.zone,
      boardCount: boardsWithRatings.length,
      totalCatalogCount: agency._count.boards,
      rentalCount: agency._count.rentals,
      boards: boardsWithRatings,
    };
  }

  /**
   * Registro SaaS multi-agencia: permite a una escuela, guardería o surf shop crear su tienda por zona.
   */
  async registerAgency(input: RegisterAgencyInput, authenticatedUserId?: string) {
    // 1. Validar zona: existente o creación dinámica de zona/ciudad costera
    let zoneId = input.zoneId?.trim() || '';
    let resolvedLat = input.latitud ?? -38.0278;
    let resolvedLon = input.longitud ?? -57.5306;

    if (zoneId) {
      const existingZone = await prisma.zone.findUnique({ where: { id: zoneId } });
      if (!existingZone) {
        throw new AppError('ZONE_NOT_FOUND', 'La zona seleccionada no existe.', 404);
      }
      if (input.latitud === undefined) resolvedLat = existingZone.latitud;
      if (input.longitud === undefined) resolvedLon = existingZone.longitud;
    } else if (input.ciudad && input.nombreZona) {
      const zoneSlug = toSlug(`${input.ciudad}-${input.nombreZona}`);
      const existingBySlug = await prisma.zone.findUnique({ where: { slug: zoneSlug } });
      if (existingBySlug) {
        zoneId = existingBySlug.id;
        if (input.latitud === undefined) resolvedLat = existingBySlug.latitud;
        if (input.longitud === undefined) resolvedLon = existingBySlug.longitud;
      } else {
        const createdZone = await prisma.zone.create({
          data: {
            slug: zoneSlug,
            ciudad: input.ciudad.trim(),
            nombre: input.nombreZona.trim(),
            latitud: resolvedLat,
            longitud: resolvedLon,
            activa: true,
          },
        });
        zoneId = createdZone.id;
      }
    } else {
      const fallbackZone = await prisma.zone.findFirst({ where: { activa: true } });
      if (!fallbackZone) {
        throw new AppError('ZONE_REQUIRED', 'Debés seleccionar una ciudad o zona costera.', 400);
      }
      zoneId = fallbackZone.id;
      if (input.latitud === undefined) resolvedLat = fallbackZone.latitud;
      if (input.longitud === undefined) resolvedLon = fallbackZone.longitud;
    }

    const planTier = (input.planTier || 'STARTER') as SaasPlanTier;
    const planCommission = input.comisionPorcentaje ?? resolvePlanCommission(planTier);

    // 2. Resolver slug único de la agencia
    const baseSlug = toSlug(input.nombre);
    let uniqueSlug = baseSlug;
    let suffix = 2;
    while (await prisma.agency.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    // 3. Subir logo/portada si vienen en base64
    const logoUrl =
      input.logoUrl && input.logoUrl.startsWith('data:image/')
        ? await saveImageAsset(input.logoUrl, 'agencies', `${uniqueSlug}-logo`)
        : input.logoUrl || null;
    const portadaUrl =
      input.portadaUrl && input.portadaUrl.startsWith('data:image/')
        ? await saveImageAsset(input.portadaUrl, 'agencies', `${uniqueSlug}-cover`)
        : input.portadaUrl || null;

    // 4. Si no hay sesión autenticada, validar credenciales nuevas antes de abrir transacción
    let existingAuthUser: { id: string; email: string; role: string; agencyId: string | null } | null = null;
    if (authenticatedUserId) {
      existingAuthUser = await prisma.user.findUnique({
        where: { id: authenticatedUserId },
        select: { id: true, email: true, role: true, agencyId: true },
      });
      if (!existingAuthUser) {
        throw new AppError('USER_NOT_FOUND', 'Usuario autenticado no encontrado.', 404);
      }
      if (existingAuthUser.agencyId) {
        throw new AppError(
          'ALREADY_HAS_AGENCY',
          'Tu cuenta ya administra una agencia activa. Podés editarla desde el panel de Agencia.',
          409
        );
      }
    } else {
      if (!input.email || !input.password || !input.nombreResponsable) {
        throw new AppError(
          'CREDENTIALS_REQUIRED',
          'Para registrar una nueva agencia sin iniciar sesión debés completar nombre del responsable, email y contraseña.',
          400
        );
      }
      const duplicateEmail = await prisma.user.findUnique({
        where: { email: input.email.toLowerCase().trim() },
      });
      if (duplicateEmail) {
        throw new AppError(
          'EMAIL_ALREADY_EXISTS',
          'Ese email ya está registrado. Iniciá sesión con tu cuenta o utilizá otro correo comercial.',
          409
        );
      }
    }

    const passwordHash = !authenticatedUserId && input.password
      ? await bcrypt.hash(input.password, 12)
      : undefined;

    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          slug: uniqueSlug,
          nombre: input.nombre.trim(),
          descripcion:
            input.descripcion?.trim() ||
            `Guardería y alquiler de tablas en ${input.direccion.trim()}.`,
          logoUrl,
          portadaUrl,
          accentColor: input.accentColor || '#0E6B74',
          direccion: input.direccion.trim(),
          whatsapp: input.whatsapp?.trim() || null,
          horario: input.horario?.trim() || 'Todos los días 08:00 a 20:00',
          latitud: resolvedLat,
          longitud: resolvedLon,
          multaSalitreArs: new Prisma.Decimal(input.multaSalitreArs ?? 10000),
          comisionPorcentaje: new Prisma.Decimal(planCommission),
          mpCollectorId: input.mpCollectorId?.trim() || null,
          planEstado: `${planTier}_PENDIENTE`,
          zoneId,
          verificada: false,
          activa: true,
        },
        include: { zone: true },
      });

      const user = existingAuthUser
        ? await tx.user.update({
            where: { id: existingAuthUser.id },
            data: {
              role: 'AGENCIA',
              agencyId: agency.id,
            },
            include: {
              agency: { include: { zone: true } },
            },
          })
        : await tx.user.create({
            data: {
              email: input.email!.toLowerCase().trim(),
              passwordHash,
              nombre: input.nombreResponsable!.trim(),
              telefono: input.telefonoResponsable?.trim() || input.whatsapp?.trim() || null,
              role: 'AGENCIA',
              agencyId: agency.id,
              activo: true,
            },
            include: {
              agency: { include: { zone: true } },
            },
          });

      return { agency, user };
    });

    const tokens = await issueTokens({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      agencyId: result.agency.id,
    });

    return {
      agency: {
        ...result.agency,
        comisionPorcentaje: Number(result.agency.comisionPorcentaje),
        multaSalitreArs: Number(result.agency.multaSalitreArs),
      },
      user: {
        id: result.user.id,
        email: result.user.email,
        nombre: result.user.nombre,
        telefono: result.user.telefono,
        role: result.user.role,
        puntos: result.user.puntos,
        agencyId: result.user.agencyId,
        zoneId: result.agency.zoneId,
        agency: result.agency,
      },
      tokens,
    };
  }

  /**
   * Actualiza los datos públicos y marca visual de la agencia del operador autenticado
   */
  async updateMyAgency(
    userRole: string,
    userAgencyId: string | null | undefined,
    input: UpdateMyAgencyInput
  ) {
    const targetAgencyId =
      userRole === 'SUPER_ADMIN' && input.agencyId ? input.agencyId : userAgencyId;

    if (!targetAgencyId) {
      throw new AppError(
        'AGENCY_NOT_LINKED',
        'Tu usuario no está vinculado a ninguna agencia todavía.',
        400
      );
    }

    const existing = await prisma.agency.findUnique({ where: { id: targetAgencyId } });
    if (!existing) {
      throw new AppError('AGENCY_NOT_FOUND', 'La agencia a editar no existe.', 404);
    }

    if (input.zoneId) {
      const zoneExists = await prisma.zone.findUnique({ where: { id: input.zoneId } });
      if (!zoneExists) {
        throw new AppError('ZONE_NOT_FOUND', 'La zona seleccionada no existe.', 404);
      }
    }

    const logoUrl =
      input.logoUrl && input.logoUrl.startsWith('data:image/')
        ? await saveImageAsset(input.logoUrl, 'agencies', `${existing.slug}-logo`)
        : input.logoUrl === ''
        ? null
        : input.logoUrl;

    const portadaUrl =
      input.portadaUrl && input.portadaUrl.startsWith('data:image/')
        ? await saveImageAsset(input.portadaUrl, 'agencies', `${existing.slug}-cover`)
        : input.portadaUrl === ''
        ? null
        : input.portadaUrl;

    const updated = await prisma.agency.update({
      where: { id: targetAgencyId },
      data: {
        nombre: input.nombre?.trim() || undefined,
        descripcion:
          input.descripcion !== undefined && input.descripcion !== null
            ? input.descripcion.trim()
            : undefined,
        direccion: input.direccion?.trim() || undefined,
        whatsapp: input.whatsapp !== undefined ? input.whatsapp?.trim() || null : undefined,
        horario:
          input.horario !== undefined && input.horario !== null
            ? input.horario.trim()
            : undefined,
        accentColor: input.accentColor || undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        portadaUrl: portadaUrl !== undefined ? portadaUrl : undefined,
        multaSalitreArs:
          input.multaSalitreArs !== undefined
            ? new Prisma.Decimal(input.multaSalitreArs)
            : undefined,
        mpCollectorId:
          input.mpCollectorId !== undefined ? input.mpCollectorId?.trim() || null : undefined,
        latitud: input.latitud !== undefined ? input.latitud : undefined,
        longitud: input.longitud !== undefined ? input.longitud : undefined,
        zoneId: input.zoneId || undefined,
      },
      include: { zone: true },
    });

    return {
      ...updated,
      comisionPorcentaje: Number(updated.comisionPorcentaje),
      multaSalitreArs: Number(updated.multaSalitreArs),
    };
  }
}

export const agenciesService = new AgenciesService();
