import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useThemeStore } from '../../store/useThemeStore';
import { useHostReputationStore } from '../../store/useHostReputationStore';
import { usePostStore } from '../../store/usePostStore';
import { RootStackParamList, HostMilestone, HostTier } from '../../types';
import { TastePointsBadge } from '../../components/dining/TastePointsBadge';
import BrandBar from '../../components/common/BrandBar';

const { width } = Dimensions.get('window');

const TIER_COLORS: Record<HostTier, [string, string]> = {
    'Sous Chef': ['#94A3B8', '#64748B'],
    'Chef': ['#FFB534', '#E89B1F'],
    'Star Chef': ['#FF8A1F', '#FFB534'],
    'Elite Culinary Host': ['#FFD700', '#FFB534'],
};

const TIER_ICONS: Record<HostTier, string> = {
    'Sous Chef': '🥄',
    'Chef': '👨‍🍳',
    'Star Chef': '⭐',
    'Elite Culinary Host': '🏆',
};

function nextMilestonePoints(total: number): number {
    if (total < 100) return 100;
    if (total < 250) return 250;
    if (total < 500) return 500;
    if (total < 750) return 750;
    if (total < 1000) return 1000;
    return 1000;
}

function progressToNextTier(total: number): number {
    if (total >= 1000) return 1;
    if (total >= 500) return (total - 500) / 500;
    if (total >= 100) return (total - 100) / 400;
    return total / 100;
}

export default function HostRewardsScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const { hostId } = route.params as { hostId: string };
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const insets = useSafeAreaInsets();
    const { getReputation } = useHostReputationStore();
    const { posts } = usePostStore();

    const rep = getReputation(hostId);
    const gradientColors = TIER_COLORS[rep.tier];
    const tierIcon = TIER_ICONS[rep.tier];

    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const progress = progressToNextTier(rep.totalTastePoints);
    const nextMilestone = nextMilestonePoints(rep.totalTastePoints);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(progressAnim, {
                toValue: progress,
                duration: 1000,
                delay: 300,
                useNativeDriver: false,
            }),
        ]).start();
    }, []);

    const hostedPosts = posts.filter((p) => p.hostId === hostId);

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <BrandBar />
            {/* Sticky Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={'#ffb534'} />
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>Reputation Details</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}
            >
                {/* Hero Card */}
                <Animated.View style={[styles.heroCard, { backgroundColor: Colors.backgroundElevated, borderColor: gradientColors[0] + '40', opacity: fadeAnim }]}>
                    <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: 10 }}>{tierIcon}</Text>
                    <Text style={[styles.tierName, { color: gradientColors[0] }]}>{rep.tier}</Text>
                    <TastePointsBadge points={rep.totalTastePoints} tier={rep.tier} size="lg" />
                    <Text style={[styles.reviewCount, { color: Colors.textMuted }]}>{rep.totalReviews} reviews · ★ {rep.averageRating.toFixed(1)}</Text>
                </Animated.View>

                {/* Progress Bar */}
                {rep.tier !== 'Elite Culinary Host' && (
                    <View style={[styles.card, { backgroundColor: '#1D1B22', borderColor: 'transparent' }]}>
                        <View style={styles.progressHeader}>
                            <Text style={[styles.progressLabel, { color: Colors.textPrimary }]}>Progress to Next Tier</Text>
                            <Text style={[styles.progressValue, { color: Colors.primary }]}>
                                {rep.totalTastePoints} / {nextMilestone} pts
                            </Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: '#353534' }]}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: gradientColors[0],
                                        width: progressAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressSub, { color: Colors.textMuted }]}>
                            {nextMilestone - rep.totalTastePoints} more points to next milestone
                        </Text>
                    </View>
                )}

                {/* Milestones */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Milestones</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingRight: 8 }}
                    >
                        {rep.milestones.map((milestone, i) => (
                            <MilestoneCard
                                key={i}
                                milestone={milestone}
                                Colors={Colors}
                                gradientColors={gradientColors}
                            />
                        ))}
                    </ScrollView>
                </View>

                {/* Earned Badges */}
                {rep.earnedBadges.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Earned Badges</Text>
                        <View style={styles.badgeGrid}>
                            {rep.earnedBadges.map((badge, i) => (
                                <View key={i} style={[styles.badgeChip, { backgroundColor: '#1D1B22' }]}>
                                    <Text style={{ fontSize: 18 }}>🏅</Text>
                                    <Text style={[styles.badgeText, { color: Colors.primary }]}>{badge}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Recent Awards */}
                {rep.recentAwards.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Recent Awards</Text>
                        <View style={{ gap: 10 }}>
                            {rep.recentAwards.slice(0, 5).map((award, i) => (
                                <View
                                    key={i}
                                    style={[styles.awardRow, { backgroundColor: '#1D1B22' }]}
                                >
                                    <Text style={{ fontSize: 22 }}>👨‍🍳</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[{ color: Colors.textPrimary, fontSize: 14, fontWeight: '700' }]}>
                                            {award.awardedByName}
                                        </Text>
                                        <Text style={[{ color: Colors.textMuted, fontSize: 12 }]}>
                                            Awarded {award.points} Taste Points
                                        </Text>
                                    </View>
                                    <View style={[styles.awardBadge, { backgroundColor: Colors.accent + '25' }]}>
                                        <Text style={{ color: Colors.accent, fontWeight: '800', fontSize: 13 }}>+{award.points}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Hosted Dining */}
                {hostedPosts.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Hosted Dining Events</Text>
                        <View style={{ gap: 10 }}>
                            {hostedPosts.map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.hostedPost, { backgroundColor: '#1D1B22' }]}
                                    onPress={() => navigation.navigate('PostDetail', { postId: p.id })}
                                >
                                    <View style={styles.hostedPostLeft}>
                                        <Text style={[{ color: Colors.textPrimary, fontSize: 15, fontWeight: '800' }]} numberOfLines={1}>
                                            {p.title}
                                        </Text>
                                        <Text style={[{ color: Colors.textMuted, fontSize: 12, marginTop: 2 }]}>
                                            {p.participants.length}/{p.maxGroupSize} joined · {p.cuisineTypes[0]}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Future rewards teaser */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Future Rewards</Text>
                    <View style={[styles.futureCard, { backgroundColor: '#1D1B22' }]}>
                        <View style={styles.futureContent}>
                            <Text style={{ fontSize: 32 }}>🎖️</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={[{ color: Colors.textPrimary, fontSize: 15, fontWeight: '800' }]}>
                                    Michelin Host Badge
                                </Text>
                                <Text style={[{ color: Colors.textMuted, fontSize: 12, marginTop: 2 }]}>
                                    Coming soon — exclusive for top hosts
                                </Text>
                            </View>
                            <View style={[styles.lockedBadge, { backgroundColor: '#353534' }]}>
                                <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function MilestoneCard({
    milestone,
    Colors,
    gradientColors,
}: {
    milestone: HostMilestone;
    Colors: any;
    gradientColors: [string, string];
    key?: React.Key;
}) {
    const scale = useRef(new Animated.Value(0.8)).current;
    const fade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 8 }),
            Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
            <View
                style={[
                    styles.milestoneCard,
                    {
                        backgroundColor: milestone.unlocked ? '#1D1B22' : 'transparent',
                        borderColor: milestone.unlocked ? gradientColors[0] + '60' : '#353534',
                        opacity: milestone.unlocked ? 1 : 0.5,
                    },
                ]}
            >
                <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>{milestone.icon}</Text>
                <Text
                    style={[
                        styles.milestoneTitle,
                        { color: milestone.unlocked ? Colors.textPrimary : Colors.textMuted },
                    ]}
                >
                    {milestone.title}
                </Text>
                <View style={[
                    styles.milestonePtsBadge,
                    { backgroundColor: milestone.unlocked ? gradientColors[0] + '20' : '#353534' },
                ]}>
                    <Text style={[styles.milestonePts, { color: milestone.unlocked ? gradientColors[0] : Colors.textMuted }]}>
                        {milestone.points} pts
                    </Text>
                </View>
                <Text style={[styles.milestoneDesc, { color: Colors.textMuted }]} numberOfLines={2}>
                    {milestone.description}
                </Text>
                {milestone.unlocked && (
                    <View style={[styles.unlockedBadge, { backgroundColor: gradientColors[0] + '20' }]}>
                        <Ionicons name="checkmark-circle" size={14} color={gradientColors[0]} />
                        <Text style={[styles.unlockedText, { color: gradientColors[0] }]}>Unlocked</Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 18,
        paddingBottom: 14,
    },
    heroCard: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
        marginTop: 10,
    },
    tierName: {
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 10,
    },
    reviewCount: { fontSize: 13, fontWeight: '600', marginTop: 12 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 20,
        marginBottom: 20,
    },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    progressLabel: { fontSize: 16, fontWeight: '800' },
    progressValue: { fontSize: 14, fontWeight: '700' },
    progressTrack: { height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 8 },
    progressFill: { height: '100%', borderRadius: 7 },
    progressSub: { fontSize: 12, fontWeight: '500' },
    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
    milestoneCard: {
        width: 160,
        borderRadius: 16,
        borderWidth: 1.5,
        padding: 16,
        alignItems: 'center',
        gap: 6,
    },
    milestoneTitle: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
    milestonePtsBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 2,
    },
    milestonePts: { fontSize: 12, fontWeight: '800' },
    milestoneDesc: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
    unlockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    unlockedText: { fontSize: 11, fontWeight: '700' },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badgeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    badgeText: { fontSize: 13, fontWeight: '700' },
    awardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 16,
    },
    awardBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    hostedPost: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
    },
    hostedPostLeft: { flex: 1 },
    futureCard: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    futureContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 20,
    },
    lockedBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
