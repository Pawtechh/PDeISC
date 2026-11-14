export type SaasPlanTier = 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface SaasPlanDefinition {
  tier: SaasPlanTier;
  label: string;
  comisionPorcentaje: number;
  cuotaMensualArs: number;
  destacadoEnZona: boolean;
  descripcion: string;
}

export const SAAS_PLANS: Record<SaasPlanTier, SaasPlanDefinition> = {
  STARTER: {
    tier: 'STARTER',
    label: 'Starter ($0/mes)',
    comisionPorcentaje: 8,
    cuotaMensualArs: 0,
    destacadoEnZona: false,
    descripcion: 'Sin costo fijo mensual • 8% comisión por reserva confirmada.',
  },
  PRO: {
    tier: 'PRO',
    label: 'Pro ($15.000/mes)',
    comisionPorcentaje: 3,
    cuotaMensualArs: 15000,
    destacadoEnZona: true,
    descripcion: 'Sólo 3% comisión por reserva + Split MP directo + insignia destacada.',
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    label: 'Enterprise ($35.000/mes)',
    comisionPorcentaje: 2,
    cuotaMensualArs: 35000,
    destacadoEnZona: true,
    descripcion: 'Multi-sede ilimitado • 2% comisión mínima + soporte prioritario.',
  },
};

export function resolvePlanCommission(planTier?: SaasPlanTier | null): number {
  if (!planTier || !SAAS_PLANS[planTier]) {
    return SAAS_PLANS.STARTER.comisionPorcentaje;
  }
  return SAAS_PLANS[planTier].comisionPorcentaje;
}

export type SplitBreakdown = {
  grossArs: number;
  platformFeePct: number;
  platformFeeArs: number;
  agencyNetArs: number;
  mpCollectorId: string | null;
  mode: 'mercadopago_marketplace_split' | 'plataforma_centralizada';
};

export function buildSplitBreakdown(
  grossArs: number,
  commissionPct: number,
  mpCollectorId?: string | null
): SplitBreakdown {
  const safeGross = Math.max(0, Number(grossArs) || 0);
  const safePct = Math.max(0, Math.min(50, Number(commissionPct) || 5));
  const platformFeeArs = Math.round(safeGross * (safePct / 100) * 100) / 100;
  const agencyNetArs = Math.max(0, Math.round((safeGross - platformFeeArs) * 100) / 100);
  const collector = mpCollectorId?.trim() || null;

  return {
    grossArs: safeGross,
    platformFeePct: safePct,
    platformFeeArs,
    agencyNetArs,
    mpCollectorId: collector,
    mode: collector ? 'mercadopago_marketplace_split' : 'plataforma_centralizada',
  };
}
