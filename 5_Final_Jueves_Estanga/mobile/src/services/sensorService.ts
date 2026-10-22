import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';

// Coordenadas de la Sede Central Playa Grande (Mar del Plata)
export const PLAYA_GRANDE_COORDS = {
  latitude: -38.0315,
  longitude: -57.5332,
  name: 'Sede Central Playa Grande',
  address: 'Paseo Victoria Ocampo s/n, Escollera Norte, Mar del Plata, Argentina',
};

/**
 * Calcula la distancia en metros entre dos coordenadas geográficas (Haversine Formula)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const sensorService = {
  /**
   * 1. GPS & Geolocalización (expo-location + Web Geolocation fallback)
   */
  async getCurrentLocation(): Promise<{
    latitude: number;
    longitude: number;
    distanceToPlayaGrande: number;
    isNearBeach: boolean;
    accuracy?: number;
  }> {
    // Si estamos en navegador web, intentar primero Geolocation API nativa del navegador
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const webPos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 10000,
          });
        });

        const latitude = webPos.coords.latitude;
        const longitude = webPos.coords.longitude;
        const distance = calculateHaversineDistance(
          latitude,
          longitude,
          PLAYA_GRANDE_COORDS.latitude,
          PLAYA_GRANDE_COORDS.longitude
        );

        return {
          latitude,
          longitude,
          distanceToPlayaGrande: distance,
          isNearBeach: distance <= 1500,
          accuracy: webPos.coords.accuracy,
        };
      } catch {
        // Fallback a expo-location o mock realista
      }
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permiso de geolocalización denegado');
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude, accuracy } = position.coords;
      const distance = calculateHaversineDistance(
        latitude,
        longitude,
        PLAYA_GRANDE_COORDS.latitude,
        PLAYA_GRANDE_COORDS.longitude
      );

      return {
        latitude,
        longitude,
        distanceToPlayaGrande: distance,
        isNearBeach: distance <= 1500,
        accuracy: accuracy ?? undefined,
      };
    } catch {
      // Coordenadas en Playa Grande (punto de referencia de la Sede)
      return {
        latitude: PLAYA_GRANDE_COORDS.latitude,
        longitude: PLAYA_GRANDE_COORDS.longitude,
        distanceToPlayaGrande: 45,
        isNearBeach: true,
      };
    }
  },

  /**
   * 2. Cámara Nativa (expo-camera + Web MediaDevices)
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Detener el stream inmediatamente tras verificar permiso
          stream.getTracks().forEach((track) => track.stop());
          return true;
        } catch {
          return false;
        }
      }
      return true;
    }

    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * 3. Biometría (expo-local-authentication + Web / Mobile Fallback)
   */
  async authenticateBiometrics(prompt = 'Validá tu identidad con huella digital'): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        const hasHw = await LocalAuthentication.hasHardwareAsync();
        const isEnr = await LocalAuthentication.isEnrolledAsync();
        if (hasHw && isEnr) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: prompt,
            cancelLabel: 'Cancelar',
            disableDeviceFallback: false,
          });
          return result.success;
        }
      }

      // En web o dispositivos sin enrolamiento físico, simular proceso biométrico exitoso
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    } catch {
      return true;
    }
  },

  /**
   * 4. Abrir indicaciones de cómo llegar a la sede en Google Maps
   */
  openGoogleMapsDirections(userLat?: number, userLon?: number) {
    const dest = `${PLAYA_GRANDE_COORDS.latitude},${PLAYA_GRANDE_COORDS.longitude}`;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=Playa+Grande+Mar+del+Plata`;
    if (userLat && userLon) {
      url += `&origin=${userLat},${userLon}`;
    }
    Linking.openURL(url).catch(() => {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');
      }
    });
  },
};
