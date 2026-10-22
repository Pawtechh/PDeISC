import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { spacing, SpacingKey } from '../../theme';

export interface StackProps {
  children: React.ReactNode;
  spacing?: SpacingKey;
  style?: StyleProp<ViewStyle>;
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing: spacingKey = 'md',
  style,
  align = 'stretch',
}) => {
  return (
    <View style={[styles.stack, { gap: spacing[spacingKey], alignItems: align }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    flexDirection: 'column',
  },
});
