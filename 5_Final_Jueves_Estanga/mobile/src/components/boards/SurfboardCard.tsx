import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { safeHaptic } from '../../utils/haptics';
import { Star, Award, Store } from 'lucide-react-native';
import { Board } from '../../api/boardsApi';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../theme/ThemeContext';
import { resolveCuratedBoardPhoto } from '../../utils/curatedBoardImages';

export interface SurfboardCardProps {
  board: Board;
  onPressDetail?: () => void;
  onPressReserve?: () => void;
  onPressAgency?: (slugOrId: string) => void;
  onPressEdit?: () => void;
  onPressDelete?: () => void;
  isOwnerView?: boolean;
  isFeatured?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const triggerHaptic = () => {
  safeHaptic.impact();
};

export const SurfboardCard: React.FC<SurfboardCardProps> = ({
  board,
  onPressDetail,
  onPressReserve,
  onPressAgency,
  onPressEdit,
  onPressDelete,
  isOwnerView = false,
  isFeatured = false,
  style,
  testID,
}) => {
  const { theme, isDark } = useTheme();
  const photoUrl = resolveCuratedBoardPhoto(board.fotos?.[0], board.tipoTabla);
  const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

  const handleCardPress = useCallback(() => {
    triggerHaptic();
    onPressDetail?.();
  }, [onPressDetail]);

  const handleReservePress = useCallback(() => {
    triggerHaptic();
    onPressReserve?.();
  }, [onPressReserve]);

  const brandLine = (board.marca || 'SURF').toUpperCase();
  const modelLine = board.modelo ? `  •  ${board.modelo.toUpperCase()}` : '';

  const getOwnerStatusBadge = () => {
    switch (board.estado) {
      case 'DISPONIBLE':
        return <Badge label="DISPONIBLE" variant="success" />;
      case 'ALQUILADA':
        return <Badge label="ALQUILADA" variant="warning" />;
      case 'MANTENIMIENTO':
        return <Badge label="MANTENIMIENTO" variant="danger" />;
      case 'PRIVADA':
        return <Badge label="RETIRADA" variant="sand" />;
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.93}
      onPress={handleCardPress}
      testID={testID || `board-card-${board.id}`}
      {...(Platform.OS === 'web'
        ? ({ dataSet: { surfCard: 'true', staggerCard: 'true' } } as any)
        : {})}
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: '#000000',
          shadowOpacity: isDark ? 0.24 : 0.07,
        },
        Platform.OS === 'web'
          ? ({
              cursor: 'pointer',
              backdropFilter: 'blur(18px) saturate(140%)',
              WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            } as any)
          : undefined,
        style,
      ]}
    >
      {/* 1. Curated Gallery Image Showcase Frame */}
      <View style={[styles.imageFrame, { backgroundColor: isDark ? 'transparent' : theme.surface }]}>
        <View
          {...(Platform.OS === 'web' ? ({ dataSet: { surfImageFrame: 'true' } } as any) : {})}
          style={[
            styles.imageInner,
            {
              backgroundColor: isDark ? '#20262A' : '#EAECE8',
              borderColor: isDark ? 'rgba(242, 245, 244, 0.08)' : theme.border,
            },
          ]}
        >
          <Image
            source={{ uri: photoUrl }}
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={300}
            style={styles.heroImage}
          />

          {/* Matte dark-mode edge softening + bottom feather so bright studio shots blend cleanly */}
          <LinearGradient
            colors={
              isDark
                ? ['rgba(26, 31, 34, 0.22)', 'transparent', 'rgba(26, 31, 34, 0.34)']
                : ['rgba(19, 26, 29, 0.06)', 'transparent', 'rgba(252, 252, 250, 0.14)']
            }
            locations={[0, 0.45, 1.0]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Floating Category Badge */}
          <View style={styles.floatingBadgeLeft}>
            <View style={styles.blurPill}>
              <Text style={styles.categoryPillText}>
                {board.tipoTabla.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Floating Featured Badge with Lucide Award Icon */}
          {isFeatured && (
            <View style={styles.floatingBadgeCenter}>
              <View style={styles.featuredBlurPill}>
                <Award size={10} color="#DBA84C" strokeWidth={2.2} />
                <Text style={styles.featuredBadgeText}>DESTACADA</Text>
              </View>
            </View>
          )}

          {/* Floating Rating Badge with Lucide Star Icon */}
          <View style={styles.floatingBadgeRight}>
            <View style={styles.blurPill}>
              <Star size={11} color="#DBA84C" fill="#DBA84C" />
              <Text style={styles.ratingText}>
                {board.calificacionPromedio ? board.calificacionPromedio.toFixed(1) : '5.0'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Editorial Typography & Technical Specs */}
      <View style={[styles.contentContainer, { backgroundColor: isDark ? 'transparent' : theme.surface }]}>
        {/* Brand & Model */}
        <View style={styles.brandRow}>
          <Text
            style={[
              styles.brandSubtitle,
              { color: isDark ? theme.primaryHover : theme.primary },
            ]}
            numberOfLines={1}
          >
            {brandLine}{modelLine}
          </Text>
          {isOwnerView && getOwnerStatusBadge()}
        </View>

        {/* Board Title */}
        <Text
          style={[
            styles.boardTitle,
            { color: theme.text },
          ]}
          numberOfLines={1}
        >
          {board.titulo}
        </Text>

        {/* Agency & Coastal Zone Pill */}
        {(board.agency || board.zone) && (
          <TouchableOpacity
            activeOpacity={onPressAgency && board.agency ? 0.75 : 1}
            disabled={!onPressAgency || !board.agency}
            onPress={(e) => {
              e?.stopPropagation?.();
              if (board.agency && onPressAgency) {
                onPressAgency(board.agency.slug || board.agency.id);
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: board.agency?.accentColor || (isDark ? theme.primaryHover : theme.primary),
              }}
            />
            <Store size={11} color={theme.subtext} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: onPressAgency && board.agency ? (isDark ? theme.primaryHover : theme.primary) : theme.subtext,
                flexShrink: 1,
              }}
              numberOfLines={1}
            >
              {board.agency?.nombre || 'Sede Oficial'}
              {board.zone ? ` • ${board.zone.ciudad}` : ''}
            </Text>
          </TouchableOpacity>
        )}

        {/* Specs Pill Line */}
        <View style={styles.specsRow}>
          <View
            style={[
              styles.specChip,
              {
                backgroundColor: isDark ? 'rgba(245, 242, 236, 0.06)' : theme.cardHighlight,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.specChipText, { color: theme.subtext }]}>
              {board.medidas || "6'0\" × 19\""}
            </Text>
          </View>
          {Boolean(board.volumenLitros) && (
            <View
              style={[
                styles.specChip,
                {
                  backgroundColor: isDark ? 'rgba(245, 242, 236, 0.06)' : theme.cardHighlight,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.specChipText, { color: theme.subtext }]}>
                {board.volumenLitros} L
              </Text>
            </View>
          )}
          <View
            style={[
              styles.specChip,
              {
                backgroundColor: isDark ? 'rgba(245, 242, 236, 0.06)' : theme.cardHighlight,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.specChipText, { color: theme.muted }]}>
              {board.tipoTabla.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* 3. Integrated Price & Luxury CTA Row */}
        {isOwnerView ? (
          <View style={styles.ownerActionsRow}>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceValue, { color: theme.text }]}>${board.precioHora}</Text>
              <Text style={[styles.priceUnit, { color: theme.muted }]}> / hr</Text>
            </View>

            <View style={styles.ownerButtons}>
              {onPressDelete && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    onPressDelete();
                  }}
                  style={[styles.ownerGhostBtn, { backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder }]}
                >
                  <Text style={[styles.ownerGhostBtnText, { color: theme.danger }]}>Dar de baja</Text>
                </TouchableOpacity>
              )}
              {onPressEdit && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    onPressEdit();
                  }}
                  style={[styles.ownerEditBtn, { backgroundColor: theme.primarySubtle, borderColor: theme.primaryBorder }]}
                >
                  <Text style={[styles.ownerEditBtnText, { color: isDark ? theme.primaryHover : theme.primary }]}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.footerRow, { borderTopColor: theme.divider }]}>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceValue, { color: theme.text }]}>
                ${board.precioHora}
              </Text>
              <Text style={[styles.priceUnit, { color: theme.muted }]}> / hr</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={(e) => {
                e.stopPropagation();
                handleReservePress();
              }}
              style={[styles.reserveBtnWrapper, { shadowColor: theme.primary }]}
              {...(Platform.OS === 'web'
                ? ({ dataSet: { surfReserve: 'true', luxuryBtn: 'primary' } } as any)
                : {})}
              testID={`board-3d-reserve-${board.id}`}
            >
              <LinearGradient
                colors={isDark ? ['#51CCD5', '#38BDC7', '#2499A3'] : ['#13828C', '#0E6B74', '#08444A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.reserveBtnGradient}
              >
                <Text style={[styles.reserveBtnText, { color: theme.primaryText }]}>Reservar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 8,
  },
  imageFrame: {
    padding: 10,
    paddingBottom: 0,
  },
  imageInner: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadgeLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  floatingBadgeRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  floatingBadgeCenter: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    borderRadius: 6,
    overflow: 'hidden',
  },
  featuredBlurPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(28, 27, 25, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(219, 168, 76, 0.42)',
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: '#F3D9A6',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  blurPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(28, 27, 25, 0.80)',
    borderWidth: 1,
    borderColor: 'rgba(245, 242, 236, 0.16)',
    borderRadius: 6,
    gap: 4,
  },
  categoryPillText: {
    color: '#F5F2EC',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  ratingText: {
    color: '#F5F2EC',
    fontSize: 10,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  boardTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 24,
    marginBottom: 10,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  specChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  specChipText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  reserveBtnWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#38BDC7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.26,
    shadowRadius: 10,
    elevation: 4,
  },
  reserveBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveBtnText: {
    color: '#0C1719',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(242, 245, 244, 0.08)',
  },
  ownerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerGhostBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(185, 64, 58, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(236, 122, 115, 0.32)',
  },
  ownerGhostBtnText: {
    color: '#EC7A73',
    fontSize: 11,
    fontWeight: '700',
  },
  ownerEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 199, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 199, 0.32)',
  },
  ownerEditBtnText: {
    color: '#38BDC7',
    fontSize: 11,
    fontWeight: '700',
  },
});
