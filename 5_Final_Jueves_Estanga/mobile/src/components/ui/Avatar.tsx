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
  const { isDark } = useTheme();
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
          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : colors.ocean[100],
          borderWidth: 1.5,
          borderColor: isDark ? 'rgba(56, 189, 248, 0.38)' : colors.ocean[300],
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
          color={isDark ? '#38BDF8' : colors.ocean[700]}
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
