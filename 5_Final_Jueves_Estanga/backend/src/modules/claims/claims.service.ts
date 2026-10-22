import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { BUSINESS } from '../../constants/business';
import {
  CreateClaimInput,
  ConsumerRespondClaimInput,
  AgencyMediateClaimInput,
} from './claims.schemas';

export class ClaimsService {
  /**
   * Crea y notifica un nuevo reclamo de daño (iniciado por el Owner o la Agencia)
   */
  async createClaim(reporterId: string, input: CreateClaimInput) {
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

    const now = new Date();
    const plazoDisputaVence = new Date(
      now.getTime() + BUSINESS.PLAZO_DISPUTA_HORAS * 60 * 60 * 1000
    );

    // 1. Crear el reclamo en estado NOTIFICADO
    const claim = await prisma.insuranceClaim.create({
      data: {
        rentalId: rental.id,
        reportadoPorId: reporterId,
        montoReclamado: input.montoReclamado,
        descripcion: input.descripcion,
        fotosDano: input.fotosDano,
        presupuestoReparacionUrl: input.presupuestoReparacionUrl,
        estado: 'NOTIFICADO',
        notificadoAt: now,
        plazoDisputaVence,
      },
      include: {
        rental: {
          include: {
            board: true,
            consumer: true,
          },
        },
      },
    });

    // 2. Actualizar alquiler a RECLAMO y tabla a MANTENIMIENTO
    await prisma.rental.update({
      where: { id: rental.id },
      data: { estado: 'RECLAMO' },
    });

    await prisma.board.update({
      where: { id: rental.boardId },
      data: { estado: 'MANTENIMIENTO' },
    });

    // 3. Notificación reglamentaria con apercibimiento del plazo de 24 horas
    await prisma.notification.create({
      data: {
        userId: rental.consumerId,
        titulo: '⚠️ Daño Reportado en tu Alquiler de Tabla',
        mensaje: `Se reportó un daño en "${rental.board.titulo}". Tenés 24 horas (vence el ${plazoDisputaVence.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}) para responder o disputar. Pasado dicho plazo, el silencio constituye aceptación tácita del cargo.`,
        tipo: 'RECLAMO',
      },
    });

    return claim;
  }

  /**
   * Obtiene la lista de reclamos según el rol del usuario (Consumer, Owner o Agencia)
   */
  async getClaims(userId: string, role: string) {
    // Procesar automáticamente los reclamos de 24h vencidos por silencio
    try {
      await this.processExpired24hClaims();
    } catch {
      // Ignorar error transitorio si ya se procesó
    }

    let whereClause: any = {};

    if (role === 'CONSUMER') {
      whereClause = { rental: { consumerId: userId } };
    } else if (role === 'OWNER') {
      whereClause = { rental: { board: { ownerId: userId } } };
    }
    // Si es AGENCIA, ve todos los reclamos del sistema

    const claims = await prisma.insuranceClaim.findMany({
      where: whereClause,
      include: {
        rental: {
          include: {
            board: true,
            consumer: {
              select: { id: true, nombre: true, email: true, telefono: true, dni: true },
            },
            payments: true,
          },
        },
        reportadoPor: {
          select: { id: true, nombre: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return claims.map((c) => {
      const msRestantes = c.plazoDisputaVence ? c.plazoDisputaVence.getTime() - now.getTime() : 0;
      const horasRestantes = Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60)));
      const plazoVencido = msRestantes <= 0;

      return {
        ...c,
        montoReclamado: Number(c.montoReclamado),
        horasRestantesDisputa: c.estado === 'NOTIFICADO' ? horasRestantes : 0,
        plazoVencido,
      };
    });
  }

  /**
   * Obtiene el detalle de un reclamo por ID con validación de pertenencia
   */
  async getClaimById(claimId: string, userId: string, role: string) {
    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: claimId },
      include: {
        rental: {
          include: {
            board: true,
            consumer: true,
            payments: true,
          },
        },
        reportadoPor: {
          select: { id: true, nombre: true, role: true },
        },
      },
    });

    if (!claim) {
      throw new AppError('CLAIM_NOT_FOUND', 'Reclamo no encontrado', 404);
    }

    if (
      role === 'CONSUMER' &&
      claim.rental.consumerId !== userId
    ) {
      throw new AppError('FORBIDDEN', 'No tenés permisos para ver este reclamo', 403);
    }

    if (
      role === 'OWNER' &&
      claim.rental.board.ownerId !== userId
    ) {
      throw new AppError('FORBIDDEN', 'No tenés permisos para ver este reclamo', 403);
    }

    const now = new Date();
    const msRestantes = claim.plazoDisputaVence
      ? claim.plazoDisputaVence.getTime() - now.getTime()
      : 0;
    const horasRestantes = Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60)));

    return {
      ...claim,
      montoReclamado: Number(claim.montoReclamado),
      horasRestantesDisputa: claim.estado === 'NOTIFICADO' ? horasRestantes : 0,
      plazoVencido: msRestantes <= 0,
      reglaSilencio: 'Silencio del consumer tras 24h notificado = aceptación de daño.',
    };
  }

  /**
   * Respuesta del consumidor al reclamo dentro del plazo de 24 horas:
   * - ACEPTAR: Reconoce el daño -> Se ejecuta el cobro sobre la pre-autorización.
   * - DISPUTAR: Objeta el daño -> Pasa a estado EN_MEDIACION para dictamen de Agencia.
   */
  async consumerRespond(
    claimId: string,
    consumerId: string,
    input: ConsumerRespondClaimInput
  ) {
    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: claimId },
      include: {
        rental: {
          include: { board: true, consumer: true },
        },
      },
    });

    if (!claim) {
      throw new AppError('CLAIM_NOT_FOUND', 'Reclamo no encontrado', 404);
    }

    if (claim.rental.consumerId !== consumerId) {
      throw new AppError('FORBIDDEN', 'No sos el titular de este alquiler', 403);
    }

    if (claim.estado !== 'NOTIFICADO') {
      throw new AppError(
        'INVALID_STATUS',
        `No se puede responder un reclamo en estado ${claim.estado}`,
        400
      );
    }

    const now = new Date();

    // 1. Caso A: Consumidor ACEPTA la responsabilidad
    if (input.accion === 'ACEPTAR') {
      await prisma.insuranceClaim.update({
        where: { id: claim.id },
        data: {
          estado: 'ACEPTADO',
          resolucionAgencia: 'Aceptado voluntariamente por el consumidor dentro del plazo de 24h.',
        },
      });

      // Ejecutar la secuencia de cobro sobre la pre-autorización
      const cobroResult = await this.executeClaimCharge(claim.id, consumerId);

      // Notificar al Owner
      await prisma.notification.create({
        data: {
          userId: claim.rental.board.ownerId,
          titulo: '✓ Reclamo de Daño Aceptado por el Surfista',
          mensaje: `El cliente aceptó la responsabilidad del daño en "${claim.rental.board.titulo}". Se debitaron $${Number(claim.montoReclamado).toLocaleString('es-AR')} ARS para la reparación.`,
          tipo: 'RECLAMO',
        },
      });

      return {
        estado: 'ACEPTADO',
        mensaje: 'Aceptaste la responsabilidad del daño. El cobro fue procesado con éxito.',
        cobro: cobroResult,
      };
    }

    // 2. Caso B: Consumidor DISPUTA el cargo con descargo fotográfico
    const updatedClaim = await prisma.insuranceClaim.update({
      where: { id: claim.id },
      data: {
        estado: 'EN_MEDIACION',
        resolucionAgencia: `DISPUTA INICIADA POR CONSUMIDOR: "${input.motivoDisputa || 'Sin motivo especificado'}" [${now.toISOString()}]`,
      },
    });

    // Notificar al Dueño de la disputa
    await prisma.notification.create({
      data: {
        userId: claim.rental.board.ownerId,
        titulo: 'Disputa de Daño en Curso',
        mensaje: `El surfista disputó el reclamo en "${claim.rental.board.titulo}". El caso pasó a arbitraje de la Agencia en sede central.`,
        tipo: 'RECLAMO',
      },
    });

    return {
      estado: 'EN_MEDIACION',
      mensaje: 'Disputa registrada. La Agencia peritará las fotos de entrega y devolución para emitir resolución vinculante.',
      claim: updatedClaim,
    };
  }

  /**
   * Cron / Worker de Vencimiento de 24 Horas:
   * Aplica la regla jurídica no negociable:
   * "Silencio del consumer tras 24h notificado = aceptación de daño"
   */
  async processExpired24hClaims() {
    const now = new Date();

    const expiredClaims = await prisma.insuranceClaim.findMany({
      where: {
        estado: 'NOTIFICADO',
        plazoDisputaVence: {
          lt: now,
        },
      },
      include: {
        rental: {
          include: { board: true, consumer: true },
        },
      },
    });

    const procesados = [];

    for (const claim of expiredClaims) {
      // 1. Marcar como aceptado por silencio de 24 horas
      await prisma.insuranceClaim.update({
        where: { id: claim.id },
        data: {
          estado: 'ACEPTADO',
          resolucionAgencia: `ACEPTACIÓN TÁCITA POR SILENCIO: Vencido el plazo de 24 horas sin objeción del consumidor (${now.toISOString()}). Regla no negociable aplicada.`,
        },
      });

      // 2. Ejecutar cobro sobre la pre-autorización
      await this.executeClaimCharge(claim.id, 'SISTEMA_CRON_24H');

      // 3. Notificar a las partes
      await prisma.notification.create({
        data: {
          userId: claim.rental.consumerId,
          titulo: 'Aceptación Tácita de Daño (Plazo 24h Vencido)',
          mensaje: `Vencieron las 24 horas sin respuesta para el reclamo de "${claim.rental.board.titulo}". Según las condiciones contractuales, el silencio implica aceptación. Se procedió al cobro de la reparación.`,
          tipo: 'RECLAMO',
        },
      });

      await prisma.notification.create({
        data: {
          userId: claim.rental.board.ownerId,
          titulo: '✓ Reclamo Aprobado por Silencio del Cliente',
          mensaje: `Se venció el plazo de 24h sin respuesta del cliente para "${claim.rental.board.titulo}". El cobro por $${Number(claim.montoReclamado).toLocaleString('es-AR')} ARS fue ejecutado.`,
          tipo: 'RECLAMO',
        },
      });

      procesados.push(claim.id);
    }

    return {
      totalProcesados: procesados.length,
      claimsAfectados: procesados,
      timestamp: now.toISOString(),
    };
  }

  /**
   * Mediación de la Agencia (Arbitraje en mostrador):
   * La Agencia revisa las fotos de Check-in (entrega) vs Check-out (devolución)
   * y emite resolución vinculante:
   * - RESUELTO_OWNER: Confirma daño -> Se ejecuta cobro sobre pre-autorización.
   * - RESUELTO_CONSUMER: Desestima reclamo -> Se libera pre-autorización y rehabilita tabla.
   */
  async agencyMediate(
    claimId: string,
    operatorId: string,
    input: AgencyMediateClaimInput
  ) {
    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: claimId },
      include: {
        rental: {
          include: { board: true, consumer: true },
        },
      },
    });

    if (!claim) {
      throw new AppError('CLAIM_NOT_FOUND', 'Reclamo no encontrado', 404);
    }

    if (claim.estado !== 'EN_MEDIACION' && claim.estado !== 'DISPUTADO') {
      throw new AppError(
        'INVALID_STATUS',
        `Solo se pueden mediar reclamos en mediación o disputados (actual: ${claim.estado})`,
        400
      );
    }

    const montoFinal = input.montoAprobado || Number(claim.montoReclamado);

    // 1. Caso A: Resolución a favor del Dueño (Owner)
    if (input.resolucion === 'RESUELTO_OWNER') {
      const updatedClaim = await prisma.insuranceClaim.update({
        where: { id: claim.id },
        data: {
          estado: 'RESUELTO_OWNER',
          resolucionAgencia: `LAUDO ARBITRAL AGENCIA (Operador ${operatorId}): Daño confirmado. ${input.resolucionAgencia}`,
          montoReclamado: montoFinal,
        },
      });

      // Ejecutar cobro sobre la pre-autorización
      const cobro = await this.executeClaimCharge(claim.id, operatorId, montoFinal);

      await prisma.notification.createMany({
        data: [
          {
            userId: claim.rental.consumerId,
            titulo: 'Resolución de Mediación: Favorable al Propietario',
            mensaje: `La Agencia peritó las fotos del alquiler y determinó que el daño corresponde al período de uso. Dictamen: ${input.resolucionAgencia}. Se debitó $${montoFinal.toLocaleString('es-AR')} ARS.`,
            tipo: 'RECLAMO',
          },
          {
            userId: claim.rental.board.ownerId,
            titulo: '✓ Mediación Resuelta a tu Favor',
            mensaje: `La Agencia peritó el reclamo de "${claim.rental.board.titulo}" y ratificó el daño. Se acreditarán $${montoFinal.toLocaleString('es-AR')} ARS para la reparación.`,
            tipo: 'RECLAMO',
          },
        ],
      });

      return {
        resolucion: 'RESUELTO_OWNER',
        claim: updatedClaim,
        cobro,
      };
    }

    // 2. Caso B: Resolución a favor del Consumidor
    const updatedClaim = await prisma.insuranceClaim.update({
      where: { id: claim.id },
      data: {
        estado: 'RESUELTO_CONSUMER',
        resolucionAgencia: `LAUDO ARBITRAL AGENCIA (Operador ${operatorId}): Daño desestimado. ${input.resolucionAgencia}`,
      },
    });

    // Liberar la garantía pre-autorizada
    await prisma.payment.updateMany({
      where: {
        rentalId: claim.rental.id,
        tipo: 'PRE_AUTH_DANO',
        estado: 'PRE_AUTORIZADO',
      },
      data: {
        estado: 'REEMBOLSADO',
      },
    });

    // Cerrar el alquiler como DEVUELTA y reactivar tabla a DISPONIBLE
    await prisma.rental.update({
      where: { id: claim.rental.id },
      data: { estado: 'DEVUELTA' },
    });

    await prisma.board.update({
      where: { id: claim.rental.boardId },
      data: { estado: 'DISPONIBLE' },
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: claim.rental.consumerId,
          titulo: '✓ Reclamo Desestimado por Mediación',
          mensaje: `La Agencia peritó las fotos y determinó que no existió daño imputable a tu uso. Se liberó la pre-autorización de garantía sin cargos.`,
          tipo: 'RECLAMO',
        },
        {
          userId: claim.rental.board.ownerId,
          titulo: 'Mediación Resuelta: Reclamo Desestimado',
          mensaje: `La Agencia determinó que el detalle observado en "${claim.rental.board.titulo}" correspondía a desgaste previo o no constituye daño imputable. La tabla fue reactivada en el catálogo.`,
          tipo: 'RECLAMO',
        },
      ],
    });

    return {
      resolucion: 'RESUELTO_CONSUMER',
      claim: updatedClaim,
      mensaje: 'Reclamo desestimado. Garantía liberada y tabla reactivada.',
    };
  }

  /**
   * Secuencia de cobro de daños contra la Pre-Autorización:
   * 1. Localiza el Payment PRE_AUTORIZADO ($30.000 ARS).
   * 2. Debita el monto exacto de la reparación.
   * 3. Si el daño supera el hold, cobra el tope y deriva a legal si no se salda.
   * 4. Transiciona el reclamo a COBRADO.
   */
  async executeClaimCharge(claimId: string, actorId: string, montoOverride?: number) {
    const claim = await prisma.insuranceClaim.findUnique({
      where: { id: claimId },
      include: {
        rental: {
          include: {
            board: true,
            consumer: true,
            payments: true,
          },
        },
      },
    });

    if (!claim) {
      throw new AppError('CLAIM_NOT_FOUND', 'Reclamo no encontrado', 404);
    }

    const montoCobrar = montoOverride !== undefined ? montoOverride : Number(claim.montoReclamado);
    const now = new Date();

    // 1. Buscar la pre-autorización de daño existente en los pagos del alquiler
    const holdPayment = claim.rental.payments.find(
      (p) => p.tipo === 'PRE_AUTH_DANO' && p.estado === 'PRE_AUTORIZADO'
    );

    let cobroEfectivoMonto = montoCobrar;
    let pagoDebitadoId: string;

    if (holdPayment) {
      const montoHold = Number(holdPayment.monto);
      cobroEfectivoMonto = Math.min(montoCobrar, montoHold);

      // Actualizar el hold a DEBITADO
      await prisma.payment.update({
        where: { id: holdPayment.id },
        data: {
          estado: 'DEBITADO',
          monto: cobroEfectivoMonto,
          metadataJson: {
            motivo: 'Cobro por reparación de daños según laudo/aceptación de reclamo',
            claimId: claim.id,
            actorId,
            montoTotalReclamado: montoCobrar,
            montoDebitadoPreAuth: cobroEfectivoMonto,
            fechaCobro: now.toISOString(),
          },
        },
      });

      pagoDebitadoId = holdPayment.id;
    } else {
      // Si no había hold previo en sandbox, crear el pago debitado directamente
      const newPayment = await prisma.payment.create({
        data: {
          rentalId: claim.rental.id,
          monto: cobroEfectivoMonto,
          tipo: 'PRE_AUTH_DANO',
          estado: 'DEBITADO',
          metadataJson: {
            motivo: 'Cobro directo de daño de seguro',
            claimId: claim.id,
            actorId,
            fechaCobro: now.toISOString(),
          },
        },
      });
      pagoDebitadoId = newPayment.id;
    }

    // 2. Si el daño superó el monto retenido en el hold, derivar a gestión legal
    const superoGarantia = montoCobrar > (holdPayment ? Number(holdPayment.monto) : 30000);
    const estadoFinalClaim = superoGarantia ? 'DERIVADO_LEGAL' : 'COBRADO';

    // 3. Actualizar estado del reclamo
    await prisma.insuranceClaim.update({
      where: { id: claim.id },
      data: {
        estado: estadoFinalClaim,
        cobradoAt: now,
      },
    });

    // 4. Si se cobró por completo, cerrar el alquiler como DEVUELTA
    if (estadoFinalClaim === 'COBRADO') {
      await prisma.rental.update({
        where: { id: claim.rental.id },
        data: { estado: 'DEVUELTA' },
      });
    }

    return {
      claimId: claim.id,
      estado: estadoFinalClaim,
      montoCobrado: cobroEfectivoMonto,
      pagoId: pagoDebitadoId,
      cobradoAt: now,
      superoGarantia,
    };
  }
}

export const claimsService = new ClaimsService();
