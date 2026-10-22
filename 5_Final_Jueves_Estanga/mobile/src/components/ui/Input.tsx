import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  iconLeft,
  iconRight,
  containerStyle,
  style,
  editable = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme, isDark } = useTheme();

  const getBorderColor = (): string => {
    if (error) return colors.semantic.danger;
    if (isFocused) return theme.primary;
    return theme.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text variant="caption" color={error ? colors.semantic.danger : theme.subtext} style={styles.label}>
            {label}
          </Text>
          {error && (
            <Text variant="caption" color={colors.semantic.danger} style={{ fontWeight: '700' }}>
              ❗ Requerido
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderWidth: error ? 1.5 : 1,
            backgroundColor: error
              ? (isDark ? '#3b0d0d' : '#FEF2F2')
              : editable
              ? theme.inputBg
              : theme.surface,
          },
        ]}
      >
        {iconLeft && <View style={styles.icon}>{iconLeft}</View>}
        <TextInput
          editable={editable}
          placeholderTextColor={error ? colors.semantic.danger : theme.subtext}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, { color: theme.text }, style]}
          {...props}
        />
        {iconRight ? (
          <View style={styles.icon}>{iconRight}</View>
        ) : error ? (
          <View style={styles.icon}>
            <Text style={{ fontSize: 16 }}>❗</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <Text variant="caption" color={colors.semantic.danger} style={[styles.helper, { fontWeight: '600' }]}>
          ❗ {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color={colors.sand[500]} style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.sand[900],
    paddingVertical: spacing.sm,
  },
  icon: {
    marginHorizontal: spacing.xs,
  },
  helper: {
    marginTop: spacing.xs,
  },
});
