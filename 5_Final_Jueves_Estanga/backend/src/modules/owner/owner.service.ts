import { prisma } from '../../config/prisma';
import { AppError } from '../../middlewares/errorHandler';
import { BUSINESS } from '../../constants/business';
import { systemConfig } from '../../config/systemConfig';
import {
  RequestPayoutInput,
  CompleteMaintenanceInput,
  CreateOwnerClaimInput,
} from './owner.schemas';

export class OwnerService {
  /**
   * Obtiene todas las tablas del Owner con cálculo en tiempo real
   * del ciclo de mantenimiento preventivo de 45 días y estadísticas de uso.
   */
  async getMyBoards(ownerId: string) {
    const boards = await prisma.board.findMany({
      where: { ownerId },
      include: {
        rentals: {
          select: {
            id: true,
            estado: true,
            gananciaOwner: true,
            horas: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return boards.map((board) => {
      // Cálculo de ciclo de mantenimiento preventivo (45 días)
      const ultimo = board.ultimoMantenimiento || board.createdAt;
      const proximo =
        board.proximoMantenimiento ||
        new Date(ultimo.getTime() + BUSINESS.MANTENIMIENTO_DIAS * 24 * 60 * 60 * 1000);

      const msRestantes = proximo.getTime() - now.getTime();
      const diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));
      const isOverdue = diasRestantes <= 0;
      const needsMaintenanceSoon = diasRestantes > 0 && diasRestantes <= 7;

      // Métricas de la tabla
      const completedRentals = board.rentals.filter(
        (r) => r.estado === 'DEVUELTA' || r.estado === 'PENDIENTE_REVISION' || r.estado === 'EN_CURSO'
      );
      const totalAlquileres = completedRentals.length;
      const totalHoras = completedRentals.reduce((acc, r) => acc + r.horas, 0);
      const gananciasGeneradas = completedRentals.reduce(
        (acc, r) => acc + Number(r.gananciaOwner),
        0
      );

      return {
        ...board,
        precioHora: Number(board.precioHora),
        valorTasadoUsd: Number(board.valorTasadoUsd),
        mantenimiento: {
          ultimoMantenimiento: ultimo,
          proximoMantenimiento: proximo,
          diasRestantes,
          isOverdue,
          needsMaintenanceSoon,
          estadoCiclo: isOverdue ? 'VENCIDO' : needsMaintenanceSoon ? 'POR_VENCER' : 'AL_DIA',
        },
        metricas: {
          totalAlquileres,
          totalHoras,
          gananciasGeneradas,
        },
      };
    });
  }

  /**
   * Obtiene el desglose financiero del Owner:
   * - Ingresos al 95% (comisión agencia 5% deducida)
   * - Estado de suscripción mensual ($1.000 ARS/mes, primeros 3 meses gratis)
   * - Saldo disponible y liquidaciones
   */
  async getEarnings(ownerId: string) {
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      include: {
        boards: {
          include: {
            rentals: {
              where: {
                estado: {
                  in: ['DEVUELTA', 'PENDIENTE_REVISION', 'EN_CURSO', 'ACTIVA'],
                },
              },
              include: {
                board: {
                  select: { titulo: true, tipoTabla: true },
                },
                consumer: {
                  select: { nombre: true, email: true },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!owner) {
      throw new AppError('USER_NOT_FOUND', 'Usuario owner no encontrado', 404);
    }

    const now = new Date();

    // 1. Cálculo de Suscripción ($1.000/mes, primeros 3 meses 100% gratis)
    const msDesdeRegistro = now.getTime() - owner.createdAt.getTime();
    const diasActivo = Math.floor(msDesdeRegistro / (1000 * 60 * 60 * 24));
    const mesesActivo = Math.floor(diasActivo / 30);
    const estaEnPeriodoGratuito = mesesActivo < BUSINESS.MESES_GRATIS_OWNER;
    const mesesGratisRestantes = Math.max(0, BUSINESS.MESES_GRATIS_OWNER - mesesActivo);
    const costoMensualSuscripcion = estaEnPeriodoGratuito ? 0 : BUSINESS.SUSCRIPCION_OWNER;

    // Próximo cobro de suscripción (a 30 días del último ciclo)
    const proximoCobroSuscripcion = new Date(
      owner.createdAt.getTime() + (mesesActivo + 1) * 30 * 24 * 60 * 60 * 1000
    );

    // 2. Liquidación 95% Owner / 5% Agencia
    let totalBruto = 0;
    let totalGananciaOwner = 0;
    let totalComisionAgencia = 0;
    let totalHoras = 0;
    const todosLosAlquileres = [];

    for (const board of owner.boards) {
      for (const rental of board.rentals) {
        const gananciaOwner = Number(rental.gananciaOwner);
        const gananciaAgencia = Number(rental.gananciaAgencia);
        const totalAlquiler = Number(rental.precioTotal);

        totalBruto += totalAlquiler;
        totalGananciaOwner += gananciaOwner;
        totalComisionAgencia += gananciaAgencia;
        totalHoras += rental.horas;

        todosLosAlquileres.push({
          id: rental.id,
          tabla: board.titulo,
          tipoTabla: board.tipoTabla,
          surfista: rental.consumer.nombre,
          fechaInicio: rental.fechaInicio,
          horas: rental.horas,
          precioTotal: totalAlquiler,
          gananciaOwner,
          comisionAgencia: gananciaAgencia,
          estado: rental.estado,
        });
      }
    }

    // 3. Liquidaciones y retiros previos
    const payouts = (await prisma.payout.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    })) || [];
    const totalRetirado = payouts.reduce((acc, p) => acc + Number(p.monto), 0);
    const saldoDisponible = Math.max(0, totalGananciaOwner - totalRetirado);

    return {
      resumen: {
        totalBruto,
        gananciaOwner: totalGananciaOwner,
        comisionAgencia: totalComisionAgencia,
        porcentajeOwner: systemConfig.getOwnerCommissionPercentage(),
        porcentajeAgencia: systemConfig.getAgencyCommissionPercentage(),
        totalRetirado,
        saldoDisponible,
        totalAlquileres: todosLosAlquileres.length,
        totalHoras,
      },
      suscripcion: {
        estado: estaEnPeriodoGratuito ? 'BONIFICADA_GRATIS' : 'ACTIVA_PAGA',
        mesesGratisTotales: BUSINESS.MESES_GRATIS_OWNER,
        mesesGratisRestantes,
        mesActual: mesesActivo + 1,
        costoMensual: costoMensualSuscripcion,
        proximoCobro: proximoCobroSuscripcion,
        descripcion: estaEnPeriodoGratuito
          ? `Beneficio de bienvenida: 3 meses 100% bonificados (te quedan ${mesesGratisRestantes} mes${mesesGratisRestantes > 1 ? 'es' : ''})`
          : `Suscripción activa de $${costoMensualSuscripcion.toLocaleString('es-AR')} ARS/mes por custodia y mantenimiento en sede.`,
      },
      alquileresRecientes: todosLosAlquileres.slice(0, 15),
      payouts: payouts.map((p) => ({
        id: p.id,
        transferId: p.transferId,
        monto: Number(p.monto),
        cbuAlias: p.cbuAlias,
        estado: p.estado,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Solicita el retiro de fondos de las ganancias acumuladas (95%).
   */
  async requestPayout(ownerId: string, input: RequestPayoutInput) {
    const earnings = await this.getEarnings(ownerId);

    if (input.monto > earnings.resumen.saldoDisponible) {
      throw new AppError(
        'INSUFFICIENT_FUNDS',
        `Saldo insuficiente. Saldo disponible: $${earnings.resumen.saldoDisponible.toLocaleString('es-AR')} ARS`,
        400
      );
    }

    const transferId = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaAcreditacionEstimada = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Persistir el retiro en la base de datos para descontarlo del saldo disponible
    const payout = await prisma.payout.create({
      data: {
        ownerId,
        monto: input.monto,
        cbuAlias: input.cbuAlias,
        transferId,
        estado: 'EN_PROCESO',
      },
    });

    // Notificación al Owner
    await prisma.notification.create({
      data: {
        userId: ownerId,
        titulo: 'Solicitud de Liquidación Procesada',
        mensaje: `Transferencia por $${input.monto.toLocaleString('es-AR')} ARS solicitada a CBU/Alias ${input.cbuAlias}. ID: ${transferId}`,
        tipo: 'ALQUILER',
      },
    });

    return {
      id: payout.id,
      transferId,
      monto: input.monto,
      cbuAlias: input.cbuAlias,
      estado: 'EN_PROCESO',
      fechaAcreditacionEstimada,
      saldoRestante: Math.max(0, earnings.resumen.saldoDisponible - input.monto),
    };
  }

  /**
   * Obtiene la lista de revisiones pendientes de tablas devueltas
   * con cálculo del plazo de 24 horas para disputa ("Silencio = Aceptación").
   */
  async getPendingRevisions(ownerId: string) {
    const now = new Date();

    const rentals = await prisma.rental.findMany({
      where: {
        board: { ownerId },
        estado: { in: ['PENDIENTE_REVISION', 'DEVUELTA'] },
        OR: [
          { descripcionDanio: null },
          {
            NOT: {
              descripcionDanio: {
                contains: '[CONFORME_APROBADO_OWNER]',
              },
            },
          },
        ],
      },
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
      },
      orderBy: { fechaDevolucionReal: 'desc' },
      take: 20,
    });

    // Filtrar:
    // 1. Excluir explícitamente aprobados conforme por el propietario
    // 2. Si está en DEVUELTA (sin daño en sede): solo pendiente dentro de las 24 horas para revisión
    // 3. Si está en PENDIENTE_REVISION (daño reportado en sede): pendiente de resolución activa del owner
    const pendingRentals = rentals.filter((r) => {
      if (r.descripcionDanio && r.descripcionDanio.includes('[CONFORME_APROBADO_OWNER]')) {
        return false;
      }

      if (r.estado === 'PENDIENTE_REVISION') {
        return true;
      }

      const fechaDevolucion = r.fechaDevolucionReal || r.updatedAt;
      const msRestantes =
        fechaDevolucion.getTime() + BUSINESS.PLAZO_DISPUTA_HORAS * 60 * 60 * 1000 - now.getTime();
      return msRestantes > 0;
    });

    return pendingRentals.map((r) => {
      const fechaDevolucion = r.fechaDevolucionReal || r.updatedAt;
      const plazoVence = new Date(
        fechaDevolucion.getTime() + BUSINESS.PLAZO_DISPUTA_HORAS * 60 * 60 * 1000
      );
      const msRestantes = plazoVence.getTime() - now.getTime();
      const horasRestantes = Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60)));
      const silencioAceptado = msRestantes <= 0;

      return {
        rentalId: r.id,
        board: {
          id: r.board.id,
          titulo: r.board.titulo,
          marca: r.board.marca,
          modelo: r.board.modelo,
          tipoTabla: r.board.tipoTabla,
          fotos: r.board.fotos,
        },
        consumer: r.consumer,
        estado: r.estado,
        fechaInicio: r.fechaInicio,
        fechaDevolucion,
        plazoDisputaVence: plazoVence,
        horasRestantes,
        silencioAceptado,
        lavada: r.lavada ?? true,
        multaLavado: Number(r.multaLavado || 0),
        fotosRetiro: r.fotosRetiro || [],
        fotosDevolucion: r.fotosDevolucion || [],
        descripcionDanio: r.descripcionDanio || null,
        firmaRetiroUrl: r.firmaRetiroUrl,
      };
    });
  }

  /**
   * Obtiene el detalle de inspección comparativa para PhotoComparator:
   * fotosRetiro vs fotosDevolucion, estado de lavado y checklist.
   */
  async getRentalInspection(ownerId: string, rentalId: string) {
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
            dni: true,
          },
        },
        claims: true,
      },
    });

    if (!rental) {
      throw new AppError('RENTAL_NOT_FOUND', 'Alquiler no encontrado', 404);
    }

    if (rental.board.ownerId !== ownerId) {
      throw new AppError('FORBIDDEN', 'No tenés permisos sobre esta tabla', 403);
    }

    const now = new Date();
    const fechaDevolucion = rental.fechaDevolucionReal || rental.updatedAt;
    const plazoVence = new Date(
      fechaDevolucion.getTime() + BUSINESS.PLAZO_DISPUTA_HORAS * 60 * 60 * 1000
    );
    const msRestantes = plazoVence.getTime() - now.getTime();
    const horasRestantes = Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60)));

    return {
      rentalId: rental.id,
      board: {
        id: rental.board.id,
        titulo: rental.board.titulo,
        marca: rental.board.marca,
        modelo: rental.board.modelo,
        tipoTabla: rental.board.tipoTabla,
        medidas: rental.board.medidas,
        valorTasadoUsd: Number(rental.board.valorTasadoUsd),
      },
      consumer: rental.consumer,
      estado: rental.estado,
      fechaInicio: rental.fechaInicio,
      fechaDevolucionReal: fechaDevolucion,
      horas: rental.horas,
      lavada: rental.lavada ?? true,
      multaLavado: Number(rental.multaLavado || 0),
      fotosRetiro: rental.fotosRetiro || [],
      fotosDevolucion: rental.fotosDevolucion || [],
      descripcionDanio: rental.descripcionDanio || null,
      firmaRetiroUrl: rental.firmaRetiroUrl,
      disputa: {
        plazoVence,
        horasRestantes,
        vencido: msRestantes <= 0,
        reglaSilencio: 'Silencio del consumer tras 24h notificado = aceptación de daño.',
      },
      claims: rental.claims,
    };
  }

  /**
   * Registra el mantenimiento preventivo completado por el Owner o la Agencia.
   * Resetea el ciclo por 45 días más y restaura la tabla a DISPONIBLE si estaba en MANTENIMIENTO.
   */
  async completeMaintenance(
    ownerId: string,
    boardId: string,
    input?: CompleteMaintenanceInput
  ) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new AppError('BOARD_NOT_FOUND', 'Tabla no encontrada', 404);
    }

    if (board.ownerId !== ownerId) {
      throw new AppError('FORBIDDEN', 'No tenés permisos para gestionar esta tabla', 403);
    }

    const now = new Date();
    const cicloMs = BUSINESS.MANTENIMIENTO_DIAS * 24 * 60 * 60 * 1000;

    // Renovación técnica reglamentaria: el ciclo preventivo es de como máximo 45 días a partir de la inspección
    const proximoMantenimiento = new Date(now.getTime() + cicloMs);
    const diasRestantes = BUSINESS.MANTENIMIENTO_DIAS;

    // Si estaba en MANTENIMIENTO, volverla a DISPONIBLE
    const nuevoEstado = board.estado === 'MANTENIMIENTO' ? 'DISPONIBLE' : board.estado;

    const updatedBoard = await prisma.board.update({
      where: { id: board.id },
      data: {
        ultimoMantenimiento: now,
        proximoMantenimiento,
        estado: nuevoEstado,
      },
    });

    await prisma.notification.create({
      data: {
        userId: ownerId,
        titulo: 'Mantenimiento Preventivo Registrado',
        mensaje: `La tabla "${board.titulo}" completó su mantenimiento (+45 días). Próximo vencimiento: ${proximoMantenimiento.toLocaleDateString('es-AR')} (${diasRestantes} días restantes).`,
        tipo: 'MANTENIMIENTO',
      },
    });

    return {
      board: updatedBoard,
      ultimoMantenimiento: now,
      proximoMantenimiento,
      diasCiclo: BUSINESS.MANTENIMIENTO_DIAS,
      diasRestantes,
      notas: input?.notas,
    };
  }

  /**
   * Inicia un reclamo de daño desde el panel del Owner
   * tras comparar las fotos de retiro y devolución.
   */
  async reportDamageClaim(ownerId: string, input: CreateOwnerClaimInput) {
    const rental = await prisma.rental.findUnique({
      where: { id: input.rentalId },
      include: { board: true, consumer: true },
    });

    if (!rental) {
      throw new AppError('RENTAL_NOT_FOUND', 'Alquiler no encontrado', 404);
    }

    if (rental.board.ownerId !== ownerId) {
      throw new AppError('FORBIDDEN', 'No sos el propietario de esta tabla', 403);
    }

    const now = new Date();
    const plazoDisputaVence = new Date(
      now.getTime() + BUSINESS.PLAZO_DISPUTA_HORAS * 60 * 60 * 1000
    );

    // 1. Resolver fotos de daño seguras (fallback si fotosDevolucion era null)
    let safeFotosDano = Array.isArray(input.fotosDano) && input.fotosDano.length > 0
      ? input.fotosDano
      : [];
    if (safeFotosDano.length === 0) {
      if (Array.isArray(rental.fotosDevolucion) && (rental.fotosDevolucion as any[]).length > 0) {
        safeFotosDano = (rental.fotosDevolucion as any[]).map(f => typeof f === 'string' ? f : String(f?.url || f));
      } else {
        safeFotosDano = ['https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800'];
      }
    }

    // 2. Crear el reclamo de seguro
    const claim = await prisma.insuranceClaim.create({
      data: {
        rentalId: rental.id,
        reportadoPorId: ownerId,
        montoReclamado: input.montoReclamado,
        descripcion: input.descripcion,
        fotosDano: safeFotosDano,
        presupuestoReparacionUrl: input.presupuestoReparacionUrl,
        estado: 'NOTIFICADO',
        notificadoAt: now,
        plazoDisputaVence,
      },
    });

    // 3. Pasar el alquiler a estado RECLAMO y la tabla a MANTENIMIENTO
    await prisma.rental.update({
      where: { id: rental.id },
      data: { estado: 'RECLAMO' },
    });

    await prisma.board.update({
      where: { id: rental.boardId },
      data: { estado: 'MANTENIMIENTO' },
    });

    // 4. Notificar al consumidor con la regla de las 24 horas
    await prisma.notification.create({
      data: {
        userId: rental.consumerId,
        titulo: '⚠️ Daño Reportado en Alquiler',
        mensaje: `El propietario reportó un daño en "${rental.board.titulo}" por $${input.montoReclamado.toLocaleString('es-AR')} ARS. Tenés 24 horas para responder o disputar el cargo. Pasadas 24h, el silencio implica aceptación.`,
        tipo: 'RECLAMO',
      },
    });

    return claim;
  }

  /**
   * Aprueba la revisión de la tabla devuelta como conforme (sin daños).
   * Pasa el alquiler a estado DEVUELTA y libera los fondos retenidos.
   */
  async approveRevision(ownerId: string, rentalId: string) {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: { board: true },
    });

    if (!rental) {
      throw new AppError('RENTAL_NOT_FOUND', 'Alquiler no encontrado', 404);
    }

    if (rental.board.ownerId !== ownerId) {
      throw new AppError('FORBIDDEN', 'No tenés permisos sobre esta tabla', 403);
    }

    const updated = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        estado: 'DEVUELTA',
        descripcionDanio: '[CONFORME_APROBADO_OWNER]',
      },
    });

    // Si la tabla estaba en MANTENIMIENTO por inspección preliminar, restaurarla a DISPONIBLE
    if (rental.board.estado === 'MANTENIMIENTO') {
      await prisma.board.update({
        where: { id: rental.boardId },
        data: { estado: 'DISPONIBLE' },
      });
    }

    await prisma.notification.create({
      data: {
        userId: ownerId,
        titulo: 'Revisión Aprobada Conforme',
        mensaje: `Aprobaste el estado de "${rental.board.titulo}". Fondos liberados exitosamente.`,
        tipo: 'ALQUILER',
      },
    });

    return {
      rentalId: updated.id,
      estado: updated.estado,
      mensaje: 'Revisión aprobada conforme. Fondos liberados al saldo disponible.',
    };
  }

  /**
   * Cron / Worker de Mantenimiento Preventivo (Regla de 45 días):
   * Escanea tablas cuya fecha de mantenimiento haya vencido y las cambia
   * automáticamente de DISPONIBLE a MANTENIMIENTO para prevenir alquiler de equipo no apto.
   */
  async checkMaintenanceCycleJob() {
    const now = new Date();

    const overdueBoards = await prisma.board.findMany({
      where: {
        estado: 'DISPONIBLE',
        proximoMantenimiento: {
          lt: now,
        },
      },
    });

    for (const board of overdueBoards) {
      await prisma.board.update({
        where: { id: board.id },
        data: { estado: 'MANTENIMIENTO' },
      });

      await prisma.notification.create({
        data: {
          userId: board.ownerId,
          titulo: '⚠️ Tabla Bloqueada por Mantenimiento (45 Días)',
          mensaje: `Tu tabla "${board.titulo}" superó los 45 días sin inspección obligatoria. Se retiró temporalmente del catálogo por seguridad. Registrá el mantenimiento para reactivarla.`,
          tipo: 'MANTENIMIENTO',
        },
      });
    }

    return {
      tablasAfectadas: overdueBoards.length,
      tablasIds: overdueBoards.map((b) => b.id),
      timestamp: now.toISOString(),
    };
  }
}

export const ownerService = new OwnerService();
