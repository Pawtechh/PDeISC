import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedReaction,
  SharedValue,
} from 'react-native-reanimated';
import { Board } from '../../api/boardsApi';
import { SurfboardCard } from './SurfboardCard';
import { spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface Board3DCarouselProps {
  boards: Board[];
  onPressDetail: (board: Board) => void;
  onPressReserve: (board: Board) => void;
}

const triggerHaptic = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Non-blocking fallback
  }
};

interface CarouselCardItemProps {
  board: Board;
  index: number;
  scrollX: SharedValue<number>;
  cardWidth: number;
  isDesktop: boolean;
  onPressDetail: (board: Board) => void;
  onPressReserve: (board: Board) => void;
}

const CarouselCardItem: React.FC<CarouselCardItemProps> = ({
  board,
  index,
  scrollX,
  cardWidth,
  isDesktop,
  onPressDetail,
  onPressReserve,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    if (isDesktop) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }],
      };
    }

    const inputRange = [
      (index - 1) * cardWidth,
      index * cardWidth,
      (index + 1) * cardWidth,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.93, 1.0, 0.93],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.65, 1.0, 0.65],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          width: cardWidth,
          paddingHorizontal: 7,
        },
        animatedStyle,
      ]}
    >
      <SurfboardCard
        board={board}
        isFeatured={true}
        onPressDetail={() => onPressDetail(board)}
        onPressReserve={() => onPressReserve(board)}
        testID={`board-3d-detail-${board.id}`}
      />
    </Animated.View>
  );
};

interface PaginationDotProps {
  index: number;
  scrollX: SharedValue<number>;
  cardWidth: number;
  onPressDot: (idx: number) => void;
}

const PaginationDot: React.FC<PaginationDotProps> = ({ index, scrollX, cardWidth, onPressDot }) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * cardWidth,
      index * cardWidth,
      (index + 1) * cardWidth,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [6, 24, 6],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.35, 1, 0.35],
      Extrapolation.CLAMP
    );

    return {
      width,
      opacity,
      backgroundColor: opacity > 0.65 ? '#38BDF8' : '#F59E0B',
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPressDot(index)}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Animated.View style={[styles.dot, animatedDotStyle]} />
    </TouchableOpacity>
  );
};

export const Board3DCarousel: React.FC<Board3DCarouselProps> = ({
  boards,
  onPressDetail,
  onPressReserve,
}) => {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimerRef = useRef<any>(null);

  const isDesktop = width >= 900;
  // On desktop, show 3 balanced featured cards side-by-side without a blank left void
  const effectiveWidth = Math.min(width - 32, 1248);
  const CARD_WIDTH = isDesktop
    ? Math.floor(effectiveWidth / 3)
    : Math.min(width * 0.84, 420);
  const SPACING = isDesktop ? 0 : (width - CARD_WIDTH) / 2;

  const scrollX = useSharedValue(0);
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    scrollX.value = 0;
    setCurrentIndex(0);
  }, [boards]);

  useEffect(() => {
    if (boards.length <= 1 || isInteracting) return;

    const maxIndex = isDesktop ? Math.max(0, boards.length - 3) : boards.length - 1;
    if (maxIndex <= 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev >= maxIndex ? 0 : prev + 1;
        flatListRef.current?.scrollToOffset({
          offset: next * CARD_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [boards.length, isInteracting, CARD_WIDTH, isDesktop]);

  const onUserInteractionStart = useCallback(() => {
    setIsInteracting(true);
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
  }, []);

  const onUserInteractionEnd = useCallback(() => {
    if (interactionTimerRef.current) {
      clearTimeout(interactionTimerRef.current);
    }
    interactionTimerRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 5000);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  useAnimatedReaction(
    () => Math.round(scrollX.value / CARD_WIDTH),
    (current, previous) => {
      if (current >= 0 && current < boards.length) {
        runOnJS(setCurrentIndex)(current);
      }
      if (
        previous !== null &&
        current !== previous &&
        current >= 0 &&
        current < boards.length
      ) {
        runOnJS(triggerHaptic)();
      }
    },
    [CARD_WIDTH, boards.length]
  );

  const scrollToIndex = useCallback(
    (targetIndex: number) => {
      const safeIndex = Math.max(0, Math.min(boards.length - 1, targetIndex));
      triggerHaptic();
      onUserInteractionStart();
      flatListRef.current?.scrollToOffset({
        offset: safeIndex * CARD_WIDTH,
        animated: true,
      });
      setCurrentIndex(safeIndex);
      onUserInteractionEnd();
    },
    [boards.length, CARD_WIDTH, onUserInteractionStart, onUserInteractionEnd]
  );

  const handlePrev = useCallback(() => {
    scrollToIndex(currentIndex - 1);
  }, [currentIndex, scrollToIndex]);

  const handleNext = useCallback(() => {
    scrollToIndex(currentIndex + 1);
  }, [currentIndex, scrollToIndex]);

  if (!boards || boards.length === 0) {
    return null;
  }

  const isFirst = currentIndex === 0;
  const isLast = isDesktop
    ? currentIndex >= Math.max(0, boards.length - 3)
    : currentIndex === boards.length - 1;

  return (
    <View style={styles.carouselContainer}>
      <View style={styles.carouselTrackWrapper}>
        <Animated.FlatList
          ref={flatListRef}
          data={boards}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH}
          decelerationRate="fast"
          snapToAlignment="start"
          nestedScrollEnabled
          contentContainerStyle={[
            styles.contentContainer,
            { paddingHorizontal: SPACING },
          ]}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onTouchStart={onUserInteractionStart}
          onTouchEnd={onUserInteractionEnd}
          onScrollBeginDrag={onUserInteractionStart}
          onScrollEndDrag={onUserInteractionEnd}
          onMomentumScrollEnd={onUserInteractionEnd}
          renderItem={({ item, index }) => (
            <CarouselCardItem
              board={item}
              index={index}
              scrollX={scrollX}
              cardWidth={CARD_WIDTH}
              isDesktop={isDesktop}
              onPressDetail={onPressDetail}
              onPressReserve={onPressReserve}
            />
          )}
          getItemLayout={(_, index) => ({
            length: CARD_WIDTH,
            offset: CARD_WIDTH * index,
            index,
          })}
        />

        {!isFirst && width >= 600 && (
          <TouchableOpacity
            style={[
              styles.floatingArrow,
              styles.floatingArrowLeft,
              {
                backgroundColor: isDark ? 'rgba(9, 12, 16, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#CBD5E1',
              },
            ]}
            onPress={handlePrev}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft size={20} color={isDark ? '#F8FAFC' : '#0F172A'} />
          </TouchableOpacity>
        )}

        {!isLast && width >= 600 && (
          <TouchableOpacity
            style={[
              styles.floatingArrow,
              styles.floatingArrowRight,
              {
                backgroundColor: isDark ? 'rgba(9, 12, 16, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(245, 158, 11, 0.35)' : '#CBD5E1',
              },
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronRight size={20} color={isDark ? '#F8FAFC' : '#0F172A'} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomNavContainer}>
        <TouchableOpacity
          style={[
            styles.navArrowBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
            },
            isFirst && styles.navArrowBtnDisabled,
          ]}
          onPress={handlePrev}
          disabled={isFirst}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={15} color={isFirst ? '#64748B' : '#38BDF8'} />
        </TouchableOpacity>

        {boards.length <= 10 ? (
          <View style={styles.paginationRow}>
            {boards.map((board, idx) => (
              <PaginationDot
                key={`dot-${board.id}`}
                index={idx}
                scrollX={scrollX}
                cardWidth={CARD_WIDTH}
                onPressDot={scrollToIndex}
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.counterBox,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#CBD5E1',
              },
            ]}
          >
            <Text style={styles.counterHighlight}>{currentIndex + 1}</Text>
            <Text style={styles.counterDivider}> / </Text>
            <Text style={[styles.counterTotal, { color: isDark ? '#94A3B8' : '#475569' }]}>
              {boards.length}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.navArrowBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
            },
            isLast && styles.navArrowBtnDisabled,
          ]}
          onPress={handleNext}
          disabled={isLast}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight size={15} color={isLast ? '#64748B' : '#38BDF8'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: spacing.xs,
    width: '100%',
  },
  carouselTrackWrapper: {
    position: 'relative',
    width: '100%',
  },
  contentContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  floatingArrow: {
    position: 'absolute',
    top: '45%',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(9, 12, 16, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingArrowLeft: {
    left: 12,
  },
  floatingArrowRight: {
    right: 12,
  },
  bottomNavContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowBtnDisabled: {
    opacity: 0.25,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 5,
    borderRadius: 2.5,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  counterHighlight: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  counterDivider: {
    color: '#64748B',
    fontSize: 12,
  },
  counterTotal: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
