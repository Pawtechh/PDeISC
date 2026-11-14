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

export interface RefreshAttemptResult {
  refreshed: boolean;
  transientFailure?: boolean;
  accessToken?: string;
  refreshToken?: string;
}

let refreshMutexPromise: Promise<RefreshAttemptResult> | null = null;

export const isValidJwtFormat = (token: string | null | undefined): boolean => {
  if (!token || typeof token !== 'string') return false;
  if (token.startsWith('dev-')) return false;
  return token.split('.').length === 3;
};

const decodeBase64Url = (input: string): string | null => {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (normalized.length % 4)) % 4;
    const padded = normalized + '='.repeat(padLength);
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(padded);
    }
    const Buf = (globalThis as any).Buffer;
    if (Buf) {
      return Buf.from(padded, 'base64').toString('utf8');
    }
    return null;
  } catch {
    return null;
  }
};

export const isJwtExpired = (token: string | null | undefined, bufferSeconds = 30): boolean => {
  if (!isValidJwtFormat(token)) return true;
  try {
    const parts = (token as string).split('.');
    const jsonStr = decodeBase64Url(parts[1] || '');
    if (!jsonStr) return false;
    const payload = JSON.parse(jsonStr) as { exp?: number };
    if (typeof payload.exp !== 'number') return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSeconds + bufferSeconds;
  } catch {
    return false;
  }
};

const isTransientStatus = (status: unknown): boolean =>
  status === 502 || status === 503 || status === 504 || status === 'FETCH_ERROR';

const isIdempotentRequest = (args: string | FetchArgs): boolean => {
  if (typeof args === 'string') return true;
  const method = (args.method || 'GET').toUpperCase();
  return method === 'GET' || method === 'HEAD';
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const executeWithColdStartRetry = async (
  args: string | FetchArgs,
  api: any,
  extraOptions: any
) => {
  const maxRetries = isIdempotentRequest(args) ? 2 : 0;
  let result = await rawBaseQuery(args, api, extraOptions);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    if (!result.error || !isTransientStatus(result.error.status)) {
      break;
    }
    await sleep(attempt === 1 ? 1200 : 2500);
    result = await rawBaseQuery(args, api, extraOptions);
  }

  return result;
};

export const tryRefreshAccessToken = async (params: {
  dispatch: any;
  getState: () => RootState;
  refreshTokenOverride?: string | null;
  userOverride?: any;
  extraOptions?: any;
}): Promise<RefreshAttemptResult> => {
  if (!refreshMutexPromise) {
    refreshMutexPromise = (async (): Promise<RefreshAttemptResult> => {
      try {
        const state = params.getState();
        const refreshToken = params.refreshTokenOverride ?? state.auth.refreshToken;
        const currentUser = params.userOverride ?? state.auth.user;
        const fakeApi = {
          dispatch: params.dispatch,
          getState: params.getState,
          signal: new AbortController().signal,
          abort: () => {},
          extra: undefined,
          endpoint: 'authRefresh',
          type: 'mutation',
        } as any;

        // 1. Intentar refresh real sólo si el refreshToken tiene formato JWT válido y no expiró
        if (isValidJwtFormat(refreshToken) && !isJwtExpired(refreshToken, 5)) {
          const refreshResult = await rawBaseQuery(
            {
              url: '/auth/refresh',
              method: 'POST',
              body: { refreshToken },
            },
            fakeApi,
            params.extraOptions || {}
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
              params.dispatch(
                setCredentials({
                  user: currentUser,
                  accessToken: newTokens.accessToken,
                  refreshToken: newTokens.refreshToken,
                })
              );
            }
            return {
              refreshed: true,
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
            };
          }

          if (refreshResult.error && isTransientStatus(refreshResult.error.status)) {
            return { refreshed: false, transientFailure: true };
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
            fakeApi,
            params.extraOptions || {}
          );

          if (loginResult.data) {
            const payload = (loginResult.data as any)?.data;
            if (payload?.tokens && payload?.user) {
              await tokenStorage.save({
                access: payload.tokens.accessToken,
                refresh: payload.tokens.refreshToken,
              });
              await tokenStorage.saveUser(payload.user);

              params.dispatch(
                setCredentials({
                  user: payload.user,
                  accessToken: payload.tokens.accessToken,
                  refreshToken: payload.tokens.refreshToken,
                })
              );
              return {
                refreshed: true,
                accessToken: payload.tokens.accessToken,
                refreshToken: payload.tokens.refreshToken,
              };
            }
          }

          if (loginResult.error && isTransientStatus(loginResult.error.status)) {
            return { refreshed: false, transientFailure: true };
          }
        }

        // 3. Si no se pudo renovar ni es demo recuperable, desloguear limpiamente
        await params.dispatch(logout() as any);
        return { refreshed: false };
      } catch {
        await params.dispatch(logout() as any);
        return { refreshed: false };
      } finally {
        refreshMutexPromise = null;
      }
    })();
  }

  return refreshMutexPromise;
};

export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await executeWithColdStartRetry(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Evitar bucle si el propio login o refresh dio 401
    const reqUrl = typeof args === 'string' ? args : args.url;
    if (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/refresh')) {
      return result;
    }

    const { refreshed } = await tryRefreshAccessToken({
      dispatch: api.dispatch,
      getState: api.getState as () => RootState,
      extraOptions,
    });
    if (refreshed) {
      result = await executeWithColdStartRetry(args, api, extraOptions);
    }
  }

  return result;
};
