import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { BUSINESS } from '../../constants/business';
import { AgencyCheckInInput, AgencyCheckOutInput } from './agency.schemas';

export class AgencyService {
  /**
   * Procesa la entrega física de la tabla en mostrador de la Sede Central:
   * Inspección fotográfica de retiro, validación de DNI (+18) y firma digital.
   */
  async checkIn(input: AgencyCheckInInput, _operatorId: string) {
    const rental = await prisma.rental.findUnique({
      where: { id: input.rentalId },
      include: {
        board: true,
        consumer: true,
      },
    });

    if (!rental) {
      throw new AppError('RENTAL_NOT_FOUND', 'Alquiler no encontrado', 404);
    }

    if (rental.estado === 'EN_CURSO') {
      return rental;
    }

    if (rental.estado !== 'ACTIVA' && rental.estado !== 'PENDIENTE') {
      throw new AppError(
        'INVALID_STATUS',
        `No se puede realizar el retiro de un alquiler en estado ${rental.estado}`,
        400
      );
    }

    // Validación reglamentaria de horario pactado de retiro:
    // El check-in solo se habilita con un máximo de 15 minutos antes del horario pactado
    const now = new Date();
    const inicioTime = new Date(rental.fechaInicio).getTime();
    const ventanaAnticipacionMs = 15 * 60 * 1000; // 15 minutos de gracia

    if (now.getTime() < inicioTime - ventanaAnticipacionMs) {
      const horaPactada = new Date(rental.fechaInicio).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const fechaPactada = new Date(rental.fechaInicio).toLocaleDateString('es-AR');
      throw new AppError(
        'EARLY_CHECKIN_NOT_ALLOWED',
        `Retiro anticipado no permitido. El horario pactado de retiro es el ${fechaPactada} a las ${horaPactada} hs. El despacho en mostrador se habilita con un máximo de 15 minutos de anticipación.`,
        400
      );
    }

    // 1. Actualizar alquiler a EN_CURSO con fotos y firma de conformidad
    const updatedRental = await prisma.rental.update({
      where: { id: rental.id },
      data: {
        estado: 'EN_CURSO',
        fotosRetiro: input.fotosRetiro,
        firmaRetiroUrl: input.firmaRetiroUrl,
      },
      include: {
        board: true,
        consumer: true,
      },
    });

    // 2. Actualizar estado de la tabla a ALQUILADA
    await prisma.board.update({
      where: { id: rental.boardId },
      data: {
        estado: 'ALQUILADA',
      },
    });

    // 3. Notificaciones in-app
    await prisma.notification.createMany({
      data: [
        {
          userId: rental.consumerId,
          titulo: '¡Tabla Retirada en Sede!',
          mensaje: `Retiraste ${rental.board.titulo}. Horario de devolución estimada: ${new Date(rental.fechaFinEstimada).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs.`,
          tipo: 'ALQUILER',
        },
        {
          userId: rental.board.ownerId,
          titulo: 'Tabla en el Agua',
          mensaje: `Tu tabla ${rental.board.titulo} fue entregada y está siendo utilizada por el surfista.`,
          tipo: 'ALQUILER',
        },
      ],
    });

    return updatedRental;
  }

  /**
   * Procesa la devolución de la tabla en mostrador de la Sede Central:
   * Control de enjuague de salitre (multa automática $10.000 ARS) y revisión de daños.
   */
  async checkOut(input: AgencyCheckOutInput, _operatorId: string) {
    const rental = await prisma.rental.findUnique({
      where: { id: input.rentalId },
      include: {
        board: true,
        consumer: true,
      },
    });

    if (!rental) {
      throw new AppError('RENTAL_NOT_FOUND', 'Alquiler no encontrado', 404);
    }

    if (rental.estado === 'DEVUELTA' || rental.estado === 'PENDIENTE_REVISION') {
      return {
        rental,
        multaLavado: Number(rental.multaLavado || 0),
        lavada: rental.lavada ?? true,
        tieneDanio: false,
        estadoFinal: rental.estado,
      };
    }

    if (rental.estado !== 'EN_CURSO' && rental.estado !== 'ACTIVA') {
      throw new AppError(
        'INVALID_STATUS',
        `Solo se puede recibir la devolución de un alquiler en estado EN_CURSO o ACTIVA (actual: ${rental.estado})`,
        400
      );
    }

    const now = new Date();
    const multaLavado = !input.lavada ? BUSINESS.MULTA_NO_LAVAR : 0;
    const nuevoEstadoRental = input.tieneDanio ? 'PENDIENTE_REVISION' : 'DEVUELTA';
    const nuevoEstadoBoard = input.tieneDanio ? 'MANTENIMIENTO' : 'DISPONIBLE';

    // 1. Si no fue lavada, registrar cobro automático de la multa de $10.000 ARS
    if (!input.lavada) {
      await prisma.payment.create({
        data: {
          rentalId: rental.id,
          monto: multaLavado,
          tipo: 'MULTA',
          estado: 'DEBITADO',
          metadataJson: {
            motivo: 'Regla de negocio: Tabla devuelta con salitre/sin enjuague de agua dulce',
            montoArs: multaLavado,
            aplicadoAt: now.toISOString(),
          },
        },
      });

      await prisma.notification.create({
        data: {
          userId: rental.consumerId,
          titulo: '⚠️ Multa por Salitre Aplicada',
          mensaje: `Se debitó una multa de $${multaLavado.toLocaleString('es-AR')} ARS por no enjuagar la tabla antes de la devolución.`,
          tipo: 'MULTA',
        },
      });
    }

    // 2. Preparar fotos de devolución (incluyendo foto del daño si fue reportado)
    let fotosFinales = input.fotosDevolucion;
    if (input.tieneDanio && input.fotoDanio) {
      fotosFinales = [input.fotoDanio, ...input.fotosDevolucion.filter((f) => f !== input.fotoDanio)];
    }

    // Actualizar registro del alquiler
    const updatedRental = await prisma.rental.update({
      where: { id: rental.id },
      data: {
        estado: nuevoEstadoRental,
        fotosDevolucion: fotosFinales,
        descripcionDanio: input.tieneDanio ? input.descripcionDanio : null,
        lavada: input.lavada,
        multaLavado,
        fechaDevolucionReal: now,
      },
      include: {
        board: true,
      },
    });

    // 3. Actualizar estado de la tabla
    await prisma.board.update({
      where: { id: rental.boardId },
      data: {
        estado: nuevoEstadoBoard,
      },
    });

    // 4. Notificaciones
    if (input.tieneDanio) {
      await prisma.notification.createMany({
        data: [
          {
            userId: rental.consumerId,
            titulo: 'Inspección con Observaciones',
            mensaje: `Se registraron daños en ${rental.board.titulo}: "${input.descripcionDanio}". Plazo de disputa: 24 horas.`,
            tipo: 'RECLAMO',
          },
          {
            userId: rental.board.ownerId,
            titulo: 'Revisión Técnica Requerida',
            mensaje: `Tu tabla ${rental.board.titulo} fue devuelta con reporte de daño: "${input.descripcionDanio}". Podés inspeccionar las fotos de devolución en tu panel de dueño para ratificar o iniciar reclamo.`,
            tipo: 'RECLAMO',
          },
        ],
      });
    } else {
      await prisma.notification.create({
        data: {
          userId: rental.consumerId,
          titulo: '¡Alquiler Completado!',
          mensaje: `La devolución de ${rental.board.titulo} fue exitosa. ¡Gracias por surfear con Surf Rental MDP!`,
          tipo: 'ALQUILER',
        },
      });
    }

    return {
      rental: updatedRental,
      multaLavado,
      lavada: input.lavada,
      tieneDanio: input.tieneDanio,
      estadoFinal: nuevoEstadoRental,
    };
  }

  /**
   * Obtiene la grilla de operaciones del día en Sede Central
   */
  async getDailySchedule() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rentals = await prisma.rental.findMany({
      where: {
        OR: [
          {
            estado: { in: ['ACTIVA', 'PENDIENTE', 'EN_CURSO'] },
          },
          {
            fechaInicio: { gte: today, lt: tomorrow },
          },
        ],
      },
      orderBy: { fechaInicio: 'asc' },
      include: {
        board: {
          select: {
            id: true,
            titulo: true,
            marca: true,
            tipoTabla: true,
            fotos: true,
          },
        },
        consumer: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            email: true,
          },
        },
      },
    });

    return rentals;
  }

  /**
   * Métricas y resumen operativo del mostrador de la agencia
   */
  async getAgencyMetrics() {
    const enElAguaCount = await prisma.rental.count({
      where: { estado: 'EN_CURSO' },
    });

    const reservasHoyCount = await prisma.rental.count({
      where: { estado: 'ACTIVA' },
    });

    const tablasEnCustodia = await prisma.board.count();

    const multasEmitidas = await prisma.payment.aggregate({
      where: { tipo: 'MULTA', estado: 'DEBITADO' },
      _sum: { monto: true },
      _count: { id: true },
    });

    return {
      enElAguaCount,
      reservasHoyCount,
      tablasEnCustodia,
      totalMultasRecaudadas: Number(multasEmitidas._sum.monto || 0),
      cantidadMultas: multasEmitidas._count.id,
      comisionAgenciaPorcentaje: 5,
      multaLavadoEstándar: BUSINESS.MULTA_NO_LAVAR,
    };
  }
}

export const agencyService = new AgencyService();
