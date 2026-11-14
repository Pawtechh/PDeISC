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
          backgroundColor: isDark ? '#0284C7' : colors.ocean[600],
          borderWidth: 1,
          borderColor: isDark ? 'rgba(103, 232, 249, 0.55)' : colors.ocean[700],
          shadowColor: isDark ? '#06B6D4' : colors.ocean[600],
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.42 : 0.22,
          shadowRadius: 14,
          elevation: 5,
          ...(Platform.OS === 'web'
            ? ({
                backgroundImage:
                  'linear-gradient(135deg, #06B6D4 0%, #0EA5E9 52%, #0284C7 100%)',
                boxShadow: isDark
                  ? '0 8px 24px -4px rgba(14, 165, 233, 0.48), 0 0 16px rgba(34, 211, 238, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.30)'
                  : '0 8px 20px -4px rgba(2, 132, 199, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                overflow: 'hidden',
              } as any)
            : {}),
        };
      case 'secondary':
        return {
          backgroundColor: isDark ? 'rgba(14, 32, 58, 0.72)' : '#F1F5F9',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(2, 132, 199, 0.18)',
          ...(Platform.OS === 'web'
            ? ({
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              } as any)
            : {}),
        };
      case 'danger':
        return {
          backgroundColor: isDark ? '#EF4444' : colors.semantic.danger,
          borderWidth: 1,
          borderColor: '#F87171',
          ...(Platform.OS === 'web' ? ({ overflow: 'hidden' } as any) : {}),
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(2, 132, 199, 0.22)',
          ...(Platform.OS === 'web' ? ({ overflow: 'hidden' } as any) : {}),
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'danger':
        return '#FFFFFF';
      case 'secondary':
        return isDark ? '#F8FAFC' : colors.sand[900];
      case 'ghost':
        return isDark ? '#22D3EE' : colors.ocean[700];
    }
  };

  return (
    <AnimatedPressable
      testID={testID}
      {...(Platform.OS === 'web' ? ({ dataSet: { luxuryBtn: variant } } as any) : {})}
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
