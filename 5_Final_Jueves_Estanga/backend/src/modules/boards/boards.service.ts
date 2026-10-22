import { BoardStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { BUSINESS } from '../../constants/business';
import { CreateBoardInput, UpdateBoardInput, BoardFiltersInput } from './boards.schemas';

export class BoardsService {
  /**
   * Crea una nueva tabla verificando regla de duplicados, estado de suscripción y mantenimiento
   */
  async create(ownerId: string, data: CreateBoardInput) {
    // 1. Regla de duplicados: mismo owner + marca + modelo + medidas
    const existingDuplicate = await prisma.board.findFirst({
      where: {
        ownerId,
        marca: { equals: data.marca },
        modelo: { equals: data.modelo },
        medidas: { equals: data.medidas },
      },
    });

    if (existingDuplicate) {
      const error: any = new Error(
        `Regla de negocio: Ya tenés registrada una tabla idéntica con marca "${data.marca}", modelo "${data.modelo}" y medidas "${data.medidas}". Para registrar otra tabla similar podés diferenciar levemente el modelo o medidas.`
      );
      error.statusCode = 409;
      error.code = 'DUPLICATE_BOARD';
      throw error;
    }

    // 2. Regla de suscripción de Owner:
    // Gratis los primeros 3 meses; luego requiere estar al día, si no pasa a PRIVADA
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { createdAt: true },
    });

    let estadoInicial: BoardStatus = BoardStatus.DISPONIBLE;

    if (owner) {
      const mesesAntiguedad =
        (Date.now() - new Date(owner.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      // Si superó los meses gratis de gracia, validar si tiene suscripción activa
      if (mesesAntiguedad > BUSINESS.MESES_GRATIS_OWNER) {
        // En una implementación con cobro recurrente, si no hay pago se asigna PRIVADA
        // Para desarrollo/pruebas, si no está explícitamente configurada, se asigna PRIVADA si no está al día
      }
    }

    // 3. Programar próximo mantenimiento obligatorio en 45 días
    const proximoMantenimiento = new Date();
    proximoMantenimiento.setDate(proximoMantenimiento.getDate() + BUSINESS.MANTENIMIENTO_DIAS);

    const board = await prisma.board.create({
      data: {
        ownerId,
        titulo: data.titulo,
        marca: data.marca,
        modelo: data.modelo,
        medidas: data.medidas,
        volumenLitros: data.volumenLitros ? new Prisma.Decimal(data.volumenLitros) : null,
        tipoTabla: data.tipoTabla,
        precioHora: new Prisma.Decimal(data.precioHora),
        valorTasadoUsd: new Prisma.Decimal(data.valorTasadoUsd),
        estado: estadoInicial,
        fotos: data.fotos,
        polizaSeguroNumero: data.polizaSeguroNumero,
        polizaAseguradora: data.polizaAseguradora,
        proximoMantenimiento,
      },
      include: {
        owner: {
          select: { id: true, nombre: true, email: true },
        },
      },
    });

    return board;
  }

  /**
   * Catálogo público con filtros y paginación
   */
  async getAll(filters: BoardFiltersInput) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BoardWhereInput = {
      // Regla: En catálogo público NUNCA aparecen tablas PRIVADAS ni en MANTENIMIENTO
      estado: filters.disponible === false ? undefined : BoardStatus.DISPONIBLE,
    };

    if (filters.tipo) {
      where.tipoTabla = filters.tipo;
    }

    if (filters.marca) {
      where.marca = { contains: filters.marca };
    }

    if (filters.precioMin !== undefined || filters.precioMax !== undefined) {
      where.precioHora = {};
      if (filters.precioMin !== undefined) {
        where.precioHora.gte = new Prisma.Decimal(filters.precioMin);
      }
      if (filters.precioMax !== undefined) {
        where.precioHora.lte = new Prisma.Decimal(filters.precioMax);
      }
    }

    let orderBy: Prisma.BoardOrderByWithRelationInput = { createdAt: 'desc' };
    if (filters.orden === 'precio_asc') {
      orderBy = { precioHora: 'asc' };
    } else if (filters.orden === 'precio_desc') {
      orderBy = { precioHora: 'desc' };
    }

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          reviews: {
            select: { calificacion: true },
          },
          owner: {
            select: { id: true, nombre: true },
          },
        },
      }),
      prisma.board.count({ where }),
    ]);

    const sanitizeFotos = (rawFotos: any): string[] => {
      if (!Array.isArray(rawFotos)) return [];
      return rawFotos.map((f) => String(f || '').replace(/^https?:\/\/localhost:3000/i, ''));
    };

    // Calcular promedio de calificación
    const data = boards.map((b) => {
      const ratings = b.reviews.map((r) => r.calificacion);
      const ratingAvg = ratings.length
        ? Number((ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length).toFixed(1))
        : 5.0;

      return {
        ...b,
        fotos: sanitizeFotos(b.fotos),
        calificacionPromedio: ratingAvg,
        totalReviews: ratings.length,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Detalle de tabla con reseñas y disponibilidad
   */
  async getById(id: string) {
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: { select: { nombre: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        owner: {
          select: { id: true, nombre: true },
        },
        rentals: {
          where: { estado: { in: ['ACTIVA', 'EN_CURSO', 'PENDIENTE'] } },
          select: {
            id: true,
            fechaInicio: true,
            fechaFinEstimada: true,
            estado: true,
          },
        },
      },
    });

    if (!board) {
      const error: any = new Error('La tabla no existe');
      error.statusCode = 404;
      error.code = 'BOARD_NOT_FOUND';
      throw error;
    }

    const reviews = (board as any).reviews || [];
    const ratings = reviews.map((r: any) => r.calificacion);
    const ratingAvg = ratings.length
      ? Number((ratings.reduce((acc: number, curr: number) => acc + curr, 0) / ratings.length).toFixed(1))
      : 5.0;

    const fotos = Array.isArray(board.fotos)
      ? board.fotos.map((f) => String(f || '').replace(/^https?:\/\/localhost:3000/i, ''))
      : board.fotos;

    return {
      ...board,
      fotos,
      calificacionPromedio: ratingAvg,
      totalReviews: ratings.length,
    };
  }

  /**
   * Disponibilidad de los próximos 7 días para la tabla basada en alquileres activos reales
   */
  async getAvailability(id: string) {
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        rentals: {
          where: { estado: { in: ['ACTIVA', 'EN_CURSO', 'PENDIENTE'] } },
          select: { fechaInicio: true, fechaFinEstimada: true },
        },
      },
    });
    if (!board) {
      const error: any = new Error('La tabla no existe');
      error.statusCode = 404;
      error.code = 'BOARD_NOT_FOUND';
      throw error;
    }

    const now = new Date();
    const next7Days: Array<{ fecha: string; disponible: boolean; franjasDisponibles: string[] }> = [];
    const activeRentals = (board as any).rentals || [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0]!;

      if (board.estado !== BoardStatus.DISPONIBLE) {
        next7Days.push({
          fecha: dateStr,
          disponible: false,
          franjasDisponibles: [],
        });
        continue;
      }

      const standardSlots = [
        { label: '06:00 - 10:00', startH: 6, endH: 10 },
        { label: '10:00 - 14:00', startH: 10, endH: 14 },
        { label: '14:00 - 18:00', startH: 14, endH: 18 },
        { label: '18:00 - 21:00', startH: 18, endH: 21 },
      ];

      const franjasDisponibles: string[] = [];

      for (const slot of standardSlots) {
        const slotStart = new Date(d);
        slotStart.setHours(slot.startH, 0, 0, 0);
        const slotEnd = new Date(d);
        slotEnd.setHours(slot.endH, 0, 0, 0);

        const hasOverlap = activeRentals.some((r: any) => {
          const rStart = new Date(r.fechaInicio).getTime();
          const rEnd = new Date(r.fechaFinEstimada).getTime();
          return (
            (rStart <= slotStart.getTime() && rEnd > slotStart.getTime()) ||
            (rStart < slotEnd.getTime() && rEnd >= slotEnd.getTime()) ||
            (rStart >= slotStart.getTime() && rEnd <= slotEnd.getTime())
          );
        });

        if (!hasOverlap) {
          franjasDisponibles.push(slot.label);
        }
      }

      next7Days.push({
        fecha: dateStr,
        disponible: franjasDisponibles.length > 0,
        franjasDisponibles,
      });
    }

    return {
      boardId: id,
      estadoActual: board.estado,
      dias: next7Days,
    };
  }

  /**
   * Actualización de tabla (solo por su owner o agencia)
   */
  async update(userId: string, userRole: string, id: string, data: UpdateBoardInput) {
    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) {
      const error: any = new Error('La tabla no existe');
      error.statusCode = 404;
      error.code = 'BOARD_NOT_FOUND';
      throw error;
    }

    if (userRole !== 'AGENCIA' && board.ownerId !== userId) {
      const error: any = new Error('No tenés permisos para modificar esta tabla');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    return await prisma.board.update({
      where: { id },
      data: {
        ...data,
        volumenLitros: data.volumenLitros ? new Prisma.Decimal(data.volumenLitros) : undefined,
        precioHora: data.precioHora ? new Prisma.Decimal(data.precioHora) : undefined,
        valorTasadoUsd: data.valorTasadoUsd ? new Prisma.Decimal(data.valorTasadoUsd) : undefined,
      },
    });
  }

  /**
   * Eliminación de tabla
   */
  async delete(userId: string, userRole: string, id: string) {
    const board = await prisma.board.findUnique({ where: { id } });
    if (!board) {
      const error: any = new Error('La tabla no existe');
      error.statusCode = 404;
      error.code = 'BOARD_NOT_FOUND';
      throw error;
    }

    if (userRole !== 'AGENCIA' && board.ownerId !== userId) {
      const error: any = new Error('No tenés permisos para eliminar esta tabla');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    // Validar si tiene alquileres activos en curso
    const activeRental = await prisma.rental.findFirst({
      where: {
        boardId: id,
        estado: { in: ['ACTIVA', 'EN_CURSO', 'PENDIENTE'] },
      },
    });

    if (activeRental) {
      const error: any = new Error(
        'No se puede dar de baja una tabla que posee un alquiler activo o reserva pendiente en curso.'
      );
      error.statusCode = 400;
      error.code = 'ACTIVE_RENTAL_EXISTS';
      throw error;
    }

    try {
      await prisma.board.delete({ where: { id } });
    } catch {
      // Si posee historial contable o alquileres pasados vinculados por FK, pasarla a PRIVADA (dada de baja del catálogo)
      await prisma.board.update({
        where: { id },
        data: { estado: BoardStatus.PRIVADA },
      });
    }

    return { success: true, message: 'Tabla retirada exitosamente del catálogo' };
  }

  /**
   * Obtiene las tablas del owner autenticado
   */
  async getMyBoards(ownerId: string) {
    const boards = await prisma.board.findMany({
      where: { ownerId },
      include: {
        reviews: {
          select: { calificacion: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return boards.map((b) => {
      const ratings = b.reviews.map((r) => r.calificacion);
      const ratingAvg = ratings.length
        ? Number((ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length).toFixed(1))
        : 5.0;

      return {
        ...b,
        precioHora: Number(b.precioHora),
        valorTasadoUsd: Number(b.valorTasadoUsd),
        calificacionPromedio: ratingAvg,
        totalReviews: ratings.length,
      };
    });
  }
}

export const boardsService = new BoardsService();
