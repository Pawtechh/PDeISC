import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'CONSUMER' | 'OWNER' | 'AGENCIA';
export type VendorStatus = 'NONE' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface VendorApplicationData {
  id: string;
  userId: string;
  userEmail: string;
  userNombre: string;
  userDni?: string | null;
  userTelefono?: string | null;
  nombreVendedor: string;
  descripcion: string;
  fotosTablas: string[];
  experienciaRubro: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  biometricHash?: string;
  motivoResolucion?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  rol?: UserRole;
  nombre: string;
  puntos: number;
  dni?: string;
  dniFotoUrl?: string;
  telefono?: string;
  vendorStatus?: VendorStatus;
  canSwitchRole?: boolean;
  vendorApplication?: VendorApplicationData | null;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
}

export const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isGuest: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>
    ) => {
      const u = action.payload.user;
      const role = (u.role || u.rol || 'CONSUMER') as UserRole;
      state.user = {
        ...u,
        role,
        rol: role,
      };
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.isGuest = false;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        const u = action.payload;
        const newRole = (u.role || u.rol || state.user.role || state.user.rol || 'CONSUMER') as UserRole;
        state.user = {
          ...state.user,
          ...u,
          role: newRole,
          rol: newRole,
        };
      } else if (action.payload) {
        const u = action.payload as User;
        const newRole = (u.role || u.rol || 'CONSUMER') as UserRole;
        state.user = {
          ...u,
          role: newRole,
          rol: newRole,
        };
      }
    },
    setGuestMode: (state, action: PayloadAction<boolean>) => {
      state.isGuest = action.payload;
    },
    setRole: (state, action: PayloadAction<UserRole>) => {
      if (state.user) {
        state.user.role = action.payload;
        state.user.rol = action.payload;
      }
    },
    resetState: () => initialState,
  },
});

export const { setCredentials, setRole, updateUser, setGuestMode, resetState } = authSlice.actions;

// Re-export logout thunk para retrocompatibilidad
export { logout } from '../auth/thunks';

export default authSlice.reducer;
