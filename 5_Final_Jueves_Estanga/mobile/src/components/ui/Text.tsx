import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { typography, TypographyVariant, colors } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const { theme, isDark } = useTheme();

  let resolvedColor = color;
  if (!color) {
    resolvedColor = theme.text;
  } else if (isDark) {
    if (
      color === colors.sand[900] ||
      color === colors.ocean[900] ||
      color === '#1F1E19' ||
      color === '#052A57'
    ) {
      resolvedColor = theme.text;
    } else if (
      color === colors.sand[700] ||
      color === '#4A473C' ||
      color === colors.sand[500]
    ) {
      resolvedColor = theme.subtext;
    }
  }

  return (
    <RNText
      style={[
        typography[variant],
        { color: resolvedColor, textAlign: align },
        styles.defaultText,
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  defaultText: {
    includeFontPadding: false,
  },
});
