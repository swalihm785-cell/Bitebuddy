import React from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CustomAlert } from '../../components/common/CustomAlert';
import { RootStackParamList } from '../../types';

// Icon + accent color per notification type
const TYPE_CONFIG: Record<string, { icon: string; color: string; emoji: string }> = {
    join_request: { icon: 'person-add-outline', color: '#FF6B35', emoji: '📨' },
    request_accepted: { icon: 'checkmark-circle-outline', color: '#22C55E', emoji: '✅' },
    request_rejected: { icon: 'close-circle-outline', color: '#EF4444', emoji: '❌' },
    participant_left: { icon: 'exit-outline', color: '#EF4444', emoji: '👋' },
    new_message: { icon: 'chatbubble-outline', color: '#6C63FF', emoji: '💬' },
    review: { icon: 'star-outline', color: '#F59E0B', emoji: '⭐' },
    event: { icon: 'location-outline', color: '#FF3CAC', emoji: '📍' },
    follow_request: { icon: 'person-outline', color: '#3CA5FF', emoji: '👤' },
    follow_accepted: { icon: 'people-outline', color: '#22C55E', emoji: '🤝' },
    new_meal: { icon: 'restaurant-outline', color: '#FF6B35', emoji: '🍽️' },
    invite_received: { icon: 'mail-outline', color: '#6C63FF', emoji: '📨' },
    invite_accepted: { icon: 'checkmark-circle-outline', color: '#22C55E', emoji: '✅' },
    invite_rejected: { icon: 'close-circle-outline', color: '#EF4444', emoji: '❌' },
    report: { icon: 'flag-outline', color: '#EF4444', emoji: '🚩' },
    welcome: { icon: 'heart-outline', color: '#FF3CAC', emoji: '👋' },
    system: { icon: 'information-circle-outline', color: '#6C63FF', emoji: 'ℹ️' },
};

const DEFAULT_CONFIG = { icon: 'notifications-outline', color: '#6C63FF', emoji: '🔔' };

export default function NotificationsScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { currentTheme } = useThemeStore();
    const { Colors, FontSize, FontWeight, Spacing } = currentTheme;
    const { notifications, markAsRead, markAllAsRead, addNotification } = useNotificationStore();
    const { posts } = usePostStore();
    const { user } = useAuthStore();

    const [popupNotif, setPopupNotif] = React.useState<typeof notifications[0] | null>(null);
    const [fallbackAlert, setFallbackAlert] = React.useState(false);

    const handlePress = (notif: typeof notifications[0]) => {
        markAsRead(notif.id);
        setPopupNotif(notif);
    };

    const handleAction = (notif: typeof notifications[0]) => {
        setPopupNotif(null);
        setTimeout(() => {
            const postId = notif.data?.postId;
            const userId = notif.data?.userId;

            switch (notif.type) {
                case 'join_request':
                case 'request_accepted':
                case 'request_rejected':
                case 'participant_left':
                case 'new_meal':
                case 'invite_received':
                case 'invite_accepted':
                case 'invite_rejected': {
                    if (!postId) { setFallbackAlert(true); return; }
                    const postExists = posts.find(p => p.id === postId);
                    if (!postExists) { setFallbackAlert(true); return; }
                    navigation.navigate('PostDetail', { postId });
                    break;
                }
                case 'new_message': {
                    const chatId = notif.data?.chatId;
                    const chatName = notif.data?.chatName || 'Chat';
                    if (!chatId) { setFallbackAlert(true); return; }
                    navigation.navigate('ChatDetail', { chatId, chatName, isGroup: false });
                    break;
                }
                case 'follow_request':
                case 'follow_accepted':
                case 'review': {
                    if (!userId) { setFallbackAlert(true); return; }
                    navigation.navigate('UserProfile' as any, { userId });
                    break;
                }
            }
        }, 100);
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const NotifItem = ({ notif }: { notif: typeof notifications[0] }) => {
        const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
        return (
            <TouchableOpacity
                style={[
                    styles.item,
                    { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
                    !notif.isRead && { backgroundColor: Colors.primary + '08' }
                ]}
                onPress={() => handlePress(notif)}
                activeOpacity={0.75}
            >
                {/* Icon circle */}
                <View style={[styles.iconCircle, { backgroundColor: cfg.color + '18' }]}>
                    <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
                </View>

                <View style={styles.content}>
                    <View style={styles.topRow}>
                        <Text style={[styles.title, { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold }]} numberOfLines={1}>
                            {notif.title}
                        </Text>
                        <Text style={[styles.time, { color: Colors.textMuted, fontSize: FontSize.xs }]}>
                            {formatTime(notif.createdAt)}
                        </Text>
                    </View>
                    <Text style={[styles.body, { color: Colors.textSecondary, fontSize: FontSize.sm }]} numberOfLines={2}>
                        {notif.body}
                    </Text>
                </View>

                {/* Unread dot */}
                {!notif.isRead && (
                    <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                )}
            </TouchableOpacity>
        );
    };

    const getActionBtnText = (type: string) => {
        if (['join_request', 'request_accepted', 'request_rejected', 'participant_left', 'new_meal', 'invite_received', 'invite_accepted', 'invite_rejected'].includes(type)) return 'View Post';
        if (type === 'new_message') return 'View Chat';
        if (['follow_request', 'follow_accepted', 'review'].includes(type)) return 'View Profile';
        return null;
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: Colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold }]}>
                        Notifications
                    </Text>
                    {unreadCount > 0 && (
                        <Text style={[styles.headerSub, { color: Colors.textMuted, fontSize: FontSize.xs }]}>
                            {unreadCount} unread
                        </Text>
                    )}
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity onPress={markAllAsRead} style={[styles.markAllBtn, { backgroundColor: Colors.primary + '15' }]}>
                        <Ionicons name="checkmark-done-outline" size={16} color={Colors.primary} />
                        <Text style={[styles.markAllText, { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.medium }]}>
                            Mark all read
                        </Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => {
                    addNotification({ type: 'join_request', title: 'New Join Request', body: 'Roshan wants to join Pizza Night', data: { postId: '1' }, userId: '1' });
                    addNotification({ type: 'request_accepted', title: 'Request Accepted', body: 'Your request for Sushi Date was approved!', data: { postId: '1' }, userId: '1' });
                    addNotification({ type: 'request_rejected', title: 'Request Rejected', body: 'Your request for BBQ Party was declined.', data: { postId: '1' }, userId: '1' });
                    addNotification({ type: 'new_message', title: 'New Chat Request', body: 'Viknesh sent you a chat request.', data: { chatId: 'chat-viknesh' }, userId: '1' });
                    addNotification({ type: 'system', title: 'User Blocked', body: 'You have blocked this user successfully.', userId: '1' });
                    addNotification({ type: 'participant_left', title: 'Participant Left', body: 'Don has left your Pizza Night meal.', data: { postId: '1' }, userId: '1' });
                    addNotification({ type: 'follow_request', title: 'Follow Request', body: 'Swalih requested to follow you.', data: { userId: 'swalih' }, userId: '1' });
                    addNotification({ type: 'follow_accepted', title: 'Follow Accepted', body: 'You are now following Swalih.', data: { userId: 'swalih' }, userId: '1' });
                    addNotification({ type: 'event', title: 'Snap View', body: 'Don viewed your snap.', data: { userId: 'don' }, userId: '1' });
                    addNotification({ type: 'welcome', title: 'Snap Posted', body: 'A new snap was posted by Roshan.', data: { userId: 'roshan' }, userId: '1' });
                }} style={[{ marginLeft: 12, backgroundColor: Colors.warning + '15', padding: 8, borderRadius: 16 }]}>
                    <Text style={{ fontSize: 18 }}>🧪</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <NotifItem notif={item} />}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: Colors.border }]} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <View style={[styles.emptyIconWrap, { backgroundColor: Colors.backgroundCard }]}>
                            <Text style={{ fontSize: 40 }}>🔔</Text>
                        </View>
                        <Text style={[styles.emptyTitle, { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: FontWeight.bold }]}>
                            All caught up!
                        </Text>
                        <Text style={[styles.emptySub, { color: Colors.textMuted, fontSize: FontSize.sm }]}>
                            No notifications yet. Join a dining plan to get started.
                        </Text>
                    </View>
                }
            />

            {/* Notification Detail Popup */}
            {popupNotif && (
                <View style={styles.overlay}>
                    <View style={[styles.popup, { backgroundColor: Colors.backgroundCard, shadowColor: Colors.textPrimary }]}>
                        <View style={[styles.popupIconWrap, { backgroundColor: (TYPE_CONFIG[popupNotif.type] || DEFAULT_CONFIG).color + '15' }]}>
                            <Ionicons name={(TYPE_CONFIG[popupNotif.type] || DEFAULT_CONFIG).icon as any} size={28} color={(TYPE_CONFIG[popupNotif.type] || DEFAULT_CONFIG).color} />
                        </View>
                        <Text style={[styles.popupTitle, { color: Colors.textPrimary }]}>{popupNotif.title}</Text>
                        <Text style={[styles.popupTime, { color: Colors.textMuted }]}>{new Date(popupNotif.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</Text>

                        <View style={[styles.popupBodyWrap, { backgroundColor: Colors.backgroundElevated }]}>
                            <Text style={[styles.popupBody, { color: Colors.textSecondary }]}>{popupNotif.body}</Text>
                        </View>

                        <View style={styles.popupFooter}>
                            {getActionBtnText(popupNotif.type) && (
                                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => handleAction(popupNotif)}>
                                    <Text style={styles.actionBtnText}>{getActionBtnText(popupNotif.type)}</Text>
                                    <Ionicons name="arrow-forward" size={16} color="#FFF" />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.closeBtn, { borderColor: Colors.border }]} onPress={() => setPopupNotif(null)}>
                                <Text style={[styles.closeBtnText, { color: Colors.textMuted }]}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Fallback when content is gone */}
            <CustomAlert
                visible={fallbackAlert}
                title="Content Unavailable"
                message="This content is no longer available. It may have been deleted or removed."
                type="warning"
                confirmText="OK"
                onConfirm={() => setFallbackAlert(false)}
                onClose={() => setFallbackAlert(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', borderBottomWidth: 1 },
    headerTitle: {},
    headerSub: { marginTop: 2 },
    markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    markAllText: {},
    list: {},
    item: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    title: { flex: 1 },
    time: { marginLeft: 12 },
    body: { lineHeight: 20 },
    dot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
    separator: { height: 1, marginLeft: 78 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyTitle: {},
    emptySub: { textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },

    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    popup: { width: '85%', borderRadius: 24, padding: 24, paddingBottom: 28, alignItems: 'center', elevation: 12, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
    popupIconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    popupTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
    popupTime: { fontSize: 13, fontWeight: '600', marginBottom: 20 },
    popupBodyWrap: { width: '100%', padding: 16, borderRadius: 16, marginBottom: 24 },
    popupBody: { fontSize: 15, lineHeight: 24, textAlign: 'center' },
    popupFooter: { width: '100%', gap: 12 },
    actionBtn: { width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 14, borderRadius: 16 },
    actionBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    closeBtn: { width: '100%', alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
    closeBtnText: { fontSize: 15, fontWeight: '700' },
});
