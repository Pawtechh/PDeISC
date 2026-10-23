import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform, StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from './Text';
import { colors, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface ScrollToTopWithRingProps {
  onPress: () => void;
  progress: number; // 0 to 1
  visible?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ScrollToTopWithRing: React.FC<ScrollToTopWithRingProps> = ({
  onPress,
  progress = 0,
  visible = true,
  style,
}) => {
  const { isDark } = useTheme();

  if (!visible) return null;

  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - circumference * clampedProgress;

  const handlePress = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch {
      // safe fallback
    }
    onPress();
  };

  const primaryColor = isDark ? '#00E5FF' : colors.ocean[600];
  const trackColor = isDark ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(18, 24, 36, 0.92)' : 'rgba(255, 255, 255, 0.96)',
          shadowColor: primaryColor,
          borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : 'rgba(0, 0, 0, 0.1)',
        },
        style,
      ]}
      accessibilityLabel="Volver arriba"
      accessibilityRole="button"
      testID="btn-scroll-to-top-ring"
    >
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Foreground animated progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.innerContent}>
        <Text
          style={[
            styles.arrowIcon,
            { color: isDark ? '#00E5FF' : colors.ocean[600] },
          ]}
        >
          ↑
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 84,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    zIndex: 999,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '700',
  },
});
