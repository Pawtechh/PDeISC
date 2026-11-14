import { apiSlice } from './apiSlice';

export interface AdminZoneItem {
  id: string;
  slug: string;
  pais: string;
  ciudad: string;
  nombre: string;
  latitud: number;
  longitud: number;
  timezone: string;
  activa: boolean;
  agencyCount: number;
  boardCount: number;
}

export interface AdminAgencyUserRef {
  id: string;
  nombre: string;
  email: string;
  role: string;
  activo: boolean;
}

export interface AdminAgencyItem {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  direccion: string;
  whatsapp?: string | null;
  horario?: string | null;
  accentColor?: string | null;
  comisionPorcentaje: number;
  multaSalitreArs: number;
  verificada: boolean;
  activa: boolean;
  zoneId: string;
  zone?: {
    id: string;
    slug: string;
    ciudad: string;
    nombre: string;
    latitud: number;
    longitud: number;
  };
  users?: AdminAgencyUserRef[];
  boardCount: number;
  rentalCount: number;
  operatorCount: number;
}

export interface AdminUserItem {
  id: string;
  email: string;
  nombre: string;
  telefono?: string | null;
  role: 'CONSUMER' | 'OWNER' | 'AGENCIA' | 'SUPER_ADMIN';
  agencyId?: string | null;
  activo: boolean;
  createdAt: string;
  agency?: {
    id: string;
    nombre: string;
    slug: string;
  } | null;
}

export interface AdminBoardItem {
  id: string;
  titulo: string;
  marca: string;
  modelo: string;
  medidas: string;
  tipoTabla: string;
  precioHora: number;
  valorTasadoUsd: number;
  estado: string;
  fotos: string[];
  agencyId?: string | null;
  zoneId?: string | null;
  agency?: {
    id: string;
    nombre: string;
    slug: string;
    accentColor?: string | null;
  } | null;
  zone?: {
    id: string;
    ciudad: string;
    nombre: string;
  } | null;
  owner?: {
    id: string;
    nombre: string;
    email: string;
  } | null;
}

export interface AdminOverviewResponse {
  status: string;
  data: {
    metrics: {
      totalZones: number;
      activeZones: number;
      totalAgencies: number;
      activeAgencies: number;
      totalUsers: number;
      agencyAccounts: number;
      totalBoards: number;
      availableBoards: number;
      totalRentals: number;
      platformRevenueArs: number;
    };
    zones: AdminZoneItem[];
    agencies: AdminAgencyItem[];
    users: AdminUserItem[];
    boards: AdminBoardItem[];
  };
}

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOverview: builder.query<AdminOverviewResponse, void>({
      query: () => '/admin/overview',
      providesTags: ['AdminOverview', 'Zone', 'Agency', 'Board', 'User'],
    }),
    createZone: builder.mutation<any, {
      ciudad: string;
      nombre: string;
      pais?: string;
      latitud: number;
      longitud: number;
      timezone?: string;
      activa?: boolean;
    }>({
      query: (body) => ({
        url: '/admin/zones',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminOverview', 'Zone'],
    }),
    updateZone: builder.mutation<any, { id: string; body: Partial<AdminZoneItem> }>({
      query: ({ id, body }) => ({
        url: `/admin/zones/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminOverview', 'Zone', 'Board', 'Agency'],
    }),
    deleteZone: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/zones/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminOverview', 'Zone'],
    }),
    adminCreateAgency: builder.mutation<any, {
      nombre: string;
      descripcion?: string;
      direccion: string;
      whatsapp?: string;
      horario?: string;
      accentColor?: string;
      comisionPorcentaje?: number;
      multaSalitreArs?: number;
      zoneId: string;
      operatorEmail?: string;
      operatorPassword?: string;
      operatorNombre?: string;
      operatorTelefono?: string;
      existingUserId?: string;
    }>({
      query: (body) => ({
        url: '/admin/agencies',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminOverview', 'Agency', 'Zone', 'User'],
    }),
    adminUpdateAgency: builder.mutation<any, { id: string; body: Partial<AdminAgencyItem> }>({
      query: ({ id, body }) => ({
        url: `/admin/agencies/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminOverview', 'Agency', 'Zone', 'Board'],
    }),
    createAgencyOperator: builder.mutation<any, {
      email: string;
      password: string;
      nombre: string;
      telefono?: string;
      agencyId: string;
      role?: 'AGENCIA' | 'OWNER' | 'CONSUMER' | 'SUPER_ADMIN';
    }>({
      query: (body) => ({
        url: '/admin/users/agency-account',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminOverview', 'User', 'Agency'],
    }),
    updateUserRoleAdmin: builder.mutation<any, {
      id: string;
      role: 'AGENCIA' | 'OWNER' | 'CONSUMER' | 'SUPER_ADMIN';
      agencyId?: string | null;
      activo?: boolean;
    }>({
      query: ({ id, ...body }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminOverview', 'User', 'Agency'],
    }),
    adminCreateBoard: builder.mutation<any, {
      titulo: string;
      marca: string;
      modelo: string;
      medidas: string;
      volumenLitros?: number;
      tipoTabla: 'Shortboard' | 'Longboard' | 'Funboard' | 'Fish' | 'Bodyboard' | 'SUP';
      precioHora: number;
      valorTasadoUsd: number;
      fotos?: string[];
      agencyId: string;
      zoneId?: string;
      ownerId?: string;
    }>({
      query: (body) => ({
        url: '/admin/boards',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdminOverview', 'Board', 'Agency', 'Zone'],
    }),
    relocateBoardLocation: builder.mutation<any, {
      boardId: string;
      agencyId: string;
      zoneId: string;
      estado?: string;
    }>({
      query: ({ boardId, ...body }) => ({
        url: `/admin/boards/${boardId}/location`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminOverview', 'Board', 'Agency', 'Zone'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminOverviewQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
  useAdminCreateAgencyMutation,
  useAdminUpdateAgencyMutation,
  useCreateAgencyOperatorMutation,
  useUpdateUserRoleAdminMutation,
  useAdminCreateBoardMutation,
  useRelocateBoardLocationMutation,
} = adminApi;
