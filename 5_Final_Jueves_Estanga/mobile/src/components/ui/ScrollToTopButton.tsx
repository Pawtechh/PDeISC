import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface ScrollToTopButtonProps {
  onPress: () => void;
  visible?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  onPress,
  visible = true,
  style,
}) => {
  const { theme, isDark } = useTheme();

  if (!visible) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: isDark ? theme.surface : colors.ocean[500],
          borderColor: isDark ? theme.border : colors.ocean[600],
        },
        style,
      ]}
      accessibilityLabel="Volver arriba"
      accessibilityRole="button"
    >
      <Text style={styles.icon}>⬆️</Text>
      <Text
        variant="caption"
        color={isDark ? theme.text : colors.white}
        style={styles.label}
      >
        Arriba
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontWeight: '700',
  },
});
