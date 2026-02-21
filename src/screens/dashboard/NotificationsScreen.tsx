import React from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Notification as NotificationType } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { RootStackParamList } from '../../types';

const NOTIF_CONFIG: Record<string, { icon: string; color: string }> = {
    join_request: { icon: 'person-add-outline', color: '#6C63FF' },
    request_accepted: { icon: 'checkmark-circle-outline', color: '#2ECC71' },
    request_rejected: { icon: 'close-circle-outline', color: '#E74C3C' },
    participant_left: { icon: 'exit-outline', color: '#FF6B35' },
    new_message: { icon: 'chatbubble-outline', color: '#3CA5FF' },
    review: { icon: 'star-outline', color: '#FFD166' },
    event: { icon: 'calendar-outline', color: '#9B59B6' },
    follow_request: { icon: 'person-outline', color: '#FF3CAC' },
    follow_accepted: { icon: 'people-outline', color: '#2ECC71' },
    new_meal: { icon: 'restaurant-outline', color: '#FF6B35' },
    report: { icon: 'flag-outline', color: '#E74C3C' },
    welcome: { icon: 'hand-left-outline', color: '#FF6B35' },
    system: { icon: 'information-circle-outline', color: '#3CA5FF' },
};

function getNotifConfig(type: string) {
    return NOTIF_CONFIG[type] || { icon: 'notifications-outline', color: '#6C63FF' };
}

function getTimeDiff(date: Date) {
    const d = date instanceof Date ? date : new Date(date);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuthStore();
    const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;

    const userNotifs = notifications.filter(n => n.userId === user?.id);
    const unreadCount = userNotifs.filter(n => !n.isRead).length;

    const handleNotifPress = (notif: NotificationType) => {
        // Mark as read immediately
        markAsRead(notif.id);

        // Route based on notification type and available data
        const { type, data } = notif;

        if ((type === 'join_request' || type === 'request_accepted' || type === 'request_rejected' || type === 'participant_left' || type === 'new_meal') && data?.postId) {
            navigation.navigate('PostDetail', { postId: data.postId });
        } else if ((type === 'follow_request' || type === 'follow_accepted') && data?.userId) {
            navigation.navigate('UserProfile', { userId: data.userId });
        } else if (type === 'new_message' && data?.chatId) {
            navigation.navigate('ChatDetail', { chatId: data.chatId, chatName: data.chatName || 'Chat' });
        }
        // For types with no navigation target, just mark read
    };

    const renderNotifItem = ({ item }: { item: NotificationType }) => {
        const config = getNotifConfig(item.type);
        const isUnread = !item.isRead;

        return (
            <TouchableOpacity
                style={[
                    styles.notifItem,
                    { backgroundColor: Colors.backgroundCard, borderColor: Colors.border },
                    isUnread && { borderColor: config.color + '40', backgroundColor: config.color + '08' }
                ]}
                onPress={() => handleNotifPress(item)}
                activeOpacity={0.75}
            >
                <View style={[styles.iconWrap, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon as any} size={20} color={config.color} />
                </View>

                <View style={styles.notifContent}>
                    <Text style={[styles.notifTitle, { color: Colors.textPrimary }]}>{item.title}</Text>
                    <Text style={[styles.notifBody, { color: Colors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
                    <Text style={[styles.notifTime, { color: Colors.textMuted }]}>{getTimeDiff(item.createdAt)}</Text>
                </View>

                {isUnread && (
                    <View style={[styles.unreadDot, { backgroundColor: config.color }]} />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Notifications</Text>
                    {unreadCount > 0 && (
                        <View style={[styles.countBadge, { backgroundColor: Colors.primary }]}>
                            <Text style={styles.countText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={[styles.markAll, { color: Colors.primary }]}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={userNotifs}
                keyExtractor={(item) => item.id}
                renderItem={renderNotifItem}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <LinearGradient colors={['#FF6B3520', '#FF3CAC20']} style={styles.emptyIcon}>
                            <Ionicons name="notifications-off-outline" size={42} color={Colors.textMuted} />
                        </LinearGradient>
                        <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>All caught up!</Text>
                        <Text style={[styles.emptyBody, { color: Colors.textMuted }]}>You have no notifications yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
        paddingVertical: 14, borderBottomWidth: 1, gap: 12
    },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    countBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    countText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
    markAll: { fontSize: 13, fontWeight: '700' },
    list: { padding: 16, paddingBottom: 40 },
    notifItem: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        padding: 14, borderRadius: 18, marginBottom: 10, borderWidth: 1,
    },
    iconWrap: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    notifContent: { flex: 1 },
    notifTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
    notifBody: { fontSize: 13, marginTop: 3, lineHeight: 18 },
    notifTime: { fontSize: 11, marginTop: 6, fontWeight: '500' },
    unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
    empty: { alignItems: 'center', paddingTop: 100, gap: 16 },
    emptyIcon: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyTitle: { fontSize: 20, fontWeight: '800' },
    emptyBody: { fontSize: 14 },
});
