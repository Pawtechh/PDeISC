import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Text } from './Text';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { useTheme } from '../../theme/ThemeContext';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 88,
};

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = 'Surfista',
  size = 'md',
  style,
}) => {
  const { theme, isDark } = useTheme();
  const dimension = sizeMap[size];
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          backgroundColor: theme.primarySubtle,
          borderWidth: 1.5,
          borderColor: theme.primaryBorder,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: dimension, height: dimension }}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <Text
          variant={size === 'xl' ? 'h2' : size === 'lg' ? 'h3' : 'button'}
          color={isDark ? theme.primaryHover : theme.primary}
        >
          {initials || 'SR'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.full,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
