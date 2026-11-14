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
      {...(Platform.OS === 'web' ? ({ dataSet: { glassCard: 'true' } } as any) : {})}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? 'rgba(9, 20, 38, 0.74)' : 'rgba(255, 255, 255, 0.88)',
          borderColor: isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(2, 132, 199, 0.14)',
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(22px) saturate(170%)',
              WebkitBackdropFilter: 'blur(22px) saturate(170%)',
              boxShadow: isDark
                ? '0 16px 40px -10px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(165, 243, 252, 0.14)'
                : '0 12px 32px -8px rgba(2, 132, 199, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              transition: 'border-color 0.28s ease, box-shadow 0.28s ease, transform 0.28s ease',
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
