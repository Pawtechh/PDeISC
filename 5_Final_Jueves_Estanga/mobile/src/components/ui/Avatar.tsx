import React from 'react';
import { View, StyleSheet, Image, StyleProp, ViewStyle } from 'react-native';
import { colors, radii } from '../../theme';
import { Text } from './Text';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  source?: string;
  name?: string;
  size?: AvatarSize;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = 'SR',
  size = 'md',
  style,
}) => {
  const getDimension = (): number => {
    switch (size) {
      case 'sm':
        return 32;
      case 'md':
        return 44;
      case 'lg':
        return 56;
      case 'xl':
        return 72;
    }
  };

  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const dimension = getDimension();

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: radii.full,
          backgroundColor: colors.ocean[100],
        },
        style,
      ]}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={{ width: dimension, height: dimension, borderRadius: radii.full }}
          resizeMode="cover"
        />
      ) : (
        <Text
          variant={size === 'sm' ? 'caption' : size === 'lg' || size === 'xl' ? 'h3' : 'button'}
          color={colors.ocean[700]}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
