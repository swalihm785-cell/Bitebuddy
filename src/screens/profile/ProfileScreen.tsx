import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, Share, Clipboard, Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandBar from '../../components/common/BrandBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useHostReputationStore } from '../../store/useHostReputationStore';
import { isCurrentlyPro } from '../../utils/authUtils';
import { showMessage } from 'react-native-flash-message';
import { TastePointsBadge } from '../../components/dining/TastePointsBadge';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user, logout } = useAuthStore();
    const { posts } = usePostStore();
    const { currentTheme } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;
    const insets = useSafeAreaInsets();

    const myPosts = posts.filter(p => p.hostId === user?.id);
    const isPro = isCurrentlyPro(user);
    const { getReputation } = useHostReputationStore();
    const hostRep = getReputation(user?.id || '');

    const StatCard = ({ value, label, onPress }: { value: string | number; label: string; onPress?: () => void }) => (
        <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress}>
            <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: Colors.textMuted }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <BrandBar />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            >
                {/* Header Actions */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                        <Text style={{ color: Colors.textPrimary, fontSize: 16, fontWeight: '700' }}>Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="settings-outline" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Profile Info Card */}
                <View style={[styles.profileCard, { backgroundColor: Colors.background, marginTop: 10 }]}>
                    <View style={[styles.avatarContainer, { marginTop: 0 }]}>
                        <View style={[styles.avatarBorder, { borderColor: Colors.background }]}>
                            {user?.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.backgroundElevated }]}>
                                    <Text style={{ fontSize: 60 }}>👤</Text>
                                </View>
                            )}
                        </View>
                        {isPro && (
                            <LinearGradient colors={['#FFD700', '#FFA500']} style={{ position: 'absolute', bottom: 5, right: 5, width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' }}>
                                <Ionicons name="star" size={16} color="#FFF" />
                            </LinearGradient>
                        )}
                    </View>

                    <View style={styles.userInfo}>
                        <View style={styles.nameContainer}>
                            <Text style={[styles.userName, { color: Colors.textPrimary }]}>{user?.name}</Text>
                            {user?.isVerified && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
                        </View>
                        <Text style={[styles.userHandle, { color: Colors.textMuted }]}>@{user?.name?.toLowerCase().replace(' ', '_')}</Text>
                        <Text style={[styles.bio, { color: Colors.textSecondary }]}>
                            {user?.bio || 'No bio set. Tell the world about your taste!'}
                        </Text>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.editBtn, { backgroundColor: Colors.primary }]}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Text style={styles.editBtnText}>Edit Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.shareBtn, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                            onPress={() => {
                                const shareUrl = `https://bitebuddy.app/profile/${user?.id}`;
                                const shareMessage = `👤 Check out my profile on Bite Buddy!\n${shareUrl}`;

                                Alert.alert(
                                    'Share Profile',
                                    'Tell your friends about your food adventures!',
                                    [
                                        {
                                            text: 'Share via...',
                                            onPress: async () => {
                                                try {
                                                    await Share.share({
                                                        message: shareMessage,
                                                        url: shareUrl,
                                                    });
                                                } catch (error) {
                                                    console.error('Error sharing:', error);
                                                }
                                            },
                                        },
                                        {
                                            text: 'Copy Link',
                                            onPress: () => {
                                                Clipboard.setString(shareUrl);
                                                showMessage({
                                                    message: 'Link copied!',
                                                    type: 'success',
                                                });
                                            },
                                        },
                                        { text: 'Cancel', style: 'cancel' },
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={[styles.statsRow, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, marginTop: 10, marginHorizontal: 20 }]}>
                    <StatCard value={myPosts.length} label="Plans" />
                    <View style={{ width: 1, height: 30, backgroundColor: Colors.border }} />
                    <StatCard 
                        value={(user?.followersCount || 0) + (user?.followingCount || 0)} 
                        label="Food Buddies" 
                        onPress={() => navigation.navigate('FollowList')} 
                    />
                </View>

                {/* About Section */}
                <View style={styles.contentSection}>
                    <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>About</Text>
                    <View style={[styles.detailsGrid, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        {user?.profession && <DetailItem icon="briefcase-outline" label="Profession" value={user.profession} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                        {user?.city && <DetailItem icon="location-outline" label="City" value={user.city} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                        {user?.dietaryPreference && <DetailItem icon="nutrition-outline" label="Dietary" value={user.dietaryPreference} color={Colors.success} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                        {user?.socialPreference && <DetailItem icon="people-outline" label="Social Vibe" value={user.socialPreference} color={Colors.secondary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                        {user?.languagesSpoken && user.languagesSpoken.length > 0 && (
                            <DetailItem icon="language-outline" label="Languages" value={user.languagesSpoken.join(', ')} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                        )}
                        {user?.cuisineInterests && user.cuisineInterests.length > 0 && (
                            <DetailItem icon="restaurant-outline" label="Fav Cuisine" value={user.cuisineInterests.join(', ')} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                        )}
                    </View>

                    {/* Cuisine Interests */}
                    {user?.cuisineInterests && user.cuisineInterests.length > 0 && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Cuisine Interests</Text>
                            <View style={styles.chipRow}>
                                {user.cuisineInterests.map(c => (
                                    <View key={c} style={[styles.chip, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
                                        <Text style={[styles.chipTxt, { color: Colors.primary }]}>{c}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Personality / Vibe */}
                    {user?.personalityTags && user.personalityTags.length > 0 && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Vibe</Text>
                            <View style={styles.chipRow}>
                                {user.personalityTags.map(t => (
                                    <View key={t} style={[styles.chip, { backgroundColor: Colors.secondary + '15', borderColor: Colors.secondary + '30' }]}>
                                        <Text style={[styles.chipTxt, { color: Colors.secondary }]}>{t}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Reputation & Taste Points */}
                    <View style={{ marginTop: 20 }}>
                        <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Reputation & Taste Points</Text>
                        <TouchableOpacity
                            style={[styles.repCard, { borderColor: Colors.border }]}
                            onPress={() => navigation.navigate('HostRewards' as any, { hostId: user?.id })}
                            activeOpacity={0.85}
                        >
                            <LinearGradient colors={['#FF6B3512', '#6C63FF0A']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                            <View style={styles.repRow}>
                                <View style={{ flex: 1, gap: 6 }}>
                                    <TastePointsBadge points={hostRep.totalTastePoints} tier={hostRep.tier} size="md" showTier />
                                    <Text style={[styles.repStat, { color: Colors.textMuted }]}>
                                        ★ {hostRep.averageRating.toFixed(1)} avg · {hostRep.totalReviews} review{hostRep.totalReviews !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <View style={styles.repRight}>
                                    {hostRep.earnedBadges.slice(0, 2).map((b, i) => (
                                        <View key={i} style={[styles.miniChip, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
                                            <Text style={{ fontSize: 12 }}>🏅</Text>
                                            <Text style={[styles.miniChipTxt, { color: Colors.primary }]} numberOfLines={1}>{b}</Text>
                                        </View>
                                    ))}
                                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dining Plans Section */}
                <View style={styles.contentSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>My Dining Plans</Text>
                    </View>

                    {myPosts.length > 0 ? (
                        <View style={styles.postGrid}>
                            {[...myPosts]
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map(post => {
                                    const isCurrent = post.status === 'open' && new Date(post.dateTime) > new Date();
                                    return (
                                        <TouchableOpacity
                                            key={post.id}
                                            style={[styles.postCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                                            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                                            activeOpacity={0.75}
                                        >
                                            {post.imageURL && (
                                                <Image source={{ uri: post.imageURL }} style={styles.postImage} />
                                            )}
                                            <View style={styles.postInfo}>
                                                <View style={styles.postTopRow}>
                                                    <Text style={[styles.postTitle, { color: Colors.textPrimary }]} numberOfLines={1}>
                                                        {post.title}
                                                    </Text>
                                                    <View style={[styles.postTag, { backgroundColor: isCurrent ? '#22C55E18' : Colors.border + '60' }]}>
                                                        <View style={[styles.postTagDot, { backgroundColor: isCurrent ? '#22C55E' : Colors.textMuted }]} />
                                                        <Text style={[styles.postTagText, { color: isCurrent ? '#22C55E' : Colors.textMuted }]}>
                                                            {isCurrent ? 'Current' : 'Previous'}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.postMeta, { color: Colors.textMuted }]} numberOfLines={1}>
                                                    {post.cuisineTypes.join(', ')}
                                                </Text>
                                                <View style={styles.postBottomRow}>
                                                    <View style={styles.postMetaItem}>
                                                        <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                                                        <Text style={[styles.postMetaText, { color: Colors.textMuted }]}>
                                                            {new Date(post.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.postMetaItem}>
                                                        <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
                                                        <Text style={[styles.postMetaText, { color: Colors.textMuted }]}>
                                                            {post.currentParticipants}/{post.maxGroupSize}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.postMetaItem}>
                                                        <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                                                        <Text style={[styles.postMetaText, { color: Colors.textMuted }]} numberOfLines={1}>
                                                            {post.area}, {post.city}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
                            <Text style={[styles.emptyText, { color: Colors.textMuted }]}>No dining plans created yet.</Text>
                            <TouchableOpacity
                                style={[styles.createBtn, { borderColor: Colors.primary }]}
                                onPress={() => navigation.navigate('CreatePost')}
                            >
                                <Text style={[styles.createBtnText, { color: Colors.primary }]}>Create first plan</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {!isPro && (
                <View style={[styles.proCard, { bottom: insets.bottom + 100 }]}>
                    <View style={[styles.proBadge, { backgroundColor: Colors.primary }]}>
                        <Ionicons name="star" size={12} color="#FFF" />
                        <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                    <View style={styles.proInfo}>
                        <Text style={[styles.proTitle, { color: Colors.textPrimary }]}>Unlock Pro Features</Text>
                        <Text style={[styles.proDesc, { color: Colors.textMuted }]}>Advanced filters, insights & more!</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.upgradeBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => navigation.navigate('Plan')}
                    >
                        <Text style={styles.upgradeBtnText}>Upgrade</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const DetailItem = ({ icon, label, value, color, textColor, mutedColor }: any) => (
    <View style={styles.detailRow}>
        <Ionicons name={icon} size={18} color={color} />
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{value || 'Not specified'}</Text>
        </View>
    </View>
);
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    hero: {
        height: 180,
        paddingHorizontal: 20,
    },
    topActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    circleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileCard: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    avatarContainer: {
        alignSelf: 'center',
        position: 'relative',
    },
    avatarBorder: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 6,
        overflow: 'hidden',
    },
    avatarImg: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'center',
        marginTop: 12,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
    },
    userHandle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    bio: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 18,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        paddingHorizontal: 10,
    },
    editBtn: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBtnText: {
        color: '#000',
        fontWeight: '800',
        fontSize: 15,
    },
    shareBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    autoApproveSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginTop: 2
    },
    contentSection: {
        padding: 20,
    },
    sectionHeader: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.6,
        marginBottom: 12,
    },
    postGrid: {
        gap: 12,
    },
    // ── Post Card Styles (matching UserProfileScreen) ──
    postCard: { flexDirection: 'row' as const, borderRadius: 16, borderWidth: 1, overflow: 'hidden' as const },
    postImage: { width: 90, height: 90, backgroundColor: '#E5E7EB' },
    postInfo: { flex: 1, padding: 12, justifyContent: 'center' as const, gap: 4 },
    postTopRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, gap: 8 },
    postTitle: { fontSize: 15, fontWeight: '800' as const, flex: 1 },
    postTag: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    postTagDot: { width: 6, height: 6, borderRadius: 3 },
    postTagText: { fontSize: 10, fontWeight: '800' as const, letterSpacing: 0.3 },
    postMeta: { fontSize: 12, fontWeight: '600' as const },
    postBottomRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, marginTop: 2 },
    postMetaItem: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 3 },
    postMetaText: { fontSize: 11, fontWeight: '600' as const },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 10,
    },
    createBtn: {
        marginTop: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    createBtnText: {
        fontWeight: 'bold',
    },
    proCard: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: '#1E293B',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    proBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    proBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    proInfo: {
        flex: 1,
        marginLeft: 12,
    },
    proTitle: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    proDesc: {
        fontSize: 12,
    },
    upgradeBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    upgradeBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // ── About Section ──
    detailsGrid: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center' },
    // ── Chips ──
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
    chipTxt: { fontSize: 12, fontWeight: '700' },
    // ── Reputation Card ──
    repCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
    repRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    repStat: { fontSize: 13, fontWeight: '600' },
    repRight: { alignItems: 'flex-end', gap: 6 },
    miniChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, maxWidth: 120 },
    miniChipTxt: { fontSize: 10, fontWeight: '700', flex: 1 },
});
