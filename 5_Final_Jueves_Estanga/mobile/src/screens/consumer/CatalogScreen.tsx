import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Search, LayoutGrid, Award, Shield, Clock, Waves } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Screen, Stack, Row, Text, Input, Badge, Button, EmptyState, GlassCard } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useGetBoardsQuery, Board } from '../../api/boardsApi';
import { BoardCard } from '../../components/boards/BoardCard';
import { Board3DCarousel } from '../../components/boards/Board3DCarousel';
import { BoardDetailScreen } from './BoardDetailScreen';
import { useResponsive } from '../../hooks/useResponsive';
import { MarineForecastCard } from '../../components/marine/MarineForecastCard';

const FILTER_TYPES = ['Todos', 'Longboard', 'Fish', 'Funboard', 'Shortboard', 'Bodyboard', 'SUP'];

export const CatalogScreen: React.FC<any> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const { numColumns } = useResponsive();

  const triggerHaptic = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Non-blocking fallback
    }
  }, []);

  const { data, isLoading, isFetching, refetch } = useGetBoardsQuery(
    selectedType !== 'Todos' ? { tipo: selectedType } : undefined
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
          tintColor="#00E5FF"
          colors={['#00E5FF', '#D4AF37']}
        />
      }
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Boutique Coastal Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1600&q=85' }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={[
              'rgba(9, 12, 16, 0.45)',
              'rgba(9, 12, 16, 0.85)',
              '#090C10',
            ]}
            locations={[0, 0.65, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroBannerContent}>
            <Row justify="space-between" align="center" style={styles.heroHeaderRow}>
              <View style={styles.brandLocationPill}>
                <Text style={styles.brandLocationText}>COLECCIÓN EXCLUSIVA • PLAYA GRANDE, MAR DEL PLATA</Text>
              </View>
              <View style={styles.stockBadge}>
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
              <View style={styles.kpiChip}>
                <Award size={13} color="#D4AF37" />
                <Text style={styles.kpiChipText}>Shapers Marplatenses</Text>
              </View>
              <View style={styles.kpiChip}>
                <Clock size={13} color="#00E5FF" />
                <Text style={styles.kpiChipText}>Retiro Express 5 min</Text>
              </View>
              <View style={styles.kpiChip}>
                <Star size={13} color="#D4AF37" fill="#D4AF37" />
                <Text style={styles.kpiChipText}>4.9/5 Calificación</Text>
              </View>
              <View style={styles.kpiChip}>
                <Shield size={13} color="#00E5FF" />
                <Text style={styles.kpiChipText}>Cobertura Total 100%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live Marine Weather Report (Playa Grande) */}
        <MarineForecastCard />

        {/* 1. SECCIÓN SUPERIOR: CARRUSEL DE SOLO LAS DESTACADAS */}
        {featuredBoards.length > 0 && (
          <View style={styles.featuredSection}>
            <Row justify="space-between" align="center" style={styles.sectionHeaderRow}>
              <Row align="center" spacing="xs">
                <Star size={14} color="#D4AF37" fill="#D4AF37" />
                <Text
                  variant="caption"
                  style={[styles.sectionTitle, { color: isDark ? '#D4AF37' : '#0A66D4' }]}
                >
                  TABLAS DESTACADAS • SELECCIÓN PLAYA GRANDE
                </Text>
              </Row>
              <Badge label="TOP RATED" variant={isDark ? 'warning' : 'ocean'} />
            </Row>

            <Text
              variant="caption"
              style={[styles.sectionSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}
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
              <Waves size={14} color={isDark ? '#D4AF37' : '#0A66D4'} />
              <Text
                variant="caption"
                style={[styles.sectionTitle, { color: isDark ? '#D4AF37' : '#0A66D4' }]}
              >
                TODAS LAS TABLAS {selectedType !== 'Todos' ? `• ${selectedType.toUpperCase()}` : ''} ({boardsList.length})
              </Text>
            </Row>
            <View
              style={[
                styles.gridBadge,
                {
                  backgroundColor: isDark ? 'rgba(0, 229, 255, 0.1)' : '#EFF6FF',
                  borderColor: isDark ? 'rgba(0, 229, 255, 0.3)' : '#BFDBFE',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                },
              ]}
            >
              <LayoutGrid size={11} color={isDark ? '#00E5FF' : '#0A66D4'} />
              <Text
                style={[styles.gridBadgeText, { color: isDark ? '#00E5FF' : '#0A66D4' }]}
              >
                CUADRÍCULA
              </Text>
            </View>
          </Row>

          {/* Upgraded Luxury Search Bar */}
          <View style={styles.searchWrapper}>
            <Input
              placeholder="Buscar por tabla, shaper o modelo..."
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={search}
              onChangeText={setSearch}
              containerStyle={styles.searchContainer}
              style={[
                styles.searchInput,
                {
                  backgroundColor: isDark ? 'rgba(13, 19, 29, 0.8)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(212, 175, 55, 0.25)' : '#CBD5E1',
                  color: isDark ? '#F1F5F9' : '#0F172A',
                },
              ]}
              iconLeft={<Search size={15} color={isDark ? '#94A3B8' : '#64748B'} />}
            />
          </View>

          {/* Filter Pills with Luxury Coastal Styling */}
          <View style={styles.filterRow}>
            {FILTER_TYPES.map((type) => {
              const isSelected = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  testID={`catalog-filter-${type}`}
                  onPress={() => handleFilterSelect(type)}
                  activeOpacity={0.8}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isDark ? 'rgba(18, 24, 36, 0.75)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#CBD5E1',
                    },
                    isSelected &&
                      (isDark ? styles.filterPillSelectedDark : styles.filterPillSelectedLight),
                  ]}
                >
                  <Text
                    variant="caption"
                    style={[
                      styles.filterPillText,
                      { color: isDark ? '#94A3B8' : '#475569' },
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
      </Stack>

      {/* Modal with Full Surfboard Detail */}
      <Modal
        visible={Boolean(selectedBoard)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedBoard(null)}
      >
        {selectedBoard && (
          <View style={[styles.modalRoot, { backgroundColor: isDark ? '#090C10' : '#F8FAFC' }]}>
            <View style={[styles.modalHeader, { backgroundColor: isDark ? '#090C10' : '#FFFFFF', borderBottomColor: isDark ? 'rgba(212, 175, 55, 0.2)' : '#E2E8F0' }]}>
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
    borderColor: 'rgba(212, 175, 55, 0.28)',
    minHeight: 240,
    justifyContent: 'flex-end',
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
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
    backgroundColor: 'rgba(9, 12, 16, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  brandLocationDot: {
    color: '#00E5FF',
    fontSize: 8,
  },
  brandLocationText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stockBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  stockBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  catalogHeroTitle: {
    color: '#F1F5F9',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  catalogHeroSubtitle: {
    color: '#94A3B8',
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
    backgroundColor: 'rgba(18, 24, 36, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  kpiChipIcon: {
    fontSize: 12,
  },
  kpiChipText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: 'rgba(18, 24, 36, 0.65)',
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  headerTextGroup: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerTitle: {
    color: '#F1F5F9',
    fontWeight: '800',
  },
  sparkleIcon: {
    fontSize: 18,
  },
  headerSubtitle: {
    color: '#94A3B8',
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
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sectionIcon: {
    fontSize: 14,
  },
  sectionSubtitle: {
    color: '#94A3B8',
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
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  gridBadgeText: {
    color: '#00E5FF',
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
    backgroundColor: 'rgba(13, 19, 29, 0.8)',
    borderColor: 'rgba(212, 175, 55, 0.25)',
    color: '#F1F5F9',
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
    backgroundColor: 'rgba(18, 24, 36, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.22)',
  },
  filterPillSelectedDark: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderColor: '#00E5FF',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
  filterPillSelectedLight: {
    backgroundColor: '#0A66D4',
    borderColor: '#0A66D4',
    shadowColor: '#0A66D4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextSelectedDark: {
    color: '#00E5FF',
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
    color: '#94A3B8',
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
    backgroundColor: '#090C10',
  },
  modalHeader: {
    backgroundColor: '#090C10',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
});
