import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  address?: string;
  city?: string;
  country?: string;
}

export default function LocationScreen() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Obtener ubicación GPS actual
  const fetchLocation = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('El permiso para acceder a la ubicación fue denegado.');
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      let addressStr = 'No disponible';
      let cityStr = '';
      let countryStr = '';

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (reverseGeocode.length > 0) {
          const item = reverseGeocode[0];
          cityStr = item.city || item.subregion || item.region || '';
          countryStr = item.country || '';
          addressStr = `${item.street || ''} ${item.streetNumber || ''}`.trim() || item.name || '';
        }
      } catch (geoErr) {
        console.warn('Geocodificación inversa no disponible:', geoErr);
      }

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        altitude: loc.coords.altitude,
        accuracy: loc.coords.accuracy,
        speed: loc.coords.speed ? Math.round(loc.coords.speed * 3.6) : 0, // m/s a km/h
        heading: loc.coords.heading,
        address: addressStr,
        city: cityStr,
        country: countryStr,
      });
    } catch (error: any) {
      setErrorMsg(error.message || 'Error al obtener la ubicación GPS.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const openInMaps = () => {
    if (!location) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el mapa.');
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Tarjeta de Encabezado */}
      <View style={styles.headerCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="location" size={32} color="#0284c7" />
        </View>
        <Text style={styles.headerTitle}>Geolocalización & GPS</Text>
        <Text style={styles.headerSubtitle}>
          Lectura de satélites GPS en tiempo real y geocodificación inversa de dirección física.
        </Text>
      </View>

      {/* Estado o Mensaje de Error */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color="#dc2626" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Tarjeta de Coordenadas Principales */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="navigate-circle-outline" size={20} color="#0284c7" />
          <Text style={styles.cardTitle}>Coordenadas Geográficas</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>Conectando con satélites GPS...</Text>
          </View>
        ) : location ? (
          <View style={styles.coordsGrid}>
            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>Latitud</Text>
              <Text style={styles.coordValue}>{location.latitude.toFixed(6)}°</Text>
            </View>

            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>Longitud</Text>
              <Text style={styles.coordValue}>{location.longitude.toFixed(6)}°</Text>
            </View>

            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>Altitud</Text>
              <Text style={styles.coordValue}>
                {location.altitude ? `${Math.round(location.altitude)} m` : 'N/D'}
              </Text>
            </View>

            <View style={styles.coordBox}>
              <Text style={styles.coordLabel}>Precisión</Text>
              <Text style={styles.coordValue}>
                {location.accuracy ? `±${Math.round(location.accuracy)} m` : 'N/D'}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataText}>Presioná actualizar para obtener datos de GPS.</Text>
        )}
      </View>

      {/* Tarjeta de Dirección Geocodificada */}
      {location && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="map-outline" size={20} color="#0284c7" />
            <Text style={styles.cardTitle}>Dirección Aproximada (Reverse Geocoding)</Text>
          </View>

          <View style={styles.addressList}>
            <View style={styles.addressRow}>
              <Ionicons name="home-outline" size={18} color="#64748b" />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>Calle y Altura:</Text>
                <Text style={styles.addressValue}>{location.address || 'Calle no identificada'}</Text>
              </View>
            </View>

            <View style={styles.addressRow}>
              <Ionicons name="business-outline" size={18} color="#64748b" />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>Ciudad / Región:</Text>
                <Text style={styles.addressValue}>{location.city || 'Desconocida'}</Text>
              </View>
            </View>

            <View style={styles.addressRow}>
              <Ionicons name="globe-outline" size={18} color="#64748b" />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>País:</Text>
                <Text style={styles.addressValue}>{location.country || 'Desconocido'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Botones de Acción */}
      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          disabled={loading}
          onPress={fetchLocation}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.primaryButtonText}>
            {loading ? 'Actualizando...' : 'Actualizar Coordenadas GPS'}
          </Text>
        </TouchableOpacity>

        {location && (
          <TouchableOpacity style={styles.secondaryButton} onPress={openInMaps} activeOpacity={0.8}>
            <Ionicons name="open-outline" size={18} color="#0284c7" />
            <Text style={styles.secondaryButtonText}>Abrir en Google Maps</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
  },
  coordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  coordBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  coordLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  coordValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  noDataText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 14,
  },
  addressList: {
    gap: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  addressLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  actionsColumn: {
    gap: 10,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#7dd3fc',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#0284c7',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '700',
  },
});
