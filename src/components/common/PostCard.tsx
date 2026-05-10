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

// Returns a human-friendly relative time string: "1m ago", "2 hr ago", "3 days ago"
const getRelativeTimeAgo = (post: DiningPost): string => {
    // Use createdAt if available, otherwise fall back to dateTime
    const rawDate = (post as any).createdAt ?? post.dateTime;
    const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
    if (isNaN(date.getTime())) return '';

    const diffMs = Date.now() - date.getTime();
    if (diffMs < 0) return 'just now';

    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hr ago`;

    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return '1 week ago';
    return `${diffWeeks} weeks ago`;
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
    const relativeTimeAgo = getRelativeTimeAgo(post);
    const participantsCount = post.participants?.length || 0;
    const spotsLeft = post.maxGroupSize - participantsCount;
    const hostInfo = getHostInfo(post.hostId);
    const cuisineImage = post.imageURL || CUISINE_IMAGES[post.cuisineTypes[0]] || DEFAULT_IMAGE;

    const postDate = post.dateTime instanceof Date ? post.dateTime : new Date(post.dateTime);
    const isInactive = post.status !== 'open' || postDate.getTime() < Date.now();

    const cardBg = '#1d1b22';
    const cardBorder = 'rgba(73,69,79,0.1)';
    const textColor = '#FFFFFF';
    const textMuted = '#938f99';

    // Format Meet At Time
    const postDateObj = post.dateTime instanceof Date ? post.dateTime : new Date(post.dateTime);
    const meetTimeStr = !isNaN(postDateObj.getTime()) ? postDateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'TBD';
    const meetDateStr = !isNaN(postDateObj.getTime()) ? postDateObj.toLocaleDateString([], { day: 'numeric', month: 'short' }).toUpperCase() : '';

    return (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={onPress}
            style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder }
            ]}
        >
            <View style={styles.cardInner}>
                {/* Top Row: Host & Date/Time */}
                <View style={styles.topRow}>
                    <View style={styles.hostInfo}>
                        <Image source={{ uri: hostInfo.photoURL }} style={styles.hostAvatar} />
                        <Text style={[styles.hostName, { color: textColor }]}>
                            {hostInfo.name}
                        </Text>
                    </View>
                    <View style={styles.dateInfo}>
                        <Text style={[styles.dateText, { color: textMuted }]}>{meetDateStr}</Text>
                        <View style={styles.meetAtChip}>
                            <Ionicons name="time" size={12} color="#000" style={{ marginRight: 4 }} />
                            <Text style={styles.meetAtText}>Meet at: {meetTimeStr}</Text>
                        </View>
                    </View>
                </View>

                {/* Title */}
                <View style={styles.titleRow}>
                    <Ionicons name="restaurant" size={16} color="#ffb534" style={{ marginRight: 8 }} />
                    <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
                        {post.title}
                    </Text>
                </View>

                {/* Location */}
                <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={textMuted} style={{ marginRight: 8 }} />
                    <Text style={[styles.locationText, { color: textMuted }]} numberOfLines={1}>
                        {post.restaurantName ? `${post.restaurantName} • ` : ''}{post.area}
                    </Text>
                </View>

                {/* Footer: Joined Progress & Join Button */}
                <View style={styles.footerRow}>
                    <View style={styles.progressSection}>
                        <Text style={[styles.joinedText, { color: textColor }]}>
                            {participantsCount}/{post.maxGroupSize} joined
                        </Text>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${Math.min((participantsCount / post.maxGroupSize) * 100, 100)}%` }]} />
                        </View>
                        <Text style={[styles.timeAgoText, { color: textMuted }]}>
                            {relativeTimeAgo || timeInfo.label}
                        </Text>
                    </View>

                    {isInactive ? (
                        <View style={styles.closedBtn}>
                            <Text style={styles.closedBtnText}>CLOSED</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.joinBtn} onPress={onPress}>
                            <Text style={styles.joinBtnText}>JOIN NOW</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 16,
    },
    cardInner: {
        padding: 16,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    hostInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    hostAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: '#FFF',
    },
    hostName: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateText: {
        fontSize: 10,
        fontWeight: '700',
    },
    meetAtChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffb534',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    meetAtText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#000',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 2,
        marginBottom: 16,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '400',
        flex: 1,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    progressSection: {
        flex: 1,
    },
    joinedText: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 6,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#332f3c',
        borderRadius: 3,
        width: 100,
        marginBottom: 6,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#ffb534',
        borderRadius: 3,
    },
    timeAgoText: {
        fontSize: 10,
        fontWeight: '400',
    },
    joinBtn: {
        borderWidth: 1,
        borderColor: '#ffb534',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    joinBtnText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    closedBtn: {
        borderWidth: 1,
        borderColor: '#761200',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 20,
        opacity: 0.5,
    },
    closedBtnText: {
        color: 'red',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
});
