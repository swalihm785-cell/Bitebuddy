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
import { CustomAlert } from '../../components/common/CustomAlert';
import { isCurrentlyPro } from '../../utils/authUtils';

// All known users except current user — for "new chat" picker
const ALL_USERS = Object.values(TEST_USERS).map(u => u.user);

const STATUS_COLORS: Record<string, string> = {
    accepted: '#22C55E',
    pending: '#F59E0B',
    blocked: '#EF4444',
};

const formatTime = (date?: Date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
};

export default function ChatListScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors, FontSize, FontWeight, Spacing } = currentTheme;
    const { user } = useAuthStore();
    const { conversations, sendChatRequest, acceptRequest, blockConversation, deleteRequest, markRead } = useChatStore();

    const [newChatVisible, setNewChatVisible] = useState(false);
    const [search, setSearch] = useState('');


    const isPro = isCurrentlyPro(user);
    // Filter chats: exclude blocked and deleted, separate pending requests, and restrict non-pro from viewing groups
    const myId = user?.id || '';
    const visibleChats = conversations.filter(c => c.ownerId === myId && c.status !== 'blocked' && c.status !== 'deleted' && (isPro || !c.isGroup));
    const pendingIncoming = visibleChats.filter(c => c.status === 'pending' && !c.initiatedByMe)
        .sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());
    const activeChats = visibleChats.filter(c => !(c.status === 'pending' && !c.initiatedByMe))
        .sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime());

    // People not already in a conversation
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

    // ── Pending request card (Accept / Block / Delete) ──────────────
    const renderPendingCard = ({ item: chat }: { item: any }) => (
        <View style={[styles.pendingCard, { backgroundColor: Colors.backgroundCard, borderColor: chat.isGroup ? Colors.primary + '40' : Colors.warning + '40' }]}>
            <View style={styles.pendingTop}>
                <View style={styles.avatarWrap}>
                    {chat.participantAvatar
                        ? <Image source={{ uri: chat.participantAvatar }} style={styles.avatarImg} />
                        : (
                            <LinearGradient
                                colors={chat.isGroup ? ['#6C63FF', '#3CA5FF'] : [Colors.primary + '30', Colors.primary + '10']}
                                style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}
                            >
                                <Text style={{ fontSize: 20 }}>{chat.isGroup ? '👥' : '👤'}</Text>
                            </LinearGradient>
                        )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.chatName, { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.bold }]}>
                        {chat.participantName}
                    </Text>
                    <Text style={[{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }]}>
                        {chat.isGroup ? `Invite to join group` : 'Wants to start a conversation'}
                    </Text>
                    {chat.isGroup && (
                        <Text style={{ color: Colors.primary, fontSize: 11, fontWeight: '700', marginTop: 4 }}>
                            {chat.participantsCount || 2} members
                        </Text>
                    )}
                </View>
                <View style={[styles.pendingBadge, { backgroundColor: chat.isGroup ? Colors.primary + '20' : Colors.warning + '20' }]}>
                    <Text style={{ fontSize: 10, color: chat.isGroup ? Colors.primary : Colors.warning, fontWeight: '700' }}>
                        {chat.isGroup ? 'GROUP INVITE' : 'REQUEST'}
                    </Text>
                </View>
            </View>
            <View style={styles.pendingActions}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.success, flex: 1 }]}
                    onPress={() => acceptRequest(chat.id)}
                >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                    <Text style={styles.actionBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.backgroundElevated, flex: 1, borderWidth: 1, borderColor: Colors.border }]}
                    onPress={() => deleteRequest(chat.id, myId)}
                >
                    <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                    <Text style={[styles.actionBtnText, { color: Colors.textMuted }]}>Delete Request</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // ── Regular chat row ──────────────────────────────────────────────
    // ── Regular chat row ──────────────────────────────────────────────
    const renderChatItem = ({ item: chat }: { item: any }) => (
        <TouchableOpacity
            style={[styles.chatItem, { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md }]}
            onPress={() => handleOpenChat(chat)}
            activeOpacity={0.75}
        >
            <View style={styles.avatarWrap}>
                {chat.participantAvatar
                    ? <Image source={{ uri: chat.participantAvatar }} style={styles.avatarImg2} />
                    : (
                        <LinearGradient
                            colors={chat.isGroup ? ['#6C63FF', '#3CA5FF'] : ['#FF6B35', '#FF3CAC']}
                            style={styles.avatarGrad}
                        >
                            <Text style={{ fontSize: 22 }}>{chat.isGroup ? '👥' : '👤'}</Text>
                        </LinearGradient>
                    )
                }
                {/* Status dot */}
                <View style={[
                    styles.statusDot,
                    { backgroundColor: chat.status === 'pending' ? Colors.warning : Colors.success, borderColor: Colors.background }
                ]} />
            </View>

            <View style={styles.chatContent}>
                <View style={[styles.chatHeader, { alignItems: 'flex-start' }]}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.chatName, { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: chat.unreadCount > 0 ? Colors.textPrimary : Colors.textSecondary }]} numberOfLines={1}>
                            {chat.participantName}
                        </Text>
                        {chat.isGroup && (
                            <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '700', marginTop: 2 }}>
                                Group · {chat.participantsCount || 2} members
                            </Text>
                        )}
                    </View>
                    <Text style={[{ fontSize: FontSize.xs, color: chat.unreadCount > 0 ? Colors.primary : Colors.textMuted, fontWeight: chat.unreadCount > 0 ? '700' : '400' }]}>
                        {formatTime(chat.lastMessageAt)}
                    </Text>
                </View>
                {chat.status === 'pending' && chat.initiatedByMe ? (
                    <Text style={{ fontSize: FontSize.xs, color: Colors.warning, fontWeight: '600', marginTop: 4 }}>
                        ⏳ Request sent – waiting for response
                    </Text>
                ) : (
                    <View style={styles.chatBottom}>
                        <Text
                            style={[{ fontSize: FontSize.sm, flex: 1, color: chat.unreadCount > 0 ? Colors.textPrimary : Colors.textMuted, fontWeight: chat.unreadCount > 0 ? '600' : '400', marginTop: 2 }]}
                            numberOfLines={1}
                        >
                            {chat.lastMessage || 'Start a conversation…'}
                        </Text>
                        {chat.unreadCount > 0 && (
                            <View style={[styles.unreadBadge, { backgroundColor: Colors.primary }]}>
                                <Text style={{ fontSize: 10, color: '#FFF', fontWeight: '800' }}>{chat.unreadCount}</Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.safeArea, { backgroundColor: Colors.background }]}>
            <BrandBar />
            {/* Header */}
            <View style={{ backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.background, borderBottomWidth: 1, borderBottomColor: Colors.border, overflow: 'hidden' }}>
                {Platform.OS === 'ios' && (
                    <BlurView intensity={80} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                )}
                <View style={[styles.header, { borderBottomWidth: 0, paddingHorizontal: 12, paddingVertical: 14 }]}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                backgroundColor: Colors.backgroundCard,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Messages</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={[styles.newChatBtn, { backgroundColor: Colors.primary + '15' }]}
                            onPress={() => navigation.navigate('CreateGroupChat' as any)}
                        >
                            <Ionicons name="people-outline" size={22} color={Colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.newChatBtn, { backgroundColor: Colors.primary + '15' }]}
                            onPress={() => setNewChatVisible(true)}
                        >
                            <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <FlatList
                data={[...pendingIncoming.map(c => ({ ...c, _isPending: true })), ...activeChats.map(c => ({ ...c, _isPending: false }))]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (item as any)._isPending
                    ? renderPendingCard({ item })
                    : renderChatItem({ item })
                }
                contentContainerStyle={[styles.list, activeChats.length === 0 && pendingIncoming.length === 0 && styles.listEmpty]}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: Colors.border }]} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIcon, { backgroundColor: Colors.backgroundCard }]}>
                            <Text style={{ fontSize: 40 }}>💬</Text>
                        </View>
                        <Text style={[{ fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary }]}>
                            No messages yet
                        </Text>
                        <Text style={[{ fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' }]}>
                            Tap the compose button to start a conversation with someone
                        </Text>
                        <TouchableOpacity
                            style={[styles.emptyBtn, { backgroundColor: Colors.primary }]}
                            onPress={() => setNewChatVisible(true)}
                        >
                            <Ionicons name="create-outline" size={18} color="#FFF" />
                            <Text style={{ color: '#FFF', fontWeight: '700', fontSize: FontSize.md }}>New Message</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* New chat modal */}
            <Modal visible={newChatVisible} animationType="slide" onRequestClose={() => setNewChatVisible(false)}>
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: Colors.background }]}>
                    {/* Modal Header */}
                    <View style={[styles.modalHeader, { borderBottomColor: Colors.border }]}>
                        <TouchableOpacity onPress={() => { setNewChatVisible(false); setSearch(''); }}>
                            <Ionicons name="close" size={24} color={Colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>New Message</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Search */}
                    <View style={[styles.searchBar, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: Colors.textPrimary }]}
                            placeholder="Search people..."
                            placeholderTextColor={Colors.textMuted}
                            value={search}
                            onChangeText={setSearch}
                            autoFocus
                        />
                    </View>


                    {/* Results */}
                    <FlatList
                        data={searchResults}
                        keyExtractor={u => u.id}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingTop: 60, gap: 8 }}>
                                <Text style={{ fontSize: 36 }}>🔍</Text>
                                <Text style={[{ color: Colors.textMuted, fontSize: FontSize.md }]}>No users found</Text>
                            </View>
                        }
                        renderItem={({ item: u }) => (
                            <TouchableOpacity
                                style={[styles.userRow, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                                onPress={() => handleStartChat(u)}
                                activeOpacity={0.8}
                            >
                                <Image source={{ uri: u.photoURL || `https://i.pravatar.cc/80?u=${u.id}` }} style={styles.userAvatar} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[{ color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: 'bold' }]}>
                                        {u.name}
                                    </Text>
                                    <Text style={[{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }]}>
                                        {u.profession || u.city || ''}
                                    </Text>
                                </View>
                                <View style={[styles.startChatBtn, { backgroundColor: Colors.primary + '15' }]}>
                                    <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
                                </View>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
    headerTitle: {},
    newChatBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    list: { paddingVertical: 8 },
    listEmpty: { flex: 1 },

    // Pending card
    pendingCard: { margin: 12, borderRadius: 20, borderWidth: 1.5, padding: 16, gap: 14 },
    pendingTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    pendingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    pendingActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
    actionBtnText: { fontSize: 13, fontWeight: '700', color: '#FFF' },

    // Chat item
    chatItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatarWrap: { position: 'relative', width: 54, height: 54 },
    avatarImg2: { width: 54, height: 54, borderRadius: 27 },
    avatarGrad: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
    avatar: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    statusDot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
    chatContent: { flex: 1 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    chatName: { flex: 1 },
    chatBottom: { flexDirection: 'row', alignItems: 'center' },
    unreadBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    separator: { height: 1, marginLeft: 82 },

    // Empty state
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 28, marginTop: 8 },

    // New chat modal
    modalContainer: { flex: 1 },
    modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 17, fontWeight: '800' },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 16, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
    messageBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 16, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 15 },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, borderWidth: 1 },
    userAvatar: { width: 48, height: 48, borderRadius: 24 },
    startChatBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
});
