import { apiSlice } from './apiSlice';

export interface DiscountItem {
  tipo: string;
  porcentaje: number;
  monto: number;
  descripcion: string;
}

export interface RentalQuote {
  horas: number;
  precioHora: number;
  precioBase: number;
  descuentos: DiscountItem[];
  descuentoTotal: number;
  precioSeguro: number;
  precioTotal: number;
  gananciaAgencia: number;
  gananciaOwner: number;
  puntosGanados: number;
  puntosUsados: number;
}

export interface Rental {
  id: string;
  consumerId: string;
  boardId: string;
  fechaInicio: string;
  fechaFinEstimada: string;
  fechaDevolucionReal?: string | null;
  horas: number;
  precioBase: number;
  descuento: number;
  precioSeguro: number;
  precioTotal: number;
  gananciaOwner: number;
  gananciaAgencia: number;
  puntosGanados: number;
  puntosUsados: number;
  estado: 'PENDIENTE' | 'ACTIVA' | 'EN_CURSO' | 'PENDIENTE_REVISION' | 'DEVUELTA' | 'RECLAMO' | 'CANCELADA';
  contratoHash?: string;
  versionTerminos?: string;
  board?: {
    id: string;
    titulo: string;
    marca: string;
    medidas?: string;
    tipoTabla: string;
    fotos: string[];
  };
  consumer?: {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
    dni?: string;
  };
}

export interface QuoteRequest {
  boardId: string;
  horas: number;
  fechaInicio: string;
  puntosUsados?: number;
  incluyeSeguro?: boolean;
  incluyeNeoprene?: boolean;
  talleNeoprene?: string;
  incluyeLeash?: boolean;
  incluyeParafina?: boolean;
}

export interface CreateRentalRequest {
  boardId: string;
  horas: number;
  fechaInicio: string;
  puntosUsados?: number;
  incluyeSeguro?: boolean;
  incluyeNeoprene?: boolean;
  talleNeoprene?: string;
  incluyeLeash?: boolean;
  incluyeParafina?: boolean;
  versionTerminos?: string;
  biometricSignature?: {
    signatureHash: string;
    timestamp: string;
    biometricVerified: boolean;
  };
}

export interface CancellationRefund {
  deltaHoras: number;
  porcentajeReembolso: number;
  porcentajePenalidad: number;
  montoReembolso: number;
  montoPenalidad: number;
  tramo: string;
}

export interface CancelRentalResponse {
  rental?: Rental;
  reembolso?: {
    monto: number;
    porcentaje: number;
    motivo: string;
    tramo: string;
  };
  rentalId: string;
  estado: string;
  motivo: string;
  refund: CancellationRefund;
}

export const rentalsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getQuote: builder.mutation<
      {
        status: string;
        data: {
          quote: RentalQuote;
          board: { id: string; titulo: string; marca: string; precioHora: number };
          fechaFinEstimada: string;
        };
      },
      QuoteRequest
    >({
      query: (body) => ({
        url: '/rentals/quote',
        method: 'POST',
        body,
      }),
    }),

    createRental: builder.mutation<
      { status: string; data: { rental: Rental; quote: RentalQuote } },
      CreateRentalRequest
    >({
      query: (body) => ({
        url: '/rentals',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Rental',
        'Board',
        'OwnerBoards',
        'User',
        'Schedule',
        'AgencyRental',
        'Metrics',
        'AgencyMetrics',
      ],
    }),

    getMyRentals: builder.query<{ status: string; data: Rental[] }, void>({
      query: () => '/rentals/my',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Rental' as const, id })),
              'Rental',
              'AgencyRental',
            ]
          : ['Rental', 'AgencyRental'],
    }),

    getRentalById: builder.query<{ status: string; data: Rental }, string>({
      query: (id) => `/rentals/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Rental', id }],
    }),

    cancelRental: builder.mutation<
      {
        status: string;
        data: CancelRentalResponse;
      },
      { id: string; motivo?: string } | string
    >({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg.id;
        const motivo =
          typeof arg === 'string'
            ? 'Cancelación solicitada por el usuario'
            : arg.motivo || 'Cancelación solicitada por el usuario';
        return {
          url: `/rentals/${id}/cancel`,
          method: 'POST',
          body: { motivo },
        };
      },
      invalidatesTags: [
        'Rental',
        'Board',
        'OwnerBoards',
        'Schedule',
        'AgencyRental',
        'Metrics',
        'AgencyMetrics',
      ],
    }),

    confirmRetiro: builder.mutation<
      { status: string; data: Rental },
      { id: string; fotosRetiro?: string[] }
    >({
      query: ({ id, ...body }) => ({
        url: `/rentals/${id}/retiro`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Rental', 'Board', 'Schedule', 'AgencyRental', 'Metrics'],
    }),

    confirmDevolucion: builder.mutation<
      { status: string; data: Rental },
      { id: string; fotosDevolucion?: string[]; lavada?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/rentals/${id}/devolucion`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Rental', 'Board', 'Schedule', 'AgencyRental', 'Metrics'],
    }),

    evaluarEstado: builder.mutation<
      { status: string; data: any },
      { id: string; tieneDanio: boolean; descripcion?: string; costoEstimado?: number }
    >({
      query: ({ id, ...body }) => ({
        url: `/rentals/${id}/evaluacion`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Rental', 'Board', 'Claim', 'Schedule', 'AgencyRental', 'Metrics'],
    }),
  }),
});

export const {
  useGetQuoteMutation,
  useCreateRentalMutation,
  useGetMyRentalsQuery,
  useGetRentalByIdQuery,
  useCancelRentalMutation,
  useConfirmRetiroMutation,
  useConfirmDevolucionMutation,
  useEvaluarEstadoMutation,
} = rentalsApi;
