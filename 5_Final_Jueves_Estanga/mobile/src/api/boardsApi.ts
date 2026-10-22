import { apiSlice } from './apiSlice';

export interface Board {
  id: string;
  ownerId: string;
  titulo: string;
  marca: string;
  modelo: string;
  medidas: string;
  volumenLitros?: number | null;
  tipoTabla: string;
  precioHora: number;
  valorTasadoUsd: number;
  estado: 'DISPONIBLE' | 'ALQUILADA' | 'MANTENIMIENTO' | 'PRIVADA';
  fotos: string[];
  polizaSeguroNumero?: string | null;
  polizaAseguradora?: string | null;
  proximoMantenimiento?: string | null;
  calificacionPromedio?: number;
  totalReviews?: number;
  owner?: {
    id: string;
    nombre: string;
  };
  rentals?: Array<{
    id: string;
    fechaInicio: string;
    fechaFinEstimada: string;
    estado: string;
  }>;
}

export interface BoardFilters {
  tipo?: string;
  marca?: string;
  precioMin?: number;
  precioMax?: number;
  orden?: string;
  page?: number;
  limit?: number;
}

export interface AvailabilityDay {
  fecha: string;
  disponible: boolean;
  franjasDisponibles: string[];
}

export interface BoardAvailability {
  boardId: string;
  estadoActual: string;
  dias: AvailabilityDay[];
}

export const boardsApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getBoards: builder.query<{ data: Board[]; meta: { total: number; page: number } }, BoardFilters | void>({
      query: (filters) => ({
        url: '/boards',
        params: (filters || {}) as Record<string, any>,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Board' as const, id })),
              'Board',
              'OwnerBoards',
            ]
          : ['Board', 'OwnerBoards'],
    }),

    getMyBoards: builder.query<{ status: string; data: Board[] }, void>({
      query: () => '/boards/mine',
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Board' as const, id })),
              'Board',
              'OwnerBoards',
            ]
          : ['Board', 'OwnerBoards'],
    }),

    getBoard: builder.query<{ data: Board }, string>({
      query: (id) => `/boards/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Board', id }],
    }),

    getBoardAvailability: builder.query<{ data: BoardAvailability }, string>({
      query: (id) => `/boards/${id}/availability`,
    }),

    createBoard: builder.mutation<{ data: Board }, Partial<Board>>({
      query: (body) => ({
        url: '/boards',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Board', 'OwnerBoards'],
    }),

    updateBoard: builder.mutation<{ data: Board }, { id: string; data: Partial<Board> }>({
      query: ({ id, data }) => ({
        url: `/boards/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Board', id }, 'Board', 'OwnerBoards'],
    }),

    deleteBoard: builder.mutation<{ data: { success: boolean } }, string>({
      query: (id) => ({
        url: `/boards/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Board', 'OwnerBoards'],
    }),
  }),
});

export const {
  useGetBoardsQuery,
  useGetMyBoardsQuery,
  useGetBoardQuery,
  useGetBoardAvailabilityQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
} = boardsApi;
