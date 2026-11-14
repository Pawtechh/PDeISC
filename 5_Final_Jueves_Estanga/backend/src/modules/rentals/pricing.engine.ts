import { BUSINESS } from '../../constants/business';

export interface RentalQuoteInput {
  precioHora: number;
  horas: number;
  fechaInicio: Date;
  ahora?: Date;
  puntosUsados?: number;
  incluyeSeguro?: boolean;
  valorTasadoUsd?: number;
  incluyeNeoprene?: boolean;
  incluyeLeash?: boolean;
  incluyeParafina?: boolean;
  comisionAgenciaRate?: number;
}

export interface DiscountBreakdown {
  tipo: string;
  porcentaje: number;
  monto: number;
  descripcion: string;
}

export interface RentalQuoteResult {
  horas: number;
  precioHora: number;
  precioBase: number;
  descuentos: DiscountBreakdown[];
  descuentoTotal: number;
  precioSeguro: number;
  precioAccesorios: number;
  precioTotal: number;
  gananciaAgencia: number;
  gananciaOwner: number;
  puntosGanados: number;
  puntosUsados: number;
}

export interface CancellationRefundResult {
  deltaHoras: number;
  porcentajeReembolso: number;
  porcentajePenalidad: number;
  montoReembolso: number;
  montoPenalidad: number;
  tramo: string;
}

/**
 * Motor de cálculo puro para cotizaciones de alquiler de tablas en Mar del Plata.
 * Implementa las reglas de negocio:
 * - 25% descuento por día completo (>= 8 horas)
 * - 10% descuento por reserva anticipada (>= 7 días)
 * - Descuento por puntos de fidelidad (100 pts -> 5%, 250 pts -> 10%, 500 pts -> 15%)
 * - 10 puntos ganados por cada hora de alquiler
 * - Split: 5% Agencia / 95% Owner
 */
export function calculateRentalQuote(input: RentalQuoteInput): RentalQuoteResult {
  const {
    precioHora,
    horas,
    fechaInicio,
    ahora = new Date(),
    puntosUsados = 0,
    incluyeSeguro = false,
    valorTasadoUsd = 400,
  } = input;

  if (horas <= 0) {
    throw new Error('La cantidad de horas debe ser mayor a 0');
  }
  if (precioHora <= 0) {
    throw new Error('El precio por hora debe ser mayor a 0');
  }

  const precioBase = Math.round(horas * precioHora);
  const descuentos: DiscountBreakdown[] = [];

  // 1. Descuento día completo (>= 8 horas) - 25%
  if (horas >= 8) {
    const monto = Math.round(precioBase * BUSINESS.DESCUENTO_DIA_COMPLETO);
    descuentos.push({
      tipo: 'DIA_COMPLETO',
      porcentaje: BUSINESS.DESCUENTO_DIA_COMPLETO,
      monto,
      descripcion: 'Descuento día completo (25% off)',
    });
  }

  // 2. Descuento reserva anticipada (+7 días) - 10%
  const diffMs = fechaInicio.getTime() - ahora.getTime();
  const diasAnticipacion = diffMs / (1000 * 60 * 60 * 24);
  if (diasAnticipacion >= BUSINESS.DIAS_ANTICIPADO) {
    const monto = Math.round(precioBase * BUSINESS.DESCUENTO_ANTICIPADO);
    descuentos.push({
      tipo: 'ANTICIPADA',
      porcentaje: BUSINESS.DESCUENTO_ANTICIPADO,
      monto,
      descripcion: 'Descuento por reserva anticipada (+7 días, 10% off)',
    });
  }

  // 3. Descuento por puntos de fidelidad acumulados
  let porcentajePuntos = 0;
  if (puntosUsados >= 500) {
    porcentajePuntos = 0.15;
  } else if (puntosUsados >= 250) {
    porcentajePuntos = 0.10;
  } else if (puntosUsados >= 100) {
    porcentajePuntos = 0.05;
  }

  if (porcentajePuntos > 0) {
    const monto = Math.round(precioBase * porcentajePuntos);
    descuentos.push({
      tipo: 'PUNTOS',
      porcentaje: porcentajePuntos,
      monto,
      descripcion: `Canje de ${puntosUsados} puntos (${porcentajePuntos * 100}% off)`,
    });
  }

  const descuentoTotal = descuentos.reduce((acc, d) => acc + d.monto, 0);

  // Accesorios opcionales para la costa de Mar del Plata
  let precioAccesorios = 0;
  if (input.incluyeNeoprene) precioAccesorios += 4500;
  if (input.incluyeLeash) precioAccesorios += 1500;
  if (input.incluyeParafina) precioAccesorios += 800;

  // Seguro opcional: tasa del 2% del valor tasado o flat $1.500 ARS
  const precioSeguro = incluyeSeguro ? Math.round(valorTasadoUsd * 2.5) : 0;

  const precioTotal = Math.max(0, precioBase - descuentoTotal + precioSeguro + precioAccesorios);

  // Split: Comisión agencia (dinámicamente configurable desde web) + 100% de los accesorios de mostrador
  const agencyRate = input.comisionAgenciaRate !== undefined ? input.comisionAgenciaRate : BUSINESS.COMISION_AGENCIA;
  const gananciaAgencia = Math.round(precioBase * agencyRate) + precioAccesorios;
  const gananciaOwner = Math.max(0, precioTotal - gananciaAgencia);

  // Puntos otorgados al surfista: 10 pts por hora
  const puntosGanados = horas * BUSINESS.PUNTOS_POR_HORA;

  return {
    horas,
    precioHora,
    precioBase,
    descuentos,
    descuentoTotal,
    precioSeguro,
    precioAccesorios,
    precioTotal,
    gananciaAgencia,
    gananciaOwner,
    puntosGanados,
    puntosUsados,
  };
}

/**
 * Cálculo de reembolso escalonado de cancelación según tiempo restante hasta fechaInicio:
 * - >= 72h: 100% reembolso (0% penalidad)
 * - 24h a 72h: 70% reembolso (30% retención)
 * - 6h a 24h: 40% reembolso (60% retención)
 * - < 6h: 0% reembolso (100% penalidad)
 */
export function calculateCancellationRefund(
  precioTotal: number,
  fechaInicio: Date,
  fechaCancelacion: Date = new Date()
): CancellationRefundResult {
  const diffMs = fechaInicio.getTime() - fechaCancelacion.getTime();
  const deltaHoras = diffMs / (1000 * 60 * 60);

  let porcentajeReembolso: number;
  let tramo: string;

  if (deltaHoras >= 72) {
    porcentajeReembolso = 1.0;
    tramo = '+72h antes: 100% reembolso';
  } else if (deltaHoras >= 24) {
    porcentajeReembolso = 0.70;
    tramo = '24h - 72h antes: 70% reembolso (30% retención)';
  } else if (deltaHoras >= 6) {
    porcentajeReembolso = 0.40;
    tramo = '6h - 24h antes: 40% reembolso (60% retención)';
  } else {
    porcentajeReembolso = 0.0;
    tramo = 'Menos de 6h antes: Sin reembolso (100% penalidad)';
  }

  const montoReembolso = Math.round(precioTotal * porcentajeReembolso);
  const montoPenalidad = precioTotal - montoReembolso;
  const porcentajePenalidad = Math.round((1 - porcentajeReembolso) * 100) / 100;

  return {
    deltaHoras: Math.round(deltaHoras * 10) / 10,
    porcentajeReembolso,
    porcentajePenalidad,
    montoReembolso,
    montoPenalidad,
    tramo,
  };
}

/**
 * Valida que los horarios estén dentro del margen operativo de la Sede Central:
 * 06:00 a 21:00 (hora local de Mar del Plata)
 */
export function validateOperatingHours(fechaInicio: Date, fechaFin: Date): { isValid: boolean; error?: string } {
  if (fechaFin.getTime() <= fechaInicio.getTime()) {
    return { isValid: false, error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
  }

  const horaInicio = fechaInicio.getHours();
  const horaFin = fechaFin.getHours();

  if (horaInicio < BUSINESS.HORA_INICIO || horaInicio >= BUSINESS.HORA_FIN) {
    return {
      isValid: false,
      error: `El horario de retiro debe estar entre las 06:00 y las 21:00 hs (solicitado: ${horaInicio} hs)`,
    };
  }

  if (horaFin < BUSINESS.HORA_INICIO || horaFin > BUSINESS.HORA_FIN) {
    return {
      isValid: false,
      error: `El horario de devolución debe ser antes de las 21:00 hs (solicitado: ${horaFin} hs)`,
    };
  }

  return { isValid: true };
}

export interface CheckInTimingEvaluation {
  status: 'TOO_EARLY' | 'ON_TIME' | 'LATE_PICKUP' | 'EXPIRED_NO_SHOW';
  minutesBeforeStart: number;
  latePickupMinutes: number;
  remainingMinutes: number;
  effectiveFechaInicio: Date;
  effectiveFechaFinEstimada: Date;
}

/**
 * Evalúa la puntualidad en el retiro:
 * - Hasta 15 min antes de `fechaInicio`: permitido.
 * - Retiro tardío (`ahora > fechaInicio` y `ahora < fechaFinEstimada`): permitido, pero las horas
 *   contratadas siguen corriendo desde `fechaInicio` hasta `fechaFinEstimada` sin prórroga ni descuentos.
 * - Ventana expirada (`ahora >= fechaFinEstimada`): No-Show — servicio cobrado íntegro.
 */
export function evaluateCheckInTiming(
  fechaInicio: Date,
  fechaFinEstimada: Date,
  ahora: Date = new Date()
): CheckInTimingEvaluation {
  const startMs = fechaInicio.getTime();
  const endMs = fechaFinEstimada.getTime();
  const nowMs = ahora.getTime();
  const earlyWindowMs = 15 * 60 * 1000;

  if (nowMs < startMs - earlyWindowMs) {
    const minutesBeforeStart = Math.max(1, Math.ceil((startMs - earlyWindowMs - nowMs) / 60000));
    return {
      status: 'TOO_EARLY',
      minutesBeforeStart,
      latePickupMinutes: 0,
      remainingMinutes: Math.max(0, Math.round((endMs - startMs) / 60000)),
      effectiveFechaInicio: fechaInicio,
      effectiveFechaFinEstimada: fechaFinEstimada,
    };
  }

  if (nowMs >= endMs) {
    return {
      status: 'EXPIRED_NO_SHOW',
      minutesBeforeStart: 0,
      latePickupMinutes: Math.max(1, Math.round((nowMs - startMs) / 60000)),
      remainingMinutes: 0,
      effectiveFechaInicio: fechaInicio,
      effectiveFechaFinEstimada: fechaFinEstimada,
    };
  }

  const graceLateMs = 60 * 1000;
  if (nowMs > startMs + graceLateMs) {
    return {
      status: 'LATE_PICKUP',
      minutesBeforeStart: 0,
      latePickupMinutes: Math.round((nowMs - startMs) / 60000),
      remainingMinutes: Math.max(0, Math.round((endMs - nowMs) / 60000)),
      effectiveFechaInicio: fechaInicio,
      effectiveFechaFinEstimada: fechaFinEstimada,
    };
  }

  return {
    status: 'ON_TIME',
    minutesBeforeStart: 0,
    latePickupMinutes: 0,
    remainingMinutes: Math.max(0, Math.round((endMs - nowMs) / 60000)),
    effectiveFechaInicio: fechaInicio,
    effectiveFechaFinEstimada: fechaFinEstimada,
  };
}

export interface OvertimeReturnEvaluation {
  isOvertime: boolean;
  overtimeMinutes: number;
  overtimeHoursCharged: number;
  overtimeChargeArs: number;
}

/**
 * Calcula recargo por devolución fuera de término respecto de `fechaFinEstimada`
 * (sin extender el turno por retiros tardíos; tolerancia operativa de 15 minutos).
 */
export function evaluateOvertimeReturn(
  fechaFinEstimada: Date,
  horasContratadas: number,
  precioBase: number,
  ahora: Date = new Date()
): OvertimeReturnEvaluation {
  const endMs = fechaFinEstimada.getTime();
  const nowMs = ahora.getTime();
  const graceMs = 15 * 60 * 1000;

  if (nowMs <= endMs + graceMs) {
    return {
      isOvertime: false,
      overtimeMinutes: 0,
      overtimeHoursCharged: 0,
      overtimeChargeArs: 0,
    };
  }

  const diffMs = nowMs - endMs;
  const overtimeMinutes = Math.max(16, Math.round(diffMs / 60000));
  const overtimeHoursCharged = Math.max(1, Math.ceil(diffMs / (60 * 60 * 1000)));
  const hourlyRate =
    horasContratadas > 0 ? Math.round(precioBase / horasContratadas) : Math.round(precioBase);
  const overtimeChargeArs = Math.max(0, hourlyRate * overtimeHoursCharged);

  return {
    isOvertime: true,
    overtimeMinutes,
    overtimeHoursCharged,
    overtimeChargeArs,
  };
}
