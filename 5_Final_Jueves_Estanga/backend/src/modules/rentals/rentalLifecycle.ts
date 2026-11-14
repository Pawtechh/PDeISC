import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';

export const NO_SHOW_MARKER = 'NO_SHOW_SIN_RETIRO';

/**
 * Liquida una reserva no retirada cuya ventana ya expiró (`now >= fechaFinEstimada`).
 * Mantiene el 100% del pago aprobado/retenido a favor de la agencia y el propietario,
 * cierra la reserva y libera la tabla a `DISPONIBLE`.
 */
export async function settleNoShowRental(rental: any, now: Date = new Date()) {
  const updatedRental = await prisma.rental.update({
    where: { id: rental.id },
    data: {
      estado: 'DEVUELTA',
      fechaDevolucionReal: rental.fechaFinEstimada || now,
    },
  });

  if (
    rental.boardId &&
    typeof (prisma as any)?.board?.update === 'function' &&
    rental.board?.estado !== 'MANTENIMIENTO' &&
    rental.board?.estado !== 'REPARACION' &&
    rental.board?.estado !== 'PENDIENTE_REVISION'
  ) {
    await prisma.board.update({
      where: { id: rental.boardId },
      data: { estado: 'DISPONIBLE' },
    });
  }

  const horaFinStr = rental.fechaFinEstimada
    ? new Date(rental.fechaFinEstimada).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  const notifRows: Array<{
    userId: string;
    titulo: string;
    mensaje: string;
    tipo: 'ALQUILER';
  }> = [
    {
      userId: rental.consumerId,
      titulo: 'Reserva vencida sin retiro — Servicio cobrado',
      mensaje: `No registraste el retiro de ${rental.board?.titulo || 'tu tabla'} antes del horario de devolución (${horaFinStr} hs). Según la política vigente, el servicio queda cobrado íntegramente sin reembolso.`,
      tipo: 'ALQUILER',
    },
  ];

  if (rental.board?.ownerId) {
    notifRows.push({
      userId: rental.board.ownerId,
      titulo: 'No-Show liquidado — Pago retenido',
      mensaje: `El surfista no retiró ${rental.board.titulo} antes de las ${horaFinStr} hs. El servicio quedó cobrado íntegramente y la tabla volvió a estar disponible.`,
      tipo: 'ALQUILER',
    });
  }

  try {
    if (typeof (prisma as any)?.notification?.createMany === 'function') {
      await prisma.notification.createMany({ data: notifRows });
    } else if (typeof (prisma as any)?.notification?.create === 'function') {
      for (const n of notifRows) {
        await prisma.notification.create({ data: n });
      }
    }
  } catch (err) {
    logger.warn('No se pudieron crear notificaciones de No-Show:', err);
  }

  return {
    ...updatedRental,
    esNoShow: true,
    servicioCobrado: Number(rental.precioTotal || 0),
  };
}

/**
 * Barrido automático de reservas pendientes/activas cuya ventana (`fechaFinEstimada`)
 * ya venció sin haber retirado la tabla.
 */
export async function sweepExpiredNoShows(
  whereScope: Record<string, any> = {},
  now: Date = new Date()
) {
  if (typeof (prisma as any)?.rental?.findMany !== 'function') {
    return [];
  }

  const candidates = await prisma.rental.findMany({
    where: {
      ...whereScope,
      estado: { in: ['ACTIVA', 'PENDIENTE'] },
      fechaFinEstimada: { lte: now },
    },
    include: {
      board: true,
      consumer: true,
    },
  });

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [];
  }

  const expired = candidates.filter((r: any) => {
    if (!r || (r.estado !== 'ACTIVA' && r.estado !== 'PENDIENTE')) return false;
    if (!r.fechaFinEstimada) return false;
    const end = new Date(r.fechaFinEstimada);
    return !Number.isNaN(end.getTime()) && end.getTime() <= now.getTime();
  });

  const settled = [];
  for (const r of expired) {
    const result = await settleNoShowRental(r, now);
    settled.push(result);
  }

  return settled;
}
