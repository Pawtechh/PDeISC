import { apiSlice } from './apiSlice';

export interface RiderTierInfo {
  nivel: number;
  nombre: string;
  proximoNivelPuntos: number;
  beneficio: string;
  progresoPorcentaje: number;
}

export interface LoyaltyPointsHistoryItem {
  rentalId: string;
  tabla: string;
  tipoTabla: string;
  fecha: string;
  horas: number;
  puntosGanados: number;
  puntosUsados: number;
  montoTotal: number;
}

export interface LoyaltyBalanceResponse {
  puntos: number;
  equivalenciaArs: number;
  puntosSancion: number;
  cuentaRestringida: boolean;
  nivel: RiderTierInfo;
  vencimiento: {
    mesesVigencia: number;
    fechaEstimada: string;
    diasRestantes: number;
  };
  reglas: {
    puntosPorHora: number;
    valorPuntoArs: number;
    sancionSalitre: number;
    umbralBloqueo: number;
  };
  historial: LoyaltyPointsHistoryItem[];
}

export interface ReviewItem {
  id: string;
  calificacion: number;
  comentario: string;
  fecha: string;
  autor: string;
  verificado: boolean;
}

export interface BoardReviewsResponse {
  boardId: string;
  total: number;
  promedio: number;
  distribucion: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  reviews: ReviewItem[];
}

export interface PendingReviewItem {
  rentalId: string;
  board: {
    id: string;
    titulo: string;
    marca: string;
    modelo: string;
    tipoTabla: string;
    fotos: string[];
  };
  fechaUso: string;
  horas: number;
  puntosGanados: number;
}

export const loyaltyApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getLoyaltyBalance: builder.query<{ status: string; data: LoyaltyBalanceResponse }, void>({
      query: () => '/loyalty/balance',
      providesTags: ['User', 'LoyaltyBalance'],
    }),

    calculateDiscount: builder.mutation<
      {
        status: string;
        data: {
          puntosCanjeados: number;
          descuentoArs: number;
          puntosRestantes: number;
          valorUnitarioArs: number;
        };
      },
      { puntos: number }
    >({
      query: (body) => ({
        url: '/loyalty/redeem',
        method: 'POST',
        body,
      }),
    }),

    createReview: builder.mutation<
      { status: string; data: any },
      { rentalId: string; calificacion: number; comentario: string }
    >({
      query: (body) => ({
        url: '/loyalty/reviews',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Review',
        'User',
        'Board',
        'OwnerBoards',
        'BoardReviews',
        'PendingReviews',
        'LoyaltyBalance',
      ],
    }),

    getBoardReviews: builder.query<{ status: string; data: BoardReviewsResponse }, string>({
      query: (boardId) => `/loyalty/reviews/board/${boardId}`,
      providesTags: (_res, _err, boardId) => [
        { type: 'Review', id: boardId },
        { type: 'BoardReviews', id: boardId },
      ],
    }),

    getPendingReviews: builder.query<{ status: string; data: PendingReviewItem[] }, void>({
      query: () => '/loyalty/reviews/pending',
      providesTags: ['PendingReviews', 'Rental'],
    }),
  }),
});

export const {
  useGetLoyaltyBalanceQuery,
  useCalculateDiscountMutation,
  useCreateReviewMutation,
  useGetBoardReviewsQuery,
  useGetPendingReviewsQuery,
} = loyaltyApi;
