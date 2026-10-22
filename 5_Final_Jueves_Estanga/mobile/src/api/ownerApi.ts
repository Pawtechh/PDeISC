import { apiSlice } from './apiSlice';
import { Board } from './boardsApi';

export interface BoardMaintenanceInfo {
  ultimoMantenimiento: string;
  proximoMantenimiento: string;
  diasRestantes: number;
  isOverdue: boolean;
  needsMaintenanceSoon: boolean;
  estadoCiclo: 'AL_DIA' | 'POR_VENCER' | 'VENCIDO';
}

export interface OwnerBoardItem extends Board {
  mantenimiento: BoardMaintenanceInfo;
  metricas: {
    totalAlquileres: number;
    totalHoras: number;
    gananciasGeneradas: number;
  };
}

export interface OwnerEarningsSummary {
  totalBruto: number;
  gananciaOwner: number;
  comisionAgencia: number;
  porcentajeOwner: number;
  porcentajeAgencia: number;
  totalRetirado: number;
  saldoDisponible: number;
  totalAlquileres: number;
  totalHoras: number;
}

export interface OwnerSubscriptionInfo {
  estado: 'BONIFICADA_GRATIS' | 'ACTIVA_PAGA';
  mesesGratisTotales: number;
  mesesGratisRestantes: number;
  mesActual: number;
  costoMensual: number;
  proximoCobro: string;
  descripcion: string;
}

export interface OwnerRentalItem {
  id: string;
  tabla: string;
  tipoTabla: string;
  surfista: string;
  fechaInicio: string;
  horas: number;
  precioTotal: number;
  gananciaOwner: number;
  comisionAgencia: number;
  estado: string;
}

export interface OwnerPayoutRecord {
  id: string;
  transferId: string;
  monto: number;
  cbuAlias: string;
  estado: string;
  createdAt: string;
}

export interface OwnerEarningsResponse {
  resumen: OwnerEarningsSummary;
  suscripcion: OwnerSubscriptionInfo;
  alquileresRecientes: OwnerRentalItem[];
  payouts: OwnerPayoutRecord[];
}

export interface PayoutRequestInput {
  monto: number;
  cbuAlias: string;
}

export interface PayoutResponse {
  id?: string;
  transferId: string;
  monto: number;
  cbuAlias: string;
  estado: string;
  fechaAcreditacionEstimada: string;
  saldoRestante: number;
}

export interface PendingRevisionItem {
  rentalId: string;
  board: {
    id: string;
    titulo: string;
    marca: string;
    modelo: string;
    tipoTabla: string;
    fotos: string[];
  };
  consumer: {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
  };
  estado: string;
  fechaInicio: string;
  fechaDevolucion: string;
  plazoDisputaVence: string;
  horasRestantes: number;
  silencioAceptado: boolean;
  lavada: boolean;
  multaLavado: number;
  fotosRetiro?: string[];
  fotosDevolucion?: string[];
  descripcionDanio?: string | null;
  firmaRetiroUrl?: string;
}

export interface RentalInspectionDetail {
  rentalId: string;
  board: {
    id: string;
    titulo: string;
    marca: string;
    modelo: string;
    tipoTabla: string;
    medidas: string;
    valorTasadoUsd: number;
  };
  consumer: {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
    dni?: string;
  };
  estado: string;
  fechaInicio: string;
  fechaDevolucionReal: string;
  horas: number;
  lavada: boolean;
  multaLavado: number;
  fotosRetiro: string[];
  fotosDevolucion: string[];
  descripcionDanio?: string | null;
  firmaRetiroUrl?: string;
  disputa: {
    plazoVence: string;
    horasRestantes: number;
    vencido: boolean;
    reglaSilencio: string;
  };
  claims: any[];
}

export const ownerApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getOwnerBoards: builder.query<{ status: string; data: OwnerBoardItem[] }, void>({
      query: () => '/owner/boards',
      providesTags: ['Board', 'OwnerBoards'],
    }),

    getOwnerEarnings: builder.query<{ status: string; data: OwnerEarningsResponse }, void>({
      query: () => '/owner/earnings',
      providesTags: ['Payout', 'OwnerEarnings'],
    }),

    requestPayout: builder.mutation<{ status: string; data: PayoutResponse }, PayoutRequestInput>({
      query: (body) => ({
        url: '/owner/payout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Payout', 'OwnerEarnings'],
    }),

    getPendingRevisions: builder.query<{ status: string; data: PendingRevisionItem[] }, void>({
      query: () => '/owner/rentals/pending-revisions',
      providesTags: ['Rental', 'OwnerRevisions'],
    }),

    getRentalInspection: builder.query<
      { status: string; data: RentalInspectionDetail },
      string
    >({
      query: (rentalId) => `/owner/rentals/${rentalId}/inspection`,
    }),

    completeMaintenance: builder.mutation<
      { status: string; data: any },
      { boardId: string; notas?: string; piezasReemplazadas?: string[] }
    >({
      query: ({ boardId, ...body }) => ({
        url: `/owner/boards/${boardId}/maintenance`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Board', 'OwnerBoards'],
    }),

    approveRevision: builder.mutation<
      { status: string; data: { rentalId: string; estado: string; mensaje: string } },
      string
    >({
      query: (rentalId) => ({
        url: `/owner/rentals/${rentalId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Rental', 'OwnerRevisions', 'Payout', 'OwnerEarnings', 'Board', 'OwnerBoards'],
    }),

    reportDamageClaim: builder.mutation<
      { status: string; data: any },
      {
        rentalId: string;
        descripcion: string;
        fotosDano: string[];
        montoReclamado: number;
        presupuestoReparacionUrl?: string;
      }
    >({
      query: (body) => ({
        url: '/owner/claims',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Claim', 'Rental', 'OwnerRevisions', 'Board', 'OwnerBoards'],
    }),
  }),
});

export const {
  useGetOwnerBoardsQuery,
  useGetOwnerEarningsQuery,
  useRequestPayoutMutation,
  useGetPendingRevisionsQuery,
  useGetRentalInspectionQuery,
  useCompleteMaintenanceMutation,
  useReportDamageClaimMutation,
  useApproveRevisionMutation,
} = ownerApi;
