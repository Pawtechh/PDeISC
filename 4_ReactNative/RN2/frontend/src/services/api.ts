import { Platform } from 'react-native';
import { LoginResponse } from '../types/auth';

// Dirección IP local detectada de tu computadora
export const DEFAULT_HOST = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.100.63:3000';
export const DEFAULT_API_URL = `${DEFAULT_HOST}/api/login`;

/**
 * Realiza la petición de autenticación contra la API en Node.js o PHP
 */
export async function authenticateUser(
  email: string,
  password: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<LoginResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000); // 7 segundos de timeout

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data: LoginResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Error del servidor (${response.status})`,
      };
    }

    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al conectar con el servidor.');
    }
    throw new Error(
      error.message || 'No se pudo conectar con el servidor backend. Verificá que la API esté corriendo.'
    );
  }
}
