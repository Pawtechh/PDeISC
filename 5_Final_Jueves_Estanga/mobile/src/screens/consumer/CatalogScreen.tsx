import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Search, LayoutGrid, Award, Shield, Clock, Waves } from 'lucide-react-native';
import { safeHaptic } from '../../utils/haptics';
import { Screen, Stack, Row, Text, Input, Badge, Button, EmptyState, GlassCard, Card } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useGetBoardsQuery, Board } from '../../api/boardsApi';
import { resolveAssetUrl } from '../../api/baseQueryWithAuth';
import { BoardCard } from '../../components/boards/BoardCard';
import { Board3DCarousel } from '../../components/boards/Board3DCarousel';
import { BoardDetailScreen } from './BoardDetailScreen';
import { useResponsive } from '../../hooks/useResponsive';
import { MarineForecastCard } from '../../components/marine/MarineForecastCard';
import { GoogleMapSedeCard } from '../../components/sensors';
import { Pressable as RNPressable, ScrollView as RNScrollView } from 'react-native';
import { MapPin as ZonePinIcon, Store as AgencyStoreIcon, ShieldCheck as AgencyCheckIcon } from 'lucide-react-native';
import { useGetZonesQuery, useGetAgenciesQuery } from '../../api/agenciesApi';
import { AgencyProfileScreen } from './AgencyProfileScreen';
import { getContrastInk } from '../../theme/ThemeContext';
import { useAppSelector, useAppDispatch } from '../../store';
import { setGuestMode } from '../../store/slices/authSlice';

const FILTER_TYPES = ['Todos', 'Longboard', 'Fish', 'Funboard', 'Shortboard', 'Bodyboard', 'SUP'];

export const CatalogScreen: React.FC<any> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [selectedAgencySlug, setSelectedAgencySlug] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const { numColumns } = useResponsive();

  const triggerHaptic = useCallback(() => {
    safeHaptic.impact();
  }, []);

  const { data: zonesData } = useGetZonesQuery();
  const { data: agenciesData } = useGetAgenciesQuery(
    selectedZoneId ? { zoneId: selectedZoneId } : undefined
  );
  const zones = zonesData?.data ?? [];
  const agencies = agenciesData?.data ?? [];
  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) ?? null,
    [zones, selectedZoneId]
  );

  const boardsQueryArgs = useMemo(() => {
    const params: { tipo?: string; zoneId?: string } = {};
    if (selectedType !== 'Todos') params.tipo = selectedType;
    if (selectedZoneId) params.zoneId = selectedZoneId;
    return Object.keys(params).length > 0 ? params : undefined;
  }, [selectedType, selectedZoneId]);

  const { data, isLoading, isFetching, isError, refetch } = useGetBoardsQuery(
    boardsQueryArgs,
    { pollingInterval: 6000, refetchOnMountOrArgChange: true }
  );

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Tablas destacadas para el carrusel superior:
  // Se seleccionan las tablas disponibles con mejor puntuación y trayectoria
  const featuredBoards = useMemo(() => {
    const list = data?.data || [];
    return [...list]
      .filter((b) => b.estado === 'DISPONIBLE')
      .sort((a, b) => {
        const scoreA = (a.calificacionPromedio ?? 4.5) * 10 + (a.totalReviews ?? 0);
        const scoreB = (b.calificacionPromedio ?? 4.5) * 10 + (b.totalReviews ?? 0);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [data]);

  // Colección completa / filtrada para la cuadrícula inferior
  const boardsList = useMemo(() => {
    const list = data?.data || [];

    return list.filter((item) => {
      const matchType =
        selectedType === 'Todos' || item.tipoTabla.toLowerCase() === selectedType.toLowerCase();
      const matchSearch =
        search.trim() === '' ||
        item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        item.marca.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [data, search, selectedType]);

  const handleFilterSelect = (type: string) => {
    triggerHaptic();
    setSelectedType(type);
  };

  return (
    <Screen
      atmosphericGradient={true}
      scrollable
      showScrollToTop={true}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          tintColor={theme.primary}
          colors={[theme.primary, theme.champagne]}
        />
      }
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Boutique Coastal Hero Banner */}
        <View
          {...(Platform.OS === 'web' ? ({ dataSet: { heroBanner: 'true' } } as any) : {})}
          style={styles.heroBanner}
        >
          <Image
            source={{ uri: resolveAssetUrl('/images/hero-quiver.jpg') }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={[
              'rgba(26, 25, 23, 0.20)',
              'rgba(31, 29, 27, 0.72)',
              'rgba(26, 25, 23, 0.92)',
            ]}
            locations={[0, 0.62, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroBannerContent}>
            <Row justify="space-between" align="center" style={styles.heroHeaderRow}>
              <View style={styles.brandLocationPill}>
                <Text style={styles.brandLocationText}>
                  {selectedZone
                    ? `COLECCIÓN EXCLUSIVA • ${selectedZone.nombre.toUpperCase()}, ${selectedZone.ciudad.toUpperCase()}`
                    : 'RED COSTERA MULTI-ZONA • ARGENTINA'}
                </Text>
              </View>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { stockPulse: 'true' } } as any) : {})}
                style={styles.stockBadge}
              >
                <Text style={styles.stockBadgeText}>{data?.data?.length || 0} TABLAS DISPONIBLES</Text>
              </View>
            </Row>

            <Text variant="display" style={styles.catalogHeroTitle}>
              FLOTA DE AUTOR & ALTO RENDIMIENTO
            </Text>
            <Text style={styles.catalogHeroSubtitle}>
              {selectedZone
                ? `Tablas curadas en ${selectedZone.ciudad}. Reserva instantánea, encerado y entrega en ${selectedZone.nombre}.`
                : 'Explora tablas en múltiples ciudades costeras. Reserva instantánea con agencias verificadas.'}
            </Text>

            <View style={styles.kpiRow}>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { heroChip: 'true' } } as any) : {})}
                style={styles.kpiChip}
              >
                <Award size={13} color={theme.champagne} />
                <Text style={styles.kpiChipText}>
                  {selectedZone ? selectedZone.ciudad : `${zones.length || 5} Zonas Costeras`}
                </Text>
              </View>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { heroChip: 'true' } } as any) : {})}
                style={styles.kpiChip}
              >
                <Clock size={13} color={colors.teal[400]} />
                <Text style={styles.kpiChipText}>Retiro Express 5 min</Text>
              </View>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { heroChip: 'true' } } as any) : {})}
                style={styles.kpiChip}
              >
                <Star size={13} color={theme.champagne} fill={theme.champagne} />
                <Text style={styles.kpiChipText}>4.9/5 Calificación</Text>
              </View>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { heroChip: 'true' } } as any) : {})}
                style={styles.kpiChip}
              >
                <Shield size={13} color="#D5CFC5" />
                <Text style={styles.kpiChipText}>Cobertura Total 100%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live Marine Weather Report (Dinámico por Zona / Spot) */}
        <MarineForecastCard
          zoneId={selectedZoneId || undefined}
          zoneLabel={selectedZone ? `${selectedZone.ciudad} • ${selectedZone.nombre}` : 'Playa Grande • Costa Atlántica'}
        />

        {/* Zone / City Switcher */}
        {zones.length > 0 && (
          <Stack spacing="xs" style={styles.zoneSection}>
            <Row justify="space-between" align="center" style={styles.sectionHeaderRow}>
              <Row spacing="xs" align="center">
                <ZonePinIcon size={15} color={theme.primary} />
                <Text variant="label" color={theme.primary} style={styles.sectionTitle}>
                  EXPLORAR POR ZONA / CIUDAD
                </Text>
              </Row>
              <Text variant="caption" color={theme.subtext}>
                {selectedZone ? `${selectedZone.ciudad} (${selectedZone.boardCount} tablas)` : `${zones.length} zonas activas`}
              </Text>
            </Row>
            {numColumns >= 2 ? (
              <View style={[styles.zoneScrollContent, styles.filterRow]}>
                <RNPressable
                  onPress={() => setSelectedZoneId('')}
                  style={[
                    styles.zonePill,
                    {
                      backgroundColor: selectedZoneId === '' ? theme.primary : theme.surfaceElevated,
                      borderColor: selectedZoneId === '' ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    color={selectedZoneId === '' ? getContrastInk(theme.primary) : theme.text}
                    style={{ fontWeight: selectedZoneId === '' ? '800' : '600' }}
                  >
                    Todas las zonas
                  </Text>
                </RNPressable>
                {zones.map((z) => {
                  const active = selectedZoneId === z.id;
                  return (
                    <RNPressable
                      key={z.id}
                      onPress={() => setSelectedZoneId(active ? '' : z.id)}
                      style={[
                        styles.zonePill,
                        {
                          backgroundColor: active ? theme.primary : theme.surfaceElevated,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={active ? getContrastInk(theme.primary) : theme.text}
                        style={{ fontWeight: active ? '800' : '600' }}
                      >
                        {z.ciudad} · {z.nombre} ({z.boardCount})
                      </Text>
                    </RNPressable>
                  );
                })}
              </View>
            ) : (
              <RNScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.zoneScrollContent}
              >
                <RNPressable
                  onPress={() => setSelectedZoneId('')}
                  style={[
                    styles.zonePill,
                    {
                      backgroundColor: selectedZoneId === '' ? theme.primary : theme.surfaceElevated,
                      borderColor: selectedZoneId === '' ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    color={selectedZoneId === '' ? getContrastInk(theme.primary) : theme.text}
                    style={{ fontWeight: selectedZoneId === '' ? '800' : '600' }}
                  >
                    Todas las zonas
                  </Text>
                </RNPressable>
                {zones.map((z) => {
                  const active = selectedZoneId === z.id;
                  return (
                    <RNPressable
                      key={z.id}
                      onPress={() => setSelectedZoneId(active ? '' : z.id)}
                      style={[
                        styles.zonePill,
                        {
                          backgroundColor: active ? theme.primary : theme.surfaceElevated,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={active ? getContrastInk(theme.primary) : theme.text}
                        style={{ fontWeight: active ? '800' : '600' }}
                      >
                        {z.ciudad} · {z.nombre} ({z.boardCount})
                      </Text>
                    </RNPressable>
                  );
                })}
              </RNScrollView>
            )}
          </Stack>
        )}

        {/* Agencies Directory in Selected Zone */}
        {agencies.length > 0 && (
          <Stack spacing="xs" style={styles.zoneSection}>
            <Row justify="space-between" align="center" style={styles.sectionHeaderRow}>
              <Row spacing="xs" align="center">
                <AgencyStoreIcon size={15} color={theme.primary} />
                <Text variant="label" color={theme.primary} style={styles.sectionTitle}>
                  AGENCIAS EN {selectedZone ? selectedZone.ciudad.toUpperCase() : 'LA COSTA'}
                </Text>
              </Row>
              <Text variant="caption" color={theme.subtext}>
                {agencies.length} {agencies.length === 1 ? 'tienda' : 'tiendas'}
              </Text>
            </Row>
            <RNScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.agenciesScrollContent}
            >
              {agencies.map((ag) => {
                const accent = ag.accentColor || theme.primary;
                const ink = getContrastInk(accent);
                return (
                  <RNPressable
                    key={ag.id}
                    onPress={() => setSelectedAgencySlug(ag.slug || ag.id)}
                    style={[
                      styles.agencyCard,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={[styles.agencyAccentStripe, { backgroundColor: accent }]} />
                    <Stack spacing="xs" style={{ padding: spacing.sm + 2 }}>
                      <Row justify="space-between" align="center" spacing="xs">
                        <Text variant="label" color={theme.text} numberOfLines={1} style={{ flex: 1, fontWeight: '800' }}>
                          {ag.nombre}
                        </Text>
                        {ag.verificada && (
                          <View style={[styles.agencyVerifiedDot, { backgroundColor: accent }]}>
                            <AgencyCheckIcon size={11} color={ink} />
                          </View>
                        )}
                      </Row>
                      <Text variant="caption" color={theme.subtext} numberOfLines={1}>
                        {ag.zone ? `${ag.zone.ciudad} · ${ag.zone.nombre}` : ag.direccion}
                      </Text>
                      <Row justify="space-between" align="center" style={{ marginTop: 2 }}>
                        <Text variant="caption" color={theme.primary} style={{ fontWeight: '700' }}>
                          {ag.boardCount ?? 0} {(ag.boardCount ?? 0) === 1 ? 'tabla' : 'tablas'}
                        </Text>
                        <Text variant="caption" color={theme.primary} style={{ fontWeight: '700' }}>
                          Ver tienda →
                        </Text>
                      </Row>
                    </Stack>
                  </RNPressable>
                );
              })}
            </RNScrollView>
          </Stack>
        )}

        {/* Banner de Modo Invitado */}
        {(!isAuthenticated || isGuest) && (
          <Card
            padding="md"
            style={{
              backgroundColor: isDark ? theme.card : theme.card,
              borderColor: theme.border,
              borderWidth: 1,
            }}
          >
            <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text variant="caption" color={isDark ? theme.primaryHover : theme.primary} style={{ fontWeight: '800' }}>
                  MODO INVITADO (SOLO LECTURA)
                </Text>
                <Text variant="caption" color={theme.text}>
                  Podés explorar las tablas y perfiles de los comerciantes libremente. Para interactuar o alquilar, creá tu cuenta.
                </Text>
              </View>
              <Row spacing="xs">
                <Button
                  title="Crear Cuenta"
                  size="sm"
                  variant="primary"
                  onPress={() => dispatch(setGuestMode(false))}
                />
                <Button
                  title="Iniciar Sesión"
                  size="sm"
                  variant="secondary"
                  onPress={() => dispatch(setGuestMode(false))}
                />
              </Row>
            </Row>
          </Card>
        )}

        {/* 1. SECCIÓN SUPERIOR: CARRUSEL DE SOLO LAS DESTACADAS */}
        {featuredBoards.length > 0 && (
          <View style={styles.featuredSection}>
            <Row justify="space-between" align="center" style={styles.sectionHeaderRow}>
              <Row align="center" spacing="xs">
                <Star size={14} color={theme.champagne} fill={theme.champagne} />
                <Text
                  variant="caption"
                  style={[styles.sectionTitle, { color: theme.text }]}
                >
                  {selectedZone ? `TABLAS DESTACADAS • ${selectedZone.nombre.toUpperCase()}` : 'TABLAS DESTACADAS • RED COSTERA'}
                </Text>
              </Row>
              <Badge label="TOP RATED" variant={isDark ? 'sand' : 'sand'} />
            </Row>

            <Text
              variant="caption"
              style={[styles.sectionSubtitle, { color: theme.subtext }]}
            >
              Deslizá para explorar las tablas mejor valoradas por nuestra comunidad
            </Text>

            <Board3DCarousel
              boards={featuredBoards}
              onPressDetail={(board) => setSelectedBoard(board)}
              onPressReserve={(board) => setSelectedBoard(board)}
              onPressAgency={(slugOrId) => setSelectedAgencySlug(slugOrId)}
            />
          </View>
        )}

        {/* 2. SECCIÓN INFERIOR: CATÁLOGO COMPLETO EN CUADRÍCULA */}
        <View style={styles.gridSection}>
          <Row justify="space-between" align="center" style={styles.sectionHeaderRow}>
            <Row align="center" spacing="xs">
              <Waves size={14} color={isDark ? theme.primaryHover : theme.primary} />
              <Text
                variant="caption"
                style={[styles.sectionTitle, { color: theme.text }]}
              >
                TODAS LAS TABLAS {selectedType !== 'Todos' ? `• ${selectedType.toUpperCase()}` : ''} ({boardsList.length})
              </Text>
            </Row>
            <View
              style={[
                styles.gridBadge,
                {
                  backgroundColor: isDark ? theme.surfaceElevated : theme.cardHighlight,
                  borderColor: theme.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                },
              ]}
            >
              <LayoutGrid size={11} color={theme.subtext} />
              <Text
                style={[styles.gridBadgeText, { color: theme.subtext }]}
              >
                CUADRÍCULA
              </Text>
            </View>
          </Row>

          {/* Upgraded Luxury Search Bar */}
          <View style={styles.searchWrapper}>
            <Input
              placeholder="Buscar por tabla, shaper o modelo..."
              placeholderTextColor={theme.muted}
              value={search}
              onChangeText={setSearch}
              containerStyle={styles.searchContainer}
              style={[
                styles.searchInput,
                {
                  backgroundColor: isDark ? 'transparent' : theme.card,
                  borderColor: 'transparent',
                  color: theme.text,
                },
              ]}
              iconLeft={<Search size={15} color={theme.subtext} />}
            />
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {FILTER_TYPES.map((type) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  testID={`catalog-filter-${type}`}
                  onPress={() => handleFilterSelect(type)}
                  activeOpacity={0.8}
                  {...(Platform.OS === 'web'
                    ? ({ dataSet: { filterPill: isSelected ? 'active' : 'idle' } } as any)
                    : {})}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isDark ? 'rgba(42, 41, 38, 0.85)' : theme.card,
                      borderColor: theme.border,
                    },
                    isSelected &&
                      (isDark ? styles.filterPillSelectedDark : styles.filterPillSelectedLight),
                  ]}
                >
                  <Text
                    variant="caption"
                    style={[
                      styles.filterPillText,
                      { color: theme.subtext },
                      isSelected &&
                        (isDark ? styles.filterPillTextSelectedDark : styles.filterPillTextSelectedLight),
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Cuadrícula de Tablas */}
          {isLoading && boardsList.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text variant="body" style={styles.loadingText}>
                Cargando tablas desde la sede central...
              </Text>
            </View>
          ) : isError && boardsList.length === 0 ? (
            <EmptyState
              title="Conectando con la sede central..."
              description="El servidor o la base de datos está iniciando en este momento. Tocá Reintentar en unos segundos."
              actionTitle="Reintentar ahora"
              onAction={() => {
                triggerHaptic();
                refetch();
              }}
            />
          ) : boardsList.length === 0 ? (
            <EmptyState
              title="No se encontraron tablas"
              description="Probá seleccionando otra zona, categoría o cambiando el término de búsqueda."
              actionTitle="Ver todas"
              onAction={() => {
                triggerHaptic();
                setSelectedType('Todos');
                setSelectedZoneId('');
                setSearch('');
              }}
            />
          ) : (
            <View style={[styles.gridContainer, numColumns > 1 && styles.gridMultiColumn]}>
              {boardsList.map((board) => (
                <View
                  key={board.id}
                  style={[
                    styles.gridItem,
                    numColumns === 2 && styles.gridItemTablet,
                    numColumns === 3 && styles.gridItemDesktop,
                  ]}
                >
                  <BoardCard
                    board={board}
                    onPressDetail={() => setSelectedBoard(board)}
                    onPressReserve={() => setSelectedBoard(board)}
                    onPressAgency={(slugOrId) => setSelectedAgencySlug(slugOrId)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Ubicación de la Sede & Cómo Llegar con Google Maps (y Sensor GPS en Móvil) */}
          <GoogleMapSedeCard
            spotName={
              selectedZone
                ? `${selectedZone.nombre} — ${selectedZone.ciudad}`
                : agencies[0]?.nombre
                  ? `${agencies[0].nombre} (${agencies[0].zone?.ciudad || 'Costa Atlántica'})`
                  : undefined
            }
            address={
              agencies[0]?.direccion ||
              (selectedZone ? `${selectedZone.nombre}, ${selectedZone.ciudad}, Argentina` : undefined)
            }
            latitude={selectedZone?.latitud ?? agencies[0]?.zone?.latitud}
            longitude={selectedZone?.longitud ?? agencies[0]?.zone?.longitud}
            badgeLabel={selectedZone ? `SPOT • ${selectedZone.ciudad.toUpperCase()}` : undefined}
          />
      </Stack>

      {/* Modal with Full Surfboard Detail */}
      <Modal
        visible={Boolean(selectedBoard)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedBoard(null)}
      >
        {selectedBoard && (
          <View style={[styles.modalRoot, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
              <Button
                title="✕ Cerrar"
                variant="ghost"
                size="sm"
                onPress={() => {
                  triggerHaptic();
                  setSelectedBoard(null);
                }}
              />
            </View>
            <BoardDetailScreen
              route={{ params: { board: selectedBoard } }}
              navigation={{
                goBack: () => setSelectedBoard(null),
                navigate: (screen: string) => {
                  setSelectedBoard(null);
                  navigation?.navigate?.(screen);
                },
              }}
              onOpenAgency={(slugOrId) => {
                setSelectedBoard(null);
                setSelectedAgencySlug(slugOrId);
              }}
            />
          </View>
        )}
      </Modal>

      {/* Modal with Public Agency Storefront */}
      <Modal
        visible={Boolean(selectedAgencySlug)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAgencySlug(null)}
      >
        {selectedAgencySlug && (
          <View style={[styles.modalRoot, { backgroundColor: theme.background }]}>
            <AgencyProfileScreen
              agencyIdOrSlug={selectedAgencySlug}
              onClose={() => setSelectedAgencySlug(null)}
              onSelectBoard={(b) => {
                setSelectedAgencySlug(null);
                setSelectedBoard(b);
              }}
            />
          </View>
        )}
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingBottom: 150,
  },
  heroBanner: {
    position: 'relative',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245, 242, 236, 0.10)',
    minHeight: 240,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    shadowColor: '#38BDC7',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.20,
    shadowRadius: 28,
    elevation: 10,
  },
  heroBannerContent: {
    zIndex: 2,
    gap: spacing.xs,
  },
  heroHeaderRow: {
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.xs,
  },
  brandLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(20, 26, 29, 0.84)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(242, 245, 244, 0.16)',
  },
  brandLocationDot: {
    color: colors.teal[400],
    fontSize: 8,
  },
  brandLocationText: {
    color: '#F2F5F4',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stockBadge: {
    backgroundColor: 'rgba(28, 26, 24, 0.82)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 242, 236, 0.18)',
  },
  stockBadgeText: {
    color: '#F5F2EC',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  catalogHeroTitle: {
    color: '#F5F2EC',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  catalogHeroSubtitle: {
    color: '#D5CFC5',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 680,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.xs,
  },
  kpiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(24, 23, 21, 0.80)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 242, 236, 0.12)',
  },
  kpiChipIcon: {
    fontSize: 12,
  },
  kpiChipText: {
    color: '#F5F2EC',
    fontSize: 11,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: 'rgba(42, 41, 38, 0.85)',
    borderColor: 'rgba(245, 242, 236, 0.10)',
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerTitle: {
    color: '#F5F2EC',
    fontWeight: '800',
  },
  sparkleIcon: {
    fontSize: 18,
  },
  headerSubtitle: {
    color: '#B6B0A5',
    marginTop: 2,
    fontSize: 13,
  },
  badgeWrapper: {
    alignSelf: 'center',
  },
  sectionHeaderRow: {
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.champagne[400],
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionIcon: {
    fontSize: 14,
  },
  sectionSubtitle: {
    color: '#B6B0A5',
    fontSize: 12,
    marginTop: -2,
    marginBottom: spacing.xs,
  },
  featuredSection: {
    marginBottom: spacing.xs,
  },
  gridSection: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  gridBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(242, 245, 244, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(242, 245, 244, 0.10)',
  },
  gridBadgeText: {
    color: colors.teal[400],
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  searchWrapper: {
    marginTop: 0,
  },
  searchContainer: {
    marginBottom: 0,
  },
  searchInput: {
    backgroundColor: '#2D363B',
    borderColor: 'rgba(242, 245, 244, 0.12)',
    color: '#F2F5F4',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: 'rgba(35, 42, 46, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(242, 245, 244, 0.12)',
  },
  filterPillSelectedDark: {
    backgroundColor: '#38BDC7',
    borderColor: '#38BDC7',
    shadowColor: '#38BDC7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  filterPillSelectedLight: {
    backgroundColor: '#0E6B74',
    borderColor: '#0E6B74',
    shadowColor: '#0E6B74',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextSelectedDark: {
    color: '#0C1719',
    fontWeight: '800',
  },
  filterPillTextSelectedLight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  loadingText: {
    color: '#B6B0A5',
    textAlign: 'center',
  },
  gridContainer: {
    gap: spacing.md,
  },
  gridMultiColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '100%',
  },
  gridItemTablet: {
    width: '48%',
    flexGrow: 1,
  },
  gridItemDesktop: {
    width: '31%',
    flexGrow: 1,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: '#21201E',
  },
  modalHeader: {
    backgroundColor: 'rgba(42, 41, 38, 0.96)',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 242, 236, 0.10)',
  },
  zoneSection: {
    marginTop: 2,
  },
  zoneScrollContent: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  zonePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  agenciesScrollContent: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  agencyCard: {
    width: 245,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  agencyAccentStripe: {
    height: 4,
    width: '100%',
  },
  agencyVerifiedDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
