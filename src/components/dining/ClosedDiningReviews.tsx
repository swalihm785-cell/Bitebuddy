import React, { useRef, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Animated, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { useReviewStore } from '../../store/useReviewStore';
import { ReviewCard } from './ReviewCard';
import { DiningReview } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78;
const CARD_GAP = 16;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

interface ClosedDiningReviewsProps { postId: string; }

export function ClosedDiningReviews({ postId }: ClosedDiningReviewsProps) {
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const { getReviewsForPost } = useReviewStore();
    const reviews = getReviewsForPost(postId);
    const [activeIndex, setActiveIndex] = useState(0);

    const slideAnim = useRef(new Animated.Value(30)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 5 }),
        ]).start();
    }, []);

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(e.nativeEvent.contentOffset.x / SNAP_INTERVAL);
        setActiveIndex(index);
    };

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.overallRating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <Animated.View style={[styles.wrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            {/* Section Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: Colors.textPrimary }]}>Dining Reviews</Text>
                    {avgRating && (
                        <Text style={[styles.avgRating, { color: Colors.textMuted }]}>
                            ★ {avgRating} avg · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                        </Text>
                    )}
                </View>
                <View style={[styles.countBadge, { backgroundColor: Colors.primary + '20', borderColor: Colors.primary + '40' }]}>
                    <Text style={[styles.countText, { color: Colors.primary }]}>{reviews.length}</Text>
                </View>
            </View>

            {reviews.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                    <Text style={styles.emptyIcon}>🍽️</Text>
                    <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>No Reviews Yet</Text>
                    <Text style={[styles.emptySubtitle, { color: Colors.textMuted }]}>
                        Be the first to share your dining experience!
                    </Text>
                </View>
            ) : reviews.length === 1 ? (
                <View style={{ width: '100%' }}>
                    <ReviewCard review={reviews[0]} fullWidth={true} />
                </View>
            ) : (
                <>
                    <FlatList<DiningReview>
                        data={reviews}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => <ReviewCard review={item} />}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        snapToInterval={SNAP_INTERVAL}
                        decelerationRate="fast"
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
                    />
                    <View style={styles.dots}>
                        {reviews.map((_, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: i === activeIndex ? Colors.primary : Colors.border,
                                        width: i === activeIndex ? 20 : 6,
                                    }
                                ]}
                            />
                        ))}
                    </View>
                </>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: { marginTop: 28, marginBottom: 8 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    title: { fontSize: 16, fontWeight: '600' },
    avgRating: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    countBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
    countText: { fontSize: 13, fontWeight: '800' },
    listContent: { paddingRight: 24 },
    dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 14 },
    dot: { height: 6, borderRadius: 3 },
    emptyState: { borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', padding: 32, alignItems: 'center', gap: 8 },
    emptyIcon: { fontSize: 40 },
    emptyTitle: { fontSize: 16, fontWeight: '800' },
    emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
