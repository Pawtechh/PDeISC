import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { spacing } from '../../theme';

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
  size = 18,
  interactive = false,
  onRatingChange,
}) => {
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFilled = i <= Math.round(rating);
    const starNode = (
      <View key={i} style={styles.starWrapper}>
        <Star
          size={size}
          color={isFilled ? '#D4AF37' : '#475569'}
          fill={isFilled ? '#D4AF37' : 'transparent'}
          strokeWidth={1.5}
        />
      </View>
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
    gap: 4,
  },
  starWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchable: {
    padding: 2,
  },
});
