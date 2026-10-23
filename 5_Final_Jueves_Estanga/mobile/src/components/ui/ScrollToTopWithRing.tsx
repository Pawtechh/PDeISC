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
  const { theme, isDark } = useTheme();

  if (!visible) return null;

  const size = 52;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const strokeDashoffset = circumference - circumference * clampedProgress;
  const percentText = Math.round(clampedProgress * 100);

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
  const trackColor = isDark ? 'rgba(212, 175, 55, 0.2)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#121824' : colors.white,
          shadowColor: primaryColor,
        },
        style,
      ]}
      accessibilityLabel={`Volver arriba (${percentText}% leído)`}
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
        <Text style={{ fontSize: 13, lineHeight: 16 }}>▲</Text>
        <Text
          variant="caption"
          style={[
            styles.percentText,
            { color: isDark ? '#D4AF37' : colors.ocean[700] },
          ]}
        >
          {percentText}%
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
    width: 52,
    height: 52,
    borderRadius: radii.full,
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
  percentText: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: -2,
  },
});
