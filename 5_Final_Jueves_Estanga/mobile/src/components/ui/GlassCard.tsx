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
  const { isDark } = useTheme();

  // Resolved padding
  const resolvedPadding =
    typeof padding === 'number' ? padding : spacing[padding] ?? spacing.lg;

  // Border & Glow styling
  const getGlowStyles = (): ViewStyle => {
    switch (glow) {
      case 'champagne':
        return {
          borderColor: 'rgba(212, 175, 55, 0.25)', // Golden champagne glow
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 4,
        };
      case 'cyan':
        return {
          borderColor: 'rgba(0, 229, 255, 0.22)', // Neon cyan ocean pulse
          shadowColor: '#00E5FF',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 10,
          elevation: 4,
        };
      case 'none':
      default:
        return {
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 2,
        };
    }
  };

  // Gradient shimmer colors based on glow mode
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (glow) {
      case 'cyan':
        return [
          'rgba(0, 229, 255, 0.08)',
          'rgba(18, 24, 36, 0.25)',
          'rgba(212, 175, 55, 0.02)',
        ];
      case 'none':
        return [
          'rgba(255, 255, 255, 0.04)',
          'rgba(18, 24, 36, 0.2)',
          'rgba(0, 0, 0, 0.1)',
        ];
      case 'champagne':
      default:
        return [
          'rgba(212, 175, 55, 0.08)',
          'rgba(18, 24, 36, 0.25)',
          'rgba(0, 229, 255, 0.03)',
        ];
    }
  };

  // Web-specific backdrop blur style for full browser fidelity
  const webBackdropStyle: ViewStyle | undefined =
    Platform.OS === 'web'
      ? ({
          backdropFilter: `blur(${intensity / 2}px)`,
          WebkitBackdropFilter: `blur(${intensity / 2}px)`,
        } as any)
      : undefined;

  const cardContent = (
    <View
      testID={testID}
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
            backgroundColor: isDark ? 'rgba(18, 24, 36, 0.82)' : 'rgba(255, 255, 255, 0.85)',
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
