import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme/theme';

const MOCK_CHATS = [
    {
        id: 'c1', name: 'Alex Chen', lastMessage: 'See you at 7pm! 🍣', time: '2m',
        unread: 2, postTitle: 'Sushi Night at Nobu', isGroup: false,
    },
    {
        id: 'c2', name: 'Vegan Brunch Group', lastMessage: 'Maria: I\'ll be there early!', time: '15m',
        unread: 0, postTitle: 'Vegan Brunch Adventure', isGroup: true,
    },
    {
        id: 'c3', name: 'Priya Sharma', lastMessage: 'Can we change the location?', time: '1h',
        unread: 1, postTitle: 'Indian Networking Dinner', isGroup: false,
    },
    {
        id: 'c4', name: 'Thai Street Food Squad', lastMessage: 'You: On my way!', time: '3h',
        unread: 0, postTitle: 'Thai Street Food', isGroup: true,
    },
];

export default function ChatListScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const ChatItem = ({ chat }: { chat: typeof MOCK_CHATS[0] }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('ChatDetail', { chatId: chat.id, chatName: chat.name })}
            activeOpacity={0.75}
        >
            <LinearGradient
                colors={chat.isGroup ? ['#6C63FF', '#3CA5FF'] : ['#FF6B35', '#FF3CAC']}
                style={styles.avatar}
            >
                <Text style={{ fontSize: 22 }}>{chat.isGroup ? '👥' : '👤'}</Text>
            </LinearGradient>

            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName} numberOfLines={1}>{chat.name}</Text>
                    <Text style={styles.chatTime}>{chat.time}</Text>
                </View>
                <Text style={styles.chatSub} numberOfLines={1}>{chat.postTitle}</Text>
                <View style={styles.chatBottom}>
                    <Text style={[styles.lastMsg, chat.unread > 0 && { color: Colors.textPrimary }]} numberOfLines={1}>
                        {chat.lastMessage}
                    </Text>
                    {chat.unread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{chat.unread}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity style={styles.newChatBtn}>
                    <Ionicons name="create-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={MOCK_CHATS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <ChatItem chat={item} />}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ fontSize: 40 }}>💬</Text>
                        <Text style={styles.emptyText}>No messages yet</Text>
                        <Text style={styles.emptySubText}>Join a dining plan to start chatting</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
    newChatBtn: { padding: 8 },
    list: { paddingVertical: Spacing.sm },
    chatItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: Spacing.md },
    avatar: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
    chatContent: { flex: 1 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    chatName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
    chatTime: { fontSize: FontSize.xs, color: Colors.textMuted },
    chatSub: { fontSize: FontSize.xs, color: Colors.primary, marginBottom: 2 },
    chatBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    lastMsg: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
    unreadBadge: {
        width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    unreadText: { fontSize: 10, fontWeight: FontWeight.bold, color: '#FFF' },
    separator: { height: 1, backgroundColor: Colors.border, marginLeft: 90 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
    emptyText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
    emptySubText: { fontSize: FontSize.md, color: Colors.textMuted },
});
