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
          return { bg: 'rgba(34, 168, 107, 0.14)', border: 'rgba(34, 168, 107, 0.28)', text: '#57C992' };
        case 'warning':
          return { bg: 'rgba(217, 155, 56, 0.14)', border: 'rgba(217, 155, 56, 0.28)', text: '#E5B869' };
        case 'danger':
          return { bg: 'rgba(223, 78, 78, 0.14)', border: 'rgba(223, 78, 78, 0.28)', text: '#EE7A7A' };
        case 'info':
          return { bg: 'rgba(148, 163, 184, 0.14)', border: 'rgba(148, 163, 184, 0.26)', text: '#CBD5E1' };
        case 'ocean':
          return { bg: 'rgba(226, 91, 60, 0.14)', border: 'rgba(226, 91, 60, 0.28)', text: '#EA7357' };
        case 'sand':
          return { bg: 'rgba(255, 255, 255, 0.07)', border: 'rgba(255, 255, 255, 0.14)', text: '#D1D5DB' };
      }
    }

    switch (variant) {
      case 'success':
        return { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' };
      case 'warning':
        return { bg: '#FEF9EE', border: '#FDE6B8', text: '#8C5808' };
      case 'danger':
        return { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' };
      case 'info':
        return { bg: '#F1F5F9', border: '#E2E8F0', text: '#334155' };
      case 'ocean':
        return { bg: 'rgba(226, 91, 60, 0.10)', border: 'rgba(226, 91, 60, 0.24)', text: '#CC482A' };
      case 'sand':
        return { bg: '#F1F5F9', border: '#E2E8F0', text: '#475569' };
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
