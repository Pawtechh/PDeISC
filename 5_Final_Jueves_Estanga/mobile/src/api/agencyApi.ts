import { apiSlice } from './apiSlice';
import { Rental } from './rentalsApi';

export interface AgencyCheckInRequest {
  rentalId: string;
  fotosRetiro: string[];
  firmaRetiroUrl: string;
  dniVerificado: boolean;
}

export interface AgencyCheckOutRequest {
  rentalId: string;
  fotosDevolucion: string[];
  lavada: boolean;
  tieneDanio?: boolean;
  descripcionDanio?: string;
  fotoDanio?: string;
}

export interface AgencyMetrics {
  enElAguaCount: number;
  reservasHoyCount: number;
  tablasEnCustodia: number;
  totalMultasRecaudadas: number;
  cantidadMultas: number;
  comisionAgenciaPorcentaje: number;
  multaLavadoEstándar: number;
}

export interface CommissionPolicy {
  comisionAgenciaPorcentaje: number;
  comisionOwnerPorcentaje: number;
  comisionAgenciaRate: number;
  comisionOwnerRate: number;
}

export interface UpdateCommissionRequest {
  porcentaje: number;
  specialPassword: string;
}

export interface UpdateCommissionResponse {
  comisionAgenciaPorcentaje: number;
  comisionOwnerPorcentaje: number;
  rentalsUpdatedCount: number;
  mensaje: string;
}

export const agencyApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getSchedule: builder.query<{ status: string; data: Rental[] }, void>({
      query: () => '/agency/schedule',
      providesTags: ['Schedule', 'Rental', 'AgencyRental'],
    }),

    getMetrics: builder.query<{ status: string; data: AgencyMetrics }, void>({
      query: () => '/agency/metrics',
      providesTags: ['Metrics', 'AgencyMetrics'],
    }),

    getCommission: builder.query<{ status: string; data: CommissionPolicy }, void>({
      query: () => '/agency/commission',
      providesTags: ['Metrics', 'AgencyMetrics'],
    }),

    updateCommission: builder.mutation<
      { status: string; data: UpdateCommissionResponse },
      UpdateCommissionRequest
    >({
      query: (body) => ({
        url: '/agency/commission',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        'Rental',
        'Schedule',
        'AgencyRental',
        'Board',
        'OwnerBoards',
        'Metrics',
        'AgencyMetrics',
      ],
    }),

    checkIn: builder.mutation<
      { status: string; data: Rental },
      AgencyCheckInRequest
    >({
      query: (body) => ({
        url: '/agency/checkin',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Rental',
        'Schedule',
        'AgencyRental',
        'Board',
        'OwnerBoards',
        'Metrics',
        'AgencyMetrics',
      ],
    }),

    checkOut: builder.mutation<
      {
        status: string;
        data: {
          rental: Rental;
          multaLavado: number;
          lavada: boolean;
          tieneDanio: boolean;
          estadoFinal: string;
        };
      },
      AgencyCheckOutRequest
    >({
      query: (body) => ({
        url: '/agency/checkout',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Rental',
        'Schedule',
        'AgencyRental',
        'Board',
        'OwnerBoards',
        'Metrics',
        'AgencyMetrics',
        'OwnerRevisions',
      ],
    }),
  }),
});

export const {
  useGetScheduleQuery,
  useGetMetricsQuery,
  useGetCommissionQuery,
  useUpdateCommissionMutation,
  useCheckInMutation,
  useCheckOutMutation,
} = agencyApi;
