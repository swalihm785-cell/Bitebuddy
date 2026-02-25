import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, Dimensions, TextInput, Modal, Alert, Share, Clipboard, Platform, KeyboardAvoidingView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useChatStore, API_URL } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { DiningPost, RootStackParamList, JoinRequest, Participant } from '../../types';
import { BUDGET_LABELS } from '../../theme/theme';
import { CustomAlert } from '../../components/common/CustomAlert';
import { isCurrentlyPro } from '../../utils/authUtils';
import { TEST_USERS } from '../../data/testUsers';
import { handleDiningPlanShare } from '../../utils/diningPlanShareUtils';

const { width, height } = Dimensions.get('window');

const CUISINE_IMAGES: Record<string, string> = {
    Italian: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80',
    Japanese: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    Indian: 'https://images.unsplash.com/photo-1585937421612-71100e45278d?auto=format&fit=crop&w=800&q=80',
    Thai: 'https://images.unsplash.com/photo-1559311648-d46f4d8593d9?auto=format&fit=crop&w=800&q=80',
    American: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    Mexican: 'https://images.unsplash.com/photo-1565299585323-38d6bcba1698?auto=format&fit=crop&w=800&q=80',
    Vegan: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    Chinese: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';

export default function PostDetailScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const { postId } = route.params;
    const { user } = useAuthStore();
    const { posts, joinRequests, invites, updatePost, deletePost, addJoinRequest, updateJoinRequest, updateInvite, removeInvite, leavePost } = usePostStore();
    const { addNotification } = useNotificationStore();
    const { createGroupChat, addGroupMember } = useChatStore();
    const { currentTheme } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;
    const insets = useSafeAreaInsets();

    const [creatingGroup, setCreatingGroup] = useState(false);
    const [inviteAction, setInviteAction] = useState<'accept' | 'reject' | null>(null);
    const [inviteNote, setInviteNote] = useState('');
    const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);

    // Invite Modal State
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [inviteSearchQuery, setInviteSearchQuery] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'error' | 'info' | 'warning'; onConfirm?: () => void; confirmText?: string; cancelText?: string }>({ visible: false, title: '', message: '' });
    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', onConfirm?: () => void, confirmText = 'OK', cancelText?: string) =>
        setAlertConfig({ visible: true, title, message, type, onConfirm, confirmText, cancelText });
    const closeAlert = () => setAlertConfig(a => ({ ...a, visible: false }));

    const post = posts.find(p => p.id === postId);

    if (!post) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.textMuted} />
                <Text style={[styles.errorText, { color: Colors.textPrimary }]}>Post not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: Colors.primary, fontWeight: '700' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isHost = user?.id === post.hostId;
    const isJoined = post.participants.some(p => p.id === user?.id);
    const isPro = isCurrentlyPro(user);
    const myRequest = joinRequests.find(r => r.postId === postId && r.requesterId === user?.id);
    const hasPendingRequest = myRequest?.status === 'pending';
    const hasRejectedRequest = myRequest?.status === 'rejected';

    const postRequests = joinRequests.filter(r => r.postId === postId && r.status === 'pending');
    const postInvites = invites.filter(i => i.postId === postId);
    const myInvite = postInvites.find(i => i.inviteeId === user?.id);

    const hostParticipant: Participant = post.participants.find(p => p.id === post.hostId) || { id: post.hostId, name: 'Host', age: 25 };
    const participants = post.participants || [];
    const spotsLeft = post.maxGroupSize - participants.length;
    const cuisineImage = post.imageURL || CUISINE_IMAGES[post.cuisineTypes[0]] || DEFAULT_IMAGE;

    const formatDate = (date: any) => {
        const d = date instanceof Date ? date : new Date(date);
        return isNaN(d.getTime()) ? 'Time TBD' : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    const handleJoin = () => {
        if (!user) {
            showAlert('Login Required', 'Please log in to join.', 'warning');
            return;
        }
        if (isJoined || hasPendingRequest) return;
        if (spotsLeft <= 0) {
            showAlert('Meal is Full', 'This meal is already at full capacity.', 'error');
            return;
        }

        if (post.autoApprove) {
            const newParticipant: Participant = { id: user.id || 'me', name: user.name || 'User', age: user.age || 25, gender: user.gender };
            const updatedParticipants = [...participants, newParticipant];
            updatePost(post.id, { participants: updatedParticipants, currentParticipants: updatedParticipants.length });

            addNotification({
                userId: post.hostId,
                type: 'join_request',
                title: 'New Participant Joined! 🎉',
                body: `${user.name} joined your meal: ${post.title}`,
                data: { postId: post.id }
            });

            addGroupMember(`group_${post.id}`, user.id);
            showAlert('Joined! 🎉', 'You have been automatically added to this dining plan.', 'success');
        } else {
            const newRequest: JoinRequest = {
                id: Math.random().toString(36).substr(2, 9),
                postId: post.id,
                requesterId: user.id || 'me',
                requester: user as any,
                status: 'pending',
                createdAt: new Date()
            };
            addJoinRequest(newRequest);

            addNotification({
                userId: post.hostId,
                type: 'join_request',
                title: 'New Join Request! 📨',
                body: `${user.name} wants to join: ${post.title}`,
                data: { postId: post.id }
            });

            showAlert('Request Sent 📨', 'Your request has been sent to the host for approval.', 'info');
        }
    };

    const handleSendInvites = () => {
        if (!user || !post) return;
        if (selectedUserIds.size === 0) {
            showAlert('No Users Selected', 'Please select at least one user to invite.', 'warning');
            return;
        }

        let sentCount = 0;
        selectedUserIds.forEach(id => {
            const targetUser = Object.values(TEST_USERS).map(t => t.user).find(u => u.id === id);
            if (!targetUser) return;

            const alreadyJoined = participants.some(p => p.id === id);
            const alreadyInvited = postInvites.some(i => i.inviteeId === id && i.status !== 'rejected');

            if (!alreadyJoined && !alreadyInvited) {
                const newInvite = {
                    id: Math.random().toString(36).substr(2, 9),
                    postId: post.id,
                    inviterId: user.id,
                    inviteeId: targetUser.id,
                    inviteeName: targetUser.name,
                    inviteePhotoURL: targetUser.photoURL,
                    status: 'pending' as const,
                    createdAt: new Date()
                };

                usePostStore.getState().addInvite(newInvite);

                addNotification({
                    userId: targetUser.id,
                    type: 'system',
                    title: 'New Dining Invite! 🍽️',
                    body: `${user.name} invited you to join: ${post.title}`,
                    data: { postId: post.id }
                });
                sentCount++;
            }
        });

        setInviteModalVisible(false);
        setSelectedUserIds(new Set());

        if (sentCount > 0) {
            showAlert('Invites Sent! 🚀', `Successfully sent ${sentCount} invite(s).`, 'success');
        } else {
            showAlert('Notice', 'Selected users are already invited or participating.', 'info');
        }
    };

    const handleCreateGroupChat = async () => {
        if (!user) return;
        if (!isPro) {
            showAlert('Pro Required', 'You need a Pro membership to create and access group chats.', 'warning', () => navigation.navigate('Plan' as any), 'Upgrade', 'Cancel');
            return;
        }

        setCreatingGroup(true);
        const participantIds = participants.map(p => p.id);

        try {
            const res = await createGroupChat(user.id, post.id, post.title, participantIds, isPro);

            if (res.success && res.chatId) {
                participants.forEach(p => {
                    if (p.id !== user.id) {
                        addNotification({
                            userId: p.id,
                            type: 'event',
                            title: 'Group Chat Created 💬',
                            body: `A group chat has been created for your meal plan: ${post.title}`,
                            data: { postId: post.id }
                        });
                    }
                });

                showAlert('Group Created! 🎉', 'Your group chat is ready. Moving to inbox...', 'success', () => {
                    navigation.navigate('Main' as any, { screen: 'Messages' });
                });
            } else {
                showAlert('Failed', res.error || 'Could not create group chat.', 'error');
            }
        } catch (err) {
            showAlert('Error', 'An unexpected error occurred.', 'error');
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleLeave = () => {
        showAlert(
            'Leave Meal',
            'Are you sure you want to leave this meal?',
            'warning',
            () => {
                leavePost(post.id, user!.id);
                fetch(`${API_URL}/chats/group/group_${post.id}/remove`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user!.id })
                }).catch(e => console.error(e));

                addNotification({
                    userId: post.hostId,
                    type: 'participant_left',
                    title: 'Participant Left',
                    body: `${user?.name} has left your meal: ${post.title}`,
                    data: { postId: post.id }
                });
                showAlert('Left Meal', 'You are no longer a participant of this meal.', 'info');
            },
            'Leave',
            'Cancel'
        );
    };

    const handleDelete = () => {
        showAlert(
            'Cancel Dining Plan',
            'Are you sure you want to cancel this dining plan? This cannot be undone.',
            'error',
            () => {
                deletePost(post.id);
                navigation.goBack();
            },
            'Delete Plan',
            'Keep'
        );
    };

    const handleRequestAction = (requestId: string, action: 'accepted' | 'rejected') => {
        const request = joinRequests.find(r => r.id === requestId);
        if (!request) return;

        updateJoinRequest(requestId, action);

        addNotification({
            userId: request.requesterId,
            type: action === 'accepted' ? 'request_accepted' : 'request_rejected',
            title: action === 'accepted' ? 'Request Approved! 🥳' : 'Request Declined',
            body: action === 'accepted'
                ? `The host approved your request to join: ${post.title}`
                : `Your request to join "${post.title}" was not accepted this time.`,
            data: { postId: post.id }
        });

        if (action === 'accepted') {
            addGroupMember(`group_${post.id}`, request.requesterId);
        }

        showAlert(action === 'accepted' ? 'Approved ✅' : 'Declined', `User has been ${action}.`, action === 'accepted' ? 'success' : 'error');
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <Image source={{ uri: cuisineImage }} style={styles.heroImage} />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.8)']}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={[styles.headerActions, { paddingTop: Math.max(insets.top, 10), backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'transparent', overflow: 'hidden' }]}>
                        {Platform.OS === 'ios' && (
                            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                        )}
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
                            <Ionicons name="chevron-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => handleDiningPlanShare(post)} style={styles.circleBtn}>
                                <Ionicons name="share-social-outline" size={22} color="#FFF" />
                            </TouchableOpacity>
                            {isHost && (
                                <TouchableOpacity onPress={() => navigation.navigate('EditPost' as any, { postId: post.id })} style={styles.circleBtn}>
                                    <Ionicons name="create-outline" size={22} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={styles.heroContent}>
                        <View style={styles.cuisineRow}>
                            {post.cuisineTypes.map(c => (
                                <View key={c} style={[styles.cuisineBadge, { backgroundColor: Colors.primary }]}>
                                    <Text style={styles.cuisineText}>{c}</Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.heroTitle}>{post.title}</Text>
                        <View style={styles.heroMeta}>
                            <Ionicons name="location" size={16} color={Colors.accent} />
                            <Text style={styles.heroMetaText}>{post.restaurantName || 'Restaurant'} · {post.area}</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.body, { backgroundColor: Colors.background }]}>
                    {/* Host Card */}
                    <View style={[styles.card, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                        <View style={styles.hostRow}>
                            <View style={[styles.hostAvatar, { backgroundColor: Colors.primary }]}>
                                {hostParticipant.photoURL ? (
                                    <Image source={{ uri: hostParticipant.photoURL }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
                                ) : (
                                    <Text style={{ fontSize: 24 }}>👤</Text>
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <TouchableOpacity onPress={() => navigation.navigate('UserProfile' as any, { userId: post.hostId })}>
                                    <Text style={[styles.hostName, { color: Colors.textPrimary }]}>{hostParticipant.name}</Text>
                                    <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Host · ★ 4.9</Text>
                                </TouchableOpacity>
                            </View>
                            {!isHost && (
                                <TouchableOpacity
                                    style={[styles.chatBtn, { borderColor: Colors.primary }]}
                                    onPress={async () => {
                                        if (!user) {
                                            showAlert('Login Required', 'Please log in to message the host.', 'warning');
                                            return;
                                        }
                                        const { findConversationByParticipantId, sendChatRequest } = useChatStore.getState();
                                        const existing = findConversationByParticipantId(post.hostId);

                                        if (existing) {
                                            navigation.navigate('ChatDetail', {
                                                chatId: existing.id,
                                                chatName: hostParticipant.name,
                                                isGroup: false,
                                                chatAvatar: hostParticipant.photoURL
                                            });
                                        } else {
                                            const newChatId = await sendChatRequest(
                                                { id: user.id, name: user.name, avatar: user.photoURL },
                                                { id: post.hostId, name: hostParticipant.name, avatar: hostParticipant.photoURL },
                                                'Hi! I am interested in your dining plan.'
                                            );
                                            if (newChatId) {
                                                navigation.navigate('ChatDetail', {
                                                    chatId: newChatId,
                                                    chatName: hostParticipant.name,
                                                    isGroup: false,
                                                    chatAvatar: hostParticipant.photoURL
                                                });
                                            }
                                        }
                                    }}
                                >
                                    <Ionicons name="chatbubble" size={18} color={Colors.primary} />
                                    <Text style={{ color: Colors.primary, fontWeight: '700' }}>Message</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Join Request Status Banner */}
                    {!isHost && myRequest && (
                        <View style={[styles.card, {
                            backgroundColor: myRequest.status === 'pending' ? Colors.warning + '12' : myRequest.status === 'accepted' ? Colors.success + '12' : Colors.error + '12',
                            borderColor: myRequest.status === 'pending' ? Colors.warning : myRequest.status === 'accepted' ? Colors.success : Colors.error,
                        }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{
                                    width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center',
                                    backgroundColor: myRequest.status === 'pending' ? Colors.warning + '25' : myRequest.status === 'accepted' ? Colors.success + '25' : Colors.error + '25',
                                }}>
                                    <Ionicons
                                        name={myRequest.status === 'pending' ? 'hourglass-outline' : myRequest.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                                        size={24}
                                        color={myRequest.status === 'pending' ? Colors.warning : myRequest.status === 'accepted' ? Colors.success : Colors.error}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 15, fontWeight: '800', color: myRequest.status === 'pending' ? Colors.warning : myRequest.status === 'accepted' ? Colors.success : Colors.error }}>
                                        {myRequest.status === 'pending' ? 'Request Pending' : myRequest.status === 'accepted' ? 'Request Accepted!' : 'Request Declined'}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: Colors.textSecondary, marginTop: 2 }}>
                                        {myRequest.status === 'pending'
                                            ? 'Waiting for the host to review your request.'
                                            : myRequest.status === 'accepted'
                                                ? 'You have been approved to join this meal!'
                                                : 'The host did not accept your request this time.'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Join Requests for Host */}
                    {isHost && postRequests.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Pending Requests ({postRequests.length})</Text>
                            <View style={styles.requestList}>
                                {postRequests.map((req) => (
                                    <View key={req.id} style={[styles.requestItem, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                                        <TouchableOpacity
                                            style={styles.requesterInfo}
                                            onPress={() => navigation.navigate('UserProfile' as any, { userId: req.requesterId })}
                                        >
                                            <View style={[styles.rAvatar, { backgroundColor: Colors.backgroundCard }]}>
                                                <Text style={{ fontSize: 14 }}>👤</Text>
                                            </View>
                                            <View>
                                                <Text style={[styles.rName, { color: Colors.textPrimary }]}>{req.requester?.name || 'User'}</Text>
                                                <Text style={{ color: Colors.textMuted, fontSize: 11 }}>★ 5.0 Reputation</Text>
                                            </View>
                                        </TouchableOpacity>
                                        <View style={styles.requestActions}>
                                            <TouchableOpacity
                                                onPress={() => handleRequestAction(req.id, 'rejected')}
                                                style={[styles.actionIcon, { backgroundColor: Colors.error + '15' }]}
                                            >
                                                <Ionicons name="close" size={20} color={Colors.error} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleRequestAction(req.id, 'accepted')}
                                                style={[styles.actionIcon, { backgroundColor: Colors.success + '15' }]}
                                            >
                                                <Ionicons name="checkmark" size={20} color={Colors.success} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Details Grid */}
                    <View style={styles.detailsGrid}>
                        <View style={[styles.detailItem, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                            <Ionicons name="time-outline" size={22} color={Colors.primary} />
                            <View>
                                <Text style={[styles.detailLabel, { color: Colors.textMuted }]}>Date & Time</Text>
                                <Text style={[styles.detailValue, { color: Colors.textPrimary }]}>{post.isImmediate ? 'Right Now!' : formatDate(post.dateTime)}</Text>
                            </View>
                        </View>
                        <View style={[styles.detailItem, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                            <Ionicons name="people-outline" size={22} color={Colors.primary} />
                            <View>
                                <Text style={[styles.detailLabel, { color: Colors.textMuted }]}>Participants</Text>
                                <Text style={[styles.detailValue, { color: Colors.textPrimary }]}>{participants.length} / {post.maxGroupSize} joined</Text>
                            </View>
                        </View>
                        <View style={[styles.detailItem, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                            <Ionicons name="cash-outline" size={22} color={Colors.primary} />
                            <View>
                                <Text style={[styles.detailLabel, { color: Colors.textMuted }]}>Budget</Text>
                                <Text style={[styles.detailValue, { color: Colors.textPrimary }]}>₹{BUDGET_LABELS[post.budgetRange]}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>About the Meal</Text>
                        <Text style={[styles.descriptionText, { color: Colors.textSecondary }]}>{post.description || 'No additional details provided by the host.'}</Text>
                        {post.cuisineDescription && (
                            <View style={[styles.cuisineDesc, { backgroundColor: Colors.backgroundCard }]}>
                                <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
                                <Text style={[styles.cuisineDescText, { color: Colors.textSecondary }]}>{post.cuisineDescription}</Text>
                            </View>
                        )}
                    </View>

                    {/* Participants List */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Meeting With</Text>
                        <View style={styles.participantList}>
                            {participants.map((p, i) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[styles.participantItem, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                                    onPress={() => navigation.navigate('UserProfile' as any, { userId: p.id })}
                                >
                                    <View style={[styles.pAvatar, { backgroundColor: Colors.backgroundElevated }]}>
                                        <Text style={{ fontSize: 16 }}>👤</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.pName, { color: Colors.textPrimary }]}>{p.name}</Text>
                                        <Text style={{ color: Colors.textMuted, fontSize: 11 }}>{p.age || 25}y · {p.gender || 'Foodie'}</Text>
                                    </View>
                                    {p.id === post.hostId && (
                                        <View style={[styles.hostBadge, { backgroundColor: Colors.primary + '20' }]}>
                                            <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '800' }}>HOST</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                            {Array.from({ length: Math.max(0, post.maxGroupSize - participants.length) }).map((_, i) => (
                                isHost ? (
                                    <TouchableOpacity
                                        key={`empty-${i}`}
                                        style={[styles.participantItem, styles.emptySpot, { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' }]}
                                        onPress={() => setInviteModalVisible(true)}
                                    >
                                        <Ionicons name="person-add-outline" size={20} color={Colors.primary} />
                                        <Text style={{ color: Colors.primary, fontWeight: '700' }}>Invite People</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View key={`empty-${i}`} style={[styles.participantItem, styles.emptySpot, { borderColor: Colors.border }]}>
                                        <Ionicons name="add" size={20} color={Colors.textMuted} />
                                        <Text style={{ color: Colors.textMuted, fontWeight: '600' }}>Spot Available</Text>
                                    </View>
                                )
                            ))}
                        </View>
                    </View>

                    {/* Pending Invites Section */}
                    {postInvites.filter(i => i.status === 'pending').length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Invited</Text>
                            <View style={styles.participantList}>
                                {postInvites.filter(i => i.status === 'pending').map((invite) => (
                                    <View key={invite.id} style={[styles.participantItem, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, opacity: 0.7 }]}>
                                        <View style={[styles.pAvatar, { backgroundColor: Colors.backgroundElevated }]}>
                                            <Text style={{ fontSize: 16 }}>⏳</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.pName, { color: Colors.textPrimary }]}>{invite.inviteeName || 'User'}</Text>
                                            <Text style={{ color: Colors.textMuted, fontSize: 11 }}>Invite Sent</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* Bottom CTA */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: Colors.border, backgroundColor: Colors.background }]}>
                {isJoined ? (
                    isHost ? (
                        <TouchableOpacity
                            style={[styles.mainBtn, { backgroundColor: Colors.error }]}
                            onPress={handleDelete}
                        >
                            <Text style={styles.mainBtnText}>Cancel Dining Plan</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.mainBtn, { backgroundColor: Colors.error }]}
                            onPress={handleLeave}
                        >
                            <Text style={styles.mainBtnText}>Leave Dining Plan</Text>
                        </TouchableOpacity>
                    )
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.mainBtn,
                            { backgroundColor: hasPendingRequest ? Colors.warning : hasRejectedRequest ? Colors.error : Colors.primary },
                            (spotsLeft <= 0 && !hasPendingRequest && !hasRejectedRequest) && { backgroundColor: Colors.textMuted }
                        ]}
                        disabled={hasPendingRequest || hasRejectedRequest || (spotsLeft <= 0)}
                        onPress={handleJoin}
                    >
                        <Text style={styles.mainBtnText}>
                            {spotsLeft <= 0 ? 'Full' : hasPendingRequest ? 'Request Pending...' : hasRejectedRequest ? 'Request Rejected' : 'Request to Join'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* User Selection Modal (Invite Feature) */}
            <Modal
                visible={inviteModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setInviteModalVisible(false)}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { backgroundColor: Colors.background }]}>
                            <View style={styles.dragIndicator} />
                            <View style={[styles.modalHeader, { borderBottomColor: Colors.border }]}>
                                <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Invite People</Text>
                                <TouchableOpacity onPress={() => setInviteModalVisible(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.searchContainer}>
                                <Ionicons name="search" size={20} color={Colors.textMuted} />
                                <TextInput
                                    style={[styles.searchInput, { color: Colors.textPrimary }]}
                                    placeholder="Search by name or username..."
                                    placeholderTextColor={Colors.textMuted}
                                    value={inviteSearchQuery}
                                    onChangeText={setInviteSearchQuery}
                                />
                            </View>

                            <ScrollView style={styles.userList} contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
                                {Object.values(TEST_USERS)
                                    .map(t => t.user)
                                    .filter(u => u.id !== user?.id)
                                    .filter(u => !participants.some(p => p.id === u.id))
                                    .filter(u => u.name.toLowerCase().includes(inviteSearchQuery.toLowerCase()) || u.id.toLowerCase().includes(inviteSearchQuery.toLowerCase()))
                                    .map(u => {
                                        const isSelected = selectedUserIds.has(u.id);
                                        const isAlreadyInvited = postInvites.some(i => i.inviteeId === u.id && i.status !== 'rejected');

                                        return (
                                            <TouchableOpacity
                                                key={u.id}
                                                style={[styles.userItem, {
                                                    backgroundColor: isSelected ? Colors.primary + '08' : Colors.backgroundElevated,
                                                    borderColor: isSelected ? Colors.primary : Colors.border,
                                                    opacity: isAlreadyInvited ? 0.6 : 1
                                                }]}
                                                onPress={() => {
                                                    if (isAlreadyInvited) return;
                                                    const next = new Set(selectedUserIds);
                                                    if (isSelected) next.delete(u.id);
                                                    else next.add(u.id);
                                                    setSelectedUserIds(next);
                                                }}
                                                disabled={isAlreadyInvited}
                                            >
                                                <Image source={{ uri: u.photoURL || 'https://via.placeholder.com/100' }} style={styles.userItemAvatar} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.userItemName, { color: Colors.textPrimary }]}>{u.name}</Text>
                                                    <Text style={{ color: Colors.textMuted, fontSize: 13 }}>@{u.id}</Text>
                                                </View>

                                                {isAlreadyInvited ? (
                                                    <View style={[styles.invitedBadge, { backgroundColor: Colors.backgroundCard }]}>
                                                        <Text style={{ color: Colors.textMuted, fontSize: 12, fontWeight: '700' }}>Invited</Text>
                                                    </View>
                                                ) : (
                                                    <View style={[
                                                        styles.checkbox,
                                                        {
                                                            borderColor: isSelected ? Colors.primary : Colors.textMuted,
                                                            backgroundColor: isSelected ? Colors.primary : 'transparent'
                                                        }
                                                    ]}>
                                                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                                                    </View>
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                            </ScrollView>

                            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 20), borderTopColor: Colors.border, backgroundColor: Colors.background }]}>
                                <TouchableOpacity
                                    style={[styles.mainBtn, { flex: 1, backgroundColor: selectedUserIds.size > 0 ? Colors.primary : Colors.textMuted }]}
                                    disabled={selectedUserIds.size === 0}
                                    onPress={handleSendInvites}
                                >
                                    <Text style={styles.mainBtnText}>Send {selectedUserIds.size > 0 ? selectedUserIds.size : ''} Invite{selectedUserIds.size !== 1 ? 's' : ''}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={closeAlert}
                onConfirm={alertConfig.onConfirm ? () => { closeAlert(); alertConfig.onConfirm!(); } : undefined}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    heroContainer: { height: 350, width: '100%' },
    heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    headerActions: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
    circleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    heroContent: { position: 'absolute', bottom: 30, left: 20, right: 20 },
    cuisineRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    createGroupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginTop: 16, gap: 8 },
    createGroupText: { fontSize: 14, fontWeight: '700' },
    cuisineBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8 },
    cuisineText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
    heroTitle: { fontSize: 32, fontWeight: '900', color: '#FFF' },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    heroMetaText: { color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '600' },
    body: { padding: 24, paddingTop: 32, marginTop: -24, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
    card: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 24 },
    hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hostAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    hostName: { fontSize: 18, fontWeight: '800' },
    chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5 },
    detailsGrid: { gap: 14, marginBottom: 28 },
    detailItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 20, borderWidth: 1 },
    detailLabel: { fontSize: 12, fontWeight: '600' },
    detailValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },
    section: { marginBottom: 36 },
    sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 18 },
    descriptionText: { fontSize: 15, lineHeight: 24 },
    cuisineDesc: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: 16, marginTop: 16 },
    cuisineDescText: { flex: 1, fontSize: 14, fontStyle: 'italic' },
    participantList: { gap: 12 },
    participantItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, gap: 12 },
    pAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    pName: { fontSize: 15, fontWeight: '800' },
    hostBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    emptySpot: { borderStyle: 'dashed', borderWidth: 2, padding: 12, justifyContent: 'center', height: 60 },
    requestList: { gap: 12 },
    requestItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, justifyContent: 'space-between' },
    requesterInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    rAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    rName: { fontSize: 14, fontWeight: '800' },
    requestActions: { flexDirection: 'row', gap: 10 },
    actionIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, borderTopWidth: 1 },
    mainBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    errorText: { fontSize: 18, fontWeight: '700', marginTop: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { maxHeight: height * 0.85, flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
    dragIndicator: { width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(150,150,150,0.3)', alignSelf: 'center', marginTop: 12, marginBottom: -10 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16, borderBottomWidth: 1 },
    modalTitle: { fontSize: 22, fontWeight: '900' },
    closeBtn: { padding: 4 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 20, marginBottom: 0, paddingHorizontal: 16, height: 48, borderRadius: 24, backgroundColor: 'rgba(150,150,150,0.1)' },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500' },
    userList: { flex: 1 },
    userItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1.5, gap: 14 },
    userItemAvatar: { width: 48, height: 48, borderRadius: 24 },
    userItemName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    invitedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    modalFooter: { padding: 20, borderTopWidth: 1 }
});
