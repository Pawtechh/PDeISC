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
          return { bg: 'rgba(16, 185, 129, 0.14)', border: 'rgba(16, 185, 129, 0.35)', text: '#34D399' };
        case 'warning':
          return { bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.35)', text: '#FBBF24' };
        case 'danger':
          return { bg: 'rgba(239, 68, 68, 0.14)', border: 'rgba(239, 68, 68, 0.35)', text: '#F87171' };
        case 'info':
        case 'ocean':
          return { bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.32)', text: '#38BDF8' };
        case 'sand':
          return { bg: 'rgba(203, 213, 225, 0.08)', border: 'rgba(203, 213, 225, 0.22)', text: '#CBD5E1' };
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
        return { bg: '#E0F2FE', border: '#BAE6FD', text: '#0369A1' };
      case 'ocean':
        return { bg: '#0284C7', border: '#0369A1', text: '#FFFFFF' };
      case 'sand':
        return { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569' };
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
