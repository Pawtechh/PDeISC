import authReducer, {
  setCredentials,
  setRole,
  resetState,
  initialState,
  User,
} from '../slices/authSlice';

describe('authSlice Reducer & Actions', () => {
  it('debe tener el estado inicial correcto con isAuthenticated en false', () => {
    const state = authReducer(undefined, { type: 'unknown' });
    expect(state).toEqual(initialState);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('debe actualizar credenciales, token y autenticar con setCredentials', () => {
    const mockUser: User = {
      id: 'usr-1',
      email: 'consumer@surf.com',
      role: 'CONSUMER',
      nombre: 'Lucas Surfista',
      puntos: 120,
    };

    const nextState = authReducer(
      initialState,
      setCredentials({
        user: mockUser,
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-456',
      })
    );

    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user?.email).toBe('consumer@surf.com');
    expect(nextState.user?.role).toBe('CONSUMER');
    expect(nextState.user?.rol).toBe('CONSUMER');
    expect(nextState.accessToken).toBe('access-token-123');
    expect(nextState.refreshToken).toBe('refresh-token-456');
  });

  it('debe cambiar de rol entre CONSUMER, OWNER y AGENCIA sin requerir re-login con setRole', () => {
    const loggedState = {
      user: {
        id: 'usr-1',
        email: 'user@surf.com',
        role: 'CONSUMER' as const,
        rol: 'CONSUMER' as const,
        nombre: 'Usuario Demo',
        puntos: 50,
      },
      accessToken: 'token-abc',
      refreshToken: 'token-xyz',
      isAuthenticated: true,
    };

    // Cambiar a OWNER
    const stateOwner = authReducer(loggedState, setRole('OWNER'));
    expect(stateOwner.isAuthenticated).toBe(true);
    expect(stateOwner.user?.role).toBe('OWNER');
    expect(stateOwner.user?.rol).toBe('OWNER');

    // Cambiar a AGENCIA
    const stateAgencia = authReducer(stateOwner, setRole('AGENCIA'));
    expect(stateAgencia.isAuthenticated).toBe(true);
    expect(stateAgencia.user?.role).toBe('AGENCIA');
    expect(stateAgencia.user?.rol).toBe('AGENCIA');
  });

  it('debe restablecer el estado al initialState con resetState', () => {
    const activeState = {
      user: {
        id: 'usr-1',
        email: 'owner@surf.com',
        role: 'OWNER' as const,
        nombre: 'Martin Shaper',
        puntos: 500,
      },
      accessToken: 'token-123',
      refreshToken: 'token-456',
      isAuthenticated: true,
    };

    const clearedState = authReducer(activeState, resetState());
    expect(clearedState).toEqual(initialState);
    expect(clearedState.isAuthenticated).toBe(false);
    expect(clearedState.user).toBeNull();
    expect(clearedState.accessToken).toBeNull();
  });
});
