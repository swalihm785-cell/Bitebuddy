import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';
import { Review } from '../../types';
import { ALL_USERS } from '../../store/useChatStore';

interface ReviewCardProps {
    review: Review;
    onLike: () => void;
    isLiked: boolean;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, onLike, isLiked }) => {
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const author = Object.values(ALL_USERS).find(u => u.id === review.reviewerId);

    return (
        <View style={[styles.container, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={{ uri: author?.photoURL || 'https://via.placeholder.com/100' }}
                    style={styles.avatar}
                />
                <View style={styles.headerText}>
                    <Text style={[styles.userName, { color: Colors.textPrimary }]}>{author?.name || 'Unknown'}</Text>
                    <Text style={[styles.metaText, { color: Colors.textMuted }]}>
                        Reviewed {review.restaurantName}
                    </Text>
                </View>
                <View style={[styles.ratingBadge, { backgroundColor: '#F59E0B' }]}>
                    <Text style={styles.ratingText}>{review.rating}</Text>
                    <Ionicons name="star" size={12} color="#FFF" />
                </View>
            </View>

            {/* Media */}
            {review.mediaUri && (
                <View style={styles.mediaContainer}>
                    <Image source={{ uri: review.mediaUri }} style={styles.media} resizeMode="cover" />
                </View>
            )}

            {/* Review Text */}
            <View style={styles.contentPad}>
                <Text style={[styles.reviewText, { color: Colors.textPrimary }]}>
                    <Ionicons name="chatbubble" size={16} color={Colors.primary + '40'} /> {review.reviewText}
                </Text>
                <Text style={[styles.dateText, { color: Colors.textMuted }]}>
                    {new Date(review.createdAt).toLocaleDateString()}
                </Text>
            </View>

            {/* Social Actions */}
            <View style={[styles.actions, { borderTopColor: Colors.border }]}>
                <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
                    <Ionicons
                        name={isLiked ? "heart" : "heart-outline"}
                        size={20}
                        color={isLiked ? Colors.error : Colors.textSecondary}
                    />
                    <Text style={[styles.actionText, { color: Colors.textSecondary }]}>
                        {review.likes.length}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="chatbubble-outline" size={18} color={Colors.textSecondary} />
                    <Text style={[styles.actionText, { color: Colors.textSecondary }]}>
                        {review.commentsCount}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="share-outline" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 16,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerText: {
        flex: 1,
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
    },
    metaText: {
        fontSize: 12,
        marginTop: 1,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 2,
    },
    ratingText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
    },
    mediaContainer: {
        width: '100%',
        height: 180,
    },
    media: {
        width: '100%',
        height: '100%',
    },
    contentPad: {
        padding: 16,
    },
    reviewText: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
        fontStyle: 'italic',
    },
    dateText: {
        fontSize: 11,
        marginTop: 12,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        padding: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 20,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
