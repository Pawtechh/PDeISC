import React, { useRef, useState } from 'react';
import { View, StyleSheet, StatusBar, StyleProp, ViewStyle, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { ScrollToTopButton } from './ScrollToTopButton';

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const yOffset = event.nativeEvent.contentOffset.y;
    if (yOffset > 150 && !isScrolledDown) {
      setIsScrolledDown(true);
    } else if (yOffset <= 150 && isScrolledDown) {
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

        {scrollable && showScrollToTop && (
          <ScrollToTopButton
            visible={isScrolledDown}
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
    maxWidth: 1440,
  },
  fullWidthContainer: {
    maxWidth: '100%',
    paddingHorizontal: spacing.xl,
  },
});
