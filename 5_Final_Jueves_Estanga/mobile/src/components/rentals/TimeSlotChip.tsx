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
            ? theme.primary
            : !disponible
            ? theme.cardHighlight
            : theme.card,
          borderColor: selected
            ? theme.primary
            : theme.border,
          opacity: !disponible ? 0.45 : 1,
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
              ? '#FDFCFA'
              : !disponible
              ? theme.muted
              : theme.text
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
            color={theme.muted}
            style={styles.subtext}
          >
            No disp.
          </Text>
        )}
        {disponible && !selected && (
          <Text
            variant="caption"
            color={theme.successText}
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
    backgroundColor: colors.coral[500],
    borderColor: colors.coral[600],
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
