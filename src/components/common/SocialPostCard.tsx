import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';
import { SocialPost, User } from '../../types';
import { ALL_USERS } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';

interface SocialPostCardProps {
    post: SocialPost;
    onLike: () => void;
    isLiked: boolean;
}

export const SocialPostCard: React.FC<SocialPostCardProps> = ({ post, onLike, isLiked }) => {
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    
    const currentUser = useAuthStore.getState().user;
    const author = currentUser && currentUser.id === post.userId
        ? currentUser
        : Object.values(ALL_USERS).find(u => u.id === post.userId);

    return (
        <View style={[styles.container, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={{ uri: author?.photoURL || 'https://via.placeholder.com/100' }}
                    style={styles.avatar}
                />
                <View style={styles.headerText}>
                    <Text style={[styles.userName, { color: Colors.textPrimary }]}>{author?.name || 'Unknown User'}</Text>
                    <View style={styles.metaRow}>
                        {post.location && (
                            <Text style={[styles.metaText, { color: Colors.textMuted }]}>
                                <Ionicons name="location" size={12} /> {post.location}
                            </Text>
                        )}
                        <Text style={[styles.metaText, { color: Colors.textMuted }]}>
                            • {new Date(post.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <Text style={[styles.content, { color: Colors.textPrimary }]}>{post.content}</Text>

            {post.mediaUri && (
                <View style={styles.mediaContainer}>
                    <Image source={{ uri: post.mediaUri }} style={styles.media} resizeMode="cover" />
                </View>
            )}

            {post.cuisine && (
                <View style={[styles.cuisineBadge, { backgroundColor: Colors.primary + '15' }]}>
                    <Text style={[styles.cuisineText, { color: Colors.primary }]}>{post.cuisine}</Text>
                </View>
            )}

            {/* Actions */}
            <View style={[styles.actions, { borderTopColor: Colors.border }]}>
                <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
                    <Ionicons
                        name={isLiked ? "heart" : "heart-outline"}
                        size={22}
                        color={isLiked ? Colors.error : Colors.textSecondary}
                    />
                    <Text style={[styles.actionText, { color: Colors.textSecondary }]}>
                        {post.likes.length}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
                    <Text style={[styles.actionText, { color: Colors.textSecondary }]}>
                        {post.commentsCount}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
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
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    metaText: {
        fontSize: 12,
        marginRight: 4,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        fontSize: 15,
        lineHeight: 22,
    },
    mediaContainer: {
        width: '100%',
        aspectRatio: 4 / 3,
        backgroundColor: '#000',
    },
    media: {
        width: '100%',
        height: '100%',
    },
    cuisineBadge: {
        alignSelf: 'flex-start',
        margin: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    cuisineText: {
        fontSize: 12,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 20,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
