import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { HostTier } from '../../types';

interface TastePointsBadgeProps {
    points: number;
    tier?: HostTier;
    size?: 'sm' | 'md' | 'lg';
    showTier?: boolean;
}

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

export function TastePointsBadge({ points, tier, size = 'md', showTier = false }: TastePointsBadgeProps) {
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;

    const resolvedTier: HostTier = tier ?? (
        points >= 1000 ? 'Elite Culinary Host' :
        points >= 500 ? 'Star Chef' :
        points >= 100 ? 'Chef' :
        'Sous Chef'
    );

    const tierColor = TIER_COLORS[resolvedTier];
    const tierIcon = TIER_ICONS[resolvedTier];

    const config = {
        sm: { iconSize: 11, fontSize: 11, px: 6, py: 3, gap: 3, radius: 8 },
        md: { iconSize: 13, fontSize: 13, px: 10, py: 5, gap: 5, radius: 10 },
        lg: { iconSize: 16, fontSize: 16, px: 14, py: 7, gap: 6, radius: 14 },
    }[size];

    return (
        <View style={[
            styles.badge,
            {
                backgroundColor: tierColor + '20',
                borderColor: tierColor + '50',
                paddingHorizontal: config.px,
                paddingVertical: config.py,
                borderRadius: config.radius,
                gap: config.gap,
            }
        ]}>
            <Text style={{ fontSize: config.iconSize }}>{tierIcon}</Text>
            <Text style={[styles.points, { color: tierColor, fontSize: config.fontSize }]}>
                {points.toLocaleString()} pts
            </Text>
            {showTier && (
                <Text style={[styles.tierLabel, { color: tierColor, fontSize: config.fontSize - 2 }]}>
                    · {resolvedTier}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    points: {
        fontWeight: '800',
    },
    tierLabel: {
        fontWeight: '600',
    },
});
