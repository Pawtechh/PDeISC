import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import {
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  Navigation,
  Waves,
  ArrowLeft,
  Store,
} from 'lucide-react-native';
import { Screen, Stack, Row, Text, Card, Badge, Button, EmptyState } from '../../components/ui';
import { radii, spacing } from '../../theme';
import { useTheme, getContrastInk } from '../../theme/ThemeContext';
import { useGetAgencyProfileQuery } from '../../api/agenciesApi';
import { useGetMarineForecastQuery } from '../../api/weatherApi';
import { Board } from '../../api/boardsApi';
import { resolveAssetUrl } from '../../api/baseQueryWithAuth';
import { BoardCard } from '../../components/boards/BoardCard';
import { useResponsive } from '../../hooks/useResponsive';
import { sensorService } from '../../services/sensorService';

export interface AgencyProfileScreenProps {
  agencyIdOrSlug: string;
  onClose?: () => void;
  onSelectBoard?: (board: Board) => void;
}

export const AgencyProfileScreen: React.FC<AgencyProfileScreenProps> = ({
  agencyIdOrSlug,
  onClose,
  onSelectBoard,
}) => {
  const { theme, isDark } = useTheme();
  const { numColumns } = useResponsive();
  const { width } = useWindowDimensions();

  const { data, isLoading, isError, refetch } = useGetAgencyProfileQuery(agencyIdOrSlug, {
    skip: !agencyIdOrSlug,
  });
  const agency = data?.data;

  const { data: marineRes } = useGetMarineForecastQuery(
    agency?.zoneId ? { zoneId: agency.zoneId } : undefined,
    { skip: !agency?.zoneId }
  );
  const marine = marineRes?.data;

  if (isLoading && !agency) {
    return (
      <Screen>
        <Stack spacing="md" style={{ padding: spacing.xl, alignItems: 'center', marginTop: 40 }}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text variant="body" color={theme.subtext}>
            Cargando perfil de la agencia y quiver disponible...
          </Text>
        </Stack>
      </Screen>
    );
  }

  if (isError || !agency) {
    return (
      <Screen>
        <Stack spacing="md" style={{ padding: spacing.lg }}>
          {onClose && (
            <Button title="Volver al catálogo" variant="secondary" size="sm" onPress={onClose} />
          )}
          <EmptyState
            title="Agencia no encontrada"
            description="No pudimos cargar los datos de esta tienda en este momento."
            actionTitle="Reintentar"
            onAction={refetch}
          />
        </Stack>
      </Screen>
    );
  }

  const brandHex = agency.accentColor || '#0E6B74';
  const brandInk = getContrastInk(brandHex);
  const logoUri = agency.logoUrl ? resolveAssetUrl(agency.logoUrl) : '';
  const coverUri = agency.portadaUrl ? resolveAssetUrl(agency.portadaUrl) : '';

  const handleWhatsApp = () => {
    const cleanPhone = (agency.whatsapp || '').replace(/[^\d]/g, '');
    if (!cleanPhone) return;
    const msg = encodeURIComponent(
      `Hola ${agency.nombre}! Vi sus tablas publicadas en Surf Rental y quiero consultar disponibilidad.`
    );
    const url = `https://wa.me/${cleanPhone}?text=${msg}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleDirections = () => {
    sensorService.openGoogleMapsDirections(
      undefined,
      undefined,
      agency.zone?.latitud,
      agency.zone?.longitud
    );
  };

  return (
    <Screen safeBottom={false} atmosphericGradient={false} backgroundColor={theme.background} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: width >= 768 ? spacing.lg : spacing.md,
          paddingBottom: spacing['2xl'],
        }}
        showsVerticalScrollIndicator={false}
      >
        <Stack spacing="lg">
          {onClose && (
            <Row justify="space-between" align="center">
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                style={[
                  styles.backBtn,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ArrowLeft size={16} color={theme.text} />
                <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                  Volver al Catálogo
                </Text>
              </TouchableOpacity>
              {agency.zone && (
                <Badge
                  label={`${agency.zone.ciudad.toUpperCase()} • ${agency.zone.nombre.toUpperCase()}`}
                  variant="ocean"
                />
              )}
            </Row>
          )}

          {/* Storefront Header Banner */}
          <Card
            padding="xs"
            style={[
              styles.heroCard,
              {
                borderColor: theme.border,
                backgroundColor: theme.card,
                padding: 0,
              },
            ]}
          >
            <View style={[styles.coverBand, { backgroundColor: brandHex }]}>
              {coverUri ? (
                <Image
                  source={{ uri: coverUri }}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                />
              ) : null}
              <View style={[styles.coverScrim, { backgroundColor: brandHex, opacity: coverUri ? 0.55 : 0.92 }]} />
              <Row justify="space-between" align="center" style={{ zIndex: 2, flexWrap: 'wrap', gap: 8 }}>
                <View style={styles.brandTagPill}>
                  <Store size={13} color={brandInk} />
                  <Text style={{ color: brandInk, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
                    AGENCIA OFICIAL POR ZONA
                  </Text>
                </View>
                {agency.verificada && (
                  <View style={[styles.verifiedChip, { backgroundColor: 'rgba(26,31,34,0.32)' }]}>
                    <ShieldCheck size={13} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                      SEDE VERIFICADA
                    </Text>
                  </View>
                )}
              </Row>

              <Row align="center" spacing="md" style={{ marginTop: spacing.md, zIndex: 2 }}>
                <View
                  style={[
                    styles.logoCircle,
                    {
                      backgroundColor: isDark ? '#1A1F22' : '#FFFFFF',
                      borderColor: brandInk,
                    },
                  ]}
                >
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.logoImg} contentFit="cover" />
                  ) : (
                    <Text style={{ color: brandHex, fontSize: 22, fontWeight: '900' }}>
                      {agency.nombre.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: brandInk,
                      fontSize: 22,
                      fontWeight: '800',
                      lineHeight: 27,
                    }}
                  >
                    {agency.nombre}
                  </Text>
                  {agency.zone && (
                    <Text style={{ color: brandInk, opacity: 0.9, fontSize: 13, fontWeight: '600', marginTop: 2 }}>
                      {agency.zone.ciudad} — {agency.zone.nombre}
                    </Text>
                  )}
                </View>
              </Row>
            </View>

            <View style={{ padding: spacing.md }}>
              <Stack spacing="md">
                <Text variant="body" color={theme.text} style={{ lineHeight: 21 }}>
                  {agency.descripcion}
                </Text>

                <View style={styles.infoGrid}>
                  <Row spacing="xs" align="center" style={styles.infoItem}>
                    <MapPin size={14} color={isDark ? theme.primaryHover : theme.primary} />
                    <Text variant="caption" color={theme.subtext} style={{ flex: 1 }}>
                      {agency.direccion}
                    </Text>
                  </Row>
                  {agency.horario && (
                    <Row spacing="xs" align="center" style={styles.infoItem}>
                      <Clock size={14} color={isDark ? theme.primaryHover : theme.primary} />
                      <Text variant="caption" color={theme.subtext}>
                        {agency.horario}
                      </Text>
                    </Row>
                  )}
                </View>

                {marine && (
                  <View
                    style={[
                      styles.marinePill,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 8 }}>
                      <Row spacing="xs" align="center">
                        <Waves size={15} color={isDark ? theme.primaryHover : theme.primary} />
                        <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                          Estado del mar hoy en {agency.zone?.nombre}: {marine.waveHeightMeters}m • {marine.windSpeedKmh} km/h {marine.windDirectionText} • {marine.waterTemperatureCelsius}°C
                        </Text>
                      </Row>
                      <Badge
                        label={`BANDERA ${marine.flag}`}
                        variant={marine.flag === 'VERDE' ? 'success' : marine.flag === 'AMARILLA' ? 'warning' : 'danger'}
                      />
                    </Row>
                  </View>
                )}

                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  {agency.whatsapp ? (
                    <Button
                      title="Consultar por WhatsApp"
                      variant="success"
                      size="sm"
                      onPress={handleWhatsApp}
                      iconLeft={<Phone size={14} color="#FFFFFF" />}
                    />
                  ) : null}
                  <Button
                    title="Cómo llegar (Maps)"
                    variant="secondary"
                    size="sm"
                    onPress={handleDirections}
                    iconLeft={<Navigation size={14} color={theme.text} />}
                  />
                </Row>
              </Stack>
            </View>
          </Card>

          {/* Quiver de la Agencia */}
          <Stack spacing="sm">
            <Row justify="space-between" align="center">
              <Text variant="h2" color={theme.text}>
                Tablas publicadas por {agency.nombre} ({agency.boards.length})
              </Text>
              <Badge label={`${agency.rentalCount || 0} ALQUILERES`} variant="sand" />
            </Row>

            {agency.boards.length === 0 ? (
              <EmptyState
                title="Sin tablas disponibles en este momento"
                description="Esta tienda no tiene tablas libres ahora o todas se encuentran en el agua."
              />
            ) : (
              <View style={[styles.gridContainer, numColumns > 1 && styles.gridMulti]}>
                {agency.boards.map((board) => (
                  <View
                    key={board.id}
                    style={[
                      styles.gridItem,
                      numColumns === 2 && styles.gridItem2,
                      numColumns >= 3 && styles.gridItem3,
                    ]}
                  >
                    <BoardCard
                      board={board}
                      onPressDetail={() => onSelectBoard?.(board)}
                      onPressReserve={() => onSelectBoard?.(board)}
                    />
                  </View>
                ))}
              </View>
            )}
          </Stack>
        </Stack>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  heroCard: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: radii.xl,
  },
  coverBand: {
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  coverScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  brandTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  infoGrid: {
    gap: 6,
  },
  infoItem: {
    flexWrap: 'wrap',
  },
  marinePill: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  gridContainer: {
    gap: spacing.md,
  },
  gridMulti: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '100%',
  },
  gridItem2: {
    width: '48.8%',
  },
  gridItem3: {
    width: '32%',
  },
});
