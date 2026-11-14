import { apiSlice } from './apiSlice';
import { Board } from './boardsApi';
import { User } from '../store/slices/authSlice';

export interface ZoneAgencyPreview {
  id: string;
  slug: string;
  nombre: string;
  accentColor?: string | null;
  verificada: boolean;
  direccion?: string;
  latitud?: number | null;
  longitud?: number | null;
  boardCount?: number;
  minPriceArs?: number | null;
}

export interface ZoneSummary {
  id: string;
  slug: string;
  ciudad: string;
  nombre: string;
  pais: string;
  latitud: number;
  longitud: number;
  timezone: string;
  agencyCount: number;
  boardCount: number;
  minPriceArs?: number | null;
  agenciesPreview?: ZoneAgencyPreview[];
}

export interface AgencySummary {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  logoUrl?: string | null;
  portadaUrl?: string | null;
  accentColor?: string | null;
  direccion: string;
  whatsapp?: string | null;
  horario?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  comisionPorcentaje: number;
  multaSalitreArs: number;
  mpCollectorId?: string | null;
  mpSplitConfigured?: boolean;
  planEstado?: string;
  minPriceArs?: number | null;
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
  boardCount?: number;
  rentalCount?: number;
}

export interface AgencyProfileDetail extends AgencySummary {
  totalCatalogCount: number;
  boards: Board[];
}

export interface RegisterAgencyRequest {
  nombre: string;
  descripcion?: string;
  direccion: string;
  whatsapp?: string;
  horario?: string;
  accentColor?: string;
  logoUrl?: string;
  portadaUrl?: string;
  multaSalitreArs?: number;
  comisionPorcentaje?: number;
  planTier?: 'STARTER' | 'PRO' | 'ENTERPRISE';
  mpCollectorId?: string;
  zoneId?: string;
  ciudad?: string;
  nombreZona?: string;
  email?: string;
  password?: string;
  nombreResponsable?: string;
  telefonoResponsable?: string;
}

export interface RegisterAgencyResponse {
  agency: AgencySummary;
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface UpdateMyAgencyRequest {
  nombre?: string;
  descripcion?: string | null;
  direccion?: string;
  whatsapp?: string | null;
  horario?: string | null;
  accentColor?: string;
  logoUrl?: string | null;
  portadaUrl?: string | null;
  multaSalitreArs?: number;
  latitud?: number;
  longitud?: number;
  mpCollectorId?: string | null;
  zoneId?: string;
}

export const agenciesApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getZones: builder.query<{ status: string; data: ZoneSummary[] }, void>({
      query: () => '/zones',
      providesTags: ['Zone'],
    }),

    getAgencies: builder.query<
      { status: string; data: AgencySummary[] },
      { zoneId?: string; ciudad?: string; q?: string } | void
    >({
      query: (params) => {
        const clean: Record<string, string> = {};
        if (params) {
          if (params.zoneId) clean.zoneId = params.zoneId;
          if (params.ciudad) clean.ciudad = params.ciudad;
          if (params.q) clean.q = params.q;
        }
        return Object.keys(clean).length > 0 ? { url: '/agencies', params: clean } : '/agencies';
      },
      providesTags: ['Agency'],
    }),

    getAgencyProfile: builder.query<{ status: string; data: AgencyProfileDetail }, string>({
      query: (slugOrId) => `/agencies/${encodeURIComponent(slugOrId)}`,
      providesTags: (_result, _error, slugOrId) => [{ type: 'Agency', id: slugOrId }, 'Agency', 'Board'],
    }),

    registerAgency: builder.mutation<{ status: string; data: RegisterAgencyResponse }, RegisterAgencyRequest>({
      query: (body) => ({
        url: '/agencies/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Agency', 'Zone', 'User', 'Board'],
    }),

    updateMyAgency: builder.mutation<{ status: string; data: AgencySummary }, UpdateMyAgencyRequest>({
      query: (body) => ({
        url: '/agencies/mine',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Agency', 'Zone', 'AgencyMetrics', 'Board', 'User'],
    }),
  }),
});

export const {
  useGetZonesQuery,
  useGetAgenciesQuery,
  useGetAgencyProfileQuery,
  useRegisterAgencyMutation,
  useUpdateMyAgencyMutation,
} = agenciesApi;
