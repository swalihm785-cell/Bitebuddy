import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, Share, Clipboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useThemeStore } from '../../store/useThemeStore';
import { isCurrentlyPro } from '../../utils/authUtils';
import { showMessage } from 'react-native-flash-message';

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

    const StatCard = ({ value, label, onPress }: { value: string | number; label: string; onPress?: () => void }) => (
        <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress}>
            <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: Colors.textMuted }]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            >
                {/* Hero Header */}
                <LinearGradient colors={Colors.gradientPrimary} style={styles.hero}>
                    <SafeAreaView edges={['top']}>
                        <View style={styles.topActions}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
                                <Ionicons name="chevron-back" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.circleBtn}>
                                <Ionicons name="settings" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Profile Info Card */}
                <View style={[styles.profileCard, { backgroundColor: Colors.background, marginTop: -60 }]}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatarBorder, { borderColor: Colors.background }]}>
                            {user?.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.backgroundElevated }]}>
                                    <Text style={{ fontSize: 60 }}>👤</Text>
                                </View>
                            )}
                        </View>
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
                <View style={[styles.statsRow, { borderBottomColor: Colors.border }]}>
                    <StatCard value={myPosts.length} label="Plans" />
                    <StatCard value={user?.followersCount || 0} label="Followers" onPress={() => navigation.navigate('FollowList')} />
                    <StatCard value={user?.followingCount || 0} label="Following" onPress={() => navigation.navigate('FollowList')} />
                </View>

                {/* Content Section */}
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
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarContainer: {
        alignItems: 'center',
        marginTop: -60,
    },
    avatarBorder: {
        padding: 5,
        borderRadius: 60,
        borderWidth: 5,
    },
    avatarImg: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'center',
        marginTop: 15,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    userHandle: {
        fontSize: 16,
        marginTop: 4,
    },
    bio: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    editBtn: {
        flex: 1,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    shareBtn: {
        width: 45,
        height: 45,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        paddingVertical: 20,
        marginHorizontal: 20,
        borderBottomWidth: 1,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    contentSection: {
        padding: 20,
    },
    sectionHeader: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
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
});
