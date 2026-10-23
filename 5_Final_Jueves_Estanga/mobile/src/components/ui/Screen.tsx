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

        {/* Chiche 4: Floating Command Palette Trigger Pill */}
        {Platform.OS === 'web' && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.cmdPill,
              {
                backgroundColor: isDark ? 'rgba(18, 24, 36, 0.9)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : colors.sand[300],
              },
            ]}
            onPress={() => setShowCommandPalette(true)}
            accessibilityLabel="Abrir menú de comandos (Cmd+K)"
            testID="btn-open-command-palette"
          >
            <Text style={{ fontSize: 13 }}>⚡</Text>
            <Text
              variant="caption"
              color={isDark ? '#00E5FF' : colors.ocean[700]}
              style={{ fontWeight: '700', fontSize: 11 }}
            >
              ⌘K
            </Text>
          </TouchableOpacity>
        )}

        {/* Chiche 1: Botón Volver Arriba con Anillo SVG de Porcentaje */}
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
    maxWidth: 1440,
  },
  fullWidthContainer: {
    maxWidth: '100%',
    paddingHorizontal: spacing.xl,
  },
  cmdPill: {
    position: 'absolute',
    top: 14,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 998,
  },
});
