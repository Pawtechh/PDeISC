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

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
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
  const { theme, isDark } = useTheme();
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
          backgroundColor: theme.primary,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(81, 204, 213, 0.42)' : theme.primaryDeep,
          shadowColor: theme.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.22 : 0.16,
          shadowRadius: 14,
          elevation: 5,
          ...(Platform.OS === 'web'
            ? ({
                backgroundImage: isDark
                  ? 'linear-gradient(135deg, #51CCD5 0%, #38BDC7 55%, #2499A3 100%)'
                  : 'linear-gradient(135deg, #13828C 0%, #0E6B74 55%, #08444A 100%)',
                boxShadow: isDark
                  ? '0 8px 20px -6px rgba(56, 189, 199, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                  : '0 8px 18px -6px rgba(14, 107, 116, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.24)',
                overflow: 'hidden',
              } as any)
            : {}),
        };
      case 'secondary':
        return {
          backgroundColor: isDark ? 'rgba(242, 245, 244, 0.06)' : theme.cardHighlight,
          borderWidth: 1,
          borderColor: theme.border,
          ...(Platform.OS === 'web'
            ? ({
                overflow: 'hidden',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              } as any)
            : {}),
        };
      case 'danger':
        return {
          backgroundColor: isDark ? '#B9403A' : '#B63933',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(236, 122, 115, 0.38)' : '#8B2621',
          ...(Platform.OS === 'web' ? ({ overflow: 'hidden' } as any) : {}),
        };
      case 'success':
        return {
          backgroundColor: '#1D6F5A',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(79, 195, 161, 0.42)' : '#155444',
          ...(Platform.OS === 'web' ? ({ overflow: 'hidden' } as any) : {}),
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.border,
          ...(Platform.OS === 'web' ? ({ overflow: 'hidden' } as any) : {}),
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return theme.primaryText;
      case 'danger':
        return '#FFFFFF';
      case 'success':
        return '#FFFFFF';
      case 'secondary':
        return theme.text;
      case 'ghost':
        return isDark ? theme.primaryHover : theme.primary;
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
