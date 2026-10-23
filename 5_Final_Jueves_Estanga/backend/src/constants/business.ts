import { systemConfig } from '../config/systemConfig';

export const BUSINESS = {
  get COMISION_AGENCIA(): number {
    return systemConfig.getAgencyCommissionRate();
  },
  get GANANCIA_OWNER(): number {
    return systemConfig.getOwnerCommissionRate();
  },
  SUSCRIPCION_OWNER: 1000, // ARS/mes
  MESES_GRATIS_OWNER: 3,
  MULTA_NO_LAVAR: 10000,
  MULTA_NO_PRESENTARSE_HORAS: 1,
  DESCUENTO_DIA_COMPLETO: 0.25,
  DESCUENTO_ANTICIPADO: 0.10,
  DIAS_ANTICIPADO: 7,
  EDAD_MINIMA: 18,
  HORA_INICIO: 6,
  HORA_FIN: 21,
  MANTENIMIENTO_DIAS: 45,
  PUNTOS_POR_HORA: 10,
  VALOR_PUNTO_ARS: 10, // 100 puntos = $1.000 ARS de descuento
  PUNTOS_SANCION_NO_LAVAR: 50,
  UMBRAL_SANCION_BLOQUEO: 100,
  PLAZO_DISPUTA_HORAS: 24,
  VENCIMIENTO_PUNTOS_MESES: 12,
  RETENCION_DATOS_ANIOS: 5,
} as const;
