import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useThemeStore } from '../../store/useThemeStore';
import { PostCard } from '../../components/common/PostCard';
import { isCurrentlyPro } from '../../utils/authUtils';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user, logout } = useAuthStore();
    const { posts } = usePostStore();
    const { currentTheme } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;

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
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Header */}
                <LinearGradient colors={Colors.gradientPrimary} style={styles.hero}>
                    <SafeAreaView>
                        <View style={styles.topActions}>
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
                            onPress={() => Alert.alert('Share', 'Share link copied to clipboard!')}
                        >
                            <Ionicons name="share-social-outline" size={20} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.statsRow, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, marginTop: 20 }]}>
                        <StatCard value={myPosts.length} label="Plans" />
                        <View style={[styles.vDivider, { backgroundColor: Colors.border }]} />
                        <StatCard value={user?.followersCount || 0} label="Followers" />
                        <View style={[styles.vDivider, { backgroundColor: Colors.border }]} />
                        <StatCard value={user?.followingCount || 0} label="Following" />
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Subscription Status (Private) */}
                    <View style={[styles.subCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        <View style={styles.subHeader}>
                            <Ionicons name="card-outline" size={20} color={Colors.primary} />
                            <Text style={[styles.subTitle, { color: Colors.textPrimary }]}>Membership</Text>
                        </View>
                        <View style={styles.subRow}>
                            <View>
                                <Text style={[styles.subLabel, { color: Colors.textMuted }]}>Current Plan</Text>
                                <Text style={[styles.subStatus, { color: isPro ? Colors.primary : Colors.textPrimary }]}>
                                    {isPro ? 'Pro Member' : 'Free Tier'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.manageBtn, { borderColor: Colors.primary }]}
                                onPress={() => isPro ? navigation.navigate('ManageSubscription') : navigation.navigate('Plan')}
                            >
                                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 13 }}>Manage</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Personal Stats Grid */}
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Private Details</Text>
                    </View>
                    <View style={[styles.detailsGrid, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        <DetailItem icon="briefcase-outline" label="Profession" value={user?.profession} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                        <DetailItem icon="heart-outline" label="Fav Cuisine" value={user?.favoriteCuisines?.join(', ')} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                        <DetailItem icon="nutrition-outline" label="Diet" value={user?.dietaryPreference} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                        <DetailItem icon="people-outline" label="Social Preference" value={user?.socialPreference} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                        <DetailItem icon="language-outline" label="Languages" value={user?.languagesSpoken?.join(', ')} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                        <DetailItem icon="location-outline" label="City" value={user?.city || 'Not set'} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                    </View>

                    {/* My Plans */}
                    <Text style={[styles.sectionTitle, { color: Colors.textPrimary, marginTop: 24 }]}>Your Dining Plans</Text>
                    {myPosts.length > 0 ? (
                        myPosts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                            />
                        ))
                    ) : (
                        <TouchableOpacity
                            style={[styles.emptyCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                            onPress={() => navigation.navigate('Create' as any)}
                        >
                            <Ionicons name="add-circle-outline" size={32} color={Colors.primary} />
                            <Text style={{ color: Colors.textMuted, marginTop: 8 }}>Create your first plan</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
        </View>
    );
}

const DetailItem = ({ icon, label, value, color, textColor, mutedColor }: any) => (
    <View style={styles.detailRow}>
        <Ionicons name={icon} size={18} color={color} />
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor, textTransform: 'uppercase' }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: textColor, marginTop: 2 }}>{value || 'Add in settings'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: { height: 180, width: '100%' },
    topActions: { flexDirection: 'row', justifyContent: 'flex-end', padding: 20 },
    circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    profileCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 20 },
    avatarContainer: { alignSelf: 'center', marginTop: -65, position: 'relative' },
    avatarBorder: { width: 130, height: 130, borderRadius: 65, borderWidth: 6, overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    proBadgeLarge: { position: 'absolute', bottom: 5, right: 5, width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    userInfo: { alignItems: 'center', padding: 20, paddingBottom: 10 },
    nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userName: { fontSize: 24, fontWeight: '900' },
    userHandle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
    bio: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginTop: 12, paddingHorizontal: 10 },
    actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 10 },
    editBtn: { flex: 4, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    editBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    shareBtn: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 20, padding: 20, borderWidth: 1, alignItems: 'center' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '900' },
    statLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    vDivider: { width: 1, height: 30 },
    content: { padding: 20 },
    subCard: { padding: 20, borderRadius: 24, borderWidth: 1 },
    subHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    subTitle: { fontSize: 16, fontWeight: '800' },
    subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    subLabel: { fontSize: 12, fontWeight: '600' },
    subStatus: { fontSize: 16, fontWeight: '800', marginTop: 2 },
    manageBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16 },
    detailsGrid: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center' },
    emptyCard: { padding: 40, borderRadius: 24, borderWidth: 1, alignItems: 'center', borderStyle: 'dashed' },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 16 },
    lockedBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
});
