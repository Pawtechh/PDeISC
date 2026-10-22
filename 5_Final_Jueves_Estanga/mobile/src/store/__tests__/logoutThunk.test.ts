import { logout } from '../auth/thunks';
import { tokenStorage } from '../../utils/storage';
import { authSlice } from '../slices/authSlice';
import { authApi } from '../../api/authApi';

jest.mock('../../utils/storage', () => ({
  tokenStorage: {
    clear: jest.fn().mockResolvedValue(undefined),
    save: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ access: null, refresh: null }),
  },
}));

describe('logout Thunk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe limpiar SecureStore, resetear cache de RTK Query y resetear authSlice', async () => {
    const dispatch = jest.fn();
    const getState = jest.fn();

    const thunk = logout();
    await thunk(dispatch, getState, undefined);

    // 1. Limpieza de tokens en SecureStore
    expect(tokenStorage.clear).toHaveBeenCalledTimes(1);

    // 2. Despacho de resetState del authSlice
    expect(dispatch).toHaveBeenCalledWith(authSlice.actions.resetState());

    // 3. Despacho de resetApiState de RTK Query
    expect(dispatch).toHaveBeenCalledWith(authApi.util.resetApiState());
  });
});
