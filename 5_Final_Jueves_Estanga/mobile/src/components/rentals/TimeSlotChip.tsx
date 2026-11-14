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
            ? '#FF5A36'
            : !disponible
            ? (isDark ? 'rgba(255, 255, 255, 0.03)' : '#F4F4F5')
            : (isDark ? 'rgba(255, 255, 255, 0.05)' : colors.white),
          borderColor: selected
            ? '#FF5A36'
            : !disponible
            ? (isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)')
            : (isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.12)'),
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
              ? '#FFFFFF'
              : !disponible
              ? (isDark ? '#71717A' : '#A1A1AA')
              : (isDark ? '#F5F5F7' : '#111115')
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
            color={isDark ? '#52525B' : '#A1A1AA'}
            style={styles.subtext}
          >
            No disp.
          </Text>
        )}
        {disponible && !selected && (
          <Text
            variant="caption"
            color={isDark ? '#10B981' : colors.semantic.success}
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
    backgroundColor: '#FF5A36',
    borderColor: '#E04320',
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
