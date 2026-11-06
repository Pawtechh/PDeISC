import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, TouchableOpacity, Platform } from 'react-native';
import { colors, radii, shadows, spacing, ShadowKey } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shadow?: ShadowKey;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  elevated?: boolean;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  shadow = 'sm',
  onPress,
  padding = 'lg',
  testID,
}) => {
  const { theme, isDark } = useTheme();

  const content = (
    <View
      testID={testID}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(19, 28, 46, 0.82)' : theme.card,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease',
            } as any)
          : null,
        shadows[shadow],
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
