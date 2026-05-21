import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';

type DiningStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

interface DiningStatusBadgeProps {
    status: DiningStatus;
}

const STATUS_CONFIG: Record<DiningStatus, { label: string; icon: string; bg: string; fg: string }> = {
    upcoming:  { label: 'Upcoming',  icon: '🕐', bg: '#2196F315', fg: '#2196F3' },
    ongoing:   { label: 'Ongoing',   icon: '🔥', bg: '#FFB53420', fg: '#FFB534' },
    completed: { label: 'Completed', icon: '✅', bg: '#4CAF5015', fg: '#4CAF50' },
    cancelled: { label: 'Cancelled', icon: '❌', bg: '#F4433615', fg: '#F44336' },
};

export function DiningStatusBadge({ status }: DiningStatusBadgeProps) {
    const cfg = STATUS_CONFIG[status];
    return (
        <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.fg + '40' }]}>
            <Text style={styles.icon}>{cfg.icon}</Text>
            <Text style={[styles.label, { color: cfg.fg }]}>{cfg.label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        alignSelf: 'flex-start',
    },
    icon: { fontSize: 12 },
    label: { fontSize: 12, fontWeight: '700' },
});
