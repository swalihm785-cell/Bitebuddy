import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import BrandBar from '../../components/common/BrandBar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CustomAlert } from '../../components/common/CustomAlert';

import { Notification as NotificationType } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { RootStackParamList } from '../../types';

const ICON_COLOR = '#FFB534';

const NOTIF_CONFIG: Record<string, { icon: string; color: string }> = {
    join_request: { icon: 'person-add-outline', color: ICON_COLOR },
    request_accepted: { icon: 'checkmark-circle-outline', color: ICON_COLOR },
    request_rejected: { icon: 'close-circle-outline', color: ICON_COLOR },
    participant_left: { icon: 'exit-outline', color: ICON_COLOR },
    new_message: { icon: 'chatbubble-outline', color: ICON_COLOR },
    review: { icon: 'star-outline', color: ICON_COLOR },
    event: { icon: 'calendar-outline', color: ICON_COLOR },
    follow_request: { icon: 'person-outline', color: ICON_COLOR },
    follow_accepted: { icon: 'people-outline', color: ICON_COLOR },
    new_meal: { icon: 'restaurant-outline', color: ICON_COLOR },
    invite_received: { icon: 'mail-outline', color: ICON_COLOR },
    invite_accepted: { icon: 'checkmark-circle-outline', color: ICON_COLOR },
    invite_rejected: { icon: 'close-circle-outline', color: ICON_COLOR },
    report: { icon: 'flag-outline', color: ICON_COLOR },
    welcome: { icon: 'hand-left-outline', color: ICON_COLOR },
    system: { icon: 'information-circle-outline', color: ICON_COLOR },
};

function getNotifConfig(type: string) {
    return NOTIF_CONFIG[type] || { icon: 'notifications-outline', color: ICON_COLOR };
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

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'error' | 'info' | 'warning' }>({ visible: false, title: '', message: '' });

    const userNotifs = notifications.filter(n => n.userId === user?.id);
    const unreadCount = userNotifs.filter(n => !n.isRead).length;

    const handleNotifPress = (notif: NotificationType) => {
        markAsRead(notif.id);

        const { type, data } = notif;

        setTimeout(() => {
            if (data?.postId) {
                // Any notification tied to a specific meal/post
                navigation.navigate('PostDetail', { postId: data.postId });
            } else if (data?.chatId) {
                // Any notification tied to a chat (new message, request, etc)
                navigation.navigate('ChatDetail', { chatId: data.chatId, chatName: data.chatName || 'Chat' });
            } else if (data?.userId && type !== 'welcome' && type !== 'system') {
                // Any notification tied to a user profile (follow, review)
                navigation.navigate('UserProfile', { userId: data.userId });
            } else {
                // Fallback for system, welcome, reports, or missing data
                setAlertConfig({ visible: true, title: notif.title, message: notif.body, type: 'info' });
            }
        }, 100);
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
        <View style={[styles.safeArea, { backgroundColor: Colors.background }]}>
            <BrandBar />
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="arrow-back" size={24} color={'#ffb534'} />
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>Notifications</Text>
                    </TouchableOpacity>
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

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                onConfirm={() => setAlertConfig({ ...alertConfig, visible: false })}
                confirmText="Got it"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
        paddingVertical: 14, borderBottomWidth: 1, gap: 12
    },
    backBtn: { padding: 4 },
    headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800' },
    countBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    countText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
    markAll: { fontSize: 13, fontWeight: '700' },
    list: { paddingHorizontal: 12, paddingVertical: 16, paddingBottom: 40 },
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
