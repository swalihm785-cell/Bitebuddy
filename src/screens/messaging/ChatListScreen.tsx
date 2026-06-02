import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Modal, TextInput, Image, Alert, Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandBar from '../../components/common/BrandBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore, ChatConversation } from '../../store/useChatStore';
import { TEST_USERS } from '../../data/testUsers';


const ALL_USERS = Object.values(TEST_USERS).map(u => u.user);

const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
        let h = d.getHours();
        const m = d.getMinutes();
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
    }
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export default function ChatListScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors, FontSize, FontWeight, Spacing } = currentTheme;
    const { user } = useAuthStore();
    const { conversations, sendChatRequest, acceptRequest, blockConversation, deleteRequest, markRead } = useChatStore();

    const [newChatVisible, setNewChatVisible] = useState(false);
    const [search, setSearch] = useState('');

    const isPro = true;
    const myId = user?.id || '';

    const visibleChats = conversations.filter(c =>
        c.ownerId === myId && c.status !== 'blocked' && c.status !== 'deleted' && (isPro || !c.isGroup)
    );
    const pendingIncoming = visibleChats
        .filter(c => c.status === 'pending' && !c.initiatedByMe)
        .sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());
    const activeChats = visibleChats
        .filter(c => !(c.status === 'pending' && !c.initiatedByMe))
        .sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());

    const existingIds = new Set(visibleChats.map(c => c.participantId));
    const searchResults = ALL_USERS
        .filter(u => u.id !== myId)
        .filter(u => !existingIds.has(u.id))
        .filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    const handleOpenChat = (chat: ChatConversation) => {
        if (chat.status === 'pending' && chat.initiatedByMe) {
            Alert.alert('Pending', 'Waiting for the user to accept your chat request.');
            return;
        }
        markRead(chat.id, myId);
        navigation.navigate('ChatDetail', {
            chatId: chat.id,
            chatName: chat.participantName,
            isGroup: chat.isGroup,
        });
    };

    const handleStartChat = (targetUser: typeof ALL_USERS[0]) => {
        sendChatRequest(
            { id: user!.id, name: user!.name, avatar: user!.photoURL },
            { id: targetUser.id, name: targetUser.name, avatar: targetUser.photoURL },
            'Hi 👋'
        );
        setNewChatVisible(false);
        setSearch('');
        Alert.alert('Message Sent', `Your first message has been sent to ${targetUser.name}. They need to accept the request to continue chatting.`);
    };

    // ── Pending request card ──────────────────────────────────────────────────
    const renderPendingCard = ({ item: chat }: { item: any }) => (
        <View style={[styles.pendingCard, {
            backgroundColor: Colors.backgroundCard,
            borderColor: chat.isGroup ? Colors.primary + '40' : Colors.warning + '40',
            marginHorizontal: 16,
            marginTop: 8,
        }]}>
            <View style={styles.pendingTop}>
                <View style={[styles.avatarContainer, { width: 50, height: 50 }]}>
                    {chat.participantAvatar ? (
                        <Image source={{ uri: chat.participantAvatar }} style={styles.avatar50} />
                    ) : (
                        <LinearGradient
                            colors={chat.isGroup ? ['#6C63FF', '#3CA5FF'] : [Colors.primary + '60', Colors.primary + '30']}
                            style={styles.avatar50}
                        >
                            <Text style={styles.initialsText}>{getInitials(chat.participantName)}</Text>
                        </LinearGradient>
                    )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.chatName, { color: Colors.textPrimary, fontWeight: '700', fontSize: 15 }]} numberOfLines={1}>
                        {chat.participantName}
                    </Text>
                    <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 2 }}>
                        {chat.isGroup ? 'Invite to join group' : 'Wants to start a conversation'}
                    </Text>
                </View>
                <View style={[styles.pendingBadge, {
                    backgroundColor: chat.isGroup ? Colors.primary + '20' : Colors.warning + '20',
                }]}>
                    <Text style={{ fontSize: 10, color: chat.isGroup ? Colors.primary : Colors.warning, fontWeight: '700' }}>
                        {chat.isGroup ? 'GROUP' : 'REQUEST'}
                    </Text>
                </View>
            </View>
            <View style={styles.pendingActions}>
                <TouchableOpacity
                    style={[styles.pendingBtn, { backgroundColor: Colors.success }]}
                    onPress={() => acceptRequest(chat.id)}
                >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={[styles.pendingBtnText, { color: '#FFF' }]}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.pendingBtn, { backgroundColor: Colors.backgroundElevated, borderWidth: 1, borderColor: Colors.border }]}
                    onPress={() => deleteRequest(chat.id, myId)}
                >
                    <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                    <Text style={[styles.pendingBtnText, { color: Colors.textMuted }]}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ── Regular chat row (Instagram DM style) ─────────────────────────────────
    const renderChatItem = ({ item: chat }: { item: any }) => {
        const hasUnread = chat.unreadCount > 0;
        const isPending = chat.status === 'pending' && chat.initiatedByMe;

        return (
            <TouchableOpacity
                style={styles.chatRow}
                onPress={() => handleOpenChat(chat)}
                activeOpacity={0.7}
            >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {chat.participantAvatar ? (
                        <Image source={{ uri: chat.participantAvatar }} style={styles.avatar56} />
                    ) : (
                        <LinearGradient
                            colors={chat.isGroup ? ['#6C63FF', '#3CA5FF'] : ['#FF6B35', '#FF3CAC']}
                            style={styles.avatar56}
                        >
                            <Text style={[styles.initialsText, { fontSize: 18 }]}>
                                {getInitials(chat.participantName)}
                            </Text>
                        </LinearGradient>
                    )}
                    {/* Online dot */}
                    <View style={[styles.onlineDot, {
                        backgroundColor: isPending ? Colors.warning : Colors.success,
                        borderColor: Colors.background,
                    }]} />
                </View>

                {/* Content */}
                <View style={styles.chatContent}>
                    {/* Name + time */}
                    <View style={styles.chatTopRow}>
                        <Text
                            style={[
                                styles.chatName,
                                {
                                    color: Colors.textPrimary,
                                    fontWeight: hasUnread ? '700' : '600',
                                    fontSize: 15,
                                }
                            ]}
                            numberOfLines={1}
                        >
                            {chat.participantName}
                        </Text>
                        <Text style={[
                            styles.chatTime,
                            {
                                color: hasUnread ? Colors.primary : Colors.textMuted,
                                fontWeight: hasUnread ? '600' : '400',
                            }
                        ]}>
                            {formatTime(chat.lastMessageAt)}
                        </Text>
                    </View>

                    {/* Sub-label for group */}
                    {chat.isGroup && (
                        <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '700', marginBottom: 1 }}>
                            Group · {chat.participantsCount || 2} members
                        </Text>
                    )}

                    {/* Last message or pending notice */}
                    <View style={styles.chatBottomRow}>
                        {isPending ? (
                            <Text style={{ fontSize: 13, color: Colors.warning, fontWeight: '600', flex: 1 }}>
                                ⏳ Waiting for response…
                            </Text>
                        ) : (
                            <Text
                                style={[
                                    styles.lastMsg,
                                    {
                                        color: hasUnread ? Colors.textPrimary : Colors.textMuted,
                                        fontWeight: hasUnread ? '500' : '400',
                                    }
                                ]}
                                numberOfLines={1}
                            >
                                {chat.lastMessage || 'Start a conversation…'}
                            </Text>
                        )}

                        {/* Unread badge */}
                        {hasUnread && !isPending && (
                            <View style={[styles.unreadBadge, { backgroundColor: Colors.primary }]}>
                                <Text style={[styles.unreadText, { color: isDarkMode ? '#111014' : '#FFF' }]}>
                                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const allData = [
        ...pendingIncoming.map(c => ({ ...c, _isPending: true })),
        ...activeChats.map(c => ({ ...c, _isPending: false })),
    ];

    return (
        <View style={[styles.safeArea, { backgroundColor: Colors.background }]}>
            <BrandBar />

            {/* Header — Instagram DM style */}
            <View style={{
                backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.background,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: Colors.border,
                overflow: 'hidden',
            }}>
                {Platform.OS === 'ios' && (
                    <BlurView intensity={80} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                )}
                <View style={[styles.header, { paddingHorizontal: 16, paddingVertical: 12 }]}>
                    {/* Back + Title */}
                    <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                        onPress={() => navigation.isFocused() && navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>
                            Messages
                        </Text>
                    </TouchableOpacity>

                    {/* Right icons */}
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                            style={[styles.headerIconBtn, { backgroundColor: Colors.backgroundCard }]}
                            onPress={() => navigation.navigate('CreateGroupChat' as any)}
                        >
                            <Ionicons name="people-outline" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.headerIconBtn, { backgroundColor: Colors.backgroundCard }]}
                            onPress={() => setNewChatVisible(true)}
                        >
                            <Ionicons name="create-outline" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Chat List */}
            <FlatList
                data={allData}
                keyExtractor={item => item.id}
                renderItem={({ item }) =>
                    (item as any)._isPending
                        ? renderPendingCard({ item })
                        : renderChatItem({ item })
                }
                contentContainerStyle={[
                    styles.list,
                    allData.length === 0 && styles.listEmpty,
                ]}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={({ leadingItem }) =>
                    (leadingItem as any)?._isPending ? null : (
                        <View style={[styles.separator, { backgroundColor: Colors.border }]} />
                    )
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIcon, { backgroundColor: Colors.backgroundCard }]}>
                            <Text style={{ fontSize: 40 }}>💬</Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.textPrimary }}>
                            No messages yet
                        </Text>
                        <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 }}>
                            Tap the compose button to start a conversation
                        </Text>
                        <TouchableOpacity
                            style={[styles.emptyBtn, { backgroundColor: Colors.primary }]}
                            onPress={() => setNewChatVisible(true)}
                        >
                            <Ionicons name="create-outline" size={18} color={isDarkMode ? '#111014' : '#FFF'} />
                            <Text style={{ color: isDarkMode ? '#111014' : '#FFF', fontWeight: '700', fontSize: 15 }}>
                                New Message
                            </Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* New chat modal — Instagram "New message" style */}
            <Modal visible={newChatVisible} animationType="slide" onRequestClose={() => { setNewChatVisible(false); setSearch(''); }} presentationStyle="pageSheet">
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors.background }]} edges={['top']}>

                    {/* Instagram-style header: Cancel | New message (centered) */}
                    <View style={[styles.modalHeader, { borderBottomColor: Colors.border }]}>
                        <TouchableOpacity
                            onPress={() => { setNewChatVisible(false); setSearch(''); }}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Text style={[styles.modalCancelText, { color: Colors.primary }]}>Cancel</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>New message</Text>
                        {/* Spacer to keep title centered */}
                        <View style={{ width: 56 }} />
                    </View>

                    {/* "To:" search row — Instagram style */}
                    <View style={[styles.toRow, { borderBottomColor: Colors.border }]}>
                        <Text style={[styles.toLabel, { color: Colors.textPrimary }]}>To:</Text>
                        <TextInput
                            style={[styles.toInput, { color: Colors.textPrimary }]}
                            placeholder="Search..."
                            placeholderTextColor={Colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                            autoFocus
                            returnKeyType="search"
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
                                <View style={[styles.clearBtn, { backgroundColor: Colors.textMuted }]}>
                                    <Ionicons name="close" size={10} color={Colors.background} />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Suggested label */}
                    {search.length === 0 && (
                        <Text style={[styles.suggestedLabel, { color: Colors.textPrimary }]}>Suggested</Text>
                    )}

                    <FlatList
                        data={searchResults}
                        keyExtractor={u => u.id}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => (
                            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginLeft: 78 }} />
                        )}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingTop: 48, gap: 8 }}>
                                <Text style={{ fontSize: 15, color: Colors.textMuted }}>
                                    {search.length > 0 ? `No results for "${search}"` : 'No suggestions'}
                                </Text>
                            </View>
                        }
                        renderItem={({ item: u }) => (
                            <TouchableOpacity
                                style={styles.userRow}
                                onPress={() => handleStartChat(u)}
                                activeOpacity={0.7}
                            >
                                {/* Avatar */}
                                <View style={styles.modalAvatarWrap}>
                                    <Image
                                        source={{ uri: u.photoURL || `https://i.pravatar.cc/80?u=${u.id}` }}
                                        style={styles.userAvatar}
                                    />
                                </View>
                                {/* Info */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '700' }} numberOfLines={1}>
                                        {u.name}
                                    </Text>
                                    <Text style={{ color: Colors.textMuted, fontSize: 13, marginTop: 1 }} numberOfLines={1}>
                                        {u.profession || u.city || 'BiteBuddy user'}
                                    </Text>
                                </View>
                                {/* Unselected circle (Instagram style) */}
                                <View style={[styles.selectCircle, { borderColor: Colors.border }]} />
                            </TouchableOpacity>
                        )}
                    />
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    headerIconBtn: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: 'center', alignItems: 'center',
    },

    // List
    list: { paddingTop: 8, paddingBottom: 100 },
    listEmpty: { flex: 1 },
    separator: { height: StyleSheet.hairlineWidth, marginLeft: 86 },

    // Pending card
    pendingCard: {
        borderRadius: 16, borderWidth: 1.5,
        padding: 14, gap: 12, marginBottom: 4,
    },
    pendingTop: { flexDirection: 'row', alignItems: 'center' },
    pendingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pendingActions: { flexDirection: 'row', gap: 8 },
    pendingBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 10, borderRadius: 10,
    },
    pendingBtnText: { fontSize: 13, fontWeight: '700' },

    // Chat row
    chatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 14,
    },
    avatarContainer: { position: 'relative', width: 56, height: 56 },
    avatar56: {
        width: 56, height: 56, borderRadius: 28,
        justifyContent: 'center', alignItems: 'center',
    },
    avatar50: {
        width: 50, height: 50, borderRadius: 25,
        justifyContent: 'center', alignItems: 'center',
    },
    initialsText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    onlineDot: {
        position: 'absolute', bottom: 1, right: 1,
        width: 13, height: 13, borderRadius: 6.5, borderWidth: 2,
    },
    chatContent: { flex: 1 },
    chatTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    chatName: { flex: 1, marginRight: 8 },
    chatTime: { fontSize: 12, flexShrink: 0 },
    chatBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMsg: { flex: 1, fontSize: 13, lineHeight: 18 },
    unreadBadge: {
        minWidth: 20, height: 20, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 5, marginLeft: 8,
    },
    unreadText: { fontSize: 11, fontWeight: '800' },

    // Empty
    emptyState: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        padding: 40, gap: 12,
    },
    emptyIcon: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
    },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 28, paddingVertical: 14,
        borderRadius: 28, marginTop: 8,
    },

    // New message modal
    modalContainer: { flex: 1 },
    modalHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    modalCancelText: { fontSize: 16, fontWeight: '500' },
    modalTitle: { fontSize: 16, fontWeight: '800' },

    // "To:" search row
    toRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 10,
    },
    toLabel: { fontSize: 16, fontWeight: '600' },
    toInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
    clearBtn: {
        width: 16, height: 16, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
    },

    // Suggested label
    suggestedLabel: {
        fontSize: 15, fontWeight: '700',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    },

    // User rows
    userRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 10,
    },
    modalAvatarWrap: { width: 54, height: 54 },
    userAvatar: { width: 54, height: 54, borderRadius: 27 },
    selectCircle: {
        width: 24, height: 24, borderRadius: 12,
        borderWidth: 1.5,
    },
    startChatIcon: {
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
    },
});
