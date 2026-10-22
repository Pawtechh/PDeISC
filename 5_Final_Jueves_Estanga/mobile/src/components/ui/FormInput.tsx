import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { Control, useController, FieldValues, Path } from 'react-hook-form';
import { colors, radii, spacing } from '../../theme';
import { Text } from './Text';

export interface FormInputProps<T extends FieldValues>
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
  iconLeft?: React.ReactNode;
  showSuccessIcon?: boolean;
}

export function FormInput<T extends FieldValues>({
  name,
  control,
  label,
  helperText,
  containerStyle,
  iconLeft,
  showSuccessIcon = true,
  style,
  editable = true,
  secureTextEntry,
  testID,
  ...props
}: FormInputProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    field: { onChange, onBlur, value },
    fieldState: { error, isTouched },
  } = useController({
    name,
    control,
  });

  const hasValue = value !== undefined && value !== null && String(value).trim().length > 0;
  const isError = Boolean(error && (isTouched || isFocused || hasValue));
  const isValid = Boolean(!error && isTouched && hasValue);

  const getBorderColor = (): string => {
    if (isError) return colors.semantic.danger;
    if (isValid) return colors.semantic.success;
    if (isFocused) return colors.ocean[500];
    return colors.sand[200];
  };

  const isSecure = secureTextEntry && !showPassword;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="caption" color={colors.sand[700]} style={styles.label}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: editable ? colors.white : colors.sand[100],
          },
        ]}
      >
        {iconLeft && <View style={styles.icon}>{iconLeft}</View>}

        <TextInput
          editable={editable}
          placeholderTextColor={colors.sand[500]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur();
          }}
          value={value !== undefined && value !== null ? String(value) : ''}
          onChangeText={onChange}
          secureTextEntry={isSecure}
          style={[styles.input, style]}
          testID={testID || `input-${name}`}
          {...props}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightAction}
            activeOpacity={0.7}
          >
            <Text variant="caption" color={colors.ocean[600]}>
              {showPassword ? 'Ocultar' : 'Ver'}
            </Text>
          </TouchableOpacity>
        ) : isValid && showSuccessIcon ? (
          <View style={styles.rightAction} testID={`valid-check-${name}`}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
        ) : null}
      </View>

      {isError && error?.message ? (
        <Text
          variant="caption"
          color={colors.semantic.danger}
          style={styles.helper}
          testID={`error-${name}`}
        >
          {error.message}
        </Text>
      ) : helperText ? (
        <Text variant="caption" color={colors.sand[500]} style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radii.md,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.sand[900],
    fontSize: 16,
    paddingVertical: spacing.sm,
  },
  icon: {
    marginRight: spacing.sm,
  },
  rightAction: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCheck: {
    color: colors.semantic.success,
    fontSize: 16,
    fontWeight: '700',
  },
  helper: {
    marginTop: spacing.xs,
  },
});
