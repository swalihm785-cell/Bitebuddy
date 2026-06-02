import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
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

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTER_TABS = ['All', 'Reminders', 'Payment', 'Booking'];

// ── Per-type icon + category ──────────────────────────────────────────────────
// Icon background is always the same warm soft tint — only the icon glyph changes
const TYPE_CONFIG: Record<string, { icon: string; category: string }> = {
    join_request:     { icon: 'bookmark-outline',      category: 'Booking'   },
    request_accepted: { icon: 'bookmark-outline',      category: 'Booking'   },
    request_rejected: { icon: 'bookmark-outline',      category: 'Booking'   },
    participant_left: { icon: 'bookmark-outline',      category: 'Booking'   },
    new_meal:         { icon: 'bookmark-outline',      category: 'Booking'   },
    invite_received:  { icon: 'bookmark-outline',      category: 'Booking'   },
    invite_accepted:  { icon: 'bookmark-outline',      category: 'Booking'   },
    invite_rejected:  { icon: 'bookmark-outline',      category: 'Booking'   },
    new_message:      { icon: 'chatbubble-outline',    category: 'Reminders' },
    review:           { icon: 'star-outline',          category: 'Reminders' },
    event:            { icon: 'notifications-outline', category: 'Reminders' },
    follow_request:   { icon: 'person-outline',        category: 'Reminders' },
    follow_accepted:  { icon: 'people-outline',        category: 'Reminders' },
    report:           { icon: 'flag-outline',          category: 'Reminders' },
    welcome:          { icon: 'heart-outline',         category: 'Reminders' },
    system:           { icon: 'notifications-outline', category: 'Reminders' },
    payment_success:  { icon: 'card-outline',          category: 'Payment'   },
    payment_saved:    { icon: 'card-outline',          category: 'Payment'   },
    goal_achieved:    { icon: 'trophy-outline',        category: 'Reminders' },
};
const DEFAULT_CONFIG = { icon: 'notifications-outline', category: 'Reminders' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const isToday = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    return d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();
};

const isWithinLast7Days = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && !isToday(date);
};

const isWithinLastMonth = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && !isToday(date) && !isWithinLast7Days(date);
};

const isEarlier = (date: Date) => {
    return !isToday(date) && !isWithinLast7Days(date) && !isWithinLastMonth(date);
};

const formatTime = (date: Date) => {
    const d = new Date(date);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const getCategoryFromTitle = (title: string): string => {
    const t = title.toLowerCase();
    if (t.includes('payment') || t.includes('paid') || t.includes('method')) return 'Payment';
    if (t.includes('booking') || t.includes('session') || t.includes('slot') ||
        t.includes('cancel') || t.includes('confirm')) return 'Booking';
    return 'Reminders';
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;
    const { notifications, markAsRead, markAllAsRead, addNotification } = useNotificationStore();
    const { acceptFollowRequest, rejectFollowRequest, updateUser, user } = useAuthStore();
    const { posts } = usePostStore();

    const [activeTab, setActiveTab] = useState('All');
    const [popupNotif, setPopupNotif] = React.useState<typeof notifications[0] | null>(null);
    const [fallbackAlert, setFallbackAlert] = React.useState(false);

    // Icon palette — unified warm tint matching screenshot
    // Light mode: blush pink bg, medium salmon icon
    // Dark mode:  muted warm tint bg, warm icon
    const iconBg   = isDarkMode ? 'rgba(255,180,150,0.12)' : '#FFF0EC';
    const iconColor = isDarkMode ? '#E0A090' : '#C07060';

    const filteredNotifs = notifications.filter(n => {
        if (activeTab === 'All') return true;
        const cfg = TYPE_CONFIG[n.type] || DEFAULT_CONFIG;
        const cat = cfg.category || getCategoryFromTitle(n.title);
        return cat === activeTab;
    });

    const todayNotifs     = filteredNotifs.filter(n => isToday(n.createdAt));
    const last7DaysNotifs = filteredNotifs.filter(n => isWithinLast7Days(n.createdAt));
    const lastMonthNotifs = filteredNotifs.filter(n => isWithinLastMonth(n.createdAt));
    const earlierNotifs   = filteredNotifs.filter(n => isEarlier(n.createdAt));

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
                    if (!posts.find(p => p.id === postId)) { setFallbackAlert(true); return; }
                    navigation.navigate('PostDetail', { postId });
                    break;
                }
                case 'new_message': {
                    const chatId = notif.data?.chatId;
                    if (!chatId) { setFallbackAlert(true); return; }
                    navigation.navigate('ChatDetail', { chatId, chatName: notif.data?.chatName || 'Chat', isGroup: false });
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

    const getActionBtnText = (type: string) => {
        if (['join_request', 'request_accepted', 'request_rejected', 'participant_left',
            'new_meal', 'invite_received', 'invite_accepted', 'invite_rejected'].includes(type)) return 'View Post';
        if (type === 'new_message') return 'View Chat';
        if (['follow_request', 'follow_accepted', 'review'].includes(type)) return 'View Profile';
        return null;
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // ── Notification Row ──────────────────────────────────────────────────────
    const NotifRow = ({ notif }: { notif: typeof notifications[0] }) => {
        const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CONFIG;
        const isUnread = !notif.isRead;

        return (
            <TouchableOpacity
                style={styles.row}
                onPress={() => handlePress(notif)}
                activeOpacity={0.65}
            >
                {/* Unified warm icon circle */}
                <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
                    <Ionicons name={cfg.icon as any} size={22} color={iconColor} />
                </View>

                {/* Content */}
                <View style={styles.rowContent}>
                    {/* Title + Time on same row */}
                    <View style={styles.rowTop}>
                        <Text
                            style={[
                                styles.rowTitle,
                                {
                                    color: Colors.textPrimary,
                                    fontWeight: isUnread ? '700' : '600',
                                }
                            ]}
                            numberOfLines={1}
                        >
                            {notif.title}
                        </Text>
                        <Text style={[styles.rowTime, { color: Colors.textMuted }]}>
                            {formatTime(notif.createdAt)}
                        </Text>
                    </View>

                    {/* Body — 2 lines */}
                    <Text
                        style={[styles.rowBody, { color: isDarkMode ? Colors.textSecondary : '#5A5A6E' }]}
                        numberOfLines={2}
                    >
                        {notif.body}
                    </Text>
                </View>

                {/* Unread dot */}
                {isUnread && (
                    <View style={[styles.unreadDot, { backgroundColor: Colors.primary }]} />
                )}
            </TouchableOpacity>
        );
    };

    // ── Section (Today / Earlier) ─────────────────────────────────────────────
    // "Today," gets a trailing comma; "Earlier" does not
    const Section = ({ label, data }: { label: string; data: typeof notifications }) => {
        if (data.length === 0) return null;
        const displayLabel = label === 'Today' ? 'Today,' : label;
        return (
            <View>
                <Text style={[styles.sectionLabel, { color: Colors.textPrimary }]}>
                    {displayLabel}
                </Text>
                {data.map((n) => (
                    <View key={n.id}>
                        <NotifRow notif={n} />
                        <View style={[styles.separator, { backgroundColor: isDarkMode ? Colors.border : '#E8E8F0' }]} />
                    </View>
                ))}
            </View>
        );
    };

    // ── Tab styles — selected = textPrimary bg (dark), unselected = card bg + border ──
    const getTabStyle = (tab: string) => {
        const isActive = tab === activeTab;
        return {
            container: {
                backgroundColor: isActive
                    ? Colors.textPrimary               // dark bg when selected (matches screenshot)
                    : Colors.backgroundCard,
                borderColor: isActive
                    ? Colors.textPrimary
                    : isDarkMode ? Colors.border : '#D8D8E4',
            },
            text: {
                color: isActive
                    ? (isDarkMode ? '#0F0F14' : '#FFFFFF') // inverse text on dark bg
                    : Colors.textSecondary,
                fontWeight: (isActive ? '600' : '400') as '600' | '400',
            },
        };
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: Colors.background }]} edges={['top']}>

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity
                        onPress={() => navigation.isFocused() && navigation.goBack()}
                        style={styles.backBtn}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>
                        Notifications
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {unreadCount > 0 && (
                        <TouchableOpacity
                            onPress={markAllAsRead}
                            style={[styles.iconBtn, { backgroundColor: Colors.backgroundCard }]}
                        >
                            <Ionicons name="checkmark-done" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* ── Filter Tabs ────────────────────────────────────────────────── */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}
                style={{ flexGrow: 0, maxHeight: 70 }}
            >
                {FILTER_TABS.map(tab => {
                    const ts = getTabStyle(tab);
                    return (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, {
                                backgroundColor: ts.container.backgroundColor,
                                borderColor: ts.container.borderColor,
                            }]}
                            onPress={() => setActiveTab(tab)}
                            activeOpacity={0.75}
                        >
                            <Text style={[styles.tabText, { color: ts.text.color, fontWeight: ts.text.fontWeight }]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* ── Notification List ──────────────────────────────────────────── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                    styles.listContent,
                    filteredNotifs.length === 0 && { flex: 1 },
                ]}
            >
                {filteredNotifs.length === 0 ? (
                    <View style={styles.empty}>
                        <View style={[styles.emptyIconWrap, { backgroundColor: iconBg }]}>
                            <Ionicons name="notifications-outline" size={32} color={iconColor} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: Colors.textPrimary }]}>
                            All caught up!
                        </Text>
                        <Text style={[styles.emptySub, { color: Colors.textMuted }]}>
                            {activeTab === 'All'
                                ? 'No notifications yet.'
                                : `No ${activeTab.toLowerCase()} notifications yet.`}
                        </Text>
                    </View>
                ) : (
                    <>
                        <Section label="Today" data={todayNotifs} />
                        <Section label="Last 7 days" data={last7DaysNotifs} />
                        <Section label="Last month" data={lastMonthNotifs} />
                        <Section label="Earlier" data={earlierNotifs} />
                    </>
                )}
            </ScrollView>

            {/* ── Detail Popup ───────────────────────────────────────────────── */}
            {popupNotif && (
                <View style={styles.overlay}>
                    <View style={[styles.popup, {
                        backgroundColor: Colors.backgroundCard,
                        shadowColor: isDarkMode ? '#000' : '#888',
                    }]}>
                        <View style={[styles.popupIconWrap, { backgroundColor: iconBg }]}>
                            <Ionicons
                                name={(TYPE_CONFIG[popupNotif.type] || DEFAULT_CONFIG).icon as any}
                                size={28}
                                color={iconColor}
                            />
                        </View>
                        <Text style={[styles.popupTitle, { color: Colors.textPrimary }]}>
                            {popupNotif.title}
                        </Text>
                        <Text style={[styles.popupTime, { color: Colors.textMuted }]}>
                            {new Date(popupNotif.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </Text>

                        <View style={[styles.popupBodyWrap, { backgroundColor: isDarkMode ? Colors.backgroundElevated : '#F8F8FB' }]}>
                            <Text style={[styles.popupBody, { color: Colors.textSecondary }]}>
                                {popupNotif.body}
                            </Text>
                        </View>

                        <View style={styles.popupFooter}>
                            {popupNotif.type === 'follow_request' && popupNotif.data?.userId ? (
                                <>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#22C55E' }]}
                                        onPress={() => {
                                            const rid = popupNotif.data?.userId;
                                            if (!rid || !user) return;
                                            if (!user.followRequests.includes(rid)) {
                                                updateUser({ followRequests: [...user.followRequests, rid] });
                                            }
                                            setTimeout(() => {
                                                acceptFollowRequest(rid);
                                                addNotification({ userId: rid, type: 'follow_accepted', title: 'Buddy Request Accepted! 🎉', body: `${user.name} accepted your buddy request.`, data: { userId: user.id } });
                                                markAsRead(popupNotif.id);
                                                setPopupNotif(null);
                                            }, 50);
                                        }}
                                    >
                                        <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                                        <Text style={styles.actionBtnText}>Accept</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                                        onPress={() => {
                                            const rid = popupNotif.data?.userId;
                                            if (!rid || !user) return;
                                            if (!user.followRequests.includes(rid)) {
                                                updateUser({ followRequests: [...user.followRequests, rid] });
                                            }
                                            setTimeout(() => {
                                                rejectFollowRequest(rid);
                                                markAsRead(popupNotif.id);
                                                setPopupNotif(null);
                                            }, 50);
                                        }}
                                    >
                                        <Ionicons name="close-circle" size={18} color="#FFF" />
                                        <Text style={styles.actionBtnText}>Decline</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    {getActionBtnText(popupNotif.type) && (
                                        <TouchableOpacity
                                            style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                                            onPress={() => handleAction(popupNotif)}
                                        >
                                            <Text style={[styles.actionBtnText, { color: isDarkMode ? '#0F0F14' : '#FFF' }]}>
                                                {getActionBtnText(popupNotif.type)}
                                            </Text>
                                            <Ionicons name="arrow-forward" size={16} color={isDarkMode ? '#0F0F14' : '#FFF'} />
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                            <TouchableOpacity
                                style={[styles.closeBtn, { borderColor: Colors.border }]}
                                onPress={() => setPopupNotif(null)}
                            >
                                <Text style={[styles.closeBtnText, { color: Colors.textMuted }]}>Dismiss</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            <CustomAlert
                visible={fallbackAlert}
                title="Content Unavailable"
                message="This content is no longer available."
                type="warning"
                confirmText="OK"
                onConfirm={() => setFallbackAlert(false)}
                onClose={() => setFallbackAlert(false)}
            />
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.4,
    },
    backBtn: {
        padding: 4,
    },
    iconBtn: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },

    // Tabs — pill shape, 1px border, matches screenshot exactly
    tabsContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 8,
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tab: {
        paddingHorizontal: 18,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabText: { fontSize: 14, lineHeight: 20 },

    // List
    listContent: { paddingBottom: 110 },

    // Section label — "Today," / "Earlier"
    sectionLabel: {
        fontSize: 17,
        fontWeight: '700',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 6,
        letterSpacing: -0.2,
    },

    // Row — matches screenshot layout exactly
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 13,
        gap: 14,
    },

    // Unified soft warm icon circle
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },

    rowContent: { flex: 1, paddingTop: 1 },

    rowTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 4,
        gap: 8,
    },
    rowTitle: {
        fontSize: 15,
        flex: 1,
        lineHeight: 20,
    },
    rowTime: {
        fontSize: 12,
        flexShrink: 0,
        marginTop: 1,
    },
    rowBody: {
        fontSize: 13,
        lineHeight: 19,
    },

    // Unread indicator dot
    unreadDot: {
        width: 9, height: 9, borderRadius: 4.5,
        alignSelf: 'center',
        marginLeft: 2,
        flexShrink: 0,
    },

    // Hairline separator — starts at content left edge (after icon)
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 80,      // icon width 50 + gap 14 + row padding 16
        marginRight: 0,
    },

    // Empty state
    empty: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingTop: 80,
    },
    emptyIconWrap: {
        width: 72, height: 72, borderRadius: 36,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 4,
    },
    emptyTitle: { fontSize: 17, fontWeight: '700' },
    emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },

    // Detail popup
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 1000,
    },
    popup: {
        width: '88%',
        borderRadius: 24, padding: 24, paddingBottom: 28,
        alignItems: 'center',
        elevation: 12,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
    },
    popupIconWrap: {
        width: 64, height: 64, borderRadius: 32,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 14,
    },
    popupTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 5 },
    popupTime: { fontSize: 12, fontWeight: '500', marginBottom: 16 },
    popupBodyWrap: { width: '100%', padding: 14, borderRadius: 14, marginBottom: 20 },
    popupBody: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
    popupFooter: { width: '100%', gap: 10 },
    actionBtn: {
        width: '100%', flexDirection: 'row',
        justifyContent: 'center', alignItems: 'center',
        gap: 8, paddingVertical: 14, borderRadius: 14,
    },
    actionBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    closeBtn: {
        width: '100%', alignItems: 'center',
        paddingVertical: 13, borderRadius: 14, borderWidth: 1,
    },
    closeBtnText: { fontSize: 14, fontWeight: '600' },
});
