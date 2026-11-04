import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
  View,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  iconLeft,
  iconRight,
  style,
  accessibilityLabel,
  testID,
}) => {
  const { isDark } = useTheme();
  const isDisabled = disabled || isLoading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(0.97, { damping: 16, stiffness: 320 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 260 });
  };

  const handlePress = () => {
    if (isDisabled) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDark ? '#00E5FF' : colors.ocean[600],
          borderWidth: 1,
          borderColor: isDark ? '#67E8F9' : colors.ocean[700],
          shadowColor: isDark ? '#00E5FF' : colors.ocean[600],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.25 : 0.2,
          shadowRadius: 10,
          elevation: 4,
        };
      case 'secondary':
        return {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : '#CBD5E1',
        };
      case 'danger':
        return {
          backgroundColor: isDark ? '#EF4444' : colors.semantic.danger,
          borderWidth: 1,
          borderColor: '#F87171',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return isDark ? '#090C10' : colors.white;
      case 'danger':
        return colors.white;
      case 'secondary':
        return isDark ? '#F1F5F9' : colors.sand[900];
      case 'ghost':
        return isDark ? '#CBD5E1' : colors.ocean[700];
    }
  };

  return (
    <AnimatedPressable
      testID={testID}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={[
        styles.base,
        styles[`size_${size}`],
        getVariantStyle(),
        fullWidth && { width: '100%' },
        isDisabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <Text
            variant="button"
            color={getTextColor()}
            style={{
              fontWeight: variant === 'primary' ? '800' : '600',
              letterSpacing: 0.4,
            }}
          >
            {title}
          </Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  size_sm: {
    paddingVertical: spacing.xs + 3,
    paddingHorizontal: spacing.md,
    minHeight: 38,
  },
  size_md: {
    paddingVertical: spacing.sm + 3,
    paddingHorizontal: spacing.lg,
    minHeight: 46,
  },
  size_lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 54,
  },
  disabled: {
    opacity: 0.48,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
