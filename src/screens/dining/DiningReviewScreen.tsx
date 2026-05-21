import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Alert, Animated, Platform,
    KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useReviewStore } from '../../store/useReviewStore';
import { useHostReputationStore } from '../../store/useHostReputationStore';
import { useThemeStore } from '../../store/useThemeStore';
import { RootStackParamList, DiningReview } from '../../types';
import { AnimatedStarRow } from '../../components/common/AnimatedStarRow';

const { width } = Dimensions.get('window');

const TASTE_POINT_OPTIONS: Array<{ value: 0 | 5 | 10 | 25; label: string; icon: string }> = [
    { value: 0, label: 'None', icon: '—' },
    { value: 5, label: '5 pts', icon: '🥄' },
    { value: 10, label: '10 pts', icon: '👨‍🍳' },
    { value: 25, label: '25 pts', icon: '🏆' },
];

export default function DiningReviewScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const { postId } = route.params as { postId: string };
    const { user } = useAuthStore();
    const { posts } = usePostStore();
    const { addReview } = useReviewStore();
    const { awardTastePoints, updateRating } = useHostReputationStore();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors, Spacing, BorderRadius, FontSize } = currentTheme;
    const insets = useSafeAreaInsets();

    const post = posts.find((p) => p.id === postId);

    // Rating state
    const [overallRating, setOverallRating] = useState(0);
    const [foodQuality, setFoodQuality] = useState(0);
    const [atmosphere, setAtmosphere] = useState(0);
    const [hostExperience, setHostExperience] = useState(0);
    const [tastePoints, setTastePoints] = useState<0 | 5 | 10 | 25>(0);
    const [reviewText, setReviewText] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Section fade animations
    const sectionFades = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

    React.useEffect(() => {
        sectionFades.forEach((anim, i) => {
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                delay: i * 100,
                useNativeDriver: true,
            }).start();
        });
    }, []);

    if (!post) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: Colors.textPrimary }}>Post not found.</Text>
            </SafeAreaView>
        );
    }

    const pickImages = async () => {
        if (photos.length >= 4) {
            Alert.alert('Limit Reached', 'You can upload up to 4 photos.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: 4 - photos.length,
        });
        if (!result.canceled) {
            const uris = result.assets.map((a) => a.uri);
            setPhotos((prev) => [...prev, ...uris].slice(0, 4));
        }
    };

    const handleSubmit = async () => {
        if (overallRating === 0) {
            Alert.alert('Rating Required', 'Please give an overall rating before submitting.');
            return;
        }
        setSubmitting(true);

        const review: DiningReview = {
            id: Math.random().toString(36).substr(2, 9),
            postId: post.id,
            hostId: post.hostId,
            reviewerId: user?.id ?? 'anonymous',
            reviewerName: user?.name ?? 'Anonymous',
            reviewerPhotoURL: user?.photoURL,
            overallRating,
            foodQuality: foodQuality || overallRating,
            atmosphere: atmosphere || overallRating,
            hostExperience: hostExperience || overallRating,
            reviewText: reviewText.trim() || undefined,
            photoUrls: photos.length > 0 ? photos : undefined,
            tastePointsAwarded: tastePoints,
            createdAt: new Date(),
        };

        addReview(review);

        if (tastePoints > 0) {
            awardTastePoints(post.hostId, tastePoints, user?.id ?? '', user?.name ?? 'Someone', post.id);
        }
        updateRating(post.hostId, overallRating);

        setSubmitting(false);
        navigation.replace('ReviewSuccess', { hostId: post.hostId, postId: post.id });
    };

    const SectionCard = ({ index, children }: { index: number; children: React.ReactNode }) => (
        <Animated.View style={{ opacity: sectionFades[index] }}>
            <View style={[styles.sectionCard, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                {children}
            </View>
        </Animated.View>
    );

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.container, { backgroundColor: Colors.background }]}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), borderBottomColor: Colors.border }]}>
                    {Platform.OS === 'ios' && (
                        <BlurView tint={isDarkMode ? 'dark' : 'light'} intensity={60} style={StyleSheet.absoluteFill} />
                    )}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Leave a Review</Text>
                        <Text style={[styles.headerSub, { color: Colors.textMuted }]} numberOfLines={1}>
                            {post.title}
                        </Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
                >
                    {/* Hero banner */}
                    <View
                        style={[styles.heroBanner, { borderWidth: 2, borderColor: '#FFB534', backgroundColor: 'transparent' }]}
                    >
                        <Text style={styles.heroEmoji}>🍽️</Text>
                        <Text style={[styles.heroTitle, { color: Colors.textPrimary }]}>How was your dining experience?</Text>
                        <Text style={[styles.heroSub, { color: Colors.textMuted }]}>Your feedback helps the community grow</Text>
                    </View>

                    {/* Section 1 — Overall Rating */}
                    <SectionCard index={0}>
                        <Text style={[styles.sectionLabel, { color: Colors.textPrimary }]}>Overall Experience</Text>
                        <Text style={[styles.sectionSub, { color: Colors.textMuted }]}>
                            How would you rate this dining overall?
                        </Text>
                        <View style={styles.bigStarRow}>
                            <AnimatedStarRow value={overallRating} onChange={setOverallRating} size={40} />
                        </View>
                        {overallRating > 0 && (
                            <Text style={[styles.ratingLabel, { color: Colors.primary }]}>
                                {['', '😐 Poor', '🙂 Fair', '😊 Good', '😍 Great', '🤩 Outstanding!'][overallRating]}
                            </Text>
                        )}
                    </SectionCard>

                    {/* Section 2 — Sub-ratings */}
                    <SectionCard index={1}>
                        <Text style={[styles.sectionLabel, { color: Colors.textPrimary }]}>Detailed Ratings</Text>

                        <View style={styles.subRatingItem}>
                            <View style={styles.subRatingLabelRow}>
                                <Text style={styles.subRatingIcon}>🍽️</Text>
                                <Text style={[styles.subRatingText, { color: Colors.textSecondary }]}>Food Quality</Text>
                            </View>
                            <AnimatedStarRow value={foodQuality} onChange={setFoodQuality} size={26} />
                        </View>

                        <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                        <View style={styles.subRatingItem}>
                            <View style={styles.subRatingLabelRow}>
                                <Text style={styles.subRatingIcon}>🌟</Text>
                                <Text style={[styles.subRatingText, { color: Colors.textSecondary }]}>Atmosphere</Text>
                            </View>
                            <AnimatedStarRow value={atmosphere} onChange={setAtmosphere} size={26} />
                        </View>

                        <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                        <View style={styles.subRatingItem}>
                            <View style={styles.subRatingLabelRow}>
                                <Text style={styles.subRatingIcon}>🧑‍🍳</Text>
                                <Text style={[styles.subRatingText, { color: Colors.textSecondary }]}>Host Experience</Text>
                            </View>
                            <AnimatedStarRow value={hostExperience} onChange={setHostExperience} size={26} />
                        </View>
                    </SectionCard>

                    {/* Section 3 — Taste Points (hidden for host) */}
                    {user?.id !== post?.hostId && (
                    <SectionCard index={2}>
                        <Text style={[styles.sectionLabel, { color: Colors.textPrimary }]}>Award Taste Points to Host</Text>
                        <Text style={[styles.sectionSub, { color: Colors.textMuted }]}>
                            Reward the host with Taste Points for a great experience
                        </Text>
                        <View style={styles.pointsGrid}>
                            {TASTE_POINT_OPTIONS.map((opt) => {
                                const selected = tastePoints === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => setTastePoints(opt.value)}
                                        style={[
                                            styles.pointsOption,
                                            {
                                                borderColor: selected ? Colors.primary : Colors.border,
                                                backgroundColor: selected ? Colors.primary + '18' : Colors.backgroundCard,
                                            },
                                        ]}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                                        <Text style={[styles.pointsLabel, { color: selected ? Colors.primary : Colors.textSecondary }]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </SectionCard>
                    )}

                    {/* Section 4 — Written Review */}
                    <SectionCard index={3}>
                        <Text style={[styles.sectionLabel, { color: Colors.textPrimary }]}>Write a Review</Text>
                        <Text style={[styles.sectionSub, { color: Colors.textMuted }]}>Optional — share your experience in words</Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, color: Colors.textPrimary },
                            ]}
                            placeholder="What made this dining experience memorable? Any highlights or suggestions?"
                            placeholderTextColor={Colors.textMuted}
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <Text style={[styles.charCount, { color: Colors.textMuted }]}>{reviewText.length}/500</Text>
                    </SectionCard>

                    {/* Section 5 — Photos */}
                    <SectionCard index={4}>
                        <Text style={[styles.sectionLabel, { color: Colors.textPrimary }]}>Add Photos</Text>
                        <Text style={[styles.sectionSub, { color: Colors.textMuted }]}>Optional — up to 4 photos</Text>
                        <View style={styles.photoGrid}>
                            {photos.map((uri, i) => (
                                <View key={i} style={styles.photoWrapper}>
                                    <Image source={{ uri }} style={styles.photo} />
                                    <TouchableOpacity
                                        style={[styles.removePhoto, { backgroundColor: Colors.error }]}
                                        onPress={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                                    >
                                        <Ionicons name="close" size={12} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {photos.length < 4 && (
                                <TouchableOpacity
                                    onPress={pickImages}
                                    style={[styles.addPhoto, { borderColor: Colors.border, backgroundColor: Colors.backgroundCard }]}
                                >
                                    <Ionicons name="camera-outline" size={28} color={Colors.textMuted} />
                                    <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 4 }}>Add Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </SectionCard>
                </ScrollView>

                {/* Submit CTA */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: Colors.border }]}>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.85}
                        style={{ borderRadius: 6, overflow: 'hidden' }}
                    >
                        <View style={[styles.submitBtn, { backgroundColor: overallRating > 0 ? '#ffb534' : Colors.textMuted }]}>
                            <Text style={styles.submitText}>
                                {submitting ? 'Submitting...' : 'SUBMIT REVIEW'}
                            </Text>
                            {!submitting && <Ionicons name="send" size={18} color="#000000" style={{ marginLeft: 8 }} />}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        overflow: 'hidden',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800' },
    headerSub: { fontSize: 12, marginTop: 2 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 0, gap: 16 },
    heroBanner: {
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 4,
        gap: 8,
    },
    heroEmoji: { fontSize: 48 },
    heroTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', textAlign: 'center' },
    heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
    sectionCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        gap: 12,
    },
    sectionLabel: { fontSize: 17, fontWeight: '900' },
    sectionSub: { fontSize: 13, lineHeight: 18, marginTop: -4 },
    bigStarRow: { flexDirection: 'row', justifyContent: 'center', marginVertical: 8 },
    ratingLabel: { textAlign: 'center', fontSize: 15, fontWeight: '700' },
    subRatingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    subRatingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    subRatingIcon: { fontSize: 20 },
    subRatingText: { fontSize: 14, fontWeight: '600' },
    divider: { height: 1, marginVertical: 4 },
    pointsGrid: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
    },
    pointsOption: {
        flex: 1,
        minWidth: 70,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 2,
        gap: 6,
    },
    pointsLabel: { fontSize: 13, fontWeight: '700' },
    textInput: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 14,
        fontSize: 14,
        lineHeight: 22,
        minHeight: 120,
    },
    charCount: { textAlign: 'right', fontSize: 11, marginTop: -4 },
    photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    photoWrapper: { position: 'relative' },
    photo: { width: 80, height: 80, borderRadius: 12 },
    removePhoto: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhoto: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    submitBtn: {
        height: 48,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    submitText: { color: '#000000', fontSize: 16, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
});
