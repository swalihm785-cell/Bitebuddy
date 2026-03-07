import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { DiningPost } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { BUDGET_LABELS } from '../../theme/theme';
import { TEST_USERS } from '../../data/testUsers';
import { handleDiningPlanShare } from '../../utils/diningPlanShareUtils';

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

// Resolve host name from hostId
const getHostInfo = (hostId: string) => {
    const testUser = Object.values(TEST_USERS).find(u => u.user.id === hostId);
    return testUser
        ? { name: testUser.user.name, photoURL: testUser.user.photoURL, isPro: testUser.user.plan === 'pro' }
        : { name: hostId, photoURL: `https://i.pravatar.cc/150?u=${hostId}`, isPro: false };
};

export const PostCard: React.FC<PostCardProps> = ({ post, onPress }) => {
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;

    const timeInfo = getTimeLabel(post);
    const participantsCount = post.participants?.length || 0;
    const spotsLeft = post.maxGroupSize - participantsCount;
    const hostInfo = getHostInfo(post.hostId);
    const cuisineImage = post.imageURL || CUISINE_IMAGES[post.cuisineTypes[0]] || DEFAULT_IMAGE;

    const postDate = post.dateTime instanceof Date ? post.dateTime : new Date(post.dateTime);
    const isInactive = post.status !== 'open' || postDate.getTime() < Date.now();

    const cardBg = isDarkMode ? '#1E1E2E' : '#FFFFFF';
    const cardBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    return (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={onPress}
            style={[
                styles.card,
                {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    shadowColor: isDarkMode ? '#000' : '#64748B',
                }
            ]}
        >
            {/* Banner Image */}
            <View style={styles.cardBanner}>
                <Image source={{ uri: cuisineImage }} style={styles.bannerImage} />
                <LinearGradient
                    colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.45)']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={styles.topBadges}>
                    <View style={styles.topBadgesLeft}>
                        <View style={[styles.timeBadge, { backgroundColor: timeInfo.urgent ? '#EF4444' : 'rgba(0,0,0,0.55)' }]}>
                            <Text style={styles.timeBadgeText}>{timeInfo.label}</Text>
                        </View>
                        {hostInfo.isPro && (
                            <View style={styles.proBadge}>
                                <Ionicons name="star" size={9} color="#FFF" />
                                <Text style={styles.proBadgeText}>PRO</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.shareCircle}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDiningPlanShare(post);
                        }}
                    >
                        <Ionicons name="share-social" size={16} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.bannerBottom}>
                    <View style={styles.budgetBadge}>
                        <Text style={styles.budgetText}>₹{BUDGET_LABELS[post.budgetRange]}</Text>
                    </View>
                </View>
            </View>

            {/* Card Body */}
            <View style={styles.cardBody}>
                {/* Host Row */}
                <View style={styles.hostRow}>
                    <Image source={{ uri: hostInfo.photoURL }} style={styles.hostAvatar} />
                    <Text style={[styles.hostName, { color: Colors.textMuted }]}>
                        Hosted by <Text style={{ fontWeight: '700', color: Colors.textSecondary }}>{hostInfo.name}</Text>
                    </Text>
                </View>

                {/* Title */}
                <Text style={[styles.cardTitle, { color: Colors.textPrimary }]} numberOfLines={1}>
                    {post.title}
                </Text>

                {/* Meta */}
                <View style={styles.metaContainer}>
                    <View style={styles.metaRow}>
                        <View style={[styles.metaIconWrap, { backgroundColor: Colors.primary + '12' }]}>
                            <Ionicons name="location" size={12} color={Colors.primary} />
                        </View>
                        <Text style={[styles.metaText, { color: Colors.textSecondary }]} numberOfLines={1}>
                            {post.restaurantName ? `${post.restaurantName} · ` : ''}{post.area}
                        </Text>
                    </View>
                    <View style={styles.metaRow}>
                        <View style={[styles.metaIconWrap, { backgroundColor: Colors.secondary + '12' }]}>
                            <Ionicons name="restaurant" size={12} color={Colors.secondary} />
                        </View>
                        <Text style={[styles.metaText, { color: Colors.textSecondary }]} numberOfLines={1}>
                            {post.cuisineTypes.join(', ')}
                        </Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]} />

                {/* Footer */}
                <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                        <View style={styles.avatarStack}>
                            {Array.from({ length: Math.min(participantsCount, 3) }).map((_, i) => (
                                <View key={i} style={[styles.avatarMini, { left: i * 14, borderColor: cardBg, backgroundColor: isDarkMode ? '#2A2A3A' : '#F1F5F9' }]}>
                                    <Text style={{ fontSize: 9 }}>👤</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={[styles.spotsInfo, { color: Colors.textMuted, marginLeft: Math.min(participantsCount, 3) * 14 + 8 }]}>
                            {participantsCount}/{post.maxGroupSize} joined
                        </Text>
                    </View>

                    <View style={[
                        styles.spotsBadge,
                        { backgroundColor: spotsLeft === 0 ? '#FEE2E2' : '#DCFCE7' }
                    ]}>
                        <Text style={[
                            styles.spotsBadgeText,
                            { color: spotsLeft === 0 ? '#DC2626' : '#16A34A' }
                        ]}>
                            {spotsLeft === 0 ? 'Full' : `${spotsLeft} spots left`}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Grey overlay for inactive/closed posts */}
            {isInactive && (
                <View style={styles.inactiveOverlay}>
                    <View style={styles.closedBadge}>
                        <Ionicons name="lock-closed" size={14} color="#FFF" />
                        <Text style={styles.closedBadgeText}>Closed</Text>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    cardBanner: { height: 170, position: 'relative' },
    bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    topBadges: {
        position: 'absolute',
        top: 12,
        left: 12,
        right: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topBadgesLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    shareCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timeBadge: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    timeBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
    proBadge: {
        paddingVertical: 3,
        paddingHorizontal: 7,
        borderRadius: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#F59E0B',
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
        backgroundColor: 'rgba(255,255,255,0.92)',
    },
    budgetText: { fontSize: 12, fontWeight: '800', color: '#1E293B' },
    cardBody: { padding: 18 },
    hostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    hostAvatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
    },
    hostName: { fontSize: 12, fontWeight: '500' },
    cardTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, marginBottom: 10 },
    metaContainer: { gap: 6, marginBottom: 14 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaIconWrap: {
        width: 22,
        height: 22,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    metaText: { fontSize: 13, fontWeight: '500', flex: 1 },
    divider: { height: 1, marginBottom: 14 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    footerLeft: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    avatarStack: { flexDirection: 'row', height: 22, position: 'relative' },
    avatarMini: {
        width: 22,
        height: 22,
        borderRadius: 11,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    spotsInfo: { fontSize: 12, fontWeight: '600' },
    spotsBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    spotsBadgeText: { fontSize: 11, fontWeight: '700' },
    // Inactive overlay
    inactiveOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(120,120,120,0.45)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    closedBadgeText: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
});
