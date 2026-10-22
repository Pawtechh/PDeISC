import { apiSlice } from './apiSlice';

export type ClaimStatus =
  | 'ABIERTO'
  | 'NOTIFICADO'
  | 'ACEPTADO'
  | 'DISPUTADO'
  | 'EN_MEDIACION'
  | 'SIN_RESPUESTA'
  | 'RESUELTO_OWNER'
  | 'RESUELTO_CONSUMER'
  | 'COBRADO'
  | 'DERIVADO_LEGAL'
  | 'CERRADO';

export interface InsuranceClaimItem {
  id: string;
  rentalId: string;
  reportadoPorId: string;
  montoReclamado: number;
  descripcion: string;
  fotosDano: string[];
  presupuestoReparacionUrl?: string;
  estado: ClaimStatus;
  notificadoAt?: string;
  plazoDisputaVence?: string;
  resolucionAgencia?: string;
  cobradoAt?: string;
  horasRestantesDisputa?: number;
  plazoVencido?: boolean;
  rental: {
    id: string;
    consumerId: string;
    fechaInicio: string;
    fechaDevolucionReal?: string;
    board: {
      id: string;
      titulo: string;
      marca: string;
      modelo: string;
      tipoTabla: string;
      ownerId: string;
    };
    consumer: {
      id: string;
      nombre: string;
      email: string;
      telefono?: string;
    };
    payments?: any[];
  };
  reportadoPor?: {
    id: string;
    nombre: string;
    role: string;
  };
}

export interface ConsumerRespondRequest {
  claimId: string;
  accion: 'ACEPTAR' | 'DISPUTAR';
  motivoDisputa?: string;
  fotosDescargo?: string[];
}

export interface AgencyMediateRequest {
  claimId: string;
  resolucion: 'RESUELTO_OWNER' | 'RESUELTO_CONSUMER';
  resolucionAgencia: string;
  montoAprobado?: number;
}

export const claimsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getClaims: builder.query<{ status: string; data: InsuranceClaimItem[] }, void>({
      query: () => '/claims',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Claim' as const, id })),
              'Claim',
            ]
          : ['Claim'],
    }),

    getClaimById: builder.query<{ status: string; data: InsuranceClaimItem }, string>({
      query: (id) => `/claims/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Claim', id }],
    }),

    createClaim: builder.mutation<
      { status: string; data: InsuranceClaimItem },
      {
        rentalId: string;
        descripcion: string;
        fotosDano: string[];
        montoReclamado: number;
        presupuestoReparacionUrl?: string;
      }
    >({
      query: (body) => ({
        url: '/claims',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Claim', 'Rental', 'OwnerRevisions', 'Board', 'OwnerBoards'],
    }),

    consumerRespond: builder.mutation<
      { status: string; data: any },
      ConsumerRespondRequest
    >({
      query: ({ claimId, ...body }) => ({
        url: `/claims/${claimId}/respond`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Claim', 'Rental', 'User', 'OwnerRevisions'],
    }),

    agencyMediate: builder.mutation<
      { status: string; data: any },
      AgencyMediateRequest
    >({
      query: ({ claimId, ...body }) => ({
        url: `/claims/${claimId}/mediate`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Claim',
        'Rental',
        'Board',
        'OwnerBoards',
        'User',
        'OwnerEarnings',
        'Payout',
        'OwnerRevisions',
      ],
    }),

    processExpired: builder.mutation<{ status: string; data: any }, void>({
      query: () => ({
        url: '/claims/cron/check-expired',
        method: 'POST',
      }),
      invalidatesTags: ['Claim', 'Rental', 'Board', 'OwnerBoards', 'User', 'OwnerRevisions'],
    }),
  }),
});

export const {
  useGetClaimsQuery,
  useGetClaimByIdQuery,
  useCreateClaimMutation,
  useConsumerRespondMutation,
  useAgencyMediateMutation,
  useProcessExpiredMutation,
} = claimsApi;
