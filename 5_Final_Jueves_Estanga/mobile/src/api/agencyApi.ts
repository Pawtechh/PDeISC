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
  useCheckInMutation,
  useCheckOutMutation,
} = agencyApi;
