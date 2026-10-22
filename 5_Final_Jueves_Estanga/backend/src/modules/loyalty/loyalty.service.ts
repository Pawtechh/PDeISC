import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { BUSINESS } from '../../constants/business';
import { CreateReviewInput } from './loyalty.schemas';

export class LoyaltyService {
  /**
   * Obtiene el estado del programa de fidelización del surfista:
   * Puntos disponibles (10 pts/hora de uso), nivel de rider,
   * equivalencia monetaria en ARS, vencimiento a 12 meses y puntos de sanción.
   */
  async getConsumerLoyalty(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rentalsConsumer: {
          where: {
            estado: { in: ['DEVUELTA', 'ACTIVA', 'EN_CURSO'] },
          },
          select: {
            id: true,
            fechaInicio: true,
            horas: true,
            puntosGanados: true,
            puntosUsados: true,
            precioTotal: true,
            board: {
              select: { titulo: true, tipoTabla: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 15,
        },
      },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    const puntos = user.puntos;
    const puntosSancion = user.puntosSancion;
    const equivalenciaArs = puntos * BUSINESS.VALOR_PUNTO_ARS;

    // Determinación de Nivel de Rider
    let nivel = 1;
    let nombreNivel = 'Principiante';
    let proximoNivelPuntos = 100;
    let beneficio = '10 pts por hora de alquiler completada';

    if (puntos >= 600) {
      nivel = 4;
      nombreNivel = 'Leyenda MDP';
      proximoNivelPuntos = 600;
      beneficio = 'Acceso prioritario a quivers exclusivos y máximo canje';
    } else if (puntos >= 300) {
      nivel = 3;
      nombreNivel = 'Pro Rider';
      proximoNivelPuntos = 600;
      beneficio = '15% de bonificación en canjes y prioridad en temporada alta';
    } else if (puntos >= 100) {
      nivel = 2;
      nombreNivel = 'Intermedio';
      proximoNivelPuntos = 300;
      beneficio = 'Canje de hasta $3.000 ARS por reserva';
    }

    // Regla de Vencimiento a 12 meses
    const fechaVencimiento = new Date(
      user.updatedAt.getTime() + BUSINESS.VENCIMIENTO_PUNTOS_MESES * 30 * 24 * 60 * 60 * 1000
    );

    // Verificación de Sanciones (ej: salitre no lavado = 50 pts de sanción)
    const cuentaRestringida = puntosSancion >= BUSINESS.UMBRAL_SANCION_BLOQUEO;

    return {
      puntos,
      equivalenciaArs,
      puntosSancion,
      cuentaRestringida,
      nivel: {
        nivel,
        nombre: nombreNivel,
        proximoNivelPuntos,
        beneficio,
        progresoPorcentaje: Math.min(100, Math.round((puntos / proximoNivelPuntos) * 100)),
      },
      vencimiento: {
        mesesVigencia: BUSINESS.VENCIMIENTO_PUNTOS_MESES,
        fechaEstimada: fechaVencimiento,
        diasRestantes: Math.max(
          0,
          Math.ceil((fechaVencimiento.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        ),
      },
      reglas: {
        puntosPorHora: BUSINESS.PUNTOS_POR_HORA,
        valorPuntoArs: BUSINESS.VALOR_PUNTO_ARS,
        sancionSalitre: BUSINESS.PUNTOS_SANCION_NO_LAVAR,
        umbralBloqueo: BUSINESS.UMBRAL_SANCION_BLOQUEO,
      },
      historial: user.rentalsConsumer.map((r) => ({
        rentalId: r.id,
        tabla: r.board.titulo,
        tipoTabla: r.board.tipoTabla,
        fecha: r.fechaInicio,
        horas: r.horas,
        puntosGanados: r.puntosGanados,
        puntosUsados: r.puntosUsados,
        montoTotal: Number(r.precioTotal),
      })),
    };
  }

  /**
   * Cotiza y valida el canje de puntos por descuento en un alquiler
   */
  async calculatePointsDiscount(userId: string, puntosACanjear: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'Usuario no encontrado', 404);
    }

    if (user.puntosSancion >= BUSINESS.UMBRAL_SANCION_BLOQUEO) {
      throw new AppError(
        'ACCOUNT_SANCTIONED',
        'Tu cuenta tiene sanciones activas por salitre o daños. Canje deshabilitado temporalmente.',
        403
      );
    }

    if (puntosACanjear > user.puntos) {
      throw new AppError(
        'INSUFFICIENT_POINTS',
        `Puntos insuficientes. Disponibles: ${user.puntos} pts`,
        400
      );
    }

    const descuentoArs = puntosACanjear * BUSINESS.VALOR_PUNTO_ARS;

    return {
      puntosCanjeados: puntosACanjear,
      descuentoArs,
      puntosRestantes: user.puntos - puntosACanjear,
      valorUnitarioArs: BUSINESS.VALOR_PUNTO_ARS,
    };
  }

  /**
   * Crea una Reseña 100% Verificada:
   * Solo permitida si el alquiler existe, pertenece al usuario y está en estado DEVUELTA.
   * Premia al surfista con +20 puntos de fidelización por colaborar con la comunidad.
   */
  async createVerifiedReview(userId: string, input: CreateReviewInput) {
    const rental = await prisma.rental.findUnique({
      where: { id: input.rentalId },
      include: {
        board: true,
        review: true,
      },
    });

    if (!rental) {
      throw new AppError('RENTAL_NOT_FOUND', 'Alquiler no encontrado', 404);
    }

    if (rental.consumerId !== userId) {
      throw new AppError('FORBIDDEN', 'No podés reseñar un alquiler ajeno', 403);
    }

    // REGLA CRÍTICA: Solo alquileres completados pueden dejar reseña
    if (rental.estado !== 'DEVUELTA') {
      throw new AppError(
        'RENTAL_NOT_COMPLETED',
        `Solo podés dejar una reseña verificada una vez devuelta la tabla (estado actual: ${rental.estado})`,
        400
      );
    }

    // REGLA: Máximo 1 reseña por alquiler completado
    if (rental.review) {
      throw new AppError(
        'REVIEW_ALREADY_EXISTS',
        'Ya emitiste una reseña para este alquiler',
        409
      );
    }

    // 1. Crear la reseña verificada
    const review = await prisma.review.create({
      data: {
        rentalId: rental.id,
        boardId: rental.boardId,
        userId,
        calificacion: input.calificacion,
        comentario: input.comentario,
      },
      include: {
        user: {
          select: { nombre: true },
        },
      },
    });

    // 2. Bonificación de +20 puntos de fidelización por reseña
    const puntosBonus = 20;
    await prisma.user.update({
      where: { id: userId },
      data: {
        puntos: {
          increment: puntosBonus,
        },
      },
    });

    // 3. Notificar al Propietario de la tabla
    await prisma.notification.create({
      data: {
        userId: rental.board.ownerId,
        titulo: `★ Nueva Reseña (${input.calificacion}/5) en tu Tabla`,
        mensaje: `Un surfista calificó "${rental.board.titulo}" con ${input.calificacion} estrellas: "${input.comentario}"`,
        tipo: 'ALQUILER',
      },
    });

    return {
      review,
      puntosBonusGanados: puntosBonus,
      mensaje: '¡Gracias por tu reseña verificada! Se acreditaron 20 puntos de fidelización a tu cuenta.',
    };
  }

  /**
   * Obtiene todas las reseñas verificadas de una tabla con promedio y distribución
   */
  async getBoardReviews(boardId: string) {
    const reviews = await prisma.review.findMany({
      where: { boardId },
      include: {
        user: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = reviews.length;
    const promedio =
      total > 0
        ? Number(
            (reviews.reduce((acc, r) => acc + r.calificacion, 0) / total).toFixed(1)
          )
        : 0;

    const distribucion = {
      5: reviews.filter((r) => r.calificacion === 5).length,
      4: reviews.filter((r) => r.calificacion === 4).length,
      3: reviews.filter((r) => r.calificacion === 3).length,
      2: reviews.filter((r) => r.calificacion === 2).length,
      1: reviews.filter((r) => r.calificacion === 1).length,
    };

    return {
      boardId,
      total,
      promedio,
      distribucion,
      reviews: reviews.map((r) => ({
        id: r.id,
        calificacion: r.calificacion,
        comentario: r.comentario,
        fecha: r.createdAt,
        autor: r.user.nombre,
        verificado: true,
      })),
    };
  }

  /**
   * Obtiene alquileres completados pendientes de reseñar por el consumidor
   */
  async getPendingReviews(userId: string) {
    const rentals = await prisma.rental.findMany({
      where: {
        consumerId: userId,
        estado: 'DEVUELTA',
        review: null,
      },
      include: {
        board: {
          select: {
            id: true,
            titulo: true,
            marca: true,
            modelo: true,
            tipoTabla: true,
            fotos: true,
          },
        },
      },
      orderBy: { fechaDevolucionReal: 'desc' },
      take: 10,
    });

    return rentals.map((r) => ({
      rentalId: r.id,
      board: r.board,
      fechaUso: r.fechaInicio,
      horas: r.horas,
      puntosGanados: r.puntosGanados,
    }));
  }
}

export const loyaltyService = new LoyaltyService();
