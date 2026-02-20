import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme/theme';

const MOCK_NOTIFICATIONS = [
    { id: '1', type: 'join_request', title: 'Join Request', body: 'Priya wants to join your Sushi Night', time: '2m ago', read: false, emoji: '🍣' },
    { id: '2', type: 'request_accepted', title: 'Request Accepted! 🎉', body: 'Alex accepted your request to join Italian Dinner', time: '15m ago', read: false, emoji: '✅' },
    { id: '3', type: 'new_message', title: 'New Message', body: 'Alex: See you at 7pm! 🍣', time: '30m ago', read: true, emoji: '💬' },
    { id: '4', type: 'review', title: 'New Review', body: 'Sarah gave you 5 stars! "Amazing host 🌟"', time: '1h ago', read: true, emoji: '⭐' },
    { id: '5', type: 'event', title: 'Nearby Dining Alert', body: 'Thai Street Food plan found 0.5km from you!', time: '2h ago', read: true, emoji: '📍' },
];

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

    const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const NotifItem = ({ notif }: { notif: typeof MOCK_NOTIFICATIONS[0] }) => (
        <TouchableOpacity
            style={[styles.item, !notif.read && styles.itemUnread]}
            onPress={() => setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n))}
        >
            <View style={styles.notifIcon}>
                <Text style={{ fontSize: 22 }}>{notif.emoji}</Text>
            </View>
            <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{notif.title}</Text>
                <Text style={styles.notifBody} numberOfLines={2}>{notif.body}</Text>
                <Text style={styles.notifTime}>{notif.time}</Text>
            </View>
            {!notif.read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={markAllRead}>
                    <Text style={styles.markRead}>Mark all read</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <NotifItem notif={item} />}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
    markRead: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
    list: { paddingVertical: Spacing.sm },
    item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
    itemUnread: { backgroundColor: Colors.primary + '08' },
    notifIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: Colors.backgroundCard, justifyContent: 'center', alignItems: 'center' },
    notifContent: { flex: 1 },
    notifTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 2 },
    notifBody: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: 4 },
    notifTime: { fontSize: FontSize.xs, color: Colors.textMuted },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 6 },
    separator: { height: 1, backgroundColor: Colors.border },
});
