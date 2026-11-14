import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';

export interface ReadingProgressBarProps {
  progress: number; // 0 to 1
  visible?: boolean;
}

export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  progress = 0,
  visible = true,
}) => {
  const { theme, isDark } = useTheme();

  if (!visible) return null;

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const widthPercent = `${(clampedProgress * 100).toFixed(1)}%`;

  const gradientColors = isDark
    ? ([theme.primaryDeep, theme.primary, theme.champagne] as const)
    : ([theme.primaryDeep, theme.primary, theme.champagne] as const);

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.bar, { width: widthPercent as any, shadowColor: theme.primary }]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  bar: {
    height: '100%',
    shadowColor: '#38BDC7',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 4,
  },
});
