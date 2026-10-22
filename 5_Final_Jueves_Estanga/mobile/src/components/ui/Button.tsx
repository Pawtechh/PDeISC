import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { colors, radii, spacing } from '../../theme';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
  fullWidth = false,
  testID,
}) => {
  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.md,
      minHeight: 44, // Accesibilidad: tap target mínimo 44x44
      gap: spacing.sm,
      width: fullWidth ? '100%' : 'auto',
    };

    if (Platform.OS === 'web') {
      (base as any).cursor = disabled || isLoading ? 'not-allowed' : 'pointer';
      (base as any).userSelect = 'none';
    }

    // Padding según size
    switch (size) {
      case 'sm':
        base.paddingVertical = spacing.xs + 2;
        base.paddingHorizontal = spacing.md;
        base.minHeight = 44;
        break;
      case 'md':
        base.paddingVertical = spacing.sm + 2;
        base.paddingHorizontal = spacing.lg;
        base.minHeight = 48;
        break;
      case 'lg':
        base.paddingVertical = spacing.md;
        base.paddingHorizontal = spacing.xl;
        base.minHeight = 56;
        break;
    }

    // Color según variante
    switch (variant) {
      case 'primary':
        base.backgroundColor = disabled ? colors.sand[300] : colors.ocean[500];
        break;
      case 'secondary':
        base.backgroundColor = disabled ? colors.sand[100] : colors.ocean[50];
        base.borderWidth = 1;
        base.borderColor = disabled ? colors.sand[200] : colors.ocean[200];
        break;
      case 'ghost':
        base.backgroundColor = 'transparent';
        break;
      case 'danger':
        base.backgroundColor = disabled ? colors.sand[300] : colors.semantic.danger;
        break;
    }

    return base;
  };

  const getTextColor = (): string => {
    if (disabled) return colors.sand[500];
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.white;
      case 'secondary':
        return colors.ocean[600];
      case 'ghost':
        return colors.ocean[600];
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[styles.button, getContainerStyle(), style]}
      testID={testID}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? colors.white : colors.ocean[500]}
        />
      ) : (
        <>
          {iconLeft}
          <Text variant="button" color={getTextColor()}>
            {title}
          </Text>
          {iconRight}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
  },
});
