import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Image, Modal, Alert, ActivityIndicator,
    Linking, ScrollView, Clipboard, Animated, PanResponder,
} from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandBar from '../../components/common/BrandBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore, ALL_USERS, API_URL } from '../../store/useChatStore';
import { RootStackParamList } from '../../types';
import { isCurrentlyPro } from '../../utils/authUtils';
import { CustomAlert } from '../../components/common/CustomAlert';
import { usePostStore } from '../../store/usePostStore';

type MessageType = 'text' | 'image' | 'video' | 'contact';

interface ReplyRef {
    id: string;
    text: string;
    senderName: string;
    isMe: boolean;
}

interface ChatMessage {
    id: string;
    senderId: string;
    text?: string;
    mediaUri?: string;
    mediaType?: 'image' | 'video';
    contactData?: { label: string; value: string };
    type: MessageType;
    time: string;
    status?: 'sent' | 'delivered' | 'read';
    replyTo?: ReplyRef;
}

// Quick emoji set (WhatsApp-style)
const QUICK_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

const INITIAL_MESSAGES: ChatMessage[] = [
    { id: '1', senderId: 'other', type: 'text', text: 'Hey! Excited for sushi tonight 🍣', time: '6:30 PM' },
    { id: '2', senderId: 'me', type: 'text', text: "Same! I've heard the place is amazing", time: '6:32 PM' },
    { id: '3', senderId: 'other', type: 'text', text: 'Do you have any dietary restrictions I should know?', time: '6:35 PM' },
    { id: '4', senderId: 'me', type: 'text', text: "None! I eat everything 😄 Can't wait!", time: '6:36 PM' },
    { id: '5', senderId: 'other', type: 'text', text: 'Perfect! See you at 7pm at the entrance 🎉', time: '6:40 PM' },
];

export default function ChatDetailScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const { chatId, chatName, isGroup } = route.params || { chatId: '', chatName: 'Chat', isGroup: false };
    const { user } = useAuthStore();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;
    const {
        conversations, updateLastMessage, acceptRequest, deleteRequest,
        blockConversation, clearMessages, deleteConversation, messages: storeMessages,
        sendMessageOut, fetchMessages, respondToGroupInvite, leaveGroupChat,
        removeGroupMember, deleteGroupChat
    } = useChatStore();
    const { posts } = usePostStore();

    const insets = useSafeAreaInsets();

    const chat = conversations.find(c => c.id === chatId);
    const isBlocked = chat?.status === 'blocked';
    const isPending = chat?.status === 'pending'; // This is for direct chats
    const isGroupPending = chat?.isGroup && chat?.myStatus === 'pending';
    const isHost = chat?.isGroup && chat?.initiatedByMe;

    const messages = storeMessages[chatId] || [];

    React.useEffect(() => {
        if (chatId) {
            fetchMessages(chatId);
        }
    }, [chatId]);

    const isPro = true;

    React.useEffect(() => {
        if (isGroup && !isPro) {
            Alert.alert('Pro Required', 'Group chats are exclusive to Pro members.', [
                { text: 'Cancel', onPress: () => navigation.goBack() },
                { text: 'Upgrade', onPress: () => { navigation.goBack(); navigation.navigate('Plan' as any); } }
            ]);
        }
    }, [isGroup, isPro]);

    const [inputText, setInputText] = useState('');
    const [showMediaMenu, setShowMediaMenu] = useState(false);
    const [showContactMenu, setShowContactMenu] = useState(false);
    const [showProAlert, setShowProAlert] = useState(false);
    const [showMenuPopup, setShowMenuPopup] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('Inappropriate Behavior');
    const [reportDesc, setReportDesc] = useState('');
    const [showParticipantsModal, setShowParticipantsModal] = useState(false);

    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'image' | 'video'>('image');
    const [isSending, setIsSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const listRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    // ── Reply / Emoji / Context menu state ────────────────────────────────────
    const [replyTo, setReplyTo] = useState<ReplyRef | null>(null);
    const [emojiPickerMsg, setEmojiPickerMsg] = useState<ChatMessage | null>(null);
    const [contextMsg, setContextMsg] = useState<ChatMessage | null>(null);
    // Map of msgId → emoji reactions: { '❤️': ['userId1'], '😂': ['userId2'] }
    const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
    // Local message overrides for reply (since store messages may not have replyTo)
    const [localMessages, setLocalMessages] = useState<Record<string, ChatMessage>>({});

    // Auto-upgrade sent → delivered after 1.5 s, → read when chat opened (simulated)
    React.useEffect(() => {
        const myMsgs = messages.filter(
            m => (m.senderId === user?.id || m.senderId === 'me') && m.status === 'sent'
        );
        if (myMsgs.length === 0) return;
        const t = setTimeout(() => {
            // Simulate delivered
            myMsgs.forEach(m => {
                const overrideKey = m.id;
                setLocalMessages(prev => ({ ...prev, [overrideKey]: { ...m, status: 'delivered' } }));
            });
        }, 1500);
        return () => clearTimeout(t);
    }, [messages.length]);

    // Simulate read (other opened chat) after 4 s
    React.useEffect(() => {
        const deliveredMsgs = messages.filter(
            m => (m.senderId === user?.id || m.senderId === 'me') &&
                (m.status === 'delivered' || (localMessages[m.id]?.status === 'delivered'))
        );
        if (deliveredMsgs.length === 0) return;
        const t = setTimeout(() => {
            deliveredMsgs.forEach(m => {
                setLocalMessages(prev => ({ ...prev, [m.id]: { ...(prev[m.id] || m), status: 'read' } }));
            });
        }, 4000);
        return () => clearTimeout(t);
    }, [messages.length]);

    const addReaction = (msgId: string, emoji: string) => {
        const userId = user?.id || 'me';
        setReactions(prev => {
            const msgReactions = { ...(prev[msgId] || {}) };
            const emojiUsers = [...(msgReactions[emoji] || [])];
            const idx = emojiUsers.indexOf(userId);
            if (idx >= 0) emojiUsers.splice(idx, 1); // toggle off
            else emojiUsers.push(userId);
            if (emojiUsers.length === 0) delete msgReactions[emoji];
            else msgReactions[emoji] = emojiUsers;
            return { ...prev, [msgId]: msgReactions };
        });
        setEmojiPickerMsg(null);
        setContextMsg(null);
    };

    const handleLongPress = (msg: ChatMessage) => {
        setContextMsg(msg);
    };

    const handleReply = (msg: ChatMessage) => {
        const isMe = msg.senderId === user?.id || msg.senderId === 'me';
        setReplyTo({
            id: msg.id,
            text: msg.text || (msg.type === 'image' ? '📷 Photo' : msg.type === 'video' ? '🎥 Video' : '📎 Attachment'),
            senderName: isMe ? 'You' : (chat?.participantName || 'Them'),
            isMe,
        });
        setContextMsg(null);
    };

    const handleCopyText = (msg: ChatMessage) => {
        if (msg.text) {
            // Clipboard.setString(msg.text); // uncomment if @react-native-clipboard is installed
            Alert.alert('Copied', 'Message copied to clipboard.');
        }
        setContextMsg(null);
    };


    const handleViewProfile = () => {
        if (!isGroup && chat?.participantId) {
            navigation.navigate('UserProfile' as any, { userId: chat.participantId });
        }
    };

    const sendTextMessage = () => {
        if (!inputText.trim()) return;
        const newMsg: ChatMessage = {
            id: String(Date.now()),
            senderId: user?.id || 'unknown',
            type: 'text',
            text: inputText.trim(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
            replyTo: replyTo || undefined,
        };
        sendMessageOut(chatId, newMsg);
        setInputText('');
        setReplyTo(null);
    };

    const openCamera = async () => {
        setShowMediaMenu(false);
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed.');
            return;
        }
        // allowsEditing: false is critical — editing mode blocks video recording on many devices
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: false,
            quality: 0.85,
            videoMaxDuration: 60,
            videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        });
        if (!result.canceled) {
            const asset = result.assets[0];
            if (asset.fileSize && asset.fileSize > 50 * 1024 * 1024) {
                Alert.alert('File Too Large', 'Please capture a shorter video (under 50MB).');
                return;
            }
            setPreviewUri(asset.uri);
            setPreviewType(asset.type === 'video' ? 'video' : 'image');
        }
    };

    const openGallery = async () => {
        setShowMediaMenu(false);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Gallery access is needed.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: false,
            quality: 0.8,
            videoMaxDuration: 60,
        });
        if (!result.canceled) {
            const asset = result.assets[0];
            if (asset.fileSize && asset.fileSize > 25 * 1024 * 1024) {
                Alert.alert('File Too Large', 'Please choose a file under 25MB.');
                return;
            }
            setPreviewUri(asset.uri);
            setPreviewType(asset.type === 'video' ? 'video' : 'image');
        }
    };


    const sendMedia = async () => {
        if (!previewUri) return;
        setIsSending(true);
        try {
            const formData = new FormData();
            const fileName = previewUri.split('/').pop() || 'media';
            const fileType = previewType === 'image' ? 'image/jpeg' : 'video/mp4';

            formData.append('file', {
                uri: Platform.OS === 'ios' ? previewUri.replace('file://', '') : previewUri,
                name: fileName,
                type: fileType,
            } as any);

            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            const serverUrl = data.url;

            const newMsg: ChatMessage = {
                id: String(Date.now()),
                senderId: user?.id || 'unknown',
                type: previewType,
                mediaUri: serverUrl,
                mediaType: previewType,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'sent',
            };
            sendMessageOut(chatId, newMsg);
            setPreviewUri(null);
        } catch (error) {
            console.error('Failed to send media:', error);
            Alert.alert('Upload Error', 'Could not upload media. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const sendContactInfo = (label: string, value: string) => {
        setShowContactMenu(false);
        const newMsg: ChatMessage = {
            id: String(Date.now()),
            senderId: user?.id || 'unknown',
            type: 'contact',
            contactData: { label, value },
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sent',
        };
        sendMessageOut(chatId, newMsg);
    };

    // Build the correct deep-link URL per platform
    const openContactLink = async (label: string, value: string) => {
        if (!value) return;
        let url = '';
        const clean = value.replace(/^@/, '').trim();
        switch (label) {
            case 'WhatsApp': {
                // e.g. +919876543210 → wa.me/919876543210
                const digits = clean.replace(/[^\d]/g, '');
                url = `whatsapp://send?phone=${digits}`;
                break;
            }
            case 'Instagram':
                url = `instagram://user?username=${clean}`;
                break;
            case 'Twitter / X':
                url = `twitter://user?screen_name=${clean}`;
                break;
            case 'Facebook':
                url = `fb://profile`; // best effort; fall through to browser
                break;
            case 'Phone':
                url = `tel:${clean}`;
                break;
            default:
                // Treat as a URL directly
                url = value.startsWith('http') ? value : `https://${value}`;
        }

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                // Fallback to browser
                let browserUrl = '';
                switch (label) {
                    case 'WhatsApp': browserUrl = `https://wa.me/${clean.replace(/[^\d]/g, '')}`; break;
                    case 'Instagram': browserUrl = `https://instagram.com/${clean}`; break;
                    case 'Twitter / X': browserUrl = `https://twitter.com/${clean}`; break;
                    case 'Facebook': browserUrl = `https://facebook.com/${clean}`; break;
                    case 'Phone': browserUrl = `tel:${clean}`; break;
                    default: browserUrl = value.startsWith('http') ? value : `https://${value}`;
                }
                await Linking.openURL(browserUrl);
            }
        } catch {
            Alert.alert('Cannot Open', `Could not open ${label}. Please try manually.`);
        }
    };

    const contactOptions = [
        { label: 'WhatsApp', icon: 'logo-whatsapp', value: user?.whatsappNumber || '' },
        { label: 'Instagram', icon: 'logo-instagram', value: user?.instagramId ? `@${user.instagramId}` : '' },
        { label: 'Twitter / X', icon: 'logo-twitter', value: user?.twitterId || '' },
        { label: 'Facebook', icon: 'logo-facebook', value: user?.facebookId || '' },
        { label: 'Phone', icon: 'call-outline', value: user?.phone || '' },
    ];

    const getMessageTick = (status?: 'sent' | 'delivered' | 'read') => {
        // Only show ticks on sent messages; no tick on received messages
        if (!status) return null;
        const muted = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)';
        if (status === 'sent')
            return <Ionicons name="checkmark" size={14} color={muted} style={{ marginLeft: 3 }} />;
        if (status === 'delivered')
            return <Ionicons name="checkmark-done" size={14} color={muted} style={{ marginLeft: 3 }} />;
        if (status === 'read')
            return <Ionicons name="checkmark-done" size={14} color="#34B7F1" style={{ marginLeft: 3 }} />;
        return null;
    };



    const renderMessage = ({ item }: { item: ChatMessage }) => {
        // Merge local overrides (status updates) into message
        const msg: ChatMessage = { ...item, ...(localMessages[item.id] || {}) };
        const isMe = msg.senderId === user?.id || msg.senderId === 'me';
        const isSystem = msg.senderId === 'system';
        const msgReactions = reactions[msg.id] || {};
        const hasReactions = Object.keys(msgReactions).length > 0;

        const myBubbleBg = Colors.primary;
        const otherBubbleBg = isDarkMode ? Colors.backgroundCard : '#F0F0F0';
        const myTextColor = isDarkMode ? '#FFF' : '#111014';
        const otherTextColor = Colors.textPrimary;
        const myTimeMuted = isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(17,16,20,0.55)';
        const otherTimeMuted = Colors.textMuted;
        const activeCardBg = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
        const activePreviewIconBg = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
        const activeIconColor = isDarkMode ? '#FFF' : '#111014';
        const activeChevronColor = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)';

        if (isSystem) {
            return (
                <View style={styles.systemMessageContainer}>
                    <Text style={[styles.systemMessageText, { color: Colors.textMuted }]}>{msg.text}</Text>
                </View>
            );
        }

        // Reply-to quote block
        const QuotedBlock = msg.replyTo ? (
            <View style={[styles.quotedBlock, {
                backgroundColor: isMe
                    ? 'rgba(255,255,255,0.18)'
                    : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                borderLeftColor: isMe ? 'rgba(255,255,255,0.6)' : Colors.primary,
            }]}>
                <Text style={[styles.quotedName, {
                    color: isMe ? 'rgba(255,255,255,0.8)' : Colors.primary
                }]}>
                    {msg.replyTo.senderName}
                </Text>
                <Text style={[styles.quotedText, {
                    color: isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted
                }]} numberOfLines={1}>
                    {msg.replyTo.text}
                </Text>
            </View>
        ) : null;

        return (
            <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onLongPress={() => handleLongPress(msg)}
                    delayLongPress={350}
                    style={{ maxWidth: '80%' }}
                >
                <View style={[
                    styles.bubble,
                    isMe
                        ? { backgroundColor: myBubbleBg, borderBottomRightRadius: 6 }
                        : { backgroundColor: otherBubbleBg, borderBottomLeftRadius: 6 },
                    (msg.type === 'image' || msg.type === 'video') && { paddingHorizontal: 4, paddingVertical: 4, borderRadius: 16 }
                ]}>
                    {/* Quoted reply */}
                    {QuotedBlock}
                    {msg.type === 'text' && (
                        <>
                            {(() => {
                                const postUrlMatch = msg.text?.match(/https:\/\/bitebuddy\.app\/post\/([a-zA-Z0-9]+)/);
                                if (postUrlMatch) {
                                    const postId = postUrlMatch[1];
                                    const sharedPost = posts.find(p => p.id === postId);
                                    if (sharedPost) {
                                        return (
                                            <TouchableOpacity
                                                style={[styles.sharePreviewCard, { backgroundColor: isMe ? activeCardBg : Colors.backgroundElevated }]}
                                                onPress={() => navigation.navigate('PostDetail', { postId })}
                                            >
                                                <View style={[styles.sharePreviewIcon, { backgroundColor: isMe ? activePreviewIconBg : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }]}>
                                                    <Ionicons name="restaurant" size={20} color={isMe ? activeIconColor : Colors.primary} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.sharePreviewTitle, { color: isMe ? myTextColor : otherTextColor }]} numberOfLines={1}>{sharedPost.title}</Text>
                                                    <Text style={[styles.sharePreviewSub, { color: isMe ? myTimeMuted : otherTimeMuted }]} numberOfLines={1}>
                                                        📍 {sharedPost.restaurantName || sharedPost.area}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={16} color={isMe ? activeChevronColor : Colors.textMuted} />
                                            </TouchableOpacity>
                                        );
                                    }
                                }
                                return <Text style={[styles.msgText, { color: isMe ? myTextColor : otherTextColor }]}>{msg.text}</Text>;
                            })()}
                            <View style={styles.timeRow}>
                                <Text style={[styles.msgTime, { color: isMe ? myTimeMuted : otherTimeMuted }]}>{msg.time}</Text>
                                {isMe && getMessageTick(msg.status)}
                            </View>
                        </>
                    )}
                    {msg.type === 'image' && msg.mediaUri && (
                        <>
                            <Image source={{ uri: msg.mediaUri }} style={styles.mediaImage} />
                            <View style={styles.timeRow}>
                                <Text style={[styles.msgTime, { color: isMe ? myTimeMuted : otherTimeMuted }]}>{msg.time}</Text>
                                {isMe && getMessageTick(msg.status)}
                            </View>
                        </>
                    )}
                    {msg.type === 'video' && msg.mediaUri && (
                        <>
                            <View style={styles.videoThumb}>
                                <Ionicons name="play-circle" size={44} color="#FFF" />
                                <Text style={{ color: '#FFF', fontSize: 12, marginTop: 6 }}>Video</Text>
                            </View>
                            <View style={styles.timeRow}>
                                <Text style={[styles.msgTime, { color: isMe ? myTimeMuted : otherTimeMuted }]}>{msg.time}</Text>
                                {isMe && getMessageTick(msg.status)}
                            </View>
                        </>
                    )}
                    {msg.type === 'contact' && msg.contactData && (
                        <>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                                onPress={() => openContactLink(msg.contactData!.label, msg.contactData!.value)}
                                activeOpacity={0.75}
                            >
                                <Ionicons name="person-circle-outline" size={36} color={isMe ? activeIconColor : Colors.primary} />
                                <View style={{ flexShrink: 1 }}>
                                    <Text style={{ fontSize: 11, color: isMe ? myTimeMuted : otherTimeMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {msg.contactData.label}
                                    </Text>
                                    <Text style={{ fontSize: 16, color: isMe ? myTextColor : otherTextColor, fontWeight: '800', marginTop: 1 }}>
                                        {msg.contactData.value}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <View style={styles.timeRow}>
                                <Text style={[styles.msgTime, { color: isMe ? myTimeMuted : otherTimeMuted }]}>{msg.time}</Text>
                                {isMe && getMessageTick(msg.status)}
                            </View>
                        </>
                    )}
                </View>

                {/* Emoji reactions row */}
                {hasReactions && (
                    <TouchableOpacity
                        onPress={() => setEmojiPickerMsg(msg)}
                        style={[styles.reactionsRow, isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}
                    >
                        {Object.entries(msgReactions).map(([emoji, users]) => (
                            <View
                                key={emoji}
                                style={[styles.reactionBubble, {
                                    backgroundColor: Colors.backgroundCard,
                                    borderColor: (users as string[]).includes(user?.id || '') ? Colors.primary : Colors.border,
                                }]}
                            >
                                <Text style={styles.reactionEmoji}>{emoji}</Text>
                                {(users as string[]).length > 1 && (
                                    <Text style={[styles.reactionCount, { color: Colors.textMuted }]}>
                                        {(users as string[]).length}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </TouchableOpacity>
                )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: Colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <BrandBar />
            {/* Header — Instagram DM style */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                {/* Back button */}
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
                </TouchableOpacity>

                {/* Center: avatar + name + status */}
                <TouchableOpacity
                    style={styles.headerCenter}
                    onPress={handleViewProfile}
                    activeOpacity={0.75}
                >
                    {chat?.participantAvatar ? (
                        <Image source={{ uri: chat.participantAvatar }} style={styles.headerAvatar} />
                    ) : (
                        <LinearGradient
                            colors={isGroup ? ['#6C63FF', '#3CA5FF'] : ['#FF6B35', '#FF3CAC']}
                            style={styles.headerAvatar}
                        >
                            <Text style={{ fontSize: 16, color: '#FFF', fontWeight: '800' }}>
                                {chatName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                            </Text>
                        </LinearGradient>
                    )}
                    <View style={{ alignItems: 'flex-start' }}>
                        <Text style={[styles.headerName, { color: Colors.textPrimary }]} numberOfLines={1}>
                            {chatName}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={[styles.headerStatus, { color: Colors.success }]}>
                                {isGroup ? `Group · ${chat?.participantsCount || 2} members` : 'Active now'}
                            </Text>
                            {isGroup && chat?.planId && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('PostDetail' as any, { postId: chat.planId })}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: Colors.primary + '18', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}
                                >
                                    <Ionicons name="restaurant-outline" size={11} color={Colors.primary} />
                                    <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '700' }}>Plan</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Right: more button */}
                <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => setShowMenuPopup(true)}
                >
                    <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
            </View>

            {/* FlatList + Input wrapped together */}
            <View style={{ flex: 1 }}>

            {/* Messages */}
            <FlatList
                ref={listRef}
                data={messages.slice().reverse()}
                keyExtractor={item => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                inverted
                ListHeaderComponent={() => isTyping ? (
                    <View style={styles.typingRow}>
                        <View style={[styles.typingBubble, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, borderWidth: 1 }]}>
                            <Text style={[styles.typingText, { color: Colors.textMuted }]}>Typing...</Text>
                        </View>
                    </View>
                ) : null}
            />

            {/* Input / Actions */}
            {isBlocked ? (
                <View style={[styles.inputArea, { backgroundColor: Colors.backgroundCard, borderTopColor: Colors.border, justifyContent: 'center', paddingBottom: Math.max(insets.bottom, 20), paddingTop: 16 }]}>
                    <Text style={{ color: Colors.error, fontWeight: '600' }}>You cannot reply to this conversation.</Text>
                </View>
            ) : isPending && chat && !chat.initiatedByMe ? (
                <View style={[styles.inputArea, { backgroundColor: Colors.backgroundCard, borderTopColor: Colors.border, flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 20), paddingTop: 16 }]}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.success, padding: 14, borderRadius: 16, alignItems: 'center' }} onPress={() => acceptRequest(chat.id)}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.backgroundElevated, borderColor: Colors.border, borderWidth: 1, padding: 14, borderRadius: 16, alignItems: 'center' }} onPress={() => { deleteRequest(chat.id, user?.id || ''); navigation.goBack(); }}>
                        <Text style={{ color: Colors.textMuted, fontWeight: 'bold' }}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.error + '15', borderColor: Colors.error + '40', borderWidth: 1, padding: 14, borderRadius: 16, alignItems: 'center' }} onPress={() => { blockConversation(chat.id, user?.id || ''); navigation.goBack(); }}>
                        <Text style={{ color: Colors.error, fontWeight: 'bold' }}>Block</Text>
                    </TouchableOpacity>
                </View>
            ) : isPending ? (
                <View style={[styles.inputArea, { backgroundColor: Colors.backgroundCard, borderTopColor: Colors.border, justifyContent: 'center', paddingBottom: Math.max(insets.bottom, 20), paddingTop: 16 }]}>
                    <Text style={{ color: Colors.warning, fontWeight: '600' }}>Waiting for user to accept request...</Text>
                </View>
            ) : (
                <View style={[styles.inputArea, { backgroundColor: Colors.background, borderTopColor: Colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
                    {/* Reply preview bar + pill input */}
                    <View style={{ flex: 1 }}>
                        {replyTo && (
                            <View style={[styles.replyBar, { backgroundColor: isDarkMode ? Colors.backgroundCard : '#F5F5F8', borderLeftColor: Colors.primary }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.replyBarName, { color: Colors.primary }]}>{replyTo.senderName}</Text>
                                    <Text style={[styles.replyBarText, { color: Colors.textMuted }]} numberOfLines={1}>{replyTo.text}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setReplyTo(null)} style={{ padding: 4 }}>
                                    <Ionicons name="close" size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Pill input */}
                        <View style={[styles.inputPill, { backgroundColor: isDarkMode ? Colors.backgroundCard : '#F0F0F0', borderColor: Colors.border }]}>
                            <TextInput
                                ref={inputRef}
                                style={[styles.input, { color: Colors.textPrimary }]}
                                placeholder="Type a message..."
                                placeholderTextColor={Colors.textMuted}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={1000}
                            />

                            {/* Camera icon inside the pill (right) */}
                            <TouchableOpacity style={{ paddingHorizontal: 6 }} onPress={() => setShowMediaMenu(true)}>
                                <Ionicons name="camera-outline" size={22} color={Colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Circular Action Button outside the pill (right) */}
                    <TouchableOpacity
                        onPress={inputText.trim() ? sendTextMessage : () => isPro ? setShowContactMenu(true) : setShowProAlert(true)}
                        style={styles.sendBtn}
                    >
                        <LinearGradient colors={[Colors.primary, Colors.primary + 'CC']} style={styles.sendGradient}>
                            {inputText.trim() ? (
                                <Ionicons name="send" size={16} color={isDarkMode ? '#111014' : '#FFF'} />
                            ) : (
                                <Ionicons name="person-add" size={18} color={isDarkMode ? '#111014' : '#FFF'} />
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}

            </View>

            {/* Group Approval Overlay */}
            {isGroupPending && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 30, zIndex: 1000 }]}>
                    <View style={[styles.approvalCard, { backgroundColor: Colors.backgroundElevated, borderRadius: 20, padding: 25, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: Colors.border }]}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                            <Ionicons name="chatbubbles" size={30} color={Colors.primary} />
                        </View>
                        <Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' }}>
                            Group Invitation
                        </Text>
                        <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 20 }}>
                            You've been added to the group chat for this dining plan. Please approve to see messages and participate.
                        </Text>
                        <View style={{ width: '100%', marginTop: 30, gap: 12 }}>
                            <TouchableOpacity
                                style={{ backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                                onPress={() => respondToGroupInvite(chatId, user?.id || '', 'approved')}
                            >
                                <Text style={{ color: isDarkMode ? '#FFF' : '#111014', fontWeight: '700', fontSize: 16 }}>Accept & Join</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ backgroundColor: Colors.background, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Colors.border }}
                                onPress={() => {
                                    respondToGroupInvite(chatId, user?.id || '', 'rejected');
                                    navigation.goBack();
                                }}
                            >
                                <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>Decline</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* ── Emoji Picker Modal (WhatsApp-style) ───────────────── */}
            <Modal
                visible={!!emojiPickerMsg || (!!contextMsg && false)}
                transparent
                animationType="fade"
                onRequestClose={() => setEmojiPickerMsg(null)}
                statusBarTranslucent
            >
                <TouchableOpacity
                    style={styles.emojiOverlay}
                    activeOpacity={1}
                    onPress={() => setEmojiPickerMsg(null)}
                >
                    <View style={[styles.emojiPickerCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        {QUICK_EMOJIS.map(emoji => (
                            <TouchableOpacity
                                key={emoji}
                                style={styles.emojiBtn}
                                onPress={() => emojiPickerMsg && addReaction(emojiPickerMsg.id, emoji)}
                            >
                                <Text style={styles.emojiGlyph}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ── Context Menu Modal (Reply / Copy / Delete) ─────────── */}
            <Modal
                visible={!!contextMsg}
                transparent
                animationType="fade"
                onRequestClose={() => setContextMsg(null)}
                statusBarTranslucent
            >
                <TouchableOpacity
                    style={styles.emojiOverlay}
                    activeOpacity={1}
                    onPress={() => setContextMsg(null)}
                >
                    <View style={{ alignItems: contextMsg && (contextMsg.senderId === user?.id || contextMsg.senderId === 'me') ? 'flex-end' : 'flex-start', paddingHorizontal: 16 }}>

                        {/* Emoji quick-react strip */}
                        <View style={[styles.emojiPickerCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, marginBottom: 8 }]}>
                            {QUICK_EMOJIS.map(emoji => (
                                <TouchableOpacity
                                    key={emoji}
                                    style={styles.emojiBtn}
                                    onPress={() => contextMsg && addReaction(contextMsg.id, emoji)}
                                >
                                    <Text style={styles.emojiGlyph}>{emoji}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Action menu */}
                        <View style={[styles.contextMenu, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                            <TouchableOpacity
                                style={[styles.contextMenuItem, { borderBottomColor: Colors.border }]}
                                onPress={() => contextMsg && handleReply(contextMsg)}
                            >
                                <Ionicons name="return-down-back-outline" size={19} color={Colors.textPrimary} />
                                <Text style={[styles.contextMenuText, { color: Colors.textPrimary }]}>Reply</Text>
                            </TouchableOpacity>
                            {contextMsg?.text && (
                                <TouchableOpacity
                                    style={[styles.contextMenuItem, { borderBottomColor: Colors.border }]}
                                    onPress={() => contextMsg && handleCopyText(contextMsg)}
                                >
                                    <Ionicons name="copy-outline" size={19} color={Colors.textPrimary} />
                                    <Text style={[styles.contextMenuText, { color: Colors.textPrimary }]}>Copy</Text>
                                </TouchableOpacity>
                            )}
                            {(contextMsg?.senderId === user?.id || contextMsg?.senderId === 'me') && (
                                <TouchableOpacity
                                    style={styles.contextMenuItem}
                                    onPress={() => {
                                        setContextMsg(null);
                                        Alert.alert('Delete message?', 'This will only remove it locally.', [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Delete', style: 'destructive', onPress: () => {} },
                                        ]);
                                    }}
                                >
                                    <Ionicons name="trash-outline" size={19} color="#EF4444" />
                                    <Text style={[styles.contextMenuText, { color: '#EF4444' }]}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Media Menu Modal */}
            <Modal visible={showMediaMenu} transparent animationType="slide" onRequestClose={() => setShowMediaMenu(false)} statusBarTranslucent>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowMediaMenu(false)}>
                    <View style={[styles.bottomSheet, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        <View style={[styles.handle, { backgroundColor: Colors.border }]} />
                        <Text style={[styles.sheetTitle, { color: Colors.textPrimary }]}>Media</Text>

                        {/* Camera button */}
                        <TouchableOpacity style={styles.sheetItem} onPress={openCamera}>
                            <View style={[styles.sheetIcon, { backgroundColor: Colors.primary + '20' }]}>
                                <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.sheetLabel, { color: Colors.textPrimary }]}>Camera</Text>
                                <Text style={[styles.sheetSub, { color: Colors.textMuted }]}>Photo or video</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Gallery button */}
                        <TouchableOpacity style={styles.sheetItem} onPress={openGallery}>
                            <View style={[styles.sheetIcon, { backgroundColor: '#6C63FF20' }]}>
                                <Ionicons name="images-outline" size={22} color="#6C63FF" />
                            </View>
                            <View>
                                <Text style={[styles.sheetLabel, { color: Colors.textPrimary }]}>Gallery</Text>
                                <Text style={[styles.sheetSub, { color: Colors.textMuted }]}>Images & videos • Max 25MB</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Contact Share Modal */}
            <Modal visible={showContactMenu} transparent animationType="slide" onRequestClose={() => setShowContactMenu(false)} statusBarTranslucent>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowContactMenu(false)}>
                    <View style={[styles.bottomSheet, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        <View style={[styles.handle, { backgroundColor: Colors.border }]} />
                        <Text style={[styles.sheetTitle, { color: Colors.textPrimary }]}>Share Contact Info</Text>
                        <Text style={[styles.sheetSub, { color: Colors.textMuted, marginBottom: 12 }]}>Only contacts you select will be shared.</Text>
                        {contactOptions.map(opt => (
                            <TouchableOpacity
                                key={opt.label}
                                style={[styles.sheetItem, !opt.value && { opacity: 0.4 }]}
                                onPress={() => sendContactInfo(opt.label, opt.value)}
                                disabled={!opt.value}
                            >
                                <View style={[styles.sheetIcon, { backgroundColor: Colors.primary + '20' }]}>
                                    <Ionicons name={opt.icon as any} size={20} color={Colors.primary} />
                                </View>
                                <View>
                                    <Text style={[styles.sheetLabel, { color: Colors.textPrimary }]}>{opt.label}</Text>
                                    <Text style={[styles.sheetSub, { color: Colors.textMuted }]}>
                                        {opt.value || 'Not configured'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Pro upgrade prompt for contact sharing */}
            <CustomAlert
                visible={showProAlert}
                title="Pro Feature ⚡"
                message="Sharing contact info via chat is exclusive to Pro members. Upgrade to connect deeper with your dining companions!"
                type="info"
                confirmText="Upgrade to Pro"
                cancelText="Maybe Later"
                onConfirm={() => { setShowProAlert(false); navigation.navigate('Plan'); }}
                onClose={() => setShowProAlert(false)}
            />

            {/* Header Menu Modal */}
            <Modal visible={showMenuPopup} transparent animationType="fade" onRequestClose={() => setShowMenuPopup(false)} statusBarTranslucent>
                <TouchableOpacity style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]} activeOpacity={1} onPress={() => setShowMenuPopup(false)}>
                    <View style={[styles.menuPopup, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                        {isGroup ? (
                            <>
                                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenuPopup(false); setShowParticipantsModal(true); }}>
                                    <Ionicons name="people-outline" size={20} color={Colors.textPrimary} />
                                    <Text style={[styles.menuText, { color: Colors.textPrimary }]}>View Participants</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => {
                                    setShowMenuPopup(false);
                                    Alert.alert('Leave Group', 'Are you sure you want to leave this group chat?', [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Leave', style: 'destructive', onPress: () => { leaveGroupChat(chatId, user?.id || ''); navigation.goBack(); } }
                                    ]);
                                }}>
                                    <Ionicons name="log-out-outline" size={20} color={Colors.warning} />
                                    <Text style={[styles.menuText, { color: Colors.warning }]}>Leave Group</Text>
                                </TouchableOpacity>

                                <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 4 }} />

                                <TouchableOpacity style={styles.menuItem} onPress={() => {
                                    setShowMenuPopup(false);
                                    if (isHost) {
                                        Alert.alert('Delete Group', 'This will permanently delete the group chat for all participants.', [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Delete for All', style: 'destructive', onPress: () => { deleteGroupChat(chatId, user?.id || '', true); navigation.goBack(); } }
                                        ]);
                                    } else {
                                        Alert.alert('Delete Chat', 'Remove this chat from your inbox?', [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Delete', style: 'destructive', onPress: () => { deleteGroupChat(chatId, user?.id || '', false); navigation.goBack(); } }
                                        ]);
                                    }
                                }}>
                                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                                    <Text style={[styles.menuText, { color: Colors.error }]}>{isHost ? 'Delete Group for All' : 'Delete Chat'}</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenuPopup(false); handleViewProfile(); }}>
                                    <Ionicons name="person-outline" size={20} color={Colors.textPrimary} />
                                    <Text style={[styles.menuText, { color: Colors.textPrimary }]}>View Profile</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={() => {
                                    setShowMenuPopup(false);
                                    Alert.alert('Block User', 'Are you sure you want to block this user?', [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Block', style: 'destructive', onPress: () => {
                                                blockConversation(chatId, user?.id || '');
                                                navigation.goBack();
                                            }
                                        }
                                    ]);
                                }}>
                                    <Ionicons name="ban-outline" size={20} color={Colors.error} />
                                    <Text style={[styles.menuText, { color: Colors.error }]}>Block User</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenuPopup(false); setShowReportModal(true); }}>
                                    <Ionicons name="flag-outline" size={20} color={Colors.warning} />
                                    <Text style={[styles.menuText, { color: Colors.warning }]}>Report User</Text>
                                </TouchableOpacity>

                                <View style={{ height: 1, backgroundColor: Colors.border, marginVertical: 4 }} />

                                <TouchableOpacity style={styles.menuItem} onPress={() => {
                                    setShowMenuPopup(false);
                                    Alert.alert('Clear Chat', 'Are you sure you want to clear this conversation?', [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Clear', style: 'destructive', onPress: () => clearMessages(chatId) }
                                    ]);
                                }}>
                                    <Ionicons name="trash-bin-outline" size={20} color={Colors.error} />
                                    <Text style={[styles.menuText, { color: Colors.error }]}>Clear Chat</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => {
                                    setShowMenuPopup(false);
                                    Alert.alert('Delete Chat', 'Are you sure you want to completely delete this conversation?', [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Delete', style: 'destructive', onPress: () => { deleteConversation(chatId, user?.id || ''); navigation.goBack(); } }
                                    ]);
                                }}>
                                    <Ionicons name="close-circle-outline" size={20} color={Colors.error} />
                                    <Text style={[styles.menuText, { color: Colors.error }]}>Delete Chat</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Participants Modal */}
            <Modal visible={showParticipantsModal} transparent animationType="slide" onRequestClose={() => setShowParticipantsModal(false)} statusBarTranslucent>
                <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowParticipantsModal(false)}>
                    <View style={[styles.bottomSheet, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, height: '70%' }]}>
                        <View style={[styles.handle, { backgroundColor: Colors.border }]} />
                        <Text style={[styles.sheetTitle, { color: Colors.textPrimary }]}>Participants</Text>

                        <ScrollView style={{ flex: 1, marginTop: 10 }}>
                            {chat?.isGroup && chat.members?.map((member: any) => {
                                const u = member.user_id === user?.id
                                    ? user
                                    : ALL_USERS.find(user => user.id === member.user_id);
                                const isMemberHost = chat.initiatorId === member.user_id;

                                return (
                                    <View key={member.user_id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border + '10' }}>
                                        <Image source={{ uri: u?.photoURL || 'https://via.placeholder.com/150' }} style={{ width: 45, height: 45, borderRadius: 22.5, marginRight: 15 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: Colors.textPrimary, fontWeight: '700', fontSize: 16 }}>{u?.name || 'Unknown'}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                                <View style={{ backgroundColor: isMemberHost ? Colors.primary + '20' : Colors.backgroundElevated, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 }}>
                                                    <Text style={{ color: isMemberHost ? Colors.primary : Colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                                                        {isMemberHost ? 'HOST' : 'MEMBER'}
                                                    </Text>
                                                </View>
                                                <Text style={{ color: member.status === 'approved' ? Colors.success : Colors.warning, fontSize: 11, fontWeight: '600' }}>
                                                    {member.status === 'approved' ? '✓ Joined' : '⏳ Pending'}
                                                </Text>
                                            </View>
                                        </View>

                                        {isHost && member.user_id !== user?.id && (
                                            <TouchableOpacity
                                                style={{ padding: 10 }}
                                                onPress={() => {
                                                    Alert.alert('Remove Member', `Are you sure you want to remove ${u?.name || 'this member'}?`, [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Remove', style: 'destructive', onPress: () => removeGroupMember(chatId, member.user_id, user?.id || '') }
                                                    ]);
                                                }}
                                            >
                                                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Report Modal */}
            <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)} statusBarTranslucent>
                <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }]}>
                    <View style={[styles.reportContainer, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        <Text style={[styles.reportTitle, { color: Colors.textPrimary }]}>Report User</Text>
                        <Text style={[styles.reportSub, { color: Colors.textMuted }]}>Please tell us why you are reporting this user.</Text>

                        <Text style={[styles.reportLabel, { color: Colors.textPrimary }]}>Reason</Text>
                        <TextInput
                            style={[styles.reportInput, { backgroundColor: Colors.backgroundElevated, color: Colors.textPrimary, borderColor: Colors.border }]}
                            value={reportReason}
                            onChangeText={setReportReason}
                        />

                        <Text style={[styles.reportLabel, { color: Colors.textPrimary, marginTop: 12 }]}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.reportInput, { backgroundColor: Colors.backgroundElevated, color: Colors.textPrimary, borderColor: Colors.border, height: 80, textAlignVertical: 'top' }]}
                            value={reportDesc}
                            onChangeText={setReportDesc}
                            multiline
                            placeholder="Additional details..."
                            placeholderTextColor={Colors.textMuted}
                        />

                        <View style={styles.reportActions}>
                            <TouchableOpacity style={[styles.reportBtn, { backgroundColor: Colors.backgroundElevated, borderWidth: 1, borderColor: Colors.border }]} onPress={() => setShowReportModal(false)}>
                                <Text style={[styles.reportBtnText, { color: Colors.textPrimary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.reportBtn, { backgroundColor: Colors.primary }]} onPress={() => {
                                setShowReportModal(false);
                                Alert.alert('Report Submitted', 'Thank you. We will review this report shortly.');
                            }}>
                                <Text style={[styles.reportBtnText, { color: isDarkMode ? '#FFF' : '#111014' }]}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Media Preview Modal */}
            {
                previewUri && (
                    <Modal visible animationType="slide" onRequestClose={() => setPreviewUri(null)} statusBarTranslucent>
                        <View style={[styles.previewContainer, { backgroundColor: '#000' }]}>
                            <SafeAreaView style={{ flex: 1 }}>
                                <View style={styles.previewHeader}>
                                    <TouchableOpacity onPress={() => setPreviewUri(null)}>
                                        <Ionicons name="close" size={28} color="#FFF" />
                                    </TouchableOpacity>
                                    <Text style={styles.previewTitle}>Preview</Text>
                                    <View style={{ width: 28 }} />
                                </View>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    {previewType === 'image' ? (
                                        <Image source={{ uri: previewUri || undefined }} style={styles.previewImage} resizeMode="contain" />
                                    ) : (
                                        <View style={styles.videoPreview}>
                                            <Ionicons name="play-circle" size={80} color="#FFF" />
                                            <Text style={{ color: '#FFF', marginTop: 12, fontSize: 16 }}>Video Ready to Send</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.previewFooter}>
                                    <TouchableOpacity
                                        style={[styles.previewSendBtn, { opacity: isSending ? 0.7 : 1 }]}
                                        onPress={sendMedia}
                                        disabled={isSending}
                                    >
                                        <LinearGradient colors={[Colors.primary, Colors.primary + 'CC']} style={styles.sendGradientFull}>
                                            {isSending
                                                ? <ActivityIndicator color="#FFF" />
                                                : <Text style={{ color: isDarkMode ? '#111014' : '#FFF', fontWeight: '800', fontSize: 16 }}>Send</Text>
                                            }
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </SafeAreaView>
                        </View>
                    </Modal>
                )
            }
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    // Instagram-style header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 8, paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: 4,
    },
    backBtn: { padding: 6 },
    headerCenter: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'flex-start', gap: 10,
    },
    headerAvatar: {
        width: 38, height: 38, borderRadius: 19,
        justifyContent: 'center', alignItems: 'center',
    },
    headerName: { fontSize: 15, fontWeight: '700', textAlign: 'left' },
    headerStatus: { fontSize: 11, textAlign: 'left' },
    moreBtn: { padding: 8 },
    messageList: { paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 40 },
    messageRow: { marginBottom: 12, flexDirection: 'row' },
    myRow: { justifyContent: 'flex-end' },
    otherRow: { justifyContent: 'flex-start' },
    bubble: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24 },
    sharePreviewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        gap: 12,
        minWidth: 220,
    },
    sharePreviewIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sharePreviewTitle: {
        fontSize: 14,
        fontWeight: '700',
    },
    sharePreviewSub: {
        fontSize: 12,
        marginTop: 2,
    },
    msgText: { fontSize: 16, lineHeight: 22 },
    timeRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
    msgTime: { fontSize: 11 },
    typingRow: { flexDirection: 'row', justifyContent: 'flex-start', marginBottom: 12 },
    typingBubble: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderBottomLeftRadius: 4 },
    typingText: { fontSize: 14, fontStyle: 'italic', fontWeight: '500' },
    mediaImage: { width: 200, height: 200, borderRadius: 12 },
    videoThumb: { width: 200, height: 140, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    contactCard: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4, paddingVertical: 2 },
    // ── Input area ──────────────────────────────────────────────────────────
    inputArea: {
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 10, paddingVertical: 8, gap: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    attachBtn: { padding: 6, alignSelf: 'flex-end', paddingBottom: 10 },
    inputPill: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        borderRadius: 22, borderWidth: 1,
        paddingHorizontal: 14, paddingVertical: 2,
        minHeight: 44, maxHeight: 120,
    },
    input: { flex: 1, fontSize: 15, paddingVertical: 10, maxHeight: 110 },
    sendBtn: {
        width: 40, height: 40, borderRadius: 20,
        overflow: 'hidden', alignSelf: 'flex-end', marginBottom: 2,
    },
    sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // ── Reply bar above input ────────────────────────────────────────────────
    replyBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 14, paddingVertical: 8,
        borderLeftWidth: 3, marginHorizontal: 10,
        marginBottom: 4, borderRadius: 8,
        gap: 8,
    },
    replyBarName: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
    replyBarText: { fontSize: 13 },

    // ── Quoted block inside bubble ───────────────────────────────────────────
    quotedBlock: {
        borderLeftWidth: 3, borderRadius: 6,
        paddingHorizontal: 10, paddingVertical: 6,
        marginBottom: 6,
    },
    quotedName: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
    quotedText: { fontSize: 12, lineHeight: 16 },

    // ── Emoji reactions below bubble ─────────────────────────────────────────
    reactionsRow: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 4,
        marginTop: 4, marginHorizontal: 12,
    },
    reactionBubble: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 7, paddingVertical: 3,
        borderRadius: 12, borderWidth: 1, gap: 3,
    },
    reactionEmoji: { fontSize: 14 },
    reactionCount: { fontSize: 11, fontWeight: '700' },

    // ── Emoji picker overlay ─────────────────────────────────────────────────
    emojiOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center', alignItems: 'center',
    },
    emojiPickerCard: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 10, paddingVertical: 10,
        borderRadius: 50, borderWidth: StyleSheet.hairlineWidth,
        gap: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    },
    emojiBtn: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
    },
    emojiGlyph: { fontSize: 26 },

    // ── Context menu ─────────────────────────────────────────────────────────
    contextMenu: {
        borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden', minWidth: 180,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
    },
    contextMenuItem: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 18, paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    contextMenuText: { fontSize: 15, fontWeight: '500' },
    approvalCard: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    bottomSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, borderWidth: 1 },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
    sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14 },
    sheetIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    sheetLabel: { fontSize: 15, fontWeight: '700' },
    sheetSub: { fontSize: 12, marginTop: 2 },
    previewContainer: { flex: 1 },
    previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
    previewTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    previewImage: { width: '100%', height: 400 },
    videoPreview: { alignItems: 'center', justifyContent: 'center', gap: 12 },
    previewFooter: { padding: 24 },
    previewSendBtn: { borderRadius: 28, overflow: 'hidden' },
    sendGradientFull: { height: 56, justifyContent: 'center', alignItems: 'center' },
    menuPopup: { position: 'absolute', top: 60, right: 16, width: 220, borderRadius: 16, borderWidth: 1, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
    menuText: { fontSize: 15, fontWeight: '600' },
    reportContainer: { borderRadius: 24, padding: 24, borderWidth: 1 },
    reportTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
    reportSub: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
    reportLabel: { fontSize: 13, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    reportInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
    reportActions: { flexDirection: 'row', gap: 12, marginTop: 28 },
    reportBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    reportBtnText: { fontSize: 16, fontWeight: '800' },
    systemMessageContainer: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 30,
    },
    systemMessageText: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        opacity: 0.8,
        fontStyle: 'italic',
    }
});
