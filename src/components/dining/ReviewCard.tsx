import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';
import { useNavigation } from '@react-navigation/native';
import { DiningReview } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78;

interface ReviewCardProps { review: DiningReview; fullWidth?: boolean; }

function StarRow({ value, size = 13, filledColor }: { value: number; size?: number; filledColor?: string }) {
    const defaultColor = size >= 13 ? '#FFFFFF' : '#9CA3AF';
    const colorToUse = filledColor || defaultColor;
    return (
        <View style={{ flexDirection: 'row', gap: 2 }}>
            {[1,2,3,4,5].map(s => (
                <Text key={s} style={{ fontSize: size, color: s <= value ? colorToUse : '#555' }}>
                    {s <= value ? '★' : '☆'}
                </Text>
            ))}
        </View>
    );
}

const POINTS_CONFIG: Record<number, { label: string; icon: string; color: string }> = {
    25: { label: 'Elite Host', icon: '🏆', color: '#FFD700' },
    10: { label: 'Star Chef',  icon: '⭐', color: '#FFB534' },
    5:  { label: 'Good Host',  icon: '🥄', color: '#4CAF50' },
    0:  { label: '', icon: '', color: '' },
};

export function ReviewCard({ review, fullWidth }: ReviewCardProps) {
    const navigation = useNavigation<any>();
    const pts = POINTS_CONFIG[review.tastePointsAwarded] ?? POINTS_CONFIG[0];
    
    // Fallback to pravatar if no photo URL provided
    const avatarUrl = review.reviewerPhotoURL || `https://i.pravatar.cc/150?u=${review.reviewerId}`;

    return (
        <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('UserProfile', { userId: review.reviewerId })}
            style={[styles.card, fullWidth ? { width: '100%' } : null]}
        >
            {/* Linear Gradient background matching specification */}
            <LinearGradient
                colors={['#1E1E1E', '#161616']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
            />

            {/* Reviewer header */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.name} numberOfLines={1}>
                        {review.reviewerName}
                    </Text>
                    <StarRow value={review.overallRating} size={13} />
                </View>
                {review.tastePointsAwarded > 0 && (
                    <View style={styles.hostBadge}>
                        <Text style={{ fontSize: 13 }}>🌟</Text>
                        <Text style={styles.badgeTxt}>{pts.label.toUpperCase()}</Text>
                    </View>
                )}
            </View>

            {/* Review text */}
            {review.reviewText ? (
                <Text style={styles.reviewText} numberOfLines={3}>
                    "{review.reviewText}"
                </Text>
            ) : null}

            {/* Sub-ratings row — flat, transparent background without border */}
            <View style={styles.subRow}>
                <View style={styles.subItem}>
                    <Text style={styles.subLabel}>FOOD</Text>
                    <StarRow value={review.foodQuality} size={10} />
                </View>
                <View style={[styles.subDivider, { backgroundColor: '#333' }]} />
                <View style={styles.subItem}>
                    <Text style={styles.subLabel}>VIBE</Text>
                    <StarRow value={review.atmosphere} size={10} />
                </View>
                <View style={[styles.subDivider, { backgroundColor: '#333' }]} />
                <View style={styles.subItem}>
                    <Text style={styles.subLabel}>HOST</Text>
                    <StarRow value={review.hostExperience} size={10} />
                </View>
            </View>

            {/* Photos */}
            {review.photoUrls && review.photoUrls.length > 0 && (
                <View style={styles.photoRow}>
                    {review.photoUrls.slice(0, 3).map((uri, i) => (
                        <Image key={i} source={{ uri }} style={styles.photo} />
                    ))}
                    {review.photoUrls.length > 3 && (
                        <View style={[styles.photo, styles.morePhotos, { backgroundColor: '#1A1A1A' }]}>
                            <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '700' }}>
                                +{review.photoUrls.length - 3}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Taste points footer */}
            {review.tastePointsAwarded > 0 && (
                <View style={styles.pointsRow}>
                    <Text style={{ fontSize: 14 }}>🌟</Text>
                    <Text style={styles.pointsTxt}>
                        {review.tastePointsAwarded || 0} Taste Points awarded to host
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: { 
        width: CARD_WIDTH, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#333', 
        padding: 20, 
        gap: 24, 
        overflow: 'hidden',
        position: 'relative',
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    name: { 
        fontSize: 16, 
        fontWeight: '700',
        color: '#FFF',
        lineHeight: 24,
    },
    hostBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 9999, borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.20)',
        backgroundColor: 'rgba(250, 204, 21, 0.10)',
    },
    badgeTxt: { 
        fontSize: 10, 
        fontWeight: '800', 
        color: '#FACC15', 
        lineHeight: 15,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    reviewText: { 
        fontSize: 14, 
        fontWeight: '400',
        color: '#9CA3AF',
        lineHeight: 20,
    },
    subRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    subItem: { flex: 1, alignItems: 'center', gap: 6 },
    subLabel: { 
        fontSize: 14, 
        fontWeight: '400', 
        color: '#9CA3AF', 
        lineHeight: 20,
    },
    subDivider: { width: 1, height: 28 },
    photoRow: { flexDirection: 'row', gap: 6 },
    photo: { width: 60, height: 60, borderRadius: 12 },
    morePhotos: { justifyContent: 'center', alignItems: 'center' },
    pointsRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingHorizontal: 14, paddingVertical: 12,
        borderRadius: 8, borderWidth: 1,
        borderColor: 'rgba(255, 184, 0, 0.20)',
        backgroundColor: 'rgba(250, 204, 21, 0.05)',
    },
    pointsTxt: { 
        fontSize: 12, 
        fontWeight: '700',
        color: '#EAB308',
        lineHeight: 16,
    },
});
