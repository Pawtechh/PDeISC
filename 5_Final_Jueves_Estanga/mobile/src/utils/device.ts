import { Platform } from 'react-native';

/**
 * Detecta si el entorno de ejecución actual es un teléfono o dispositivo móvil
 * (tanto nativo iOS/Android como navegador móvil en Android/iPhone/Safari/Chrome o pantalla estrecha).
 */
export function isMobileDevice(): boolean {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return true;
  }

  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const mobileRegex = /android|avantgo|blackberry|iemobile|ipad|iphone|ipod|opera mini|webos|mobile/i;
    
    if (mobileRegex.test(userAgent)) {
      return true;
    }

    // Pantalla táctil típica de smartphone o viewport móvil
    if (window.innerWidth <= 850) {
      return true;
    }
  }

  return false;
}
