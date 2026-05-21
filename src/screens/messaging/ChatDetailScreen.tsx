import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Image, Modal, Alert, ActivityIndicator, Linking, ScrollView
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
}

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
    const { currentTheme } = useThemeStore();
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
        };
        sendMessageOut(chatId, newMsg);
        setInputText('');
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
        const s = status || 'read';
        if (s === 'sent') return <Ionicons name="checkmark" size={16} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />;
        if (s === 'delivered') return <Ionicons name="checkmark-done" size={16} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />;
        if (s === 'read') return <Ionicons name="checkmark-done" size={16} color="#34B7F1" style={{ marginLeft: 4 }} />;
        return null;
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isMe = item.senderId === user?.id || item.senderId === 'me';
        const isSystem = item.senderId === 'system';

        if (isSystem) {
            return (
                <View style={styles.systemMessageContainer}>
                    <Text style={[styles.systemMessageText, { color: Colors.textMuted }]}>{item.text}</Text>
                </View>
            );
        }

        return (
            <View style={[styles.messageRow, isMe ? styles.myRow : styles.otherRow]}>
                <View style={[
                    styles.bubble,
                    isMe
                        ? { backgroundColor: Colors.primary, borderBottomRightRadius: 4 }
                        : { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }
                ]}>
                    {item.type === 'text' && (
                        <>
                            {(() => {
                                const postUrlMatch = item.text?.match(/https:\/\/bitebuddy\.app\/post\/([a-zA-Z0-9]+)/);
                                if (postUrlMatch) {
                                    const postId = postUrlMatch[1];
                                    const sharedPost = posts.find(p => p.id === postId);
                                    if (sharedPost) {
                                        return (
                                            <TouchableOpacity
                                                style={[styles.sharePreviewCard, { backgroundColor: isMe ? 'rgba(255,255,255,0.1)' : Colors.backgroundElevated }]}
                                                onPress={() => navigation.navigate('PostDetail', { postId })}
                                            >
                                                <View style={styles.sharePreviewIcon}>
                                                    <Ionicons name="restaurant" size={20} color={isMe ? '#FFF' : Colors.primary} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.sharePreviewTitle, { color: isMe ? '#FFF' : Colors.textPrimary }]} numberOfLines={1}>{sharedPost.title}</Text>
                                                    <Text style={[styles.sharePreviewSub, { color: isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted }]} numberOfLines={1}>
                                                        📍 {sharedPost.restaurantName || sharedPost.area}
                                                    </Text>
                                                </View>
                                                <Ionicons name="chevron-forward" size={16} color={isMe ? 'rgba(255,255,255,0.5)' : Colors.textMuted} />
                                            </TouchableOpacity>
                                        );
                                    }
                                }
                                return <Text style={[styles.msgText, { color: isMe ? '#FFF' : Colors.textPrimary }]}>{item.text}</Text>;
                            })()}
                            <View style={styles.timeRow}>
                                <Text style={[styles.msgTime, { color: isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted }]}>{item.time}</Text>
                                {isMe && getMessageTick(item.status)}
                            </View>
                        </>
                    )}
                    {item.type === 'image' && item.mediaUri && (
                        <>
                            <Image source={{ uri: item.mediaUri }} style={styles.mediaImage} />
                            <View style={styles.timeRow}>
                                <Text style={[styles.msgTime, { color: isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted }]}>{item.time}</Text>
                                {isMe && getMessageTick(item.status)}
                            </View>
                        </>
                    )}
                    {item.type === 'video' && item.mediaUri && (
                        <>
                            <View style={styles.videoThumb}>
                                <Ionicons name="play-circle" size={44} color="#FFF" />
                                <Text style={{ color: '#FFF', fontSize: 12, marginTop: 6 }}>Video</Text>
                            </View>
                            <View style={styles.timeRow}>
                                <Text style={[styles.msgTime, { color: 'rgba(255,255,255,0.7)' }]}>{item.time}</Text>
                                {isMe && getMessageTick(item.status)}
                            </View>
                        </>
                    )}
                    {item.type === 'contact' && item.contactData && (
                        <>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                                onPress={() => openContactLink(item.contactData!.label, item.contactData!.value)}
                                activeOpacity={0.75}
                            >
                                <Ionicons name="person-circle-outline" size={36} color={isMe ? '#FFF' : Colors.primary} />
                                <View style={{ flexShrink: 1 }}>
                                    <Text style={{ fontSize: 11, color: isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {item.contactData.label}
                                    </Text>
                                    <Text style={{ fontSize: 16, color: isMe ? '#FFF' : Colors.textPrimary, fontWeight: '800', marginTop: 1 }}>
                                        {item.contactData.value}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <View style={styles.timeRow}>
                                <Text style={[styles.msgTime, { color: isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted }]}>{item.time}</Text>
                                {isMe && getMessageTick(item.status)}
                            </View>
                        </>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <BrandBar />
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                {chat?.participantAvatar ? (
                    <Image source={{ uri: chat.participantAvatar }} style={styles.headerAvatar} />
                ) : (
                    <LinearGradient
                        colors={isGroup ? ['#6C63FF', '#3CA5FF'] : ['#FF6B35', '#FF3CAC']}
                        style={styles.headerAvatar}
                    >
                        <Text style={{ fontSize: 18 }}>{isGroup ? '👥' : '👤'}</Text>
                    </LinearGradient>
                )}
                <View style={{ flex: 1 }}>
                    <TouchableOpacity onPress={handleViewProfile} activeOpacity={0.7}>
                        <Text style={[styles.headerName, { color: Colors.textPrimary }]}>{chatName}</Text>
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.headerStatus, { color: Colors.success, fontSize: 11 }]}>{isGroup ? 'Group Chat' : 'Active now'}</Text>
                        {isGroup && chat?.planId && (
                            <>
                                <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textMuted }} />
                                <TouchableOpacity
                                    onPress={() => {
                                        navigation.navigate('PostDetail' as any, { postId: chat.planId });
                                    }}
                                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary + '10', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}
                                >
                                    <Ionicons name="restaurant-outline" size={12} color={Colors.primary} />
                                    <Text style={{ fontSize: 11, color: Colors.primary, fontWeight: '700' }}>View Plan</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => setShowMenuPopup(true)}
                >
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
            </View>

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
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
                    <View style={[styles.inputArea, { backgroundColor: Colors.backgroundCard, borderTopColor: Colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
                        <TouchableOpacity style={styles.attachBtn} onPress={() => setShowMediaMenu(true)}>
                            <Ionicons name="camera-outline" size={26} color={Colors.primary} />
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.input, { backgroundColor: Colors.backgroundElevated, color: Colors.textPrimary }]}
                            placeholder="Type a message..."
                            placeholderTextColor={Colors.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={1000}
                        />

                        {inputText.trim() ? (
                            <TouchableOpacity style={styles.sendBtn} onPress={sendTextMessage}>
                                <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.sendGradient}>
                                    <Ionicons name="send" size={18} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.sendBtn}
                                onPress={() => isPro ? setShowContactMenu(true) : setShowProAlert(true)}
                            >
                                <View style={[styles.sendGradient, { backgroundColor: isPro ? Colors.primary + '20' : Colors.backgroundElevated }]}>
                                    <Ionicons
                                        name="person-add-outline"
                                        size={18}
                                        color={isPro ? Colors.primary : Colors.textMuted}
                                    />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </KeyboardAvoidingView>
            )}

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
                                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Accept & Join</Text>
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
                                <Text style={[styles.reportBtnText, { color: '#FFF' }]}>Submit</Text>
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
                                        <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.sendGradientFull}>
                                            {isSending
                                                ? <ActivityIndicator color="#FFF" />
                                                : <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Send</Text>
                                            }
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </SafeAreaView>
                        </View>
                    </Modal>
                )
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 12, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerName: { fontSize: 16, fontWeight: '700' },
    headerStatus: { fontSize: 11, marginTop: 1 },
    moreBtn: { padding: 4 },
    messageList: { paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 40 },
    messageRow: { marginBottom: 12, flexDirection: 'row' },
    myRow: { justifyContent: 'flex-end' },
    otherRow: { justifyContent: 'flex-start' },
    bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 24 },
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
    inputArea: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 12, gap: 10, borderTopWidth: 1 },
    attachBtn: { padding: 4, alignSelf: 'center', marginBottom: 4 },
    input: { flex: 1, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, maxHeight: 120, fontSize: 16 },
    sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', alignSelf: 'center', marginLeft: 4 },
    sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
