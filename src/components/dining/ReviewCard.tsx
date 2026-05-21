import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/useThemeStore';
import { DiningReview } from '../../types';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.78;

interface ReviewCardProps { review: DiningReview; fullWidth?: boolean; }

function StarRow({ value, size = 13 }: { value: number; size?: number }) {
    return (
        <View style={{ flexDirection: 'row', gap: 2 }}>
            {[1,2,3,4,5].map(s => (
                <Text key={s} style={{ fontSize: size, color: s <= value ? '#FFB534' : '#555' }}>
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
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const pts = POINTS_CONFIG[review.tastePointsAwarded] ?? POINTS_CONFIG[0];

    return (
        <View style={[styles.card, fullWidth ? { width: '100%' } : null, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
            {/* Top gradient accent */}
            <LinearGradient
                colors={['#FFB53420', '#FF8A1F08']}
                style={styles.topAccent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />

            {/* Reviewer header */}
            <View style={styles.header}>
                <View style={[styles.avatar, { backgroundColor: Colors.backgroundCard }]}>
                    {review.reviewerPhotoURL ? (
                        <Image source={{ uri: review.reviewerPhotoURL }} style={styles.avatarImg} />
                    ) : (
                        <Text style={{ fontSize: 22 }}>👤</Text>
                    )}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.name, { color: Colors.textPrimary }]} numberOfLines={1}>
                        {review.reviewerName}
                    </Text>
                    <StarRow value={review.overallRating} size={13} />
                </View>
                {review.tastePointsAwarded > 0 && (
                    <View style={[styles.hostBadge, { backgroundColor: pts.color + '20', borderColor: pts.color + '50' }]}>
                        <Text style={{ fontSize: 13 }}>{pts.icon}</Text>
                        <Text style={[styles.badgeTxt, { color: pts.color }]}>{pts.label}</Text>
                    </View>
                )}
            </View>

            {/* Review text */}
            {review.reviewText ? (
                <Text style={[styles.reviewText, { color: Colors.textSecondary }]} numberOfLines={3}>
                    "{review.reviewText}"
                </Text>
            ) : null}

            {/* Sub-ratings row */}
            <View style={[styles.subRow, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                <View style={styles.subItem}>
                    <Text style={[styles.subLabel, { color: Colors.textMuted }]}>🍽️ Food</Text>
                    <StarRow value={review.foodQuality} size={10} />
                </View>
                <View style={[styles.subDivider, { backgroundColor: Colors.border }]} />
                <View style={styles.subItem}>
                    <Text style={[styles.subLabel, { color: Colors.textMuted }]}>✨ Vibe</Text>
                    <StarRow value={review.atmosphere} size={10} />
                </View>
                <View style={[styles.subDivider, { backgroundColor: Colors.border }]} />
                <View style={styles.subItem}>
                    <Text style={[styles.subLabel, { color: Colors.textMuted }]}>👨‍🍳 Host</Text>
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
                        <View style={[styles.photo, styles.morePhotos, { backgroundColor: Colors.backgroundCard }]}>
                            <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: '700' }}>
                                +{review.photoUrls.length - 3}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Taste points footer */}
            {review.tastePointsAwarded > 0 && (
                <View style={[styles.pointsRow, { backgroundColor: '#FFD16615', borderColor: '#FFD16640' }]}>
                    <Text style={{ fontSize: 13 }}>🌟</Text>
                    <Text style={[styles.pointsTxt, { color: '#D4A017' }]}>
                        {review.tastePointsAwarded} Taste Points awarded to host
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: { width: CARD_WIDTH, borderRadius: 24, borderWidth: 1, padding: 18, gap: 14, overflow: 'hidden' },
    topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, borderRadius: 24 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    name: { fontSize: 15, fontWeight: '800' },
    hostBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
    badgeTxt: { fontSize: 11, fontWeight: '800' },
    reviewText: { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
    subRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 10 },
    subItem: { flex: 1, alignItems: 'center', gap: 4 },
    subLabel: { fontSize: 10, fontWeight: '700' },
    subDivider: { width: 1, height: 28 },
    photoRow: { flexDirection: 'row', gap: 6 },
    photo: { width: 60, height: 60, borderRadius: 12 },
    morePhotos: { justifyContent: 'center', alignItems: 'center' },
    pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
    pointsTxt: { fontSize: 12, fontWeight: '700' },
});
