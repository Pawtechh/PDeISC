import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../ui';
import { colors, spacing } from '../../theme';

export interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 22,
  interactive = false,
  onRatingChange,
}) => {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= Math.round(rating);
    const starNode = (
      <Text
        key={i}
        style={[
          styles.star,
          {
            fontSize: size,
            color: isFilled ? colors.sunset[500] : colors.sand[300],
          },
        ]}
      >
        ★
      </Text>
    );

    if (interactive) {
      stars.push(
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => onRatingChange?.(i)}
          style={styles.touchable}
        >
          {starNode}
        </TouchableOpacity>
      );
    } else {
      stars.push(starNode);
    }
  }

  return <View style={styles.container}>{stars}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  touchable: {
    padding: 2,
  },
  star: {
    fontWeight: '900',
  },
});
