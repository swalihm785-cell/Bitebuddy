import React, { useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Animated, Dimensions, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Svg, { Path } from 'react-native-svg';

import { useHostReputationStore } from '../../store/useHostReputationStore';
import { usePostStore } from '../../store/usePostStore';
import { RootStackParamList, HostMilestone, HostTier } from '../../types';
import { TastePointsBadge } from '../../components/dining/TastePointsBadge';
import BrandBar from '../../components/common/BrandBar';

const { width } = Dimensions.get('window');

// Fork icon — same as review page
const FORK_ICON_PATH =
    'M3.48235 30.1944L4.20066 16.4882C2.94572 16.072 1.91507 15.317 1.10871 14.2233C0.302343 13.1296 -0.0642046 11.8837 0.00906575 10.4856L0.558594 0L3.55448 0.157008L3.00496 10.6426L4.5029 10.7211L5.05243 0.235512L8.04832 0.39252L7.49879 10.8781L8.99674 10.9566L9.54626 0.471024L12.5422 0.628032L11.9926 11.1136C11.9194 12.5117 11.4246 13.7125 10.5083 14.7159C9.59204 15.7193 8.48812 16.3624 7.19655 16.6452L6.47824 30.3514L3.48235 30.1944ZM18.4618 30.9795L19.0898 18.9959L14.596 18.7604L15.1455 8.27476C15.2541 6.20261 16.0769 4.47455 17.614 3.0906C19.151 1.70664 20.9556 1.06896 23.0278 1.17756L21.4577 31.1365L18.4618 30.9795Z';

const TIER_COLORS: Record<HostTier, string> = {
    'Sous Chef': '#94A3B8',
    'Chef': '#FFB534',
    'Star Chef': '#FF8A1F',
    'Elite Culinary Host': '#FFD700',
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
    const insets = useSafeAreaInsets();
    const { getReputation } = useHostReputationStore();
    const { posts } = usePostStore();

    const rep = getReputation(hostId);
    const tierColor = TIER_COLORS[rep.tier];
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
        <View style={styles.container}>
            <BrandBar />

            {/* Header Row */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnRow} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    <Text style={styles.headerTextTitle}>Reputation Details</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            >
                {/* Hero — text on left, icon on right matching review page layout */}
                <View style={styles.heroSection}>
                    <View style={styles.heroTextCol}>
                        <Text style={styles.heroTitle}>Chef Reputation</Text>
                        <Text style={styles.heroSub}>
                            Your hosting journey, milestones and taste points earned from the community.
                        </Text>
                    </View>
                    <View style={styles.heroIconWrap}>
                        <Svg width={24} height={32} viewBox="0 0 24 32" fill="none">
                            <Path d={FORK_ICON_PATH} fill="#FFD700" />
                        </Svg>
                    </View>
                </View>

                {/* Tier Section (Flat) */}
                <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim }]}>
                    <View style={styles.tierRow}>
                        <Text style={styles.tierEmoji}>{tierIcon}</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.tierName, { color: tierColor }]}>{rep.tier}</Text>
                            <Text style={styles.tierSub}>
                                {rep.totalReviews} reviews · ★ {rep.averageRating.toFixed(1)} avg
                            </Text>
                        </View>
                        <TastePointsBadge points={rep.totalTastePoints} tier={rep.tier} size="md" />
                    </View>
                </Animated.View>

                <View style={styles.flatDivider} />

                {/* Progress to Next Tier */}
                {rep.tier !== 'Elite Culinary Host' && (
                    <>
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionHeading}>Progress to Next Tier</Text>
                            <View style={styles.progressHeaderRow}>
                                <Text style={styles.sectionDesc}>Keep earning points to level up</Text>
                                <Text style={[styles.progressValue, { color: tierColor }]}>
                                    {rep.totalTastePoints} / {nextMilestone} pts
                                </Text>
                            </View>
                            <View style={styles.progressTrack}>
                                <Animated.View
                                    style={[
                                        styles.progressFill,
                                        {
                                            backgroundColor: tierColor,
                                            width: progressAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            }),
                                        },
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressSub}>
                                {nextMilestone - rep.totalTastePoints} more points to next milestone
                            </Text>
                        </View>
                        <View style={styles.flatDivider} />
                    </>
                )}

                {/* Milestones */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeading}>Milestones</Text>
                    <Text style={styles.sectionDesc}>Your journey through chef tiers</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
                    >
                        {rep.milestones.map((milestone, i) => (
                            <MilestoneCard
                                key={i}
                                milestone={milestone}
                                tierColor={tierColor}
                            />
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.flatDivider} />

                {/* Earned Badges */}
                {rep.earnedBadges.length > 0 && (
                    <>
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionHeading}>Earned Badges</Text>
                            <View style={styles.badgeGrid}>
                                {rep.earnedBadges.map((badge, i) => (
                                    <View key={i} style={styles.badgeChip}>
                                        <Text style={{ fontSize: 16 }}>🏅</Text>
                                        <Text style={[styles.badgeText, { color: '#FFD700' }]}>{badge}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={styles.flatDivider} />
                    </>
                )}

                {/* Recent Awards */}
                {rep.recentAwards.length > 0 && (
                    <>
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionHeading}>Recent Awards</Text>
                            <Text style={styles.sectionDesc}>Points awarded by the community</Text>
                            <View style={{ gap: 10 }}>
                                {rep.recentAwards.slice(0, 5).map((award, i) => (
                                    <View key={i} style={styles.awardRow}>
                                        <Text style={{ fontSize: 20 }}>👨‍🍳</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.awardName}>{award.awardedByName}</Text>
                                            <Text style={styles.awardSub}>
                                                Awarded {award.points} Taste Points
                                            </Text>
                                        </View>
                                        <View style={styles.awardBadge}>
                                            <Text style={styles.awardBadgeText}>+{award.points}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View style={styles.flatDivider} />
                    </>
                )}

                {/* Hosted Dining Events */}
                {hostedPosts.length > 0 && (
                    <>
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionHeading}>Hosted Dining Events</Text>
                            <Text style={styles.sectionDesc}>{hostedPosts.length} events hosted</Text>
                            <View style={{ gap: 10 }}>
                                {hostedPosts.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={styles.hostedPost}
                                        onPress={() => navigation.navigate('PostDetail', { postId: p.id })}
                                    >
                                        <View style={styles.hostedPostLeft}>
                                            <Text style={styles.hostedPostTitle} numberOfLines={1}>
                                                {p.title}
                                            </Text>
                                            <Text style={styles.hostedPostSub}>
                                                {p.participants.length}/{p.maxGroupSize} joined · {p.cuisineTypes[0]}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="#555" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        <View style={styles.flatDivider} />
                    </>
                )}

                {/* Future Rewards teaser */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionHeading}>Future Rewards</Text>
                    <View style={styles.futureRow}>
                        <Text style={{ fontSize: 30 }}>🎖️</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.futureTitle}>Michelin Host Badge</Text>
                            <Text style={styles.futureSub}>Coming soon — exclusive for top hosts</Text>
                        </View>
                        <View style={styles.lockedBadge}>
                            <Ionicons name="lock-closed" size={14} color="#555" />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

function MilestoneCard({
    milestone,
    tierColor,
}: {
    milestone: HostMilestone;
    tierColor: string;
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
                        borderColor: milestone.unlocked ? tierColor + '60' : '#2A2A2A',
                        opacity: milestone.unlocked ? 1 : 0.5,
                    },
                ]}
            >
                <Text style={{ fontSize: 30, textAlign: 'center', marginBottom: 6 }}>
                    {milestone.icon}
                </Text>
                <Text
                    style={[
                        styles.milestoneTitle,
                        { color: milestone.unlocked ? '#E5E2E1' : '#555' },
                    ]}
                >
                    {milestone.title}
                </Text>
                <View
                    style={[
                        styles.milestonePtsBadge,
                        {
                            backgroundColor: milestone.unlocked
                                ? tierColor + '20'
                                : '#1E1E1E',
                            borderColor: milestone.unlocked
                                ? tierColor + '40'
                                : '#2A2A2A',
                        },
                    ]}
                >
                    <Text style={[styles.milestonePts, { color: milestone.unlocked ? tierColor : '#555' }]}>
                        {milestone.points} pts
                    </Text>
                </View>
                <Text style={styles.milestoneDesc} numberOfLines={2}>
                    {milestone.description}
                </Text>
                {milestone.unlocked && (
                    <View style={[styles.unlockedBadge, { backgroundColor: tierColor + '20' }]}>
                        <Ionicons name="checkmark-circle" size={13} color={tierColor} />
                        <Text style={[styles.unlockedText, { color: tierColor }]}>Unlocked</Text>
                    </View>
                )}
            </View>
        </Animated.View>
    );
}

const SF = Platform.OS === 'ios' ? 'System' : 'sans-serif';

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111111' },

    // ── Header ──
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
    },
    backBtnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    headerTextTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#E5E2E1',
        fontFamily: 'SF-Pro-Medium',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: SF,
        fontSize: 24,
        fontWeight: '600',
        color: '#E5E2E1',
        lineHeight: 30,
    },

    // ── Scroll ──
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        gap: 10,
    },

    // ── Hero section (matches review page) ──
    heroSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingBottom: 10,
    },
    heroIconWrap: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    heroTextCol: { flex: 1, gap: 6 },
    heroTitle: {
        fontFamily: 'SF-Pro-Bold',
        fontSize: 24,
        fontWeight: '600',
        color: '#E5E2E1',
        lineHeight: 30,
    },
    heroSub: {
        fontFamily: 'SF-Pro',
        fontSize: 14,
        fontWeight: '400',
        color: '#9CA3AF',
        lineHeight: 18,
    },

    // ── Section containers (Flat layout) ──
    sectionContainer: {
        paddingVertical: 12,
        gap: 12,
    },
    flatDivider: {
        height: 1,
        backgroundColor: '#2A2A2A',
        marginVertical: 10,
    },
    sectionCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        padding: 20,
        gap: 12,
    },
    sectionHeading: {
        fontFamily: 'SF-Pro-Bold',
        fontSize: 18,
        fontWeight: '600',
        color: '#E5E2E1',
        lineHeight: 28,
        letterSpacing: -0.5,
    },
    sectionDesc: {
        fontFamily: 'SF-Pro',
        fontSize: 14,
        fontWeight: '400',
        color: '#B9CCB2',
        lineHeight: 20,
        marginTop: -4,
    },

    // ── Tier card ──
    tierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    tierEmoji: { fontSize: 40 },
    tierName: {
        fontFamily: SF,
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 28,
    },
    tierSub: {
        fontFamily: SF,
        fontSize: 13,
        fontWeight: '400',
        color: '#9CA3AF',
        marginTop: 2,
    },

    // ── Progress ──
    progressHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: -4,
    },
    progressValue: {
        fontFamily: 'Manrope',
        fontSize: 13,
        fontWeight: '700',
    },
    progressTrack: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#2A2A2A',
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 5 },
    progressSub: {
        fontFamily: SF,
        fontSize: 12,
        fontWeight: '400',
        color: '#9CA3AF',
        marginTop: -4,
    },

    // ── Milestones ──
    milestoneCard: {
        width: 156,
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        alignItems: 'center',
        gap: 6,
    },
    milestoneTitle: {
        fontFamily: SF,
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        color: '#E5E2E1',
    },
    milestonePtsBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 2,
    },
    milestonePts: { fontSize: 11, fontWeight: '800' },
    milestoneDesc: {
        fontFamily: SF,
        fontSize: 11,
        fontWeight: '400',
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 15,
    },
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

    // ── Badges ──
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badgeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
    },
    badgeText: {
        fontFamily: 'Manrope',
        fontSize: 12,
        fontWeight: '700',
        color: '#FFD700',
    },

    // ── Awards ──
    awardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#1E1E1E',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    awardName: {
        fontFamily: SF,
        fontSize: 14,
        fontWeight: '600',
        color: '#E5E2E1',
    },
    awardSub: {
        fontFamily: SF,
        fontSize: 12,
        fontWeight: '400',
        color: '#9CA3AF',
        marginTop: 2,
    },
    awardBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,184,0,0.2)',
        backgroundColor: 'rgba(250,204,21,0.05)',
    },
    awardBadgeText: {
        fontFamily: 'Manrope',
        fontSize: 12,
        fontWeight: '700',
        color: '#EAB308',
    },

    // ── Hosted posts ──
    hostedPost: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#1E1E1E',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    hostedPostLeft: { flex: 1 },
    hostedPostTitle: {
        fontFamily: SF,
        fontSize: 14,
        fontWeight: '600',
        color: '#E5E2E1',
    },
    hostedPostSub: {
        fontFamily: SF,
        fontSize: 12,
        fontWeight: '400',
        color: '#9CA3AF',
        marginTop: 2,
    },

    // ── Future rewards ──
    futureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    futureTitle: {
        fontFamily: SF,
        fontSize: 14,
        fontWeight: '600',
        color: '#E5E2E1',
    },
    futureSub: {
        fontFamily: SF,
        fontSize: 12,
        fontWeight: '400',
        color: '#9CA3AF',
        marginTop: 2,
    },
    lockedBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
