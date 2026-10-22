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
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
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
          backgroundColor: isDark ? '#101622' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
          shadowColor: isDark ? '#000000' : '#64748B',
          shadowOpacity: isDark ? 0.35 : 0.12,
        },
        Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined,
        style,
      ]}
    >
      {/* 1. Heroic & Full-Bleed Photography */}
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: photoUrl }}
          placeholder={{ blurhash }}
          contentFit="cover"
          transition={300}
          style={styles.heroImage}
        />

        {/* Subtle base gradient to blend seamlessly into solid dark background */}
        <LinearGradient
          colors={
            isDark
              ? ['transparent', 'rgba(16, 22, 34, 0.45)', '#101622']
              : ['transparent', 'rgba(255, 255, 255, 0.45)', '#FFFFFF']
          }
          locations={[0.4, 0.78, 1.0]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Floating Category Badge with ultralight BlurView */}
        <View style={styles.floatingBadgeLeft}>
          <BlurView intensity={20} tint="dark" style={styles.blurPill}>
            <Text style={styles.categoryPillText}>
              {board.tipoTabla.toUpperCase()}
            </Text>
          </BlurView>
        </View>

        {/* Floating Featured Badge */}
        {isFeatured && (
          <View style={styles.floatingBadgeCenter}>
            <BlurView intensity={25} tint="dark" style={styles.featuredBlurPill}>
              <Text style={styles.featuredBadgeText}>★ DESTACADA</Text>
            </BlurView>
          </View>
        )}

        {/* Floating Rating Badge with ultralight BlurView */}
        <View style={styles.floatingBadgeRight}>
          <BlurView intensity={20} tint="dark" style={styles.blurPill}>
            <Text style={styles.starText}>★</Text>
            <Text style={styles.ratingText}>
              {board.calificacionPromedio ? board.calificacionPromedio.toFixed(1) : '5.0'}
            </Text>
          </BlurView>
        </View>
      </View>

      {/* 2. Editorial Typography & Clean Layout */}
      <View style={[styles.contentContainer, { backgroundColor: isDark ? '#101622' : '#FFFFFF' }]}>
        {/* Brand & Model - Small uppercase with wide tracking */}
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

        {/* Board Title - High-contrast & aspirational */}
        <Text
          style={[
            styles.boardTitle,
            { color: isDark ? '#F8FAFC' : '#0F172A' },
          ]}
          numberOfLines={1}
        >
          {board.titulo}
        </Text>

        {/* Clean Editorial Specs Line (NO ROUND BOXES) */}
        <Text
          style={[
            styles.cleanSpecsLine,
            { color: isDark ? '#94A3B8' : '#475569' },
          ]}
          numberOfLines={1}
        >
          {board.medidas || "6'0\" × 19\" × 2.3\""}
          {board.volumenLitros ? `   •   ${board.volumenLitros} L` : ''}
        </Text>

        {/* 3. Integrated Price & Clean CTA Row */}
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
          <View style={[styles.footerRow, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' }]}>
            <View style={styles.priceContainer}>
              <Text style={[styles.priceValue, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>${board.precioHora}</Text>
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
                colors={['#00B4D8', '#0077B6']}
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
    backgroundColor: '#101622',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 16 / 10,
    position: 'relative',
    backgroundColor: '#090C10',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadgeLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  floatingBadgeRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  floatingBadgeCenter: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
  featuredBlurPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(212, 175, 55, 0.22)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 8,
  },
  featuredBadgeText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  blurPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(9, 12, 16, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 8,
    gap: 4,
  },
  categoryPillText: {
    color: '#F8FAFC',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  starText: {
    color: '#D4AF37',
    fontSize: 11,
    marginRight: 2,
  },
  ratingText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#101622',
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandSubtitle: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  boardTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 26,
    marginBottom: 8,
  },
  cleanSpecsLine: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.6,
    marginBottom: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  priceUnit: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '400',
    marginLeft: 3,
  },
  reserveBtnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#00B4D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  reserveBtnGradient: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  ownerActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  ownerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ownerGhostBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  ownerGhostBtnText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  ownerEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  ownerEditBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
  },
});
