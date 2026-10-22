import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing } from '../../theme';

export interface DividerProps {
  style?: StyleProp<ViewStyle>;
  color?: string;
  marginVertical?: keyof typeof spacing;
}

export const Divider: React.FC<DividerProps> = ({
  style,
  color = colors.sand[200],
  marginVertical = 'md',
}) => {
  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: color,
          marginVertical: spacing[marginVertical],
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: '100%',
  },
});
