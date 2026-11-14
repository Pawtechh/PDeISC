import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import confetti from 'canvas-confetti';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface CopyButtonWithConfettiProps {
  textToCopy: string;
  label?: string;
  copiedLabel?: string;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

export const CopyButtonWithConfetti: React.FC<CopyButtonWithConfettiProps> = ({
  textToCopy,
  label = 'Copiar',
  copiedLabel = '¡Copiado!',
  style,
  size = 'md',
}) => {
  const { theme, isDark } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
    } catch {
      // safe fallback
    }

    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // safe fallback
    }

    // Trigger subtle luxury confetti explosion
    try {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#E06343', '#DBA84C', '#52B097', '#EFEAE1'],
          ticks: 120,
          scalar: 0.85,
        });
      }
    } catch {
      // safe fallback
    }

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2200);
  };

  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleCopy}
      style={[
        styles.button,
        isSmall && styles.buttonSmall,
        {
          backgroundColor: copied
            ? theme.successBg
            : isDark
            ? 'rgba(219, 168, 76, 0.14)'
            : colors.sand[100],
          borderColor: copied
            ? theme.successBorder
            : isDark
            ? 'rgba(219, 168, 76, 0.36)'
            : colors.sand[300],
        },
        style,
      ]}
      accessibilityLabel={copied ? copiedLabel : label}
      accessibilityRole="button"
    >
      <Text style={{ fontSize: isSmall ? 12 : 14 }}>
        {copied ? '✓' : '📋'}
      </Text>
      <Text
        variant="caption"
        style={[
          styles.labelText,
          {
            color: copied
              ? theme.successText
              : isDark
              ? theme.champagne
              : theme.primary,
            fontWeight: copied ? '700' : '600',
          },
        ]}
      >
        {copied ? copiedLabel : label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  buttonSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  labelText: {
    fontSize: 12,
  },
});
