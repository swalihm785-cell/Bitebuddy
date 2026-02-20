import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, BUDGET_LABELS } from '../../theme/theme';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { DiningPost } from '../../types';

export default function PostDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { postId } = route.params;
    const { posts, updatePost } = usePostStore();
    const { user } = useAuthStore();
    const [joined, setJoined] = useState(false);
    const [message, setMessage] = useState('');

    const post = posts.find(p => p.id === postId) || {} as DiningPost;
    const host = post.participants?.[0] || { name: 'Host', age: 25 };
    const spotsLeft = post.maxGroupSize - (post.participants?.length || 0);

    const handleJoin = () => {
        if (!user) {
            Alert.alert('Login Required', 'Please log in to join a dining plan.');
            return;
        }

        const isAlreadyIn = post.participants.some(p => p.id === user.id);
        if (isAlreadyIn) {
            Alert.alert('Info', 'You are already a participant!');
            return;
        }

        Alert.alert(
            'Send Join Request',
            `Send a request to join "${post.title}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Request',
                    onPress: () => {
                        const updatedParticipants = [...post.participants, { id: user.id, name: user.name, age: user.age || 25 }];
                        updatePost(post.id, {
                            participants: updatedParticipants,
                            currentParticipants: updatedParticipants.length
                        });
                        setJoined(true);
                        Alert.alert('Request Sent! 🎉', 'The host will review your request shortly.');
                    },
                },
            ],
        );
    };

    if (!post) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Post not found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Hero */}
            <LinearGradient
                colors={['#FF6B35', '#FF3CAC', '#6C63FF']}
                style={styles.hero}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
                <SafeAreaView>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color="#FFF" />
                    </TouchableOpacity>
                </SafeAreaView>
                <Text style={styles.heroEmoji}>🍣</Text>
                <Text style={styles.heroTitle}>{post.title}</Text>
                <View style={styles.heroBadgeRow}>
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>{post.cuisineTypes.join(', ')}</Text>
                    </View>
                    <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <Text style={styles.heroBadgeText}>{BUDGET_LABELS[post.budgetRange]}</Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                {/* Host */}
                <View style={styles.section}>
                    <View style={styles.hostRow}>
                        <LinearGradient colors={['#6C63FF', '#3CA5FF']} style={styles.hostAvatar}>
                            <Text style={{ fontSize: 24 }}>👤</Text>
                        </LinearGradient>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.hostName}>{host.name}</Text>
                                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                            </View>
                            <View style={styles.starRow}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Ionicons
                                        key={s}
                                        name={s <= 4 ? 'star' : 'star-outline'}
                                        size={12}
                                        color={Colors.accent}
                                    />
                                ))}
                                <Text style={styles.ratingText}>4.8</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.chatHostBtn}>
                            <Ionicons name="chatbubble-outline" size={18} color={Colors.primary} />
                            <Text style={{ fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium }}>Chat</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Details */}
                <View style={styles.detailsGrid}>
                    {[
                        { icon: 'location-outline', label: 'Location', value: `${post.restaurantName}\n${post.restaurantAddress}` },
                        { icon: 'time-outline', label: 'When', value: post.isImmediate ? 'Right Now! 🔴' : post.dateTime.toLocaleString() },
                        { icon: 'people-outline', label: 'Group', value: `${post.participants.length}/${post.maxGroupSize} joined · ${spotsLeft} spots left` },
                        { icon: 'cash-outline', label: 'Budget', value: BUDGET_LABELS[post.budgetRange] },
                    ].map(({ icon, label, value }) => (
                        <View key={label} style={styles.detailCard}>
                            <Ionicons name={icon as any} size={20} color={Colors.primary} />
                            <Text style={styles.detailLabel}>{label}</Text>
                            <Text style={styles.detailValue}>{value}</Text>
                        </View>
                    ))}
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About This Dining Plan</Text>
                    <Text style={styles.descText}>{post.description}</Text>
                </View>

                {/* Participants */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>People ({post.participants.length}/{post.maxGroupSize})</Text>
                    <View style={styles.participantsList}>
                        {post.participants.map((p, idx) => (
                            <View key={p.id} style={styles.participantItem}>
                                <View style={styles.participantAvatar}>
                                    <Text style={{ fontSize: 16 }}>👤</Text>
                                </View>
                                <View>
                                    <Text style={styles.participantName}>{p.name}</Text>
                                    <Text style={styles.participantAge}>{p.age} years · {p.gender || 'N/A'}</Text>
                                </View>
                                {idx === 0 && ( // Assuming the first participant is the host
                                    <View style={styles.hostBadge}>
                                        <Text style={styles.hostBadgeText}>Host</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                        {Array.from({ length: spotsLeft }).map((_, i) => (
                            <View key={`empty-${i}`} style={[styles.participantItem, styles.participantEmpty]}>
                                <View style={[styles.participantAvatar, { backgroundColor: 'transparent' }]}>
                                    <Ionicons name="add" size={18} color={Colors.textMuted} />
                                </View>
                                <Text style={styles.participantName}>Spot Available</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* CTA */}
            <View style={styles.cta}>
                <TouchableOpacity
                    onPress={handleJoin}
                    disabled={joined || spotsLeft === 0}
                    activeOpacity={0.85}
                    style={{ flex: 1 }}
                >
                    <LinearGradient
                        colors={joined ? [Colors.success, Colors.success] : ['#FF6B35', '#FF3CAC']}
                        style={styles.joinBtn}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.joinBtnText}>
                            {spotsLeft === 0 ? '😔 Event Full' : joined ? '✓ Request Sent' : '🍽️ Request to Join'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    hero: { paddingBottom: Spacing.xl, alignItems: 'center' },
    backBtn: {
        alignSelf: 'flex-start', marginLeft: Spacing.xl, marginTop: Spacing.sm,
        width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center', alignItems: 'center',
    },
    heroEmoji: { fontSize: 60, marginTop: Spacing.md, marginBottom: 12 },
    heroTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: '#FFF', textAlign: 'center', paddingHorizontal: Spacing.xl },
    heroBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    heroBadge: { backgroundColor: 'rgba(0,0,0,0.25)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: BorderRadius.full },
    heroBadgeText: { fontSize: FontSize.sm, color: '#FFF', fontWeight: FontWeight.medium },
    body: { flex: 1 },
    section: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hostAvatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
    hostName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    starRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    ratingText: { fontSize: FontSize.xs, color: Colors.textMuted, marginLeft: 4 },
    chatHostBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingVertical: 8, paddingHorizontal: 12, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.primary,
    },
    detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.md, gap: Spacing.md },
    detailCard: {
        width: '47%', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg,
        padding: Spacing.md, gap: 6, borderWidth: 1, borderColor: Colors.border,
    },
    detailLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
    detailValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.semibold },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    descText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
    participantsList: { gap: 12 },
    participantItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.backgroundCard, padding: 10, borderRadius: BorderRadius.md },
    participantAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.backgroundElevated, justifyContent: 'center', alignItems: 'center' },
    participantName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
    participantAge: { fontSize: FontSize.xs, color: Colors.textMuted },
    hostBadge: { marginLeft: 'auto', backgroundColor: Colors.primary + '15', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    hostBadgeText: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.bold },
    participantEmpty: { borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.border, backgroundColor: 'transparent' },
    cta: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
        backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border,
    },
    joinBtn: { height: 56, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },
    joinBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFF' },
    errorText: { fontSize: FontSize.lg, color: Colors.error, textAlign: 'center', marginTop: Spacing.xl },
});
