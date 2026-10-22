import React from 'react';
import { StyleSheet, TouchableOpacity, View, Platform } from 'react-native';
import { Text } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface TimeSlotChipProps {
  label: string;
  disponible: boolean;
  selected: boolean;
  onPress: () => void;
  tooltip?: string;
  testID?: string;
}

export const TimeSlotChip: React.FC<TimeSlotChipProps> = ({
  label,
  disponible,
  selected,
  onPress,
  tooltip,
  testID,
}) => {
  const { theme, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={disponible ? 0.7 : 1}
      disabled={!disponible}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? (isDark ? '#00E5FF' : colors.ocean[600])
            : !disponible
            ? (isDark ? 'rgba(255, 255, 255, 0.03)' : colors.sand[100])
            : (isDark ? '#101726' : colors.white),
          borderColor: selected
            ? (isDark ? '#38BDF8' : colors.ocean[700])
            : !disponible
            ? (isDark ? 'rgba(255, 255, 255, 0.08)' : colors.sand[200])
            : (isDark ? 'rgba(212, 175, 55, 0.45)' : colors.ocean[400]),
          opacity: !disponible ? 0.4 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !disponible }}
      accessibilityHint={tooltip}
      testID={testID}
    >
      <View style={{ alignItems: 'center' }}>
        <Text
          variant="caption"
          color={
            selected
              ? (isDark ? '#090C10' : colors.white)
              : !disponible
              ? (isDark ? '#64748B' : colors.sand[500])
              : (isDark ? '#F1F5F9' : colors.ocean[900])
          }
          style={[
            styles.text,
            selected && styles.bold,
            !disponible && styles.strikethrough,
          ]}
        >
          {selected ? `✓ ${label} hs` : `${label} hs`}
        </Text>
        {!disponible && (
          <Text
            variant="caption"
            color={isDark ? '#475569' : colors.sand[500]}
            style={styles.subtext}
          >
            No disp.
          </Text>
        )}
        {disponible && !selected && (
          <Text
            variant="caption"
            color={isDark ? '#38BDF8' : colors.semantic.success}
            style={[styles.subtext, { fontWeight: '600' }]}
          >
            Libre
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.sand[200],
    backgroundColor: colors.white,
    marginRight: 6,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer' as any,
      },
    }),
  },
  chipSelected: {
    backgroundColor: colors.ocean[500],
    borderColor: colors.ocean[600],
  },
  chipDisabled: {
    opacity: 0.45,
    backgroundColor: colors.sand[100],
    borderColor: colors.sand[200],
    ...Platform.select({
      web: {
        cursor: 'not-allowed' as any,
      },
    }),
  },
  text: {
    fontSize: 12,
  },
  bold: {
    fontWeight: '700',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  subtext: {
    fontSize: 9,
    color: colors.sand[500],
    marginTop: -2,
  },
});
