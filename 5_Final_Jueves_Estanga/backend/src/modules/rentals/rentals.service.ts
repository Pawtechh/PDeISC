import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { logger } from '../../utils/logger';
import {
  calculateRentalQuote,
  calculateCancellationRefund,
  validateOperatingHours,
  RentalQuoteResult,
  CancellationRefundResult,
} from './pricing.engine';
import { QuoteRentalInput, CreateRentalInput, CancelRentalInput } from './rentals.schemas';

export class RentalsService {
  /**
   * Obtiene la cotización detallada con descuentos y split antes de reservar
   */
  async getQuote(input: QuoteRentalInput): Promise<{
    quote: RentalQuoteResult;
    board: { id: string; titulo: string; marca: string; precioHora: number; valorTasadoUsd: number };
    fechaFinEstimada: string;
  }> {
    const board = await prisma.board.findUnique({
      where: { id: input.boardId },
    });

    if (!board) {
      throw new AppError('BOARD_NOT_FOUND', 'La tabla especificada no existe', 404);
    }

    if (board.estado === 'MANTENIMIENTO' || board.estado === 'PRIVADA') {
      throw new AppError('BOARD_UNAVAILABLE', `La tabla no está disponible (${board.estado})`, 400);
    }

    const fechaInicio = new Date(input.fechaInicio);
    const fechaFin = new Date(fechaInicio.getTime() + input.horas * 60 * 60 * 1000);

    const validation = validateOperatingHours(fechaInicio, fechaFin);
    if (!validation.isValid) {
      throw new AppError('INVALID_OPERATING_HOURS', validation.error || 'Horario no permitido en sede', 400);
    }

    // Verificar si ya existe un alquiler superpuesto
    const hasConflict = await this.checkOverlap(input.boardId, fechaInicio, fechaFin);
    if (hasConflict) {
      throw new AppError(
        'RENTAL_CONFLICT',
        'La tabla ya se encuentra reservada en la franja horaria seleccionada',
        409
      );
    }

    const quote = calculateRentalQuote({
      precioHora: Number(board.precioHora),
      horas: input.horas,
      fechaInicio,
      puntosUsados: input.puntosUsados,
      incluyeSeguro: input.incluyeSeguro,
      valorTasadoUsd: Number(board.valorTasadoUsd),
      incluyeNeoprene: input.incluyeNeoprene,
      incluyeLeash: input.incluyeLeash,
      incluyeParafina: input.incluyeParafina,
    });

    return {
      quote,
      board: {
        id: board.id,
        titulo: board.titulo,
        marca: board.marca,
        precioHora: Number(board.precioHora),
        valorTasadoUsd: Number(board.valorTasadoUsd),
      },
      fechaFinEstimada: fechaFin.toISOString(),
    };
  }

  /**
   * Crea la reserva del alquiler con trazabilidad legal y contrato hash
   */
  async createRental(consumerId: string, input: CreateRentalInput) {
    const board = await prisma.board.findUnique({
      where: { id: input.boardId },
    });

    if (!board) {
      throw new AppError('BOARD_NOT_FOUND', 'La tabla especificada no existe', 404);
    }

    if (board.estado === 'MANTENIMIENTO' || board.estado === 'PRIVADA') {
      throw new AppError('BOARD_UNAVAILABLE', `La tabla no se encuentra disponible para alquiler (${board.estado})`, 400);
    }

    const fechaInicio = new Date(input.fechaInicio);
    const fechaFin = new Date(fechaInicio.getTime() + input.horas * 60 * 60 * 1000);

    const ahora = new Date();
    const bufferMs = 45 * 60 * 1000;
    if (fechaInicio.getTime() < ahora.getTime() + bufferMs) {
      throw new AppError(
        'PAST_TIME_SLOT',
        'El horario seleccionado ya pasó o está muy próximo (mínimo 60 min de anticipación). Elegí otro.',
        422
      );
    }

    const validation = validateOperatingHours(fechaInicio, fechaFin);
    if (!validation.isValid) {
      throw new AppError('INVALID_OPERATING_HOURS', validation.error || 'Horario no permitido en sede', 400);
    }

    const hasConflict = await this.checkOverlap(input.boardId, fechaInicio, fechaFin);
    if (hasConflict) {
      throw new AppError(
        'RENTAL_CONFLICT',
        'La tabla ya tiene una reserva activa en esa franja horaria',
        409
      );
    }

    const quote = calculateRentalQuote({
      precioHora: Number(board.precioHora),
      horas: input.horas,
      fechaInicio,
      puntosUsados: input.puntosUsados,
      incluyeSeguro: input.incluyeSeguro,
      valorTasadoUsd: Number(board.valorTasadoUsd),
      incluyeNeoprene: input.incluyeNeoprene,
      incluyeLeash: input.incluyeLeash,
      incluyeParafina: input.incluyeParafina,
    });

    // Hash criptográfico del contrato para auditoría legal (Ley 25.506)
    const bioSig = (input as any).biometricSignature;
    const hashData = `${consumerId}:${board.id}:${fechaInicio.toISOString()}:${quote.precioTotal}:${input.versionTerminos}`;
    const contratoHash =
      bioSig?.signatureHash || bioSig?.signature_hash || crypto.createHash('sha256').update(hashData).digest('hex');

    const rental = await prisma.rental.create({
      data: {
        consumerId,
        boardId: board.id,
        fechaInicio,
        fechaFinEstimada: fechaFin,
        horas: input.horas,
        precioBase: quote.precioBase,
        descuento: quote.descuentoTotal,
        precioSeguro: quote.precioSeguro,
        precioTotal: quote.precioTotal,
        gananciaOwner: quote.gananciaOwner,
        gananciaAgencia: quote.gananciaAgencia,
        puntosGanados: quote.puntosGanados,
        puntosUsados: input.puntosUsados || 0,
        estado: 'ACTIVA',
        contratoHash,
        versionTerminos: input.versionTerminos || '1.0',
        ipAceptacion: input.ipAceptacion || '127.0.0.1',
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
            ownerId: true,
          },
        },
      },
    });

    // Actualizar estado de la tabla a ALQUILADA
    if (prisma.board?.update) {
      await prisma.board.update({
        where: { id: board.id },
        data: { estado: 'ALQUILADA' },
      });
    }

    // Notificaciones in-app
    await prisma.notification.createMany({
      data: [
        {
          userId: consumerId,
          titulo: '¡Reserva Confirmada!',
          mensaje: `Tu reserva de ${board.titulo} está confirmada. Presentá tu código en Sede Central Playa Grande.`,
          tipo: 'ALQUILER',
        },
        {
          userId: board.ownerId,
          titulo: 'Nuevo Alquiler Registrado',
          mensaje: `Tu tabla ${board.titulo} fue reservada por ${input.horas} hs. Ganancia estimada: $${quote.gananciaOwner} ARS (95%).`,
          tipo: 'ALQUILER',
        },
      ],
    });

    // Registrar formalmente la firma biométrica en auditoría legal
    if (bioSig) {
      try {
        const { LegalService } = await import('../legal/legal.service');
        const legalService = new LegalService();
        await legalService.recordBiometricSignature({
          userId: consumerId,
          rentalId: rental.id,
          biometricVerified: true,
          timestamp: bioSig.timestamp,
          signatureHash: contratoHash,
          ipAddress: input.ipAceptacion || '127.0.0.1',
          userAgent: 'SurfRentalMobileApp/1.0',
        });
      } catch (err) {
        logger.warn(`No se pudo persistir firma biométrica en legalService: ${(err as Error).message}`);
      }
    }

    return {
      rental,
      quote,
    };
  }

  /**
   * Obtiene todos los alquileres del consumidor actual
   */
  async getMyRentals(consumerId: string) {
    const rentals = await prisma.rental.findMany({
      where: { consumerId },
      orderBy: { fechaInicio: 'desc' },
      include: {
        board: {
          select: {
            id: true,
            titulo: true,
            marca: true,
            medidas: true,
            tipoTabla: true,
            fotos: true,
          },
        },
        review: true,
      },
    });

    return rentals;
  }

  /**
   * Obtiene el detalle de un alquiler específico
   */
  async getRentalById(rentalId: string, userId: string, role: string) {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        board: true,
        consumer: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
          },
        },
        claims: true,
        payments: true,
        review: true,
      },
    });

    if (!rental) {
      throw new AppError('RENTAL_NOT_FOUND', 'Alquiler no encontrado', 404);
    }

    // Control de acceso: solo el consumidor, el owner de la tabla o la agencia
    if (role !== 'AGENCIA' && rental.consumerId !== userId && rental.board.ownerId !== userId) {
      throw new AppError('FORBIDDEN', 'No tenés permisos para ver este alquiler', 403);
    }

    return rental;
  }

  /**
   * Cancela una reserva aplicando la política escalonada
   */
  async cancelRental(rentalId: string, consumerId: string, input: CancelRentalInput): Promise<{
    rental: any;
    reembolso: {
      monto: number;
      porcentaje: number;
      motivo: string;
      tramo: string;
    };
    rentalId: string;
    estado: string;
    motivo: string;
    refund: CancellationRefundResult;
  }> {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
    });

    if (!rental) {
      throw new AppError('RENTAL_NOT_FOUND', 'Alquiler no encontrado', 404);
    }

    if (rental.consumerId !== consumerId) {
      throw new AppError('FORBIDDEN', 'No podés cancelar un alquiler de otro usuario', 403);
    }

    if (rental.estado !== 'ACTIVA' && rental.estado !== 'PENDIENTE') {
      throw new AppError('CANNOT_CANCEL', `No se puede cancelar un alquiler en estado ${rental.estado}`, 400);
    }

    const refund = calculateCancellationRefund(Number(rental.precioTotal), rental.fechaInicio);

    const updated = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        estado: 'CANCELADA',
      },
      include: { board: true },
    });

    // Liberar la tabla a estado DISPONIBLE
    if (rental.boardId && prisma.board?.update) {
      await prisma.board.update({
        where: { id: rental.boardId },
        data: { estado: 'DISPONIBLE' },
      });
    }

    // Liberar pagos y pre-autorizaciones de garantía asociadas
    if (prisma.payment?.updateMany) {
      await prisma.payment.updateMany({
        where: {
          rentalId,
          estado: { in: ['APROBADO', 'PRE_AUTORIZADO', 'PENDIENTE'] },
        },
        data: {
          estado: 'REEMBOLSADO',
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: consumerId,
        titulo: 'Alquiler Cancelado',
        mensaje: `Tu alquiler fue cancelado. ${refund.tramo}. Monto a reembolsar: $${refund.montoReembolso} ARS.`,
        tipo: 'ALQUILER',
      },
    });

    return {
      rental: updated,
      reembolso: {
        monto: refund.montoReembolso,
        porcentaje: Math.round(refund.porcentajeReembolso * 100),
        motivo: input.motivo,
        tramo: refund.tramo,
      },
      rentalId: updated.id,
      estado: updated.estado,
      motivo: input.motivo,
      refund,
    };
  }

  /**
   * Chequea si existen solapamientos de alquiler para la misma tabla
   */
  private async checkOverlap(boardId: string, fechaInicio: Date, fechaFin: Date): Promise<boolean> {
    const conflicting = await prisma.rental.findFirst({
      where: {
        boardId,
        estado: { in: ['ACTIVA', 'EN_CURSO', 'PENDIENTE'] },
        OR: [
          {
            fechaInicio: { lte: fechaInicio },
            fechaFinEstimada: { gt: fechaInicio },
          },
          {
            fechaInicio: { lt: fechaFin },
            fechaFinEstimada: { gte: fechaFin },
          },
          {
            fechaInicio: { gte: fechaInicio },
            fechaFinEstimada: { lte: fechaFin },
          },
        ],
      },
    });

    return Boolean(conflicting);
  }
}

export const rentalsService = new RentalsService();
