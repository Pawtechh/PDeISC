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
  const { isDark } = useTheme();

  if (!visible) return null;

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const widthPercent = `${(clampedProgress * 100).toFixed(1)}%`;

  const gradientColors = isDark
    ? (['#00E5FF', '#D4AF37', '#00E5FF'] as const)
    : (['#0284C7', '#D4AF37', '#0284C7'] as const);

  return (
    <View style={styles.container} pointerEvents="none">
      <View style={[styles.bar, { width: widthPercent as any }]}>
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
    height: 3,
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  bar: {
    height: '100%',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
