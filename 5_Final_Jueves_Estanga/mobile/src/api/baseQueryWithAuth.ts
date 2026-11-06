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

export const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname;
    const protocol = window.location.protocol || 'http:';
    const port = window.location.port;

    // Si corre en Metro dev server (puerto 8081 o 19006), apuntar al backend local (puerto 3000)
    if (port === '8081' || port === '19006') {
      return `${protocol}//${host}:3000/api`;
    }

    // Si corre a través de túnel público (cloudflare, pinggy, ngrok, localtunnel) o en el servidor unificado
    return `${protocol}//${host}${port ? `:${port}` : ''}/api`;
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    return 'https://pdeisc-1.onrender.com/api';
  }
  return 'http://localhost:3000/api';
};

export const getServerOrigin = () => {
  return getBaseUrl().replace(/\/api\/?$/, '');
};

export const resolveAssetUrl = (rawUrl?: string | null): string => {
  if (!rawUrl) return '';
  const cleaned = String(rawUrl).replace(/^https?:\/\/localhost:3000/i, '');
  if (cleaned.startsWith('/') && Platform.OS !== 'web') {
    return `${getServerOrigin()}${cleaned}`;
  }
  return cleaned;
};

const baseUrl = getBaseUrl();

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: async (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token && !token.startsWith('dev-')) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    headers.set('ngrok-skip-browser-warning', 'true');
    return headers;
  },
});

const DEMO_ACCOUNTS = new Set([
  'consumer@surf.com',
  'owner@surf.com',
  'mostrador@surf.com',
]);

let refreshMutexPromise: Promise<boolean> | null = null;

const isValidJwtFormat = (token: string | null | undefined): boolean => {
  if (!token || typeof token !== 'string') return false;
  if (token.startsWith('dev-')) return false;
  return token.split('.').length === 3;
};

export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Evitar bucle si el propio login o refresh dio 401
    const reqUrl = typeof args === 'string' ? args : args.url;
    if (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/refresh')) {
      return result;
    }

    if (!refreshMutexPromise) {
      refreshMutexPromise = (async () => {
        try {
          const state = api.getState() as RootState;
          const refreshToken = state.auth.refreshToken;
          const currentUser = state.auth.user;

          // 1. Intentar refresh real sólo si el refreshToken tiene formato JWT válido
          if (isValidJwtFormat(refreshToken)) {
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

              await tokenStorage.save({
                access: newTokens.accessToken,
                refresh: newTokens.refreshToken,
              });

              if (currentUser) {
                api.dispatch(
                  setCredentials({
                    user: currentUser,
                    accessToken: newTokens.accessToken,
                    refreshToken: newTokens.refreshToken,
                  })
                );
              }
              return true;
            }
          }

          // 2. Si no hay refresh token real o falló, verificar si es cuenta demo o dev
          if (currentUser?.email && DEMO_ACCOUNTS.has(currentUser.email)) {
            const loginResult = await rawBaseQuery(
              {
                url: '/auth/login',
                method: 'POST',
                body: { email: currentUser.email, password: 'Password123!' },
              },
              api,
              extraOptions
            );

            if (loginResult.data) {
              const payload = (loginResult.data as any)?.data;
              if (payload?.tokens && payload?.user) {
                await tokenStorage.save({
                  access: payload.tokens.accessToken,
                  refresh: payload.tokens.refreshToken,
                });
                await tokenStorage.saveUser(payload.user);

                api.dispatch(
                  setCredentials({
                    user: payload.user,
                    accessToken: payload.tokens.accessToken,
                    refreshToken: payload.tokens.refreshToken,
                  })
                );
                return true;
              }
            }
          }

          // 3. Si no se pudo renovar ni es demo recuperable, desloguear limpiamente
          await api.dispatch(logout() as any);
          return false;
        } catch {
          await api.dispatch(logout() as any);
          return false;
        } finally {
          refreshMutexPromise = null;
        }
      })();
    }

    const refreshed = await refreshMutexPromise;
    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
};
