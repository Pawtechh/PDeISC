import { apiSlice } from './apiSlice';
import { User } from '../store/slices/authSlice';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  data: {
    user: User;
    tokens: AuthTokens;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  dni: string;
  telefono?: string;
  dniFotoUrl?: string;
  fechaNacimiento?: string;
  aceptaTerminos?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export const authApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    getMe: builder.query<{ data: { user: User } }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    forgotPassword: builder.mutation<{ data: { message: string } }, ForgotPasswordRequest>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),

    logoutApi: builder.mutation<{ data: { success: boolean } }, { refreshToken: string }>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useLogoutApiMutation,
} = authApi;
