import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export const SkeletonBoardCard: React.FC = () => {
  const { theme, isDark } = useTheme();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.9,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const blockBg = isDark ? 'rgba(245, 242, 236, 0.08)' : 'rgba(28, 27, 24, 0.08)';

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: pulse,
        },
      ]}
    >
      <View style={[styles.imageSkeleton, { backgroundColor: blockBg }]} />
      <View style={styles.body}>
        <View style={[styles.lineShort, { backgroundColor: blockBg }]} />
        <View style={[styles.lineTitle, { backgroundColor: blockBg }]} />
        <View style={styles.chipsRow}>
          <View style={[styles.chipSkeleton, { backgroundColor: blockBg }]} />
          <View style={[styles.chipSkeleton, { backgroundColor: blockBg }]} />
        </View>
        <View style={[styles.footerRow, { borderTopColor: theme.divider }]}>
          <View style={[styles.priceSkeleton, { backgroundColor: blockBg }]} />
          <View style={[styles.btnSkeleton, { backgroundColor: blockBg }]} />
        </View>
      </View>
    </Animated.View>
  );
};

export const CatalogSkeletonGrid: React.FC<{ numColumns: number; count?: number }> = ({
  numColumns,
  count = 6,
}) => {
  return (
    <View style={[styles.grid, numColumns > 1 && styles.gridMulti]}>
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={`sk-${idx}`}
          style={[
            styles.gridItem,
            numColumns === 2 && styles.gridItemTablet,
            numColumns >= 3 && styles.gridItemDesktop,
          ]}
        >
          <SkeletonBoardCard />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  gridMulti: {
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
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 10,
  },
  imageSkeleton: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 14,
  },
  body: {
    paddingHorizontal: 6,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 10,
  },
  lineShort: {
    height: 10,
    width: '42%',
    borderRadius: radii.sm,
  },
  lineTitle: {
    height: 16,
    width: '78%',
    borderRadius: radii.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipSkeleton: {
    height: 22,
    width: 68,
    borderRadius: radii.full,
  },
  footerRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceSkeleton: {
    height: 20,
    width: 74,
    borderRadius: radii.sm,
  },
  btnSkeleton: {
    height: 36,
    width: 104,
    borderRadius: radii.full,
  },
});
