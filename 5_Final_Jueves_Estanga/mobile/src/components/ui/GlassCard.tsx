import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export type GlassCardGlow = 'champagne' | 'cyan' | 'none';

export interface GlassCardProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  /**
   * Blur intensity (30-50 recommended for Luxury Coastal dark mode, default 40)
   */
  intensity?: number;
  /**
   * Blur tint, defaults to 'dark'
   */
  tint?: BlurTint;
  /**
   * Subtle border glow accent: 'champagne' gold, neon 'cyan', or 'none'
   */
  glow?: GlassCardGlow;
  /**
   * Whether to include the sleek coastal gradient shimmer overlay
   */
  gradientOverlay?: boolean;
  onPress?: () => void;
  padding?: keyof typeof spacing | number;
  borderRadius?: number;
  activeOpacity?: number;
  testID?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  contentStyle,
  intensity = 40,
  tint = 'dark',
  glow = 'champagne',
  gradientOverlay = true,
  onPress,
  padding = 'lg',
  borderRadius = radii.lg,
  activeOpacity = 0.85,
  testID,
}) => {
  const { theme, isDark } = useTheme();

  // Resolved padding
  const resolvedPadding =
    typeof padding === 'number' ? padding : spacing[padding] ?? spacing.lg;

  // Border & Glow styling
  const getGlowStyles = (): ViewStyle => {
    switch (glow) {
      case 'champagne':
        return {
          borderColor: theme.border,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.24 : 0.07,
          shadowRadius: 16,
          elevation: 4,
        };
      case 'cyan':
        return {
          borderColor: theme.primaryBorder,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.24 : 0.07,
          shadowRadius: 16,
          elevation: 4,
        };
      case 'none':
      default:
        return {
          borderColor: theme.border,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.20 : 0.06,
          shadowRadius: 12,
          elevation: 2,
        };
    }
  };

  // Gradient shimmer colors based on glow mode
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (glow) {
      case 'cyan':
        return isDark
          ? ['rgba(242, 245, 244, 0.035)', 'rgba(35, 42, 46, 0.18)', 'rgba(56, 189, 199, 0.04)']
          : ['rgba(255, 255, 255, 0.48)', 'rgba(252, 252, 250, 0.18)', 'rgba(14, 107, 116, 0.02)'];
      case 'none':
        return isDark
          ? ['rgba(242, 245, 244, 0.03)', 'rgba(35, 42, 46, 0.18)', 'rgba(0, 0, 0, 0.04)']
          : ['rgba(255, 255, 255, 0.35)', 'rgba(252, 252, 250, 0.15)', 'rgba(0, 0, 0, 0.01)'];
      case 'champagne':
      default:
        return isDark
          ? ['rgba(242, 245, 244, 0.035)', 'rgba(35, 42, 46, 0.20)', 'rgba(217, 174, 87, 0.03)']
          : ['rgba(255, 255, 255, 0.48)', 'rgba(252, 252, 250, 0.18)', 'rgba(154, 99, 18, 0.02)'];
    }
  };

  // Web-specific backdrop blur style for full browser fidelity
  const webBackdropStyle: ViewStyle | undefined =
    Platform.OS === 'web'
      ? ({
          backdropFilter: `blur(${Math.max(16, intensity / 2)}px) saturate(140%)`,
          WebkitBackdropFilter: `blur(${Math.max(16, intensity / 2)}px) saturate(140%)`,
        } as any)
      : undefined;

  const cardContent = (
    <View
      testID={testID}
      {...(Platform.OS === 'web' ? ({ dataSet: { glass: glow || 'true', glassCard: 'true' } } as any) : {})}
      style={[
        styles.outerContainer,
        { borderRadius },
        getGlowStyles(),
        style,
      ]}
    >
      {/* 1. Graceful fallback background for web, Android, and older devices */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: theme.card,
            borderRadius,
          },
          webBackdropStyle,
        ]}
      />

      {/* 2. Expo BlurView for native glassmorphism (iOS, modern Android, web) */}
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />

      {/* 3. Sleek atmospheric linear gradient overlay */}
      {gradientOverlay && (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius }]}
          pointerEvents="none"
        />
      )}

      {/* 4. Card Content */}
      <View style={[{ padding: resolvedPadding }, contentStyle]}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  outerContainer: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
});
