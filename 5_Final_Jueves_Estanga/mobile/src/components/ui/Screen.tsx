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
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, radii, colors } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { ScrollToTopWithRing } from './ScrollToTopWithRing';
import { ReadingProgressBar } from './ReadingProgressBar';
import { CommandPalette } from './CommandPalette';
import { Text } from './Text';

export const LUXURY_COASTAL_GRADIENT = ['#090C10', '#0C131F', '#080B0F'] as const;
export const LIGHT_COASTAL_GRADIENT = ['#F8FAFC', '#F1F5F9', '#E0F2FE'] as const;

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
   * Optionally wrap the screen in a deep luxury atmospheric coastal gradient ([#090C10, #0C131F, #080B0F] in dark, [#F8FAFC, #F1F5F9, #E0F2FE] in light)
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
  atmosphericGradient = false,
  gradientColors,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const screenBg = atmosphericGradient ? 'transparent' : (backgroundColor || theme.background);

  const internalScrollRef = useRef<ScrollView>(null);
  const activeScrollRef = scrollRef || internalScrollRef;
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener for Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setShowCommandPalette((prev) => !prev);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

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
  };

  const resolvedGradientColors = gradientColors || (isDark ? LUXURY_COASTAL_GRADIENT : LIGHT_COASTAL_GRADIENT);
  const rootBg = atmosphericGradient
    ? (isDark ? '#090C10' : '#F8FAFC')
    : (backgroundColor || theme.background);
  const statusBarBg = rootBg;

  const dynamicContentContainerStyle = [
    styles.contentContainer,
    fullWidth ? styles.fullWidthContainer : styles.standardContainer,
    contentContainerStyle,
  ];

  return (
    <View style={[styles.root, { backgroundColor: rootBg }]}>
      {/* Chiche 3: Barra de Progreso de Lectura Superior */}
      <ReadingProgressBar progress={scrollProgress} visible={scrollable} />

      {atmosphericGradient && (
        <LinearGradient
          colors={resolvedGradientColors as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      )}
      <SafeAreaView
        edges={safeBottom ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
        style={[styles.container, { backgroundColor: screenBg }, style]}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={statusBarBg}
        />
        {Platform.OS === 'web' && isDesktop && (
          <View
            style={[
              styles.desktopTopBar,
              {
                backgroundColor: isDark ? 'rgba(9, 12, 16, 0.88)' : 'rgba(255, 255, 255, 0.94)',
                borderBottomColor: isDark ? 'rgba(212, 175, 55, 0.22)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.desktopTopBarInner}>
              <View style={styles.desktopBrandGroup}>
                <Text style={styles.desktopBrandWave}>🌊</Text>
                <Text style={[styles.desktopBrandName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
                  SURF RENTAL
                </Text>
                <View style={styles.desktopBrandTag}>
                  <Text style={styles.desktopBrandTagText}>MDP</Text>
                </View>
              </View>

              <View style={styles.desktopStatusTicker}>
                <Text style={styles.desktopTickerDot}>●</Text>
                <Text style={styles.desktopTickerText}>SEDE CENTRAL PLAYA GRANDE • ABIERTA</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowCommandPalette(true)}
                style={[
                  styles.desktopCmdTrigger,
                  {
                    backgroundColor: isDark ? 'rgba(18, 24, 36, 0.9)' : '#F1F5F9',
                    borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : '#CBD5E1',
                  },
                ]}
              >
                <Text style={{ fontSize: 11, color: isDark ? '#94A3B8' : '#64748B' }}>
                  Comandos
                </Text>
                <View
                  style={[
                    styles.desktopCmdKbd,
                    { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : '#E2E8F0' },
                  ]}
                >
                  <Text
                    style={[
                      styles.desktopCmdKbdText,
                      { color: isDark ? '#00E5FF' : colors.ocean[700] },
                    ]}
                  >
                    ⌘K
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
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

        {/* Chiche 1: Botón Volver Arriba Minimalista con Anillo SVG */}
        {scrollable && showScrollToTop && (
          <ScrollToTopWithRing
            visible={isScrolledDown}
            progress={scrollProgress}
            onPress={handleScrollToTop}
          />
        )}

        {/* Modal de Paleta de Comandos */}
        <CommandPalette
          visible={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
        />
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
  desktopTopBar: {
    width: '100%',
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    zIndex: 990,
  },
  desktopTopBarInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  desktopBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopBrandWave: {
    fontSize: 18,
  },
  desktopBrandName: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  desktopBrandTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
  },
  desktopBrandTagText: {
    color: '#00E5FF',
    fontSize: 9,
    fontWeight: '800',
  },
  desktopStatusTicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  desktopTickerDot: {
    color: '#10B981',
    fontSize: 8,
  },
  desktopTickerText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  desktopCmdTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  desktopCmdKbd: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  desktopCmdKbdText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
