import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Card, Stack, Row, Text, Badge } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { sensorService, PLAYA_GRANDE_COORDS } from '../../services/sensorService';

export const GoogleMapSedeCard: React.FC = () => {
  const { theme, isDark } = useTheme();

  const [gpsData, setGpsData] = useState<{
    latitude: number;
    longitude: number;
    distanceToPlayaGrande: number;
    isNearBeach: boolean;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    handleRefreshLocation();
  }, []);

  const handleRefreshLocation = async () => {
    setIsLocating(true);
    try {
      const loc = await sensorService.getCurrentLocation();
      setGpsData(loc);
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenDirections = () => {
    sensorService.openGoogleMapsDirections(gpsData?.latitude, gpsData?.longitude);
  };

  // URL del iframe interactivo de Google Maps enfocado en la Sede Playa Grande
  const mapEmbedUrl = `https://maps.google.com/maps?q=${PLAYA_GRANDE_COORDS.latitude},${PLAYA_GRANDE_COORDS.longitude}&hl=es&z=16&output=embed`;

  const distanceMts = gpsData?.distanceToPlayaGrande ?? 50;
  const isClose = distanceMts <= 1500;

  return (
    <Card
      padding="md"
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0D1420' : '#FFFFFF',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : colors.ocean[300],
        },
      ]}
    >
      <Stack spacing="sm">
        {/* Encabezado */}
        <Row justify="space-between" align="center">
          <Row spacing="xs" align="center">
            <Text style={{ fontSize: 22 }}>🗺️</Text>
            <View>
              <Text variant="h3" color={theme.text}>
                Mapa Google & Sensor de Proximidad
              </Text>
              <Text variant="caption" color={theme.subtext}>
                {PLAYA_GRANDE_COORDS.name} • Mar del Plata
              </Text>
            </View>
          </Row>
          <Badge
            label={isClose ? 'EN ZONA DE ENTREGA' : `${(distanceMts / 1000).toFixed(1)} KM DE SEDE`}
            variant={isClose ? 'success' : 'warning'}
          />
        </Row>

        {/* Indicador Central de Distancia Prominente */}
        <View
          style={[
            styles.distanceBanner,
            {
              backgroundColor: isDark ? '#142033' : '#F0F9FF',
              borderColor: isDark ? theme.champagne : colors.ocean[400],
            },
          ]}
        >
          <Row justify="space-between" align="center">
            <View style={{ flex: 1 }}>
              <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                DISTANCIA EN TIEMPO REAL:
              </Text>
              <Text
                variant="display"
                color={isDark ? theme.primary : colors.ocean[700]}
                style={styles.distanceValue}
              >
                {distanceMts < 1000 ? `${distanceMts} metros` : `${(distanceMts / 1000).toFixed(2)} km`}
              </Text>
              <Text variant="caption" color={theme.subtext}>
                {isClose
                  ? '✅ Estás dentro del perímetro habilitado para retiros y devoluciones en mostrador.'
                  : '⚠️ Te encontrás fuera del radio de entrega inmediata.'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleRefreshLocation}
              disabled={isLocating}
              style={[
                styles.refreshBtn,
                { backgroundColor: isDark ? theme.champagne : colors.ocean[600] },
              ]}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={isDark ? '#090C10' : '#FFFFFF'} />
              ) : (
                <Row spacing="xs" align="center">
                  <Text style={{ fontSize: 14 }}>📡</Text>
                  <Text
                    variant="caption"
                    color={isDark ? '#090C10' : '#FFFFFF'}
                    style={{ fontWeight: '700' }}
                  >
                    Actualizar GPS
                  </Text>
                </Row>
              )}
            </TouchableOpacity>
          </Row>
        </View>

        {/* Mapa Interactivo de Google Maps */}
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              title="Google Maps Sede Playa Grande"
              src={mapEmbedUrl}
              width="100%"
              height="220"
              style={{
                border: 0,
                borderRadius: '10px',
                filter: isDark ? 'invert(90%) hue-rotate(180deg) contrast(95%)' : 'none',
              }}
              allowFullScreen={false}
              loading="lazy"
            />
          ) : (
            <View style={styles.nativeMapPlaceholder}>
              <Text style={{ fontSize: 32 }}>🗺️</Text>
              <Text variant="body" color={theme.text} style={{ fontWeight: '700', marginTop: 4 }}>
                Sede Central Playa Grande
              </Text>
              <Text variant="caption" color={theme.subtext}>
                Lat: {PLAYA_GRANDE_COORDS.latitude}, Lon: {PLAYA_GRANDE_COORDS.longitude}
              </Text>
            </View>
          )}
        </View>

        {/* Coordenadas & Botón para abrir en la app de Google Maps */}
        <Row justify="space-between" align="center" style={styles.footerRow}>
          <Text variant="caption" color={theme.subtext} style={styles.coordText}>
            Tu GPS: {gpsData ? `${gpsData.latitude.toFixed(4)}, ${gpsData.longitude.toFixed(4)}` : 'Obteniendo...'}
          </Text>

          <TouchableOpacity onPress={handleOpenDirections} style={styles.directionsBtn}>
            <Row spacing="xs" align="center">
              <Text style={{ fontSize: 14 }}>🧭</Text>
              <Text variant="caption" color={isDark ? theme.primary : colors.ocean[600]} style={{ fontWeight: '700' }}>
                Cómo Llegar en Google Maps
              </Text>
            </Row>
          </TouchableOpacity>
        </Row>
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: radii.lg,
  },
  distanceBanner: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  distanceValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  refreshBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  mapContainer: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  nativeMapPlaceholder: {
    height: 180,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  footerRow: {
    marginTop: 2,
  },
  coordText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  directionsBtn: {
    paddingVertical: spacing.xs,
  },
});
