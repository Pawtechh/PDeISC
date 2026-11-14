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
          borderColor: 'rgba(251, 191, 36, 0.28)', // Golden champagne glow
          shadowColor: '#F59E0B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'cyan':
        return {
          borderColor: 'rgba(34, 211, 238, 0.28)', // Bioluminescent cyan pulse
          shadowColor: '#22D3EE',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.24,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'none':
      default:
        return {
          borderColor: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(2, 132, 199, 0.12)',
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
          'rgba(34, 211, 238, 0.10)',
          'rgba(9, 20, 38, 0.30)',
          'rgba(45, 212, 191, 0.05)',
        ];
      case 'none':
        return [
          'rgba(255, 255, 255, 0.04)',
          'rgba(9, 20, 38, 0.22)',
          'rgba(0, 0, 0, 0.10)',
        ];
      case 'champagne':
      default:
        return [
          'rgba(251, 191, 36, 0.09)',
          'rgba(9, 20, 38, 0.30)',
          'rgba(34, 211, 238, 0.05)',
        ];
    }
  };

  // Web-specific backdrop blur style for full browser fidelity
  const webBackdropStyle: ViewStyle | undefined =
    Platform.OS === 'web'
      ? ({
          backdropFilter: `blur(${Math.max(16, intensity / 2)}px) saturate(170%)`,
          WebkitBackdropFilter: `blur(${Math.max(16, intensity / 2)}px) saturate(170%)`,
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
            backgroundColor: isDark ? 'rgba(9, 20, 38, 0.76)' : 'rgba(255, 255, 255, 0.88)',
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
