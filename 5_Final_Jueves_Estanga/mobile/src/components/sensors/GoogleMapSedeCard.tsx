import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Map, CheckCircle2, AlertTriangle, Radio, Navigation, MapPin } from 'lucide-react-native';
import { Card, Stack, Row, Text, Badge } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  sensorService,
  PLAYA_GRANDE_COORDS,
  RealGpsReading,
} from '../../services/sensorService';

export const GoogleMapSedeCard: React.FC = () => {
  const { theme, isDark } = useTheme();
  const isPcWeb = Platform.OS === 'web';

  const [gpsData, setGpsData] = useState<RealGpsReading | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    // En PC/Web no se ejecuta el sensor de ubicación móvil
    if (isPcWeb) return;

    let sub: { remove: () => void } | null = null;
    let mounted = true;

    const initMobileGps = async () => {
      setIsLocating(true);
      setGpsError(null);
      try {
        const initial = await sensorService.getCurrentLocation();
        if (mounted) {
          setGpsData(initial);
        }
        const watcher = await sensorService.watchLocation(
          (reading) => {
            if (mounted) {
              setGpsData(reading);
              setGpsError(null);
            }
          },
          (errMsg) => {
            if (mounted) setGpsError(errMsg);
          }
        );
        sub = watcher;
      } catch (err: any) {
        if (mounted) {
          setGpsError(err?.message || 'Habilitá el permiso de GPS en tu teléfono');
        }
      } finally {
        if (mounted) setIsLocating(false);
      }
    };

    initMobileGps();

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, [isPcWeb]);

  const handleRefreshLocation = async () => {
    if (isPcWeb) return;
    setIsLocating(true);
    setGpsError(null);
    try {
      const loc = await sensorService.getCurrentLocation();
      setGpsData(loc);
    } catch (err: any) {
      setGpsError(err?.message || 'No se pudo obtener la ubicación GPS');
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenDirections = () => {
    sensorService.openGoogleMapsDirections(gpsData?.latitude, gpsData?.longitude);
  };

  const mapEmbedUrl = `https://maps.google.com/maps?q=${PLAYA_GRANDE_COORDS.latitude},${PLAYA_GRANDE_COORDS.longitude}&hl=es&z=16&output=embed`;

  return (
    <Card
      padding="md"
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0D1420' : '#FFFFFF',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : colors.ocean[300],
        },
      ]}
    >
      <Stack spacing="sm">
        {/* Encabezado */}
        <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 8 }}>
          <Row spacing="sm" align="center">
            <View style={styles.iconCircle}>
              <Map size={16} color="#38BDF8" />
            </View>
            <View>
              <Text variant="h3" color={theme.text}>
                {isPcWeb
                  ? 'Ubicación de la Sede & Cómo Llegar'
                  : 'Mapa Google & Sensor GPS en Vivo'}
              </Text>
              <Text variant="caption" color={theme.subtext}>
                {PLAYA_GRANDE_COORDS.address}
              </Text>
            </View>
          </Row>

          {isPcWeb ? (
            <Badge label="PLAYA GRANDE • MDP" variant="ocean" />
          ) : gpsData ? (
            <Badge
              label={
                gpsData.isNearBeach
                  ? 'EN ZONA DE ENTREGA'
                  : `${(gpsData.distanceToPlayaGrande / 1000).toFixed(1)} KM DE SEDE`
              }
              variant={gpsData.isNearBeach ? 'success' : 'warning'}
            />
          ) : (
            <Badge label="SENSOR GPS MÓVIL" variant="ocean" />
          )}
        </Row>

        {/* SÓLO EN MÓVIL (Expo Go / APK): Sensor de Ubicación GPS en Tiempo Real */}
        {!isPcWeb && (
          <View
            style={[
              styles.distanceBanner,
              {
                backgroundColor: isDark ? '#111A2B' : '#F0F9FF',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : colors.ocean[400],
              },
            ]}
          >
            <Row justify="space-between" align="center">
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                  DISTANCIA GPS REAL DESDE TU TELÉFONO:
                </Text>
                {gpsData ? (
                  <>
                    <Text
                      variant="display"
                      color={isDark ? '#38BDF8' : colors.ocean[700]}
                      style={styles.distanceValue}
                    >
                      {gpsData.distanceToPlayaGrande < 1000
                        ? `${gpsData.distanceToPlayaGrande} metros`
                        : `${(gpsData.distanceToPlayaGrande / 1000).toFixed(2)} km`}
                    </Text>
                    <Row spacing="xs" align="center">
                      {gpsData.isNearBeach ? (
                        <CheckCircle2 size={13} color="#34D399" />
                      ) : (
                        <AlertTriangle size={13} color="#FBBF24" />
                      )}
                      <Text variant="caption" color={theme.subtext}>
                        {gpsData.isNearBeach
                          ? 'Dentro del perímetro habilitado para retiros y devoluciones en mostrador.'
                          : 'Fuera del radio inmediato de la sede (1.5 km).'}
                      </Text>
                    </Row>
                  </>
                ) : (
                  <Text variant="body" color={theme.text} style={{ marginTop: 4 }}>
                    {isLocating
                      ? 'Leyendo coordenadas del sensor GPS de tu dispositivo...'
                      : gpsError || 'Tocá "Actualizar GPS" para medir la distancia desde tu ubicación actual.'}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleRefreshLocation}
                disabled={isLocating}
                style={[
                  styles.refreshBtn,
                  { backgroundColor: isDark ? '#F59E0B' : colors.ocean[600] },
                ]}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={isDark ? '#0B0F17' : '#FFFFFF'} />
                ) : (
                  <Row spacing="xs" align="center">
                    <Radio size={13} color={isDark ? '#0B0F17' : '#FFFFFF'} />
                    <Text
                      variant="caption"
                      color={isDark ? '#0B0F17' : '#FFFFFF'}
                      style={{ fontWeight: '700' }}
                    >
                      Actualizar GPS
                    </Text>
                  </Row>
                )}
              </TouchableOpacity>
            </Row>
          </View>
        )}

        {/* Mapa Interactivo de Google Maps */}
        <View style={styles.mapContainer}>
          {isPcWeb ? (
            <iframe
              title="Google Maps Sede Playa Grande"
              src={mapEmbedUrl}
              width="100%"
              height="240"
              style={{
                border: 0,
                borderRadius: '10px',
                filter: isDark ? 'invert(90%) hue-rotate(180deg) contrast(95%)' : 'none',
              }}
              allowFullScreen={false}
              loading="lazy"
            />
          ) : (
            <View style={[styles.nativeMapPlaceholder, { backgroundColor: isDark ? '#111826' : '#F1F5F9' }]}>
              <MapPin size={28} color="#38BDF8" />
              <Text variant="body" color={theme.text} style={{ fontWeight: '700', marginTop: 4 }}>
                {PLAYA_GRANDE_COORDS.name}
              </Text>
              <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center' }}>
                {PLAYA_GRANDE_COORDS.address}
              </Text>
              {gpsData && (
                <Text variant="caption" color="#38BDF8" style={{ marginTop: 6, fontWeight: '700' }}>
                  Tu GPS actual: {gpsData.latitude.toFixed(5)}, {gpsData.longitude.toFixed(5)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Pie con dirección/coordenadas y botón prominente "Cómo Llegar con Google Maps" */}
        <Row justify="space-between" align="center" style={styles.footerRow}>
          <Row spacing="xs" align="center" style={{ flex: 1, paddingRight: 8 }}>
            <MapPin size={13} color={theme.subtext} />
            <Text variant="caption" color={theme.subtext} style={styles.coordText}>
              {isPcWeb
                ? `Sede Central: ${PLAYA_GRANDE_COORDS.latitude}, ${PLAYA_GRANDE_COORDS.longitude}`
                : gpsData
                ? `Tu GPS: ${gpsData.latitude.toFixed(4)}, ${gpsData.longitude.toFixed(4)}`
                : 'GPS del teléfono listo para ruta'}
            </Text>
          </Row>

          <TouchableOpacity
            onPress={handleOpenDirections}
            style={[
              styles.directionsBtn,
              {
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : colors.ocean[600],
                borderColor: isDark ? '#38BDF8' : colors.ocean[600],
              },
            ]}
            testID="btn-google-maps-directions"
          >
            <Row spacing="xs" align="center">
              <Navigation size={14} color={isDark ? '#38BDF8' : '#FFFFFF'} />
              <Text
                variant="caption"
                color={isDark ? '#38BDF8' : '#FFFFFF'}
                style={{ fontWeight: '700' }}
              >
                Cómo Llegar con Google Maps
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
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
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
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  footerRow: {
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  coordText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  directionsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
});
