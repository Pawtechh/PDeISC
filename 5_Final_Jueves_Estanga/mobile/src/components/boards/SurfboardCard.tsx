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
import * as Haptics from 'expo-haptics';
import { Star, Award } from 'lucide-react-native';
import { Board } from '../../api/boardsApi';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../theme/ThemeContext';

export interface SurfboardCardProps {
  board: Board;
  onPressDetail?: () => void;
  onPressReserve?: () => void;
  onPressEdit?: () => void;
  onPressDelete?: () => void;
  isOwnerView?: boolean;
  isFeatured?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const triggerHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Non-blocking fallback
  }
};

export const SurfboardCard: React.FC<SurfboardCardProps> = ({
  board,
  onPressDetail,
  onPressReserve,
  onPressEdit,
  onPressDelete,
  isOwnerView = false,
  isFeatured = false,
  style,
  testID,
}) => {
  const { isDark } = useTheme();
  const rawPhotoUrl =
    board.fotos?.[0] ||
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80';
  const photoUrl = String(rawPhotoUrl).replace(/^https?:\/\/localhost:3000/i, '');
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
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#0D131D' : '#FFFFFF',
          borderColor: isDark ? 'rgba(212, 175, 55, 0.22)' : '#E2E8F0',
          shadowColor: isDark ? '#000000' : '#64748B',
          shadowOpacity: isDark ? 0.45 : 0.12,
        },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
        style,
      ]}
    >
      {/* 1. Curated Gallery Image Showcase Frame */}
      <View style={[styles.imageFrame, { backgroundColor: isDark ? '#080C14' : '#F1F5F9' }]}>
        <View style={styles.imageInner}>
          <Image
            source={{ uri: photoUrl }}
            placeholder={{ blurhash }}
            contentFit="cover"
            transition={300}
            style={styles.heroImage}
          />

          {/* Subtle bottom fade to blend smoothly into card body */}
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(13, 19, 29, 0.7)' : 'rgba(255, 255, 255, 0.5)']}
            locations={[0.7, 1.0]}
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
                <Award size={10} color="#D4AF37" strokeWidth={2.2} />
                <Text style={styles.featuredBadgeText}>DESTACADA</Text>
              </View>
            </View>
          )}

          {/* Floating Rating Badge with Lucide Star Icon */}
          <View style={styles.floatingBadgeRight}>
            <View style={styles.blurPill}>
              <Star size={11} color="#D4AF37" fill="#D4AF37" />
              <Text style={styles.ratingText}>
                {board.calificacionPromedio ? board.calificacionPromedio.toFixed(1) : '5.0'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 2. Editorial Typography & Technical Specs */}
      <View style={[styles.contentContainer, { backgroundColor: isDark ? '#0D131D' : '#FFFFFF' }]}>
        {/* Brand & Model */}
        <View style={styles.brandRow}>
          <Text
            style={[
              styles.brandSubtitle,
              { color: isDark ? '#D4AF37' : '#0A66D4' },
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
            { color: isDark ? '#F8FAFC' : '#0F172A' },
          ]}
          numberOfLines={1}
        >
          {board.titulo}
        </Text>

        {/* Specs Pill Line */}
        <View style={styles.specsRow}>
          <View style={[styles.specChip, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9' }]}>
            <Text style={[styles.specChipText, { color: isDark ? '#CBD5E1' : '#475569' }]}>
              {board.medidas || "6'0\" × 19\""}
            </Text>
          </View>
          {Boolean(board.volumenLitros) && (
            <View style={[styles.specChip, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.08)' : '#E0F2FE' }]}>
              <Text style={[styles.specChipText, { color: isDark ? '#00E5FF' : '#0284C7' }]}>
                {board.volumenLitros} L
              </Text>
            </View>
          )}
          <View style={[styles.specChip, { backgroundColor: isDark ? 'rgba(212, 175, 55, 0.08)' : '#FEF3C7' }]}>
            <Text style={[styles.specChipText, { color: isDark ? '#D4AF37' : '#B45309' }]}>
              {board.tipoTabla.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* 3. Integrated Price & Luxury CTA Row */}
        {isOwnerView ? (
          <View style={styles.ownerActionsRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceValue}>${board.precioHora}</Text>
              <Text style={styles.priceUnit}> / hr</Text>
            </View>

            <View style={styles.ownerButtons}>
              {onPressDelete && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    onPressDelete();
                  }}
                  style={styles.ownerGhostBtn}
                >
                  <Text style={styles.ownerGhostBtnText}>Dar de baja</Text>
                </TouchableOpacity>
              )}
              {onPressEdit && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    onPressEdit();
                  }}
                  style={styles.ownerEditBtn}
                >
                  <Text style={styles.ownerEditBtnText}>Editar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.footerRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                ${board.precioHora}
              </Text>
              <Text style={[styles.priceUnit, { color: isDark ? '#94A3B8' : '#64748B' }]}> / hr</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={(e) => {
                e.stopPropagation();
                handleReservePress();
              }}
              style={styles.reserveBtnWrapper}
              testID={`board-3d-reserve-${board.id}`}
            >
              <LinearGradient
                colors={['#00E5FF', '#0099B8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.reserveBtnGradient}
              >
                <Text style={styles.reserveBtnText}>Reservar</Text>
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
    backgroundColor: 'rgba(9, 12, 16, 0.85)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 6,
  },
  featuredBadgeText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  blurPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(9, 12, 16, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    gap: 4,
  },
  categoryPillText: {
    color: '#F8FAFC',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  ratingText: {
    color: '#F8FAFC',
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
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  reserveBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveBtnText: {
    color: '#090C10',
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
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  ownerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerGhostBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  ownerGhostBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  ownerEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  ownerEditBtnText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
  },
});
