import {
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native';
import { RootState } from '../store';
import { setCredentials, logout } from '../store/slices/authSlice';
import { tokenStorage } from '../utils/storage';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const protocol = window.location.protocol || 'http:';
    const port = window.location.port;

    // Si corre en Metro dev server (puerto 8081 o 19006), apuntar al backend local (puerto 3000)
    if (port === '8081' || port === '19006') {
      return `${protocol}//${host}:3000/api`;
    }

    // Si corre a través de túnel público (pinggy, cloudflare, ngrok, localtunnel) o en el servidor unificado
    return `${protocol}//${host}${port ? `:${port}` : ''}/api`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000/api';
  }
  return 'http://localhost:3000/api';
};

const baseUrl = getBaseUrl();

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: async (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    headers.set('ngrok-skip-browser-warning', 'true');
    return headers;
  },
});

export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.auth.refreshToken;

    if (refreshToken) {
      // Intentar refrescar el token
      const refreshResult = await rawBaseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as {
          data: { tokens: { accessToken: string; refreshToken: string } };
        };
        const newTokens = data.data.tokens;

        // Persistir en SecureStore
        await tokenStorage.save({
          access: newTokens.accessToken,
          refresh: newTokens.refreshToken,
        });

        // Actualizar store Redux
        if (state.auth.user) {
          api.dispatch(
            setCredentials({
              user: state.auth.user,
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
            })
          );
        }

        // Reintentar la consulta original con el nuevo token
        result = await rawBaseQuery(args, api, extraOptions);
      } else {
        await tokenStorage.clear();
        api.dispatch(logout());
      }
    } else {
      await tokenStorage.clear();
      api.dispatch(logout());
    }
  }

  return result;
};
