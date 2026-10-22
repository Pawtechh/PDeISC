import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { useAppDispatch } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { tokenStorage } from '../utils/storage';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'github' | 'facebook' | 'apple';

interface OAuthResponse {
  data: {
    user: {
      id: string;
      email: string;
      role: 'CONSUMER' | 'OWNER' | 'AGENCIA';
      nombre: string;
      puntos: number;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export const useOAuth = (provider: OAuthProvider, onError?: (msg: string) => void) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

  const promptAsync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'surfrental',
        path: 'auth/callback',
      });

      // 1. Obtener la URL de inicio del backend
      let authUrl: string;
      try {
        const urlRes = await fetch(`${baseUrl}/auth/oauth/${provider}?redirectUri=${encodeURIComponent(redirectUri)}`, {
          headers: { Accept: 'application/json' },
        });

        if (urlRes.ok) {
          const json = await urlRes.json();
          authUrl = json.data?.authUrl;
        } else {
          authUrl = `${baseUrl}/auth/oauth/${provider}`;
        }
      } catch {
        authUrl = `${baseUrl}/auth/oauth/${provider}`;
      }

      // 2. Abrir navegador / popup para autenticación social
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      // Si el usuario canceló la ventana o cerró el popup
      if (result.type !== 'success' || !result.url) {
        setIsLoading(false);
        // NUNCA logear al usuario si canceló la operación
        return;
      }

      const parsed = Linking.parse(result.url);

      // Si el servidor o el usuario reportó error o canceló
      if (parsed.queryParams && parsed.queryParams.error) {
        const errorDesc = String(parsed.queryParams.error_description || parsed.queryParams.error);
        const userFriendly =
          errorDesc.includes('access_denied') || errorDesc.includes('Cancelado')
            ? 'Autorización cancelada por el usuario'
            : `Error de autorización: ${errorDesc}`;
        setError(userFriendly);
        onError?.(userFriendly);
        setIsLoading(false);
        return;
      }

      const codeOrToken = (parsed.queryParams?.code || parsed.queryParams?.token) as string;
      if (!codeOrToken) {
        const msg = 'No se recibió el código de autorización del proveedor';
        setError(msg);
        onError?.(msg);
        setIsLoading(false);
        return;
      }

      // 3. Canjear en backend contra /api/auth/oauth/:provider/token
      const tokenExchangeRes = await fetch(`${baseUrl}/auth/oauth/${provider}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: codeOrToken,
          token: codeOrToken,
          redirectUri,
        }),
      });

      if (!tokenExchangeRes.ok) {
        const errJson = await tokenExchangeRes.json().catch(() => null);
        throw new Error(errJson?.message || 'Error al intercambiar credenciales con el servidor');
      }

      const responseData = (await tokenExchangeRes.json()) as OAuthResponse;
      const { user, tokens } = responseData.data;

      // 4. Guardar en SecureStore y store Redux únicamente si la respuesta fue exitosa
      await tokenStorage.save({
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      });
      await tokenStorage.saveUser(user);

      dispatch(
        setCredentials({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
    } catch (err: any) {
      const msg = err?.message || `No se pudo iniciar sesión con ${provider}`;
      setError(msg);
      onError?.(msg);
      // NUNCA despachar credenciales ni iniciar sesión si ocurrió un error
    } finally {
      setIsLoading(false);
    }
  };

  return {
    promptAsync,
    isLoading,
    error,
  };
};
