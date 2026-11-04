import { Platform, Linking } from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import * as LocalAuthentication from 'expo-local-authentication';

// Coordenadas reales de la Sede Central Playa Grande (Mar del Plata)
export const PLAYA_GRANDE_COORDS = {
  latitude: -38.0315,
  longitude: -57.5332,
  name: 'Sede Central Playa Grande',
  address: 'Paseo Victoria Ocampo s/n, Escollera Norte, Mar del Plata, Argentina',
};

/**
 * Calcula la distancia real en metros entre dos coordenadas geográficas (Haversine Formula)
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

export interface RealGpsReading {
  latitude: number;
  longitude: number;
  distanceToPlayaGrande: number;
  isNearBeach: boolean;
  accuracy?: number;
}

export const sensorService = {
  /**
   * Indica si la app corre en PC / Web (donde no aplican sensores físicos móviles de GPS/Huella)
   */
  isDesktopOrWeb(): boolean {
    return Platform.OS === 'web';
  },

  /**
   * 1. GPS & Geolocalización Nativa Real (expo-location en APK / Expo Go)
   * Sin coordenadas simuladas ni trucos.
   */
  async getCurrentLocation(): Promise<RealGpsReading> {
    if (Platform.OS === 'web') {
      throw new Error('Sensor de ubicación nativo reservado para dispositivos móviles');
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permiso de ubicación denegado en el dispositivo');
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
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
  },

  /**
   * Suscripción en tiempo real al GPS del teléfono (expo-location watchPositionAsync)
   */
  async watchLocation(
    onUpdate: (reading: RealGpsReading) => void,
    onError?: (message: string) => void
  ): Promise<Location.LocationSubscription | null> {
    if (Platform.OS === 'web') return null;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        onError?.('Permiso de GPS no otorgado. Habilitalo en Ajustes para medir distancia.');
        return null;
      }

      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 5,
        },
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const distance = calculateHaversineDistance(
            latitude,
            longitude,
            PLAYA_GRANDE_COORDS.latitude,
            PLAYA_GRANDE_COORDS.longitude
          );
          onUpdate({
            latitude,
            longitude,
            distanceToPlayaGrande: distance,
            isNearBeach: distance <= 1500,
            accuracy: accuracy ?? undefined,
          });
        }
      );
      return sub;
    } catch (err: any) {
      onError?.(err?.message || 'No se pudo leer el sensor GPS del dispositivo.');
      return null;
    }
  },

  /**
   * 2. Cámara Nativa (expo-camera)
   */
  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((track) => track.stop());
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }

    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  /**
   * 3. Biometría Nativa Real (expo-local-authentication en móvil)
   */
  async hasBiometricHardware(): Promise<{ available: boolean; label: string }> {
    if (Platform.OS === 'web') {
      return { available: false, label: 'No disponible en PC' };
    }
    try {
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const isEnr = await LocalAuthentication.isEnrolledAsync();
      if (!hasHw) return { available: false, label: 'Dispositivo sin lector biométrico' };
      if (!isEnr) return { available: false, label: 'Sin huella/rostro registrado en el teléfono' };

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isFace = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      return {
        available: true,
        label: isFace ? 'Face ID / Reconocimiento Facial Activo' : 'Lector de Huella Digital Activo',
      };
    } catch {
      return { available: false, label: 'Sensor biométrico no detectado' };
    }
  },

  async authenticateBiometrics(prompt = 'Validá tu identidad con huella digital'): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }
    try {
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const isEnr = await LocalAuthentication.isEnrolledAsync();
      if (!hasHw || !isEnr) {
        return false;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: prompt,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  },

  /**
   * 4. Abrir indicaciones de cómo llegar a la Sede Playa Grande en Google Maps
   */
  openGoogleMapsDirections(userLat?: number, userLon?: number) {
    const dest = `${PLAYA_GRANDE_COORDS.latitude},${PLAYA_GRANDE_COORDS.longitude}`;
    let url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
    if (typeof userLat === 'number' && typeof userLon === 'number') {
      url += `&origin=${userLat},${userLon}`;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    Linking.openURL(url).catch(() => {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  },
};
