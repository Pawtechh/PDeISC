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
  const { theme, isDark } = useTheme();

  const getBadgeColors = (): { bg: string; border: string; text: string } => {
    switch (variant) {
      case 'success':
        return { bg: theme.successBg, border: theme.successBorder, text: theme.successText };
      case 'warning':
        return { bg: theme.warningBg, border: theme.warningBorder, text: theme.warningText };
      case 'danger':
        return { bg: theme.dangerBg, border: theme.dangerBorder, text: theme.dangerText };
      case 'info':
        return { bg: theme.infoBg, border: theme.infoBorder, text: theme.infoText };
      case 'ocean':
        return { bg: theme.primarySubtle, border: theme.primaryBorder, text: isDark ? theme.primaryHover : theme.primary };
      case 'sand':
        return {
          bg: theme.isDark ? 'rgba(242, 245, 244, 0.08)' : theme.cardHighlight,
          border: theme.border,
          text: theme.subtext,
        };
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
