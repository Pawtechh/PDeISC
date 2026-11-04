import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'ocean' | 'sand';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  style,
  icon,
}) => {
  const { isDark } = useTheme();

  const getBadgeColors = (): { bg: string; border: string; text: string } => {
    if (isDark) {
      switch (variant) {
        case 'success':
          return { bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.38)', text: '#34D399' };
        case 'warning':
          return { bg: 'rgba(212, 175, 55, 0.16)', border: 'rgba(212, 175, 55, 0.42)', text: '#FBBF24' };
        case 'danger':
          return { bg: 'rgba(239, 68, 68, 0.16)', border: 'rgba(239, 68, 68, 0.42)', text: '#F87171' };
        case 'info':
          return { bg: 'rgba(0, 229, 255, 0.12)', border: 'rgba(0, 229, 255, 0.32)', text: '#38BDF8' };
        case 'ocean':
          return { bg: 'rgba(0, 229, 255, 0.15)', border: 'rgba(0, 229, 255, 0.40)', text: '#00E5FF' };
        case 'sand':
          return { bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.28)', text: '#CBD5E1' };
      }
    }

    switch (variant) {
      case 'success':
        return { bg: '#D1FAE5', border: '#A7F3D0', text: '#065F46' };
      case 'warning':
        return { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E' };
      case 'danger':
        return { bg: '#FEE2E2', border: '#FECACA', text: '#991B1B' };
      case 'info':
        return { bg: colors.ocean[100], border: colors.ocean[200], text: colors.ocean[700] };
      case 'ocean':
        return { bg: colors.ocean[500], border: colors.ocean[600], text: colors.white };
      case 'sand':
        return { bg: colors.sand[200], border: colors.sand[300], text: colors.sand[700] };
    }
  };

  const { bg, border, text } = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }, style]}>
      {icon}
      <Text variant="caption" color={text} style={styles.text}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  text: {
    fontWeight: '700',
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
});
