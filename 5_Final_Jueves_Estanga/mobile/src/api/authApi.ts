import { apiSlice } from './apiSlice';
import { User, VendorApplicationData, VendorStatus } from '../store/slices/authSlice';

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

export interface VendorStatusResponse {
  status: string;
  data: {
    vendorStatus: VendorStatus;
    canSwitchRole: boolean;
    application: VendorApplicationData | null;
  };
}

export interface SubmitVendorApplicationRequest {
  nombreVendedor: string;
  descripcion: string;
  fotosTablas: string[];
  experienciaRubro: string;
}

export interface SwitchRoleRequest {
  targetRole: 'CONSUMER' | 'OWNER';
  authMethod: 'BIOMETRIC' | 'PASSWORD';
  biometricVerified?: boolean;
  biometricHash?: string;
  password?: string;
}

export interface SwitchRoleResponse {
  status: string;
  data: {
    user: User;
    tokens: AuthTokens;
    mensaje: string;
  };
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
      invalidatesTags: ['User', 'VendorRequest'],
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User', 'VendorRequest'],
    }),

    getMe: builder.query<{ data: { user: User } }, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),

    getVendorStatus: builder.query<VendorStatusResponse, void>({
      query: () => '/users/vendor-status',
      providesTags: ['User', 'VendorRequest'],
    }),

    submitVendorApplication: builder.mutation<
      {
        status: string;
        data: {
          vendorStatus: VendorStatus;
          canSwitchRole: boolean;
          application: VendorApplicationData;
          mensaje: string;
        };
      },
      SubmitVendorApplicationRequest
    >({
      query: (body) => ({
        url: '/users/vendor-application',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'VendorRequest'],
    }),

    switchUserRole: builder.mutation<SwitchRoleResponse, SwitchRoleRequest>({
      query: (body) => ({
        url: '/users/switch-role',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'VendorRequest', 'OwnerBoards', 'Rental'],
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
  useGetVendorStatusQuery,
  useSubmitVendorApplicationMutation,
  useSwitchUserRoleMutation,
  useForgotPasswordMutation,
  useLogoutApiMutation,
} = authApi;
