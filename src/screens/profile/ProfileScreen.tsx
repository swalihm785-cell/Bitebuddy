import React from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, BUDGET_LABELS } from '../../theme/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { PostCard } from '../../components/PostCard';

const PAST_MEALS = [
    { id: '1', title: 'Ramen Night Tokyo', date: 'Feb 10', rating: 5, emoji: '🍜' },
    { id: '2', title: 'Italian Networking', date: 'Jan 28', rating: 4, emoji: '🍝' },
    { id: '3', title: 'Vegan Brunch', date: 'Jan 15', rating: 5, emoji: '🥗' },
];

const BADGES = [
    { emoji: '🏆', name: 'Top Host', color: '#FFD166' },
    { emoji: '🌍', name: 'Food Explorer', color: '#6C63FF' },
    { emoji: '⭐', name: 'Super Diner', color: '#FF6B35' },
];

export default function ProfileScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user, logout } = useAuthStore();
    const { posts } = usePostStore();

    const userPosts = posts.filter(p => p.hostId === user?.id);

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: logout },
        ]);
    };

    const StatCard = ({ value, label }: { value: string | number; label: string }) => (
        <View style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} style={styles.iconBtn}>
                            <Ionicons name="create-outline" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
                            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Avatar + Info */}
                <View style={styles.profileSection}>
                    <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.avatarLarge}>
                        <Text style={{ fontSize: 52 }}>👤</Text>
                    </LinearGradient>
                    <View style={styles.nameRow}>
                        <Text style={styles.userName}>{user?.name || 'Your Name'}</Text>
                        {user?.isVerified && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                        {user?.isPremium && <Ionicons name="star" size={18} color={Colors.accent} />}
                    </View>
                    <Text style={styles.userBio}>{user?.bio || 'Food lover and dining enthusiast'}</Text>

                    {/* Reputation */}
                    <View style={styles.repRow}>
                        <View style={styles.repStars}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Ionicons
                                    key={s}
                                    name={s <= Math.round(user?.reputationScore || 0) ? 'star' : 'star-outline'}
                                    size={16} color={Colors.accent}
                                />
                            ))}
                        </View>
                        <Text style={styles.repScore}>{user?.reputationScore?.toFixed(1) || '0.0'} reputation</Text>
                    </View>

                    {/* Points */}
                    <View style={styles.pointsBadge}>
                        <Ionicons name="flash" size={16} color={Colors.accent} />
                        <Text style={styles.pointsText}>{user?.points || 0} points</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <StatCard value={12} label="Meals" />
                    <View style={styles.statDivider} />
                    <StatCard value={8} label="Hosted" />
                    <View style={styles.statDivider} />
                    <StatCard value={4.9} label="Rating" />
                    <View style={styles.statDivider} />
                    <StatCard value={3} label="Badges" />
                </View>

                {/* Badges */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏅 Badges</Text>
                    <View style={styles.badgeRow}>
                        {BADGES.map((badge) => (
                            <View key={badge.name} style={styles.badge}>
                                <View style={[styles.badgeIcon, { backgroundColor: badge.color + '20' }]}>
                                    <Text style={{ fontSize: 26 }}>{badge.emoji}</Text>
                                </View>
                                <Text style={styles.badgeName}>{badge.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Cuisine Interests */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🍽️ Cuisine Interests</Text>
                    <View style={styles.chipRow}>
                        {(user?.cuisineInterests || ['Italian', 'Japanese', 'Vegan']).map((c) => (
                            <View key={c} style={styles.chip}>
                                <Text style={styles.chipText}>{c}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Personality tags */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎭 Vibe</Text>
                    <View style={styles.chipRow}>
                        {(user?.personalityTags || ['Food Explorer', 'Casual']).map((t) => (
                            <View key={t} style={[styles.chip, { borderColor: Colors.secondary }]}>
                                <Text style={[styles.chipText, { color: Colors.secondary }]}>{t}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* User Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📅 My Timeline</Text>
                    {userPosts.length > 0 ? (
                        <View style={{ gap: Spacing.md }}>
                            {userPosts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.emptyTimeline}>
                            <Text style={styles.emptyText}>You haven't posted any dining plans yet.</Text>
                        </View>
                    )}
                </View>

                {/* Past meals */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🕐 Past Meals</Text>
                    <View style={styles.mealList}>
                        {PAST_MEALS.map((meal) => (
                            <View key={meal.id} style={styles.mealCard}>
                                <View style={styles.mealEmoji}>
                                    <Text style={{ fontSize: 24 }}>{meal.emoji}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.mealTitle}>{meal.title}</Text>
                                    <Text style={styles.mealDate}>{meal.date}</Text>
                                </View>
                                <View style={styles.mealRating}>
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Ionicons key={s} name={s <= meal.rating ? 'star' : 'star-outline'} size={12} color={Colors.accent} />
                                    ))}
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Premium CTA */}
                {!user?.isPremium && (
                    <View style={styles.section}>
                        <TouchableOpacity activeOpacity={0.85}>
                            <LinearGradient colors={['#6C63FF', '#FF3CAC']} style={styles.premiumCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                                <Text style={styles.premiumEmoji}>⭐</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                                    <Text style={styles.premiumSub}>Unlimited requests · Post boost · Analytics</Text>
                                </View>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
    headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
    headerActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { padding: 8, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md },
    profileSection: { alignItems: 'center', paddingVertical: Spacing.xl },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    userName: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
    userBio: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl, lineHeight: 22, marginBottom: Spacing.md },
    repRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    repStars: { flexDirection: 'row', gap: 2 },
    repScore: { fontSize: FontSize.sm, color: Colors.textSecondary },
    pointsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.backgroundCard, paddingVertical: 6, paddingHorizontal: 14, borderRadius: BorderRadius.full },
    pointsText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.bold },
    statsRow: { flexDirection: 'row', marginHorizontal: Spacing.xl, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl, padding: Spacing.md, marginBottom: Spacing.lg },
    statCard: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
    statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    statDivider: { width: 1, backgroundColor: Colors.border },
    section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.md },
    badgeRow: { flexDirection: 'row', gap: Spacing.md },
    badge: { alignItems: 'center', gap: Spacing.xs },
    badgeIcon: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    badgeName: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
    chipText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
    mealList: { gap: 10 },
    mealCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md },
    mealEmoji: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.backgroundElevated, justifyContent: 'center', alignItems: 'center' },
    mealTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
    mealDate: { fontSize: FontSize.xs, color: Colors.textMuted },
    mealRating: { flexDirection: 'row', gap: 1 },
    premiumCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: BorderRadius.xl, padding: Spacing.lg },
    premiumEmoji: { fontSize: 32 },
    premiumTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#FFF' },
    premiumSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
    emptyTimeline: { padding: Spacing.xl, alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md },
    emptyText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
