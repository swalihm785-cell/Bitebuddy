import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DiningPost } from '../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, BUDGET_LABELS } from '../theme/theme';

interface PostCardProps {
    post: DiningPost;
    onPress: () => void;
}

const getTimeLabel = (post: DiningPost) => {
    if (post.isImmediate) return { label: '🔴 Now', urgent: true };
    const diff = post.dateTime.getTime() - Date.now();
    const h = Math.floor(diff / 3600000);
    if (h < 24) return { label: `⏰ In ${h}h`, urgent: h < 2 };
    return { label: `📅 ${post.dateTime.toLocaleDateString()}`, urgent: false };
};

export const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
    const timeInfo = getTimeLabel(post);
    const participantsCount = post.participants?.length || 0;
    const spotsLeft = post.maxGroupSize - participantsCount;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <LinearGradient
                colors={['#FF6B35', '#FF3CAC']}
                style={styles.cardBanner}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <Text style={styles.cardBannerEmoji}>
                    {post.cuisineTypes[0] === 'Japanese' ? '🍣' :
                        post.cuisineTypes[0] === 'Vegan' ? '🥗' :
                            post.cuisineTypes[0] === 'Thai' ? '🍜' :
                                post.cuisineTypes[0] === 'Indian' ? '🍛' : '🍽️'}
                </Text>
                {timeInfo.urgent && (
                    <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>LIVE</Text>
                    </View>
                )}
            </LinearGradient>

            <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{post.title}</Text>
                    <View style={[styles.budgetBadge, { backgroundColor: Colors.backgroundElevated }]}>
                        <Text style={styles.budgetText}>{BUDGET_LABELS[post.budgetRange]}</Text>
                    </View>
                </View>

                <View style={styles.cardMeta}>
                    <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                    <Text style={styles.cardMetaText} numberOfLines={1}>
                        {post.restaurantName || 'Location TBD'} · {post.area}
                    </Text>
                </View>

                <Text style={styles.cardDesc} numberOfLines={2}>{post.description}</Text>

                <View style={styles.tagRow}>
                    {post.cuisineTypes.map((c) => (
                        <View key={c} style={styles.cuisineTag}>
                            <Text style={styles.cuisineTagText}>{c}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                        <View style={styles.avatarStack}>
                            {Array.from({ length: Math.min(participantsCount, 3) }).map((_, i) => (
                                <View key={i} style={[styles.avatarMini, { left: i * 18 }]}>
                                    <Text style={{ fontSize: 10 }}>👤</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.spotsText}>
                            {participantsCount}/{post.maxGroupSize} joined · {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                        </Text>
                    </View>
                    <Text style={[styles.timeLabel, timeInfo.urgent && { color: Colors.error }]}>
                        {timeInfo.label}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md },
    cardBanner: { height: 110, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cardBannerEmoji: { fontSize: 50 },
    urgentBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: Colors.error, borderRadius: BorderRadius.full, paddingVertical: 4, paddingHorizontal: 10 },
    urgentText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#FFF' },
    cardBody: { padding: Spacing.md, gap: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    cardTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    budgetBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.sm },
    budgetText: { fontSize: 10, color: Colors.textSecondary, fontWeight: FontWeight.medium },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardMetaText: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
    cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    cuisineTag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundElevated },
    cuisineTagText: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.medium },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatarStack: { flexDirection: 'row', height: 24, width: 60, position: 'relative' },
    avatarMini: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.backgroundElevated, position: 'absolute', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.backgroundCard },
    spotsText: { fontSize: 10, color: Colors.textMuted },
    timeLabel: { fontSize: 10, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
});
