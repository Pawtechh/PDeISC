import { createAsyncThunk } from '@reduxjs/toolkit';
import { tokenStorage } from '../../utils/storage';
import { authSlice } from '../slices/authSlice';
import { apiSlice } from '../../api/apiSlice';
import { authApi } from '../../api/authApi';

// Alias para compatibilidad con dispatch(baseApi.util.resetApiState())
export const baseApi = authApi;

/**
 * Resetea el cache unificado de RTK Query del monorepo
 */
export const resetAllApis = (dispatch: any) => {
  dispatch(apiSlice.util.resetApiState());
};

/**
 * Thunk de logout completo:
 * 1. Limpia tokens de SecureStore
 * 2. Resetea cache de RTK Query
 * 3. Resetea slice de auth a initialState
 */
export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  // 1. Limpiar tokens del SecureStore
  await tokenStorage.clear();
  // 2. Resetear el cache de RTK Query
  resetAllApis(dispatch);
  // 3. Limpiar el slice de auth
  dispatch(authSlice.actions.resetState());
});
