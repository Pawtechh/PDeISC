import bcrypt from 'bcrypt';
import { BoardStatus, Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../config/prisma';
import { BUSINESS } from '../../constants/business';
import { AppError } from '../../middlewares/errorHandler';
import {
  adminCreateAgencySchema,
  adminCreateBoardSchema,
  adminUpdateAgencySchema,
  createAgencyOperatorSchema,
  createZoneSchema,
  relocateBoardSchema,
  updateUserRoleAdminSchema,
  updateZoneSchema,
} from './admin.schemas';

const toSlug = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item';

const DEFAULT_BOARD_IMAGE_BY_TYPE: Record<string, string> = {
  Shortboard: '/images/boards/shortboard-1.jpg',
  Longboard: '/images/boards/longboard-1.jpg',
  Funboard: '/images/boards/funboard-1.jpg',
  Fish: '/images/boards/fish-1.jpg',
  Bodyboard: '/images/boards/bodyboard-1.jpg',
  SUP: '/images/boards/sup-1.jpg',
};

export class AdminService {
  /**
   * Panel maestro global para SUPER_ADMIN: métricas, zonas, agencias, usuarios y locaciones de tablas
   */
  async getOverview() {
    const [
      zones,
      agencies,
      users,
      boards,
      totalRentals,
      revenueAgg,
    ] = await Promise.all([
      prisma.zone.findMany({
        orderBy: [{ activa: 'desc' }, { ciudad: 'asc' }, { nombre: 'asc' }],
        include: {
          _count: {
            select: { agencies: true, boards: true },
          },
        },
      }),
      prisma.agency.findMany({
        orderBy: [{ activa: 'desc' }, { createdAt: 'desc' }],
        include: {
          zone: true,
          users: {
            select: { id: true, nombre: true, email: true, role: true, activo: true },
          },
          _count: {
            select: { boards: true, rentals: true, users: true },
          },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          email: true,
          nombre: true,
          telefono: true,
          role: true,
          agencyId: true,
          activo: true,
          createdAt: true,
          agency: {
            select: { id: true, nombre: true, slug: true },
          },
        },
      }),
      prisma.board.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          zone: true,
          agency: {
            select: { id: true, nombre: true, slug: true, accentColor: true },
          },
          owner: {
            select: { id: true, nombre: true, email: true },
          },
        },
      }),
      prisma.rental.count(),
      prisma.rental.aggregate({
        _sum: { precioTotal: true },
        where: { estado: { in: ['ACTIVA', 'EN_CURSO', 'DEVUELTA', 'PENDIENTE_REVISION'] } },
      }),
    ]);

    const serializedZones = zones.map((z) => ({
      ...z,
      agencyCount: z._count.agencies,
      boardCount: z._count.boards,
    }));

    const serializedAgencies = agencies.map((ag) => ({
      ...ag,
      comisionPorcentaje: Number(ag.comisionPorcentaje),
      multaSalitreArs: Number(ag.multaSalitreArs),
      boardCount: ag._count.boards,
      rentalCount: ag._count.rentals,
      operatorCount: ag._count.users,
    }));

    const serializedBoards = boards.map((b) => ({
      ...b,
      precioHora: Number(b.precioHora),
      valorTasadoUsd: Number(b.valorTasadoUsd),
      volumenLitros: b.volumenLitros ? Number(b.volumenLitros) : null,
    }));

    return {
      metrics: {
        totalZones: zones.length,
        activeZones: zones.filter((z) => z.activa).length,
        totalAgencies: agencies.length,
        activeAgencies: agencies.filter((a) => a.activa).length,
        totalUsers: users.length,
        agencyAccounts: users.filter((u) => u.role === 'AGENCIA').length,
        totalBoards: boards.length,
        availableBoards: boards.filter((b) => b.estado === 'DISPONIBLE').length,
        totalRentals,
        platformRevenueArs: Number(revenueAgg?._sum?.precioTotal || 0),
      },
      zones: serializedZones,
      agencies: serializedAgencies,
      users,
      boards: serializedBoards,
    };
  }

  async createZone(input: z.infer<typeof createZoneSchema>) {
    const baseSlug = toSlug(`${input.ciudad}-${input.nombre}`);
    let uniqueSlug = baseSlug;
    let suffix = 2;
    while (await prisma.zone.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    return prisma.zone.create({
      data: {
        slug: uniqueSlug,
        ciudad: input.ciudad.trim(),
        nombre: input.nombre.trim(),
        pais: input.pais.trim(),
        latitud: input.latitud,
        longitud: input.longitud,
        timezone: input.timezone.trim(),
        activa: input.activa,
      },
    });
  }

  async updateZone(id: string, input: z.infer<typeof updateZoneSchema>) {
    const zone = await prisma.zone.findUnique({ where: { id } });
    if (!zone) {
      throw new AppError('ZONE_NOT_FOUND', 'La zona especificada no existe.', 404);
    }

    return prisma.zone.update({
      where: { id },
      data: {
        ciudad: input.ciudad?.trim(),
        nombre: input.nombre?.trim(),
        pais: input.pais?.trim(),
        latitud: input.latitud,
        longitud: input.longitud,
        timezone: input.timezone?.trim(),
        activa: input.activa,
      },
    });
  }

  async deleteZone(id: string) {
    const zone = await prisma.zone.findUnique({
      where: { id },
      include: { _count: { select: { agencies: true, boards: true } } },
    });
    if (!zone) {
      throw new AppError('ZONE_NOT_FOUND', 'La zona especificada no existe.', 404);
    }
    if (zone._count.agencies > 0 || zone._count.boards > 0) {
      throw new AppError(
        'ZONE_IN_USE',
        'No podés eliminar una zona que tiene agencias o tablas asignadas. Pausala o reubicalas primero.',
        409
      );
    }

    await prisma.zone.delete({ where: { id } });
    return { deleted: true, id };
  }

  async createAgencyWithOptionalOperator(input: z.infer<typeof adminCreateAgencySchema>) {
    const zone = await prisma.zone.findUnique({ where: { id: input.zoneId } });
    if (!zone) {
      throw new AppError('ZONE_NOT_FOUND', 'La zona seleccionada no existe.', 404);
    }

    const baseSlug = toSlug(input.nombre);
    let uniqueSlug = baseSlug;
    let suffix = 2;
    while (await prisma.agency.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }

    const email = input.operatorEmail?.trim().toLowerCase() || '';
    const password = input.operatorPassword?.trim() || '';

    if (email && !password && !input.existingUserId) {
      throw new AppError(
        'OPERATOR_PASSWORD_REQUIRED',
        'Si cargás un email para crear cuenta de agencia debés definir una contraseña de al menos 6 caracteres.',
        400
      );
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw new AppError(
          'EMAIL_ALREADY_EXISTS',
          'Ese email ya pertenece a otra cuenta. Podés asignarlo por ID o usar otro correo.',
          409
        );
      }
    }

    if (input.existingUserId) {
      const existingUser = await prisma.user.findUnique({ where: { id: input.existingUserId } });
      if (!existingUser) {
        throw new AppError('USER_NOT_FOUND', 'El usuario existente a asignar no existe.', 404);
      }
    }

    const passwordHash = email && password ? await bcrypt.hash(password, 12) : undefined;

    const result = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          slug: uniqueSlug,
          nombre: input.nombre.trim(),
          descripcion:
            input.descripcion?.trim() ||
            `Sede oficial y alquiler de tablas en ${input.direccion.trim()} (${zone.ciudad}).`,
          direccion: input.direccion.trim(),
          whatsapp: input.whatsapp?.trim() || null,
          horario: input.horario?.trim() || 'Todos los días 08:00 a 20:00',
          accentColor: input.accentColor || '#0E6B74',
          comisionPorcentaje: new Prisma.Decimal(input.comisionPorcentaje ?? 5),
          multaSalitreArs: new Prisma.Decimal(input.multaSalitreArs ?? 10000),
          zoneId: zone.id,
          verificada: input.verificada ?? true,
          activa: input.activa ?? true,
        },
        include: { zone: true },
      });

      let operator = null;
      if (input.existingUserId) {
        operator = await tx.user.update({
          where: { id: input.existingUserId },
          data: {
            role: Role.AGENCIA,
            agencyId: agency.id,
            activo: true,
          },
          select: { id: true, email: true, nombre: true, role: true, agencyId: true },
        });
      } else if (email && passwordHash) {
        operator = await tx.user.create({
          data: {
            email,
            passwordHash,
            nombre: input.operatorNombre?.trim() || `Operador ${agency.nombre}`,
            telefono: input.operatorTelefono?.trim() || input.whatsapp?.trim() || null,
            role: Role.AGENCIA,
            agencyId: agency.id,
            activo: true,
          },
          select: { id: true, email: true, nombre: true, role: true, agencyId: true },
        });
      }

      return { agency, operator };
    });

    return {
      agency: {
        ...result.agency,
        comisionPorcentaje: Number(result.agency.comisionPorcentaje),
        multaSalitreArs: Number(result.agency.multaSalitreArs),
      },
      operator: result.operator,
    };
  }

  async updateAgency(id: string, input: z.infer<typeof adminUpdateAgencySchema>) {
    const existing = await prisma.agency.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('AGENCY_NOT_FOUND', 'La agencia especificada no existe.', 404);
    }

    if (input.zoneId) {
      const zExists = await prisma.zone.findUnique({ where: { id: input.zoneId } });
      if (!zExists) {
        throw new AppError('ZONE_NOT_FOUND', 'La zona destino no existe.', 404);
      }
    }

    const updated = await prisma.agency.update({
      where: { id },
      data: {
        nombre: input.nombre?.trim(),
        descripcion: input.descripcion?.trim(),
        direccion: input.direccion?.trim(),
        whatsapp: input.whatsapp !== undefined ? input.whatsapp?.trim() || null : undefined,
        horario: input.horario !== undefined ? input.horario?.trim() || '08:00 a 20:00 hs' : undefined,
        accentColor: input.accentColor,
        comisionPorcentaje:
          input.comisionPorcentaje !== undefined
            ? new Prisma.Decimal(input.comisionPorcentaje)
            : undefined,
        multaSalitreArs:
          input.multaSalitreArs !== undefined
            ? new Prisma.Decimal(input.multaSalitreArs)
            : undefined,
        zoneId: input.zoneId,
        verificada: input.verificada,
        activa: input.activa,
      },
      include: { zone: true },
    });

    return {
      ...updated,
      comisionPorcentaje: Number(updated.comisionPorcentaje),
      multaSalitreArs: Number(updated.multaSalitreArs),
    };
  }

  async createAgencyOperator(input: z.infer<typeof createAgencyOperatorSchema>) {
    const agency = await prisma.agency.findUnique({ where: { id: input.agencyId } });
    if (!agency) {
      throw new AppError('AGENCY_NOT_FOUND', 'La agencia destino no existe.', 404);
    }

    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      throw new AppError(
        'EMAIL_ALREADY_EXISTS',
        'Ya existe una cuenta con ese correo electrónico.',
        409
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        nombre: input.nombre.trim(),
        telefono: input.telefono?.trim() || null,
        role: input.role as Role,
        agencyId: agency.id,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        role: true,
        agencyId: true,
        activo: true,
        createdAt: true,
        agency: { select: { id: true, nombre: true, slug: true } },
      },
    });

    return user;
  }

  async updateUserRoleAndAgency(
    targetUserId: string,
    input: z.infer<typeof updateUserRoleAdminSchema>,
    actingAdminId: string
  ) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado.', 404);
    }

    if (targetUserId === actingAdminId && (input.role !== 'SUPER_ADMIN' || input.activo === false)) {
      throw new AppError(
        'SELF_DEMOTION_BLOCKED',
        'No podés degradar o desactivar tu propia cuenta Super Admin en sesión.',
        400
      );
    }

    if (input.agencyId) {
      const agencyExists = await prisma.agency.findUnique({ where: { id: input.agencyId } });
      if (!agencyExists) {
        throw new AppError('AGENCY_NOT_FOUND', 'La agencia asignada no existe.', 404);
      }
    }

    return prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: input.role as Role,
        agencyId: input.agencyId !== undefined ? input.agencyId : undefined,
        activo: input.activo !== undefined ? input.activo : undefined,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        role: true,
        agencyId: true,
        activo: true,
        agency: { select: { id: true, nombre: true, slug: true } },
      },
    });
  }

  async createBoardInLocation(actingAdminId: string, input: z.infer<typeof adminCreateBoardSchema>) {
    const agency = await prisma.agency.findUnique({ where: { id: input.agencyId } });
    if (!agency) {
      throw new AppError('AGENCY_NOT_FOUND', 'La agencia seleccionada no existe.', 404);
    }

    const resolvedZoneId = input.zoneId || agency.zoneId;
    if (input.zoneId) {
      const zoneExists = await prisma.zone.findUnique({ where: { id: input.zoneId } });
      if (!zoneExists) {
        throw new AppError('ZONE_NOT_FOUND', 'La zona seleccionada no existe.', 404);
      }
    }

    let resolvedOwnerId = input.ownerId;
    if (!resolvedOwnerId) {
      const agencyOperator = await prisma.user.findFirst({
        where: { agencyId: agency.id, activo: true },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      resolvedOwnerId = agencyOperator?.id || actingAdminId;
    }

    const defaultPhoto = DEFAULT_BOARD_IMAGE_BY_TYPE[input.tipoTabla] || '/images/boards/shortboard-1.jpg';
    const fotos = input.fotos && input.fotos.length > 0 ? input.fotos : [defaultPhoto];

    const proximoMantenimiento = new Date();
    proximoMantenimiento.setDate(proximoMantenimiento.getDate() + BUSINESS.MANTENIMIENTO_DIAS);

    const board = await prisma.board.create({
      data: {
        ownerId: resolvedOwnerId,
        agencyId: agency.id,
        zoneId: resolvedZoneId,
        titulo: input.titulo.trim(),
        marca: input.marca.trim(),
        modelo: input.modelo.trim(),
        medidas: input.medidas.trim(),
        volumenLitros: input.volumenLitros ? new Prisma.Decimal(input.volumenLitros) : null,
        tipoTabla: input.tipoTabla,
        precioHora: new Prisma.Decimal(input.precioHora),
        valorTasadoUsd: new Prisma.Decimal(input.valorTasadoUsd),
        estado: BoardStatus.DISPONIBLE,
        fotos,
        proximoMantenimiento,
      },
      include: {
        zone: true,
        agency: { select: { id: true, nombre: true, slug: true, accentColor: true } },
        owner: { select: { id: true, nombre: true, email: true } },
      },
    });

    return {
      ...board,
      precioHora: Number(board.precioHora),
      valorTasadoUsd: Number(board.valorTasadoUsd),
    };
  }

  async relocateBoard(boardId: string, input: z.infer<typeof relocateBoardSchema>) {
    const [board, agency, zone] = await Promise.all([
      prisma.board.findUnique({ where: { id: boardId } }),
      prisma.agency.findUnique({ where: { id: input.agencyId } }),
      prisma.zone.findUnique({ where: { id: input.zoneId } }),
    ]);

    if (!board) throw new AppError('BOARD_NOT_FOUND', 'Tabla no encontrada.', 404);
    if (!agency) throw new AppError('AGENCY_NOT_FOUND', 'Agencia destino no encontrada.', 404);
    if (!zone) throw new AppError('ZONE_NOT_FOUND', 'Zona destino no encontrada.', 404);

    const updated = await prisma.board.update({
      where: { id: boardId },
      data: {
        agencyId: agency.id,
        zoneId: zone.id,
        estado: input.estado ? (input.estado as BoardStatus) : undefined,
      },
      include: {
        zone: true,
        agency: { select: { id: true, nombre: true, slug: true, accentColor: true } },
        owner: { select: { id: true, nombre: true, email: true } },
      },
    });

    return {
      ...updated,
      precioHora: Number(updated.precioHora),
      valorTasadoUsd: Number(updated.valorTasadoUsd),
    };
  }
}

export const adminService = new AdminService();
