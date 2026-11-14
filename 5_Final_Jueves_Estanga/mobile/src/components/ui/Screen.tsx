import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  StyleProp,
  ViewStyle,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { ScrollToTopWithRing } from './ScrollToTopWithRing';
import { ReadingProgressBar } from './ReadingProgressBar';
import { DesktopHeader } from './DesktopHeader';

export const LUXURY_COASTAL_GRADIENT = ['#030812', '#061326', '#081B33'] as const;
export const LIGHT_COASTAL_GRADIENT = ['#F2F8FC', '#E4F3FA', '#FDF8EE'] as const;

export interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  safeBottom?: boolean;
  refreshControl?: React.ReactElement;
  showScrollToTop?: boolean;
  scrollRef?: React.RefObject<ScrollView | null>;
  /**
   * Expands content to 100% viewport width without narrow centered container limits on desktop
   */
  fullWidth?: boolean;
  /**
   * Optionally wrap the screen in a deep luxury atmospheric coastal gradient
   */
  atmosphericGradient?: boolean;
  /**
   * Custom gradient colors if atmosphericGradient is enabled. Defaults to LUXURY_COASTAL_GRADIENT in dark, LIGHT_COASTAL_GRADIENT in light.
   */
  gradientColors?: readonly [string, string, ...string[]] | string[];
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scrollable = false,
  style,
  contentContainerStyle,
  backgroundColor,
  safeBottom = true,
  refreshControl,
  showScrollToTop = true,
  scrollRef,
  fullWidth = false,
  atmosphericGradient = true,
  gradientColors,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const screenBg = atmosphericGradient ? 'transparent' : (backgroundColor || theme.background);

  const internalScrollRef = useRef<ScrollView>(null);
  const activeScrollRef = scrollRef || internalScrollRef;
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const yOffset = contentOffset.y;
    const scrollableDistance = contentSize.height - layoutMeasurement.height;
    const calculatedProgress = scrollableDistance > 0 ? yOffset / scrollableDistance : 0;
    setScrollProgress(Math.min(Math.max(calculatedProgress, 0), 1));

    if (yOffset > 180 && !isScrolledDown) {
      setIsScrolledDown(true);
    } else if (yOffset <= 180 && isScrolledDown) {
      setIsScrolledDown(false);
    }
  };

  const handleScrollToTop = () => {
    activeScrollRef.current?.scrollTo({ y: 0, animated: true });
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // safe fallback
      }
    }
  };

  const resolvedGradientColors =
    gradientColors ||
    (Platform.OS === 'web'
      ? isDark
        ? (['rgba(3, 8, 18, 0.34)', 'rgba(6, 19, 38, 0.14)', 'rgba(4, 10, 22, 0.48)'] as const)
        : (['rgba(242, 248, 252, 0.40)', 'rgba(228, 243, 250, 0.16)', 'rgba(253, 248, 238, 0.44)'] as const)
      : isDark
      ? LUXURY_COASTAL_GRADIENT
      : LIGHT_COASTAL_GRADIENT);

  const rootBg =
    Platform.OS === 'web'
      ? atmosphericGradient
        ? 'transparent'
        : backgroundColor || (isDark ? 'rgba(4, 9, 20, 0.72)' : 'rgba(242, 248, 252, 0.78)')
      : atmosphericGradient
      ? isDark
        ? '#040914'
        : '#F2F8FC'
      : backgroundColor || theme.background;
  const statusBarBg = isDark ? '#040914' : '#F2F8FC';

  const dynamicContentContainerStyle = [
    styles.contentContainer,
    fullWidth ? styles.fullWidthContainer : styles.standardContainer,
    {
      paddingBottom: isDesktop ? 160 : 48,
    },
    contentContainerStyle,
  ];

  return (
    <View style={[styles.root, { backgroundColor: rootBg }]}>
      {/* Barra de Progreso de Lectura Superior */}
      <ReadingProgressBar progress={scrollProgress} visible={scrollable} />

      {/* Flagship Desktop Header (Brand Identity, Telemetry & User Role) */}
      {isDesktop && <DesktopHeader />}

      {atmosphericGradient && (
        <LinearGradient
          colors={resolvedGradientColors as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      )}

      {/* Ambient Coastal Atmospheric Glows (Bioluminescent Dark & Sunlit Daylight) */}
      {atmosphericGradient && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { ambientGlow: 'cyan' } } as any) : {})}
            style={[
              styles.ambientCyanGlow,
              !isDark && styles.ambientCyanGlowLight,
              Platform.OS === 'web' ? ({ filter: 'blur(90px)', pointerEvents: 'none' } as any) : {},
            ]}
          />
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { ambientGlow: 'gold' } } as any) : {})}
            style={[
              styles.ambientGoldGlow,
              !isDark && styles.ambientGoldGlowLight,
              Platform.OS === 'web' ? ({ filter: 'blur(85px)', pointerEvents: 'none' } as any) : {},
            ]}
          />
        </View>
      )}

      <SafeAreaView
        edges={safeBottom ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
        style={[styles.container, { backgroundColor: screenBg }, style]}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={statusBarBg}
        />
        {scrollable ? (
          <ScrollView
            ref={activeScrollRef as any}
            style={styles.scrollView}
            contentContainerStyle={dynamicContentContainerStyle}
            showsVerticalScrollIndicator={false}
            refreshControl={refreshControl}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={dynamicContentContainerStyle}>{children}</View>
        )}

        {/* Botón Volver Arriba Minimalista */}
        {scrollable && showScrollToTop && (
          <ScrollToTopWithRing
            visible={isScrolledDown}
            progress={scrollProgress}
            onPress={handleScrollToTop}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  standardContainer: {
    maxWidth: 1280,
  },
  fullWidthContainer: {
    maxWidth: '100%',
    paddingHorizontal: spacing.xl,
  },
  ambientCyanGlow: {
    position: 'absolute',
    top: -100,
    left: '15%',
    width: 600,
    height: 400,
    borderRadius: 300,
    backgroundColor: 'rgba(34, 211, 238, 0.09)',
  },
  ambientCyanGlowLight: {
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  ambientGoldGlow: {
    position: 'absolute',
    top: 100,
    right: '8%',
    width: 500,
    height: 360,
    borderRadius: 250,
    backgroundColor: 'rgba(251, 191, 36, 0.06)',
  },
  ambientGoldGlowLight: {
    backgroundColor: 'rgba(245, 158, 11, 0.07)',
  },
});
