import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme/theme';

const MOCK_MESSAGES = [
    { id: '1', senderId: 'other', text: 'Hey! Excited for sushi tonight 🍣', time: '6:30 PM' },
    { id: '2', senderId: 'me', text: 'Same! I\'ve heard Nobu is absolutely amazing', time: '6:32 PM' },
    { id: '3', senderId: 'other', text: 'Do you have any dietary restrictions I should know about?', time: '6:35 PM' },
    { id: '4', senderId: 'me', text: 'None! I eat everything 😄 Can\'t wait!', time: '6:36 PM' },
    { id: '5', senderId: 'other', text: 'Perfect! See you at 7pm at the entrance 🎉', time: '6:40 PM' },
];

export default function ChatDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { chatId, chatName } = route.params || { chatId: '', chatName: 'Chat' };
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [inputText, setInputText] = useState('');
    const listRef = useRef<FlatList>(null);

    const sendMessage = () => {
        if (!inputText.trim()) return;
        const newMsg = {
            id: String(Date.now()),
            senderId: 'me',
            text: inputText.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInputText('');
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const MessageBubble = ({ msg }: { msg: typeof MOCK_MESSAGES[0] }) => {
        const isMe = msg.senderId === 'me';
        return (
            <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
                {!isMe && (
                    <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.msgAvatar}>
                        <Text style={{ fontSize: 14 }}>👤</Text>
                    </LinearGradient>
                )}
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{msg.text}</Text>
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{msg.time}</Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.headerAvatar}>
                        <Text style={{ fontSize: 18 }}>👤</Text>
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerName}>{chatName}</Text>
                        <Text style={styles.headerStatus}>Active now</Text>
                    </View>
                    <TouchableOpacity style={styles.moreBtn}>
                        <Ionicons name="ellipsis-vertical" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <MessageBubble msg={item} />}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
                    showsVerticalScrollIndicator={false}
                />

                {/* Input */}
                <View style={styles.inputBar}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Ionicons name="attach-outline" size={22} color={Colors.textMuted} />
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor={Colors.textMuted}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={sendMessage}
                        style={[styles.sendBtn, inputText.trim() ? styles.sendBtnActive : {}]}
                        disabled={!inputText.trim()}
                    >
                        <Ionicons name="send" size={18} color={inputText.trim() ? '#FFF' : Colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
    },
    backBtn: { padding: 4 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    headerStatus: { fontSize: FontSize.xs, color: Colors.success },
    moreBtn: { padding: 4 },
    messageList: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, gap: 12 },
    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    bubbleRowMe: { justifyContent: 'flex-end' },
    msgAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    bubble: {
        maxWidth: '72%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14,
    },
    bubbleOther: { backgroundColor: Colors.backgroundCard, borderBottomLeftRadius: 4 },
    bubbleMe: {
        backgroundColor: Colors.primary, borderBottomRightRadius: 4,
    },
    bubbleText: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 22 },
    bubbleTextMe: { color: '#FFF' },
    bubbleTime: { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
    bubbleTimeMe: { color: 'rgba(255,255,255,0.6)' },
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border,
        backgroundColor: Colors.background, gap: 8,
    },
    attachBtn: { padding: 8 },
    input: {
        flex: 1, backgroundColor: Colors.backgroundInput, borderRadius: 24,
        paddingHorizontal: 16, paddingVertical: 10, fontSize: FontSize.md,
        color: Colors.textPrimary, maxHeight: 100, borderWidth: 1, borderColor: Colors.border,
    },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.backgroundCard,
        justifyContent: 'center', alignItems: 'center',
    },
    sendBtnActive: { backgroundColor: Colors.primary },
});
