import { Platform } from 'react-native';
import { LoginResponse, RegisterResponse } from '../types/auth';

// Puerto 3001 para la API de RN2 (evita colisión con el puerto 3000 del proyecto final)
export const DEFAULT_HOST = Platform.OS === 'web' ? 'http://localhost:3001' : 'http://192.168.100.63:3001';
export const DEFAULT_API_URL = `${DEFAULT_HOST}/api/login`;
export const DEFAULT_REGISTER_URL = `${DEFAULT_HOST}/api/register`;

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
      error.message || 'No se pudo conectar con el servidor backend en el puerto 3001. Verificá que la API esté corriendo.'
    );
  }
}

/**
 * Registra un nuevo usuario en la base de datos o en memoria
 */
export async function registerUser(
  nombre: string,
  email: string,
  password: string,
  rol: string = 'Estudiante',
  registerUrl: string = DEFAULT_REGISTER_URL
): Promise<RegisterResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ nombre, email, password, rol }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data: RegisterResponse = await response.json();

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
      error.message || 'No se pudo conectar con el servidor backend en el puerto 3001. Verificá que la API esté corriendo.'
    );
  }
}
