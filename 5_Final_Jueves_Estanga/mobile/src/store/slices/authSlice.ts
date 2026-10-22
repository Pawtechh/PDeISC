import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'CONSUMER' | 'OWNER' | 'AGENCIA';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  rol?: UserRole;
  nombre: string;
  puntos: number;
  dni?: string;
  telefono?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
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
      const role = u.role || u.rol || 'CONSUMER';
      state.user = {
        ...u,
        role,
        rol: role,
      };
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
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

export const { setCredentials, setRole, resetState } = authSlice.actions;

// Re-export logout thunk para retrocompatibilidad
export { logout } from '../auth/thunks';

export default authSlice.reducer;
