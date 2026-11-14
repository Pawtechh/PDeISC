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
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const { numColumns } = useResponsive();

  const triggerHaptic = useCallback(() => {
    safeHaptic.impact();
  }, []);

  const { data, isLoading, isFetching, isError, refetch } = useGetBoardsQuery(
    selectedType !== 'Todos' ? { tipo: selectedType } : undefined,
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
                <Text style={styles.brandLocationText}>COLECCIÓN EXCLUSIVA • PLAYA GRANDE, MAR DEL PLATA</Text>
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
              Tablas curadas por shapers marplatenses. Reserva instantánea, equipamiento encerado y entrega express en la orilla de Playa Grande.
            </Text>

            <View style={styles.kpiRow}>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { heroChip: 'true' } } as any) : {})}
                style={styles.kpiChip}
              >
                <Award size={13} color={theme.champagne} />
                <Text style={styles.kpiChipText}>Shapers Marplatenses</Text>
              </View>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { heroChip: 'true' } } as any) : {})}
                style={styles.kpiChip}
              >
                <Clock size={13} color={colors.coral[400]} />
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

        {/* Live Marine Weather Report (Playa Grande) */}
        <MarineForecastCard />

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
                  TABLAS DESTACADAS • SELECCIÓN PLAYA GRANDE
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
              description="Probá seleccionando otra categoría o cambiando el término de búsqueda."
              actionTitle="Ver todas"
              onAction={() => {
                triggerHaptic();
                setSelectedType('Todos');
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
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Ubicación de la Sede & Cómo Llegar con Google Maps (y Sensor GPS en Móvil) */}
        <GoogleMapSedeCard />
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
    shadowColor: '#E06343',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
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
    backgroundColor: 'rgba(28, 26, 24, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 242, 236, 0.16)',
  },
  brandLocationDot: {
    color: colors.coral[400],
    fontSize: 8,
  },
  brandLocationText: {
    color: '#F5F2EC',
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
    backgroundColor: 'rgba(245, 242, 236, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245, 242, 236, 0.10)',
  },
  gridBadgeText: {
    color: colors.coral[400],
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
    backgroundColor: '#35332F',
    borderColor: 'rgba(245, 242, 236, 0.12)',
    color: '#F5F2EC',
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
    backgroundColor: 'rgba(42, 41, 38, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(245, 242, 236, 0.12)',
  },
  filterPillSelectedDark: {
    backgroundColor: '#E06343',
    borderColor: '#E06343',
    shadowColor: '#E06343',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  filterPillSelectedLight: {
    backgroundColor: '#C94A29',
    borderColor: '#C94A29',
    shadowColor: '#C94A29',
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
    color: '#FFFFFF',
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
});
