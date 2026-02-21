import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DiningPost } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { BUDGET_LABELS } from '../../theme/theme';

const { width } = Dimensions.get('window');

const CUISINE_IMAGES: Record<string, string> = {
    Italian: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    Japanese: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    Indian: 'https://images.unsplash.com/photo-1585937421612-71100e45278d?auto=format&fit=crop&w=800&q=80',
    Thai: 'https://images.unsplash.com/photo-1559311648-d46f4d8593d9?auto=format&fit=crop&w=800&q=80',
    American: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    Mexican: 'https://images.unsplash.com/photo-1565299585323-38d6bcba1698?auto=format&fit=crop&w=800&q=80',
    Vegan: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    Chinese: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';

interface PostCardProps {
    post: DiningPost;
    onPress: () => void;
}

const getTimeLabel = (post: DiningPost) => {
    if (post.isImmediate) return { label: '🔴 Now', urgent: true };
    const date = post.dateTime instanceof Date ? post.dateTime : new Date(post.dateTime);
    if (isNaN(date.getTime())) return { label: '📅 Time TBD', urgent: false };

    const diff = date.getTime() - Date.now();
    const h = Math.floor(diff / 3600000);
    if (h < 0) return { label: 'Expired', urgent: false };
    if (h < 24) return { label: `⏰ In ${h}h`, urgent: h < 2 };
    return { label: `📅 ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`, urgent: false };
};

import { GlassCard } from '../../theme/LiquidGlassTheme';

export const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors, BorderRadius, FontSize, FontWeight, Spacing } = currentTheme;

    const timeInfo = getTimeLabel(post);
    const participantsCount = post.participants?.length || 0;
    const spotsLeft = post.maxGroupSize - participantsCount;

    const cuisineImage = CUISINE_IMAGES[post.cuisineTypes[0]] || DEFAULT_IMAGE;

    return (
        <GlassCard
            effect="regular"
            colorScheme={isDarkMode ? 'dark' : 'light'}
            interactive={true}
            style={styles.card}
            onStartShouldSetResponder={() => true}
            onTouchEnd={onPress}
        >
            <View style={styles.cardBanner}>
                <Image source={{ uri: cuisineImage }} style={styles.bannerImage} />
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.4)']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.topBadges}>
                    <View style={[styles.urgentBadge, { backgroundColor: timeInfo.urgent ? Colors.error : 'rgba(0,0,0,0.5)' }]}>
                        <Text style={styles.urgentText}>{timeInfo.label}</Text>
                    </View>
                    {post.host?.isPremium && (
                        <View style={[styles.proBadge, { backgroundColor: Colors.primary }]}>
                            <Ionicons name="star" size={10} color="#FFF" />
                            <Text style={styles.proBadgeText}>PRO</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bannerBottom}>
                    <View style={[styles.budgetBadge, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                        <Text style={[styles.budgetText, { color: '#333' }]}>₹{BUDGET_LABELS[post.budgetRange]}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: Colors.textPrimary }]} numberOfLines={1}>{post.title}</Text>
                </View>

                <View style={styles.metaContainer}>
                    <View style={styles.metaRow}>
                        <Ionicons name="location" size={14} color={Colors.primary} />
                        <Text style={[styles.metaText, { color: Colors.textSecondary }]} numberOfLines={1}>
                            {post.restaurantName ? `${post.restaurantName} · ` : ''}{post.area}
                        </Text>
                    </View>
                    <View style={[styles.metaRow, { marginTop: 4 }]}>
                        <Ionicons name="restaurant" size={14} color={Colors.secondary} />
                        <Text style={[styles.metaText, { color: Colors.textSecondary }]} numberOfLines={1}>
                            {post.cuisineTypes.join(', ')}
                        </Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                        <View style={styles.avatarStack}>
                            {Array.from({ length: Math.min(participantsCount, 3) }).map((_, i) => (
                                <View key={i} style={[styles.avatarMini, { left: i * 16, borderColor: Colors.backgroundCard, backgroundColor: Colors.backgroundElevated }]}>
                                    <Text style={{ fontSize: 10 }}>👤</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={[styles.spotsInfo, { color: Colors.textMuted }]}>
                            {participantsCount}/{post.maxGroupSize} joined
                        </Text>
                    </View>

                    <View style={[styles.spotsBadge, { backgroundColor: spotsLeft === 0 ? Colors.error + '20' : Colors.success + '20' }]}>
                        <Text style={[styles.spotsBadgeText, { color: spotsLeft === 0 ? Colors.error : Colors.success }]}>
                            {spotsLeft === 0 ? 'Full' : `${spotsLeft} spots left`}
                        </Text>
                    </View>
                </View>
            </View>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    cardBanner: { height: 180, position: 'relative' },
    bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    topBadges: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    urgentBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    urgentText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
    proBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    proBadgeText: { fontSize: 9, fontWeight: '900', color: '#FFF' },
    bannerBottom: {
        position: 'absolute',
        bottom: 12,
        left: 12,
    },
    budgetBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    budgetText: { fontSize: 12, fontWeight: '800' },
    cardBody: { padding: 16 },
    titleRow: { marginBottom: 8 },
    cardTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
    metaContainer: { marginBottom: 16 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    metaText: { fontSize: 13, fontWeight: '500', flex: 1 },
    divider: { height: 1, marginBottom: 12 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatarStack: { flexDirection: 'row', height: 24, width: 56, position: 'relative' },
    avatarMini: {
        width: 26,
        height: 26,
        borderRadius: 13,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2
    },
    spotsInfo: { fontSize: 12, fontWeight: '600' },
    spotsBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    spotsBadgeText: { fontSize: 11, fontWeight: '700' },
});
