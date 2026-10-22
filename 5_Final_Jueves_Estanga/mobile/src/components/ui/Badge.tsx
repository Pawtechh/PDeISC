import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../../theme';
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
  const getBadgeColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'success':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'warning':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'danger':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'info':
        return { bg: colors.ocean[100], text: colors.ocean[700] };
      case 'ocean':
        return { bg: colors.ocean[500], text: colors.white };
      case 'sand':
        return { bg: colors.sand[200], text: colors.sand[700] };
    }
  };

  const { bg, text } = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
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
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radii.full,
    gap: spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
});
