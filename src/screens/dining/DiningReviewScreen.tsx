import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Image, Alert, Animated, Platform,
    KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';

import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useReviewStore } from '../../store/useReviewStore';
import { useHostReputationStore } from '../../store/useHostReputationStore';
import { RootStackParamList, DiningReview } from '../../types';
import { AnimatedStarRow } from '../../components/common/AnimatedStarRow';
import BrandBar from '../../components/common/BrandBar';

const { width } = Dimensions.get('window');

// Fork icon from the Figma design (top icon)
const FORK_ICON_PATH =
    'M3.48235 30.1944L4.20066 16.4882C2.94572 16.072 1.91507 15.317 1.10871 14.2233C0.302343 13.1296 -0.0642046 11.8837 0.00906575 10.4856L0.558594 0L3.55448 0.157008L3.00496 10.6426L4.5029 10.7211L5.05243 0.235512L8.04832 0.39252L7.49879 10.8781L8.99674 10.9566L9.54626 0.471024L12.5422 0.628032L11.9926 11.1136C11.9194 12.5117 11.4246 13.7125 10.5083 14.7159C9.59204 15.7193 8.48812 16.3624 7.19655 16.6452L6.47824 30.3514L3.48235 30.1944ZM18.4618 30.9795L19.0898 18.9959L14.596 18.7604L15.1455 8.27476C15.2541 6.20261 16.0769 4.47455 17.614 3.0906C19.151 1.70664 20.9556 1.06896 23.0278 1.17756L21.4577 31.1365L18.4618 30.9795Z';

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
    const insets = useSafeAreaInsets();

    const post = posts.find((p) => p.id === postId);

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
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#E5E2E1' }}>Post not found.</Text>
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

    const RATING_LABELS = ['', '😐 Poor', '🙂 Fair', '😊 Good', '😍 Great', '🤩 Outstanding!'];

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.container}>
                <BrandBar isModal style={{ backgroundColor: '#111111' }} />

                {/* Header Row */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnRow} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="arrow-back" size={24} color="#FFD700" />
                        <Text style={styles.headerTextTitle}>Leave a Review</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
                >
                    {/* Hero section matching Figma layout */}
                    <View style={styles.heroSection}>
                        <View style={styles.heroTextCol}>
                            <Text style={styles.heroTitle}>How was your dining experience?</Text>
                            <Text style={styles.heroSub}>
                                Your feedback helps the community grow and discover hidden gems.
                            </Text>
                        </View>
                        <View style={styles.heroIconWrap}>
                            <Svg width={24} height={32} viewBox="0 0 24 32" fill="none">
                                <Path d={FORK_ICON_PATH} fill="#FFD700" />
                            </Svg>
                        </View>
                    </View>

                    {/* Section 1 — Overall Rating */}
                    <Animated.View style={[styles.sectionContainer, { opacity: sectionFades[0] }]}>
                        <Text style={styles.sectionHeading}>Overall Experience</Text>
                        <Text style={styles.sectionDesc}>How would you rate this dining overall?</Text>
                        <View style={styles.bigStarRow}>
                            <AnimatedStarRow value={overallRating} onChange={setOverallRating} size={40} />
                        </View>
                        {overallRating > 0 && (
                            <Text style={styles.ratingLabel}>
                                {RATING_LABELS[overallRating]}
                            </Text>
                        )}
                    </Animated.View>

                    <View style={styles.flatDivider} />

                    {/* Section 2 — Detailed Ratings */}
                    <Animated.View style={[styles.sectionContainer, { opacity: sectionFades[1] }]}>
                        <Text style={styles.sectionHeading}>Detailed Ratings</Text>

                        <View style={styles.subRatingItem}>
                            <View style={styles.subRatingLabelRow}>
                                <View style={[styles.subRatingIconWrap, { backgroundColor: 'rgba(255, 215, 0, 0.08)' }]}>
                                    <Ionicons name="restaurant" size={20} color="#FFD700" />
                                </View>
                                <Text style={styles.subRatingText}>Food Quality</Text>
                            </View>
                            <AnimatedStarRow value={foodQuality} onChange={setFoodQuality} size={20} />
                        </View>

                        <View style={styles.subRatingItem}>
                            <View style={styles.subRatingLabelRow}>
                                <View style={[styles.subRatingIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                                    <Ionicons name="sparkles" size={20} color="#E5E2E1" />
                                </View>
                                <Text style={styles.subRatingText}>Atmosphere</Text>
                            </View>
                            <AnimatedStarRow value={atmosphere} onChange={setAtmosphere} size={20} />
                        </View>
                    </Animated.View>

                    <View style={styles.flatDivider} />

                    {/* Section 3 — Taste Points (hidden for host) */}
                    {user?.id !== post?.hostId && (
                        <>
                            <Animated.View style={[styles.sectionContainer, { opacity: sectionFades[2] }]}>
                                <Text style={styles.sectionHeading}>Award Taste Points to Host</Text>
                                <Text style={styles.sectionDesc}>
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
                                                    selected && styles.pointsOptionSelected,
                                                ]}
                                                activeOpacity={0.75}
                                            >
                                                <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                                                <Text style={[
                                                    styles.pointsLabel,
                                                    { color: selected ? '#FFD700' : '#9CA3AF' },
                                                ]}>
                                                    {opt.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </Animated.View>
                            <View style={styles.flatDivider} />
                        </>
                    )}

                    {/* Section 4 — Additional Thoughts */}
                    <Animated.View style={[styles.sectionContainer, { opacity: sectionFades[3] }]}>
                        <Text style={styles.sectionHeading}>Additional Thoughts</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Tell us more about the highlight of your night..."
                            placeholderTextColor="#555"
                            value={reviewText}
                            onChangeText={setReviewText}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>{reviewText.length}/500</Text>
                    </Animated.View>

                    {/* Section 5 — Photos */}
                    <Animated.View style={[styles.sectionContainer, { opacity: sectionFades[4] }]}>
                        <Text style={styles.sectionHeading}>Add Photos</Text>
                        <Text style={styles.sectionDesc}>Optional — up to 4 photos</Text>
                        <View style={styles.photoGrid}>
                            {photos.map((uri, i) => (
                                <View key={i} style={styles.photoWrapper}>
                                    <Image source={{ uri }} style={styles.photo} />
                                    <TouchableOpacity
                                        style={styles.removePhoto}
                                        onPress={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                                    >
                                        <Ionicons name="close" size={12} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                            {photos.length < 4 && (
                                <TouchableOpacity onPress={pickImages} style={styles.addPhoto}>
                                    <Ionicons name="camera-outline" size={28} color="#555" />
                                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>Add Photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animated.View>
                </ScrollView>

                {/* Submit CTA */}
                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting}
                        activeOpacity={0.85}
                        style={[
                            styles.submitBtn,
                            { backgroundColor: overallRating > 0 ? '#FFD700' : '#2A2A2A' },
                        ]}
                    >
                        <Text style={[
                            styles.submitText,
                            { color: overallRating > 0 ? '#1C1B1B' : '#555' },
                        ]}>
                            {submitting ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },

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
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        fontSize: 24,
        fontWeight: '600',
        color: '#E5E2E1',
        lineHeight: 30,
    },

    // ── Scroll content ──
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        gap: 10,
    },

    // ── Hero section ──
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
    heroTextCol: {
        flex: 1,
        gap: 6,
    },
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
    sectionCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        padding: 20,
        gap: 14,
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
        marginTop: -6,
    },

    // ── Star row ──
    bigStarRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingVertical: 4,
    },
    ratingLabel: {
        textAlign: 'left',
        fontSize: 15,
        fontWeight: '700',
        color: '#FFD700',
    },

    // ── Sub-ratings ──
    subRatingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    subRatingLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subRatingIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subRatingIcon: { fontSize: 18 },
    subRatingText: {
        fontFamily: 'SF-Pro',
        fontSize: 16,
        fontWeight: '400',
        color: '#E5E2E1',
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#2A2A2A',
        marginVertical: 2,
    },
    flatDivider: {
        height: 1,
        backgroundColor: '#2A2A2A',
        marginVertical: 10,
    },

    // ── Taste points ──
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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        backgroundColor: '#1E1E1E',
        gap: 6,
    },
    pointsOptionSelected: {
        borderColor: 'rgba(255,215,0,0.4)',
        backgroundColor: 'rgba(255,215,0,0.08)',
    },
    pointsLabel: {
        fontSize: 13,
        fontWeight: '700',
    },

    // ── Text input ──
    textInput: {
        color: '#9CA3AF',
        fontFamily: 'SF-Pro',
        fontSize: 16,
        fontStyle: 'normal',
        fontWeight: '400',
        lineHeight: 24,
        minHeight: 120,
        backgroundColor: 'transparent',
        padding: 0,
        marginTop: 8,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 11,
        color: '#555',
        marginTop: -6,
    },

    // ── Photos ──
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
        backgroundColor: '#E53E3E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhoto: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#2A2A2A',
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Footer / Submit ──
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#222',
        backgroundColor: '#111111',
    },
    submitBtn: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        fontFamily: 'Manrope',
        fontSize: 18,
        fontWeight: '900',
        lineHeight: 28,
        letterSpacing: 2.7,
        textAlign: 'center',
    },
});
