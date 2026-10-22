import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { spacing, SpacingKey } from '../../theme';

export interface RowProps {
  children: React.ReactNode;
  spacing?: SpacingKey;
  style?: StyleProp<ViewStyle>;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  wrap?: boolean;
}

export const Row: React.FC<RowProps> = ({
  children,
  spacing: spacingKey = 'md',
  style,
  align = 'center',
  justify = 'flex-start',
  wrap = false,
}) => {
  return (
    <View
      style={[
        styles.row,
        {
          gap: spacing[spacingKey],
          alignItems: align,
          justifyContent: justify,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});
