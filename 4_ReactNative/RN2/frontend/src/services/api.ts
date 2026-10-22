import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { LoginResponse, RegisterResponse } from '../types/auth';

/**
 * Obtiene dinámicamente la IP de la máquina donde corre el servidor Metro/Node.js
 */
export function getBackendHost(): string {
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }

  // 1. Obtener la IP dinámica desde Expo Constants (la misma IP por la que Expo Go cargó la app)
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3001`;
    }
  }

  // 2. IP actual de la computadora en la red Wi-Fi (detectada con ipconfig)
  return 'http://10.0.5.80:3001';
}

export const DEFAULT_HOST = getBackendHost();
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
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

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
      throw new Error(
        `Tiempo de espera agotado al conectar con: ${apiUrl}\n\nVerificá que el celular esté en la misma red Wi-Fi y que el backend en el puerto 3001 esté corriendo.`
      );
    }
    throw new Error(
      `${error.message || 'Error de red'}\nDestino: ${apiUrl}\n\nVerificá que el backend esté iniciado en el puerto 3001.`
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
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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
      throw new Error(
        `Tiempo de espera agotado al conectar con: ${registerUrl}\n\nVerificá la conexión Wi-Fi y el servidor en el puerto 3001.`
      );
    }
    throw new Error(
      `${error.message || 'Error de red'}\nDestino: ${registerUrl}\n\nVerificá que el backend esté iniciado en el puerto 3001.`
    );
  }
}
