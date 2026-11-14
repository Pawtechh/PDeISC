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
          return { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.28)', text: '#34D399' };
        case 'warning':
          return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.28)', text: '#FBBF24' };
        case 'danger':
          return { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.28)', text: '#F87171' };
        case 'info':
          return { bg: 'rgba(0, 210, 211, 0.10)', border: 'rgba(0, 210, 211, 0.24)', text: '#00D2D3' };
        case 'ocean':
          return { bg: 'rgba(255, 90, 54, 0.12)', border: 'rgba(255, 90, 54, 0.28)', text: '#FF7A59' };
        case 'sand':
          return { bg: 'rgba(255, 255, 255, 0.06)', border: 'rgba(255, 255, 255, 0.12)', text: '#A1A1AA' };
      }
    }

    switch (variant) {
      case 'success':
        return { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' };
      case 'warning':
        return { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' };
      case 'danger':
        return { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' };
      case 'info':
        return { bg: '#ECFEFF', border: '#A5F3FC', text: '#0E7490' };
      case 'ocean':
        return { bg: 'rgba(255, 90, 54, 0.10)', border: 'rgba(255, 90, 54, 0.24)', text: '#D93D1B' };
      case 'sand':
        return { bg: '#F4F4F5', border: '#E4E4E7', text: '#52525B' };
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
