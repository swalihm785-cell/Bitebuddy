import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useChatStore, API_URL } from '../../store/useChatStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useReviewStore } from '../../store/useReviewStore';
import { useHostReputationStore } from '../../store/useHostReputationStore';
import { RootStackParamList, JoinRequest, Participant, User } from '../../types';
import { BUDGET_LABELS } from '../../theme/theme';
import { CustomAlert } from '../../components/common/CustomAlert';
import { isCurrentlyPro } from '../../utils/authUtils';
import { TEST_USERS } from '../../data/testUsers';
import { handleDiningPlanShare } from '../../utils/diningPlanShareUtils';
import { ClosedDiningReviews } from '../../components/dining/ClosedDiningReviews';
import BrandBar from '../../components/common/BrandBar';
import { TastePointsBadge } from '../../components/dining/TastePointsBadge';

// Map post.extras values to display labels (without emoji, uppercase per design)
const EXTRA_LABELS: Record<string, string> = {
    drinks_on_me: 'DRINKS ON ME',
    pick_up: "I'LL PICK YOU UP",
    drop_off: "I'LL DROP YOU",
    split_evenly: 'SPLIT EVENLY',
    go_dutch: 'GO DUTCH',
};

const formatExtraLabel = (val: string) => {
    if (EXTRA_LABELS[val]) return EXTRA_LABELS[val];
    // Custom extras: convert snake_case to UPPER CASE WITH SPACES
    return val.replace(/_/g, ' ').toUpperCase();
};

// Convert a personality tag like "Foodie" or "Health-Conscious" into a single hashtag token
const toHashtag = (tag: string) =>
    '#' + tag.toLowerCase().replace(/[^a-z0-9]/g, '');

export default function PostDetailScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const { postId } = route.params;
    const { user } = useAuthStore();
    const { posts, joinRequests, invites, updatePost, deletePost, addJoinRequest, updateJoinRequest, removeJoinRequest, leavePost } = usePostStore();
    const { addNotification } = useNotificationStore();
    const { createGroupChat, addGroupMember } = useChatStore();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const insets = useSafeAreaInsets();
    const { hasUserReviewedPost } = useReviewStore();
    const { getReputation } = useHostReputationStore();

    const [creatingGroup, setCreatingGroup] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'error' | 'info' | 'warning'; onConfirm?: () => void; confirmText?: string; cancelText?: string }>({ visible: false, title: '', message: '' });
    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', onConfirm?: () => void, confirmText = 'OK', cancelText?: string) =>
        setAlertConfig({ visible: true, title, message, type, onConfirm, confirmText, cancelText });
    const closeAlert = () => setAlertConfig(a => ({ ...a, visible: false }));

    const post = posts.find(p => p.id === postId);

    if (!post) {
        return (
            <View style={[styles.container, { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.textMuted} />
                <Text style={[styles.errorText, { color: Colors.textPrimary }]}>Post not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: Colors.primary, fontWeight: '700' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isHost = user?.id === post.hostId;
    const isJoined = post.participants.some(p => p.id === user?.id);
    const isPro = true;
    const myRequest = joinRequests.find(r => r.postId === postId && r.requesterId === user?.id);
    const hasPendingRequest = myRequest?.status === 'pending';
    const hasRejectedRequest = myRequest?.status === 'rejected';

    const postRequests = joinRequests.filter(r => r.postId === postId && r.status === 'pending');

    const hostUser: User | undefined = post.hostId === user?.id
        ? user
        : Object.values(TEST_USERS).map(t => t.user).find(u => u.id === post.hostId);
    
    const dbHostParticipant = post.participants.find(p => p.id === post.hostId);
    const hostParticipant: Participant = {
        id: post.hostId,
        name: hostUser?.name || dbHostParticipant?.name || 'Host',
        age: hostUser?.age || dbHostParticipant?.age || 25,
        gender: hostUser?.gender || dbHostParticipant?.gender,
        photoURL: hostUser?.photoURL || dbHostParticipant?.photoURL,
    };
    const participants = post.participants || [];
    const spotsLeft = post.maxGroupSize - participants.length;
    const personalityTags: string[] = hostUser?.personalityTags || [];

    // ── Dining status detection ──
    const postDateTime = post.dateTime instanceof Date ? post.dateTime : new Date(post.dateTime);
    const estimatedEndTime = new Date(postDateTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    const isCompleted = post.status === 'closed' || post.status === 'expired' || Date.now() > estimatedEndTime.getTime();
    const hasReviewed = user ? hasUserReviewedPost(post.id, user.id) : false;
    const isCancelled = post.status === 'cancelled';
    const hostReputation = getReputation(post.hostId);
    const hostRating = (hostReputation?.averageRating && hostReputation.averageRating > 0)
        ? hostReputation.averageRating
        : (hostUser?.reputationScore ?? 5.0);

    const formatDate = (date: any) => {
        const d = date instanceof Date ? date : new Date(date);
        if (isNaN(d.getTime())) return 'Time TBD';
        const day = d.getDate();
        const month = d.toLocaleString('en-US', { month: 'short' });
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12 || 12;
        return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
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
                    navigation.navigate('ChatList' as any);
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

    const handleCancelRequest = () => {
        if (!myRequest) return;
        showAlert(
            'Cancel Request',
            'Are you sure you want to cancel your request to join this meal?',
            'warning',
            () => {
                removeJoinRequest(myRequest.id);
                showAlert('Cancelled', 'Your request has been cancelled.', 'info');
            },
            'Cancel Request',
            'Keep Request'
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

    // ── Bottom CTA helpers ──
    // Post-dining state replaces Join/Cancel actions:
    //   - Participant who hasn't reviewed → "Rate Your Experience" (premium amber CTA)
    //   - Participant who has reviewed   → "Review Submitted" (disabled, success)
    //   - Non-participant after dining   → "Dining Completed" (disabled, muted)
    const ctaConfig = (() => {
        if (isCancelled) return { label: 'Plan Cancelled', disabled: true, color: Colors.textMuted, onPress: () => { } };
        if (isCompleted) {
            if (isJoined && !isHost && !hasReviewed) {
                return {
                    label: 'Rate Your Experience',
                    disabled: false,
                    color: Colors.primary,
                    onPress: () => navigation.navigate('DiningReview', { postId: post.id }),
                };
            }
            if (isJoined && !isHost && !hasReviewed) {
                return {
                    label: 'Rate Your Experience',
                    disabled: false,
                    color: Colors.primary,
                    onPress: () => navigation.navigate('DiningReview', { postId: post.id }),
                };
            }
            return null; // hide other CTA items (like rewards or submitted message)
        }
        if (isJoined) {
            if (isHost) return { label: 'Cancel Dining Plan', disabled: false, color: Colors.error, onPress: handleDelete };
            return { label: 'Leave Dining Plan', disabled: false, color: Colors.error, onPress: handleLeave };
        }
        if (hasPendingRequest) return { label: 'CANCEL REQUEST', disabled: false, color: Colors.error, onPress: handleCancelRequest };
        if (hasRejectedRequest) return { label: 'Request Rejected', disabled: true, color: Colors.error, onPress: () => { } };
        if (spotsLeft <= 0) return { label: 'Full', disabled: true, color: Colors.textMuted, onPress: () => { } };
        return { label: 'JOIN NOW', disabled: false, color: Colors.primary, onPress: handleJoin };
    })();


    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            {/* Shared brand bar — matches listing/dashboard top padding */}
            <BrandBar />

            {/* Header row (back, share, menu) */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    <Text style={[styles.backText, { color: Colors.textPrimary }]}>Back</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => handleDiningPlanShare(post)} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    {isHost && !isCompleted && (
                        <TouchableOpacity onPress={() => navigation.navigate('EditPost' as any, { postId: post.id })} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Svg width="18" height="18" viewBox="0 0 494.936 494.936" fill={Colors.textPrimary}>
                                <Path d="M389.844,182.85c-6.743,0-12.21,5.467-12.21,12.21v222.968c0,23.562-19.174,42.735-42.736,42.735H67.157 c-23.562,0-42.736-19.174-42.736-42.735V150.285c0-23.562,19.174-42.735,42.736-42.735h267.741c6.743,0,12.21-5.467,12.21-12.21 s-5.467-12.21-12.21-12.21H67.157C30.126,83.13,0,113.255,0,150.285v267.743c0,37.029,30.126,67.155,67.157,67.155h267.741 c37.03,0,67.156-30.126,67.156-67.155V195.061C402.054,188.318,396.587,182.85,389.844,182.85z" fill={Colors.textPrimary} />
                                <Path d="M483.876,20.791c-14.72-14.72-38.669-14.714-53.377,0L221.352,229.944c-0.28,0.28-3.434,3.559-4.251,5.396l-28.963,65.069 c-2.057,4.619-1.056,10.027,2.521,13.6c2.337,2.336,5.461,3.576,8.639,3.576c1.675,0,3.362-0.346,4.96-1.057l65.07-28.963 c1.83-0.815,5.114-3.97,5.396-4.25L483.876,74.169c7.131-7.131,11.06-16.61,11.06-26.692 C494.936,37.396,491.007,27.915,483.876,20.791z M466.61,56.897L257.457,266.05c-0.035,0.036-0.055,0.078-0.089,0.107 l-33.989,15.131L238.51,247.3c0.03-0.036,0.071-0.055,0.107-0.09L447.765,38.058c5.038-5.039,13.819-5.033,18.846,0.005 c2.518,2.51,3.905,5.855,3.905,9.414C470.516,51.036,469.127,54.38,466.61,56.897z" fill={Colors.textPrimary} />
                            </Svg>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
                <View style={styles.body}>
                    {/* Title + location */}
                    <Text style={[styles.title, { color: Colors.textPrimary }]}>{post.title}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color={Colors.textMuted} />
                        <Text style={[styles.locationText, { color: Colors.textMuted }]} numberOfLines={1}>
                            {(post.restaurantName || 'Restaurant') + ' • ' + post.area}
                        </Text>
                    </View>


                    {/* Post-dining review prompt — flat row, no card border */}
                    {isCompleted && isJoined && !hasReviewed && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('DiningReview', { postId: post.id })}
                            style={styles.reviewPrompt}
                        >
                            <View style={styles.reviewPromptIcon}>
                                <Svg width={45} height={42} viewBox="0 0 45 42" fill="none">
                                    <Path d="M0 40.787C0.468274 39.9322 1.31865 40.4461 2.04282 40.1809L5.12577 33.3241H3.4755V22.9107C4.26582 22.8428 5.05962 23.3959 5.19192 24.1899C5.51397 26.1125 4.97693 28.7779 5.2102 30.7666C5.26068 31.1945 5.62103 31.5423 6.03534 31.591C8.09557 31.8354 10.5823 31.3727 12.6878 31.6275C13.4772 31.8493 13.9577 32.5058 13.8994 33.325H13.0299V40.267H18.2418C18.2192 39.5765 18.1426 38.8365 18.912 38.5495C20.9139 38.6556 23.1813 38.346 25.1528 38.5269C26.1276 38.6165 26.1024 39.4843 26.0606 40.267H31.2725V33.3241H30.403C30.3368 32.5519 30.8364 31.7867 31.6146 31.6267C33.4494 31.2501 36.3095 31.8223 38.267 31.5901C38.6813 31.5414 39.0417 31.1936 39.0922 30.7658C39.3263 28.777 38.7884 26.1117 39.1104 24.189C39.2471 23.3716 40.0191 22.8472 40.8269 22.9098V33.3232H39.1766L42.2595 40.18C42.6112 40.4922 43.9002 39.9 44.2362 40.7218C44.4799 41.3192 44.144 41.667 43.694 42.001H0V40.7861V40.787ZM11.2934 33.3241H6.95012L3.99687 40.267H11.2943V33.3241H11.2934ZM37.354 33.3241H33.0107V40.267H40.3081L37.3549 33.3241H37.354Z" fill="#FFB534" />
                                    <Path d="M33.011 29.4188H11.2937V27.7265C11.2937 27.0709 12.279 26.1047 12.9213 25.9682C19.0759 25.803 25.301 25.7639 31.4504 25.9882C32.0649 26.143 33.011 27.0926 33.011 27.7265V29.4188Z" fill="#FFB534" />
                                    <Path d="M18.8251 4.70479C20.0855 4.41695 19.8914 5.5283 20.0924 6.26572C20.2935 7.00314 21.0586 7.79099 21.8202 8.011C22.4181 8.18405 23.3956 8.02057 23.46 8.89625C23.5427 10.0328 22.3372 9.80324 21.6583 10.0502C20.9794 10.2972 20.4197 10.8668 20.1742 11.5181C19.9288 12.1694 20.0916 13.3303 19.1541 13.3703C18.1236 13.4138 18.2924 12.1103 18.0261 11.4555C17.7598 10.8007 17.1574 10.2459 16.5038 10.0259C15.8501 9.80585 14.8335 10.0267 14.7638 9.06756C14.6846 7.97883 15.9337 8.19449 16.6517 7.91187C17.2689 7.66925 17.9138 6.96922 18.1131 6.33442C18.2863 5.78222 18.1036 4.87001 18.8269 4.70479H18.8251Z" fill="#FFB534" />
                                    <Path d="M35.3305 5.57268C36.5908 5.28484 36.3967 6.39619 36.5978 7.13361C36.7989 7.87103 37.5639 8.65888 38.3255 8.87889C38.9235 9.05194 39.901 8.88846 39.9654 9.76414C40.048 10.9007 38.8425 10.6711 38.1636 10.9181C37.4847 11.1651 36.9251 11.7346 36.6796 12.386C36.4342 13.0373 36.5969 14.1982 35.6595 14.2382C34.629 14.2817 34.7978 12.9782 34.5315 12.3234C34.2651 11.6686 33.6628 11.1138 33.0091 10.8937C32.3555 10.6737 31.3389 10.8946 31.2692 9.93545C31.19 8.84672 32.439 9.06238 33.1571 8.77976C33.7742 8.53714 34.4192 7.83711 34.6185 7.20231C34.7917 6.65011 34.6089 5.7379 35.3322 5.57268H35.3305Z" fill="#FFB534" />
                                    <Path d="M26.8432 24.2125H17.4612C17.8511 22.3733 19.4553 21.1245 21.2448 20.7462C21.4493 19.9358 20.8192 17.9288 22.11 17.8705C23.4965 17.8087 22.8594 19.934 23.0587 20.7462C24.8561 21.1184 26.4463 22.3707 26.8423 24.2125H26.8432Z" fill="#FFB534" />
                                    <Path opacity="0.3" d="M7.36112 10.3476C10.1777 9.865 10.9411 13.7373 8.51266 14.5347C5.57071 15.5017 4.50099 10.8372 7.36112 10.3476Z" fill="#FFB534" />
                                    <Path opacity="0.3" d="M30.9917 0.0228827C33.71 -0.33974 34.1373 3.72824 31.6567 4.07086C28.7539 4.47175 28.3831 0.370722 30.9917 0.0228827Z" fill="#FFB534" />
                                    <Path opacity="0.3" d="M23.0205 30.8945H21.2832V36.9695H23.0205V30.8945Z" fill="#FFB534" />
                                </Svg>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.reviewPromptTitle}>How was your dining?</Text>
                                <Text style={styles.reviewPromptSub}>
                                    Share your experience and award Taste Points to the host.
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    )}
                    {/* Divider below review prompt */}
                    {isCompleted && isJoined && !hasReviewed && (
                        <View style={styles.reviewPromptDivider} />
                    )}

                    {/* Info list */}
                    <View style={styles.infoList}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconCol}>
                                <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={'#ffb534'} />
                            </View>
                            <Text style={[styles.infoValue, { color: Colors.textPrimary }]}>
                                {post.isImmediate ? 'Right Now! 🔥' : formatDate(post.dateTime)}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconCol}>
                                <MaterialCommunityIcons name="cash-multiple" size={20} color={'#ffb534'} />
                            </View>
                            <Text style={[styles.infoValue, { color: Colors.textPrimary }]}>
                                ₹{BUDGET_LABELS[post.budgetRange]}
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconCol}>
                                <MaterialCommunityIcons name="room-service-outline" size={20} color={'#ffb534'} />
                            </View>
                            <Text style={[styles.infoValue, { color: Colors.textPrimary }]}>
                                <Text style={{ fontWeight: 'bold' }}>{post.cuisineTypes.join(', ')}:</Text>
                                {(() => {
                                    const dishes = (post.foodItems && post.foodItems.length > 0)
                                        ? post.foodItems
                                        : (post.selectedFoodOptions || []).map(o => o.name);
                                    return dishes.length > 0 ? (
                                        <Text style={{ color: Colors.textMuted, fontWeight: 'normal' }}>{` ${dishes.join(', ')}`}</Text>
                                    ) : null;
                                })()}
                            </Text>
                        </View>
                    </View>

                    {/* Join Request Status Banner */}
                    {!isHost && myRequest && (
                        <View style={[styles.banner, {
                            backgroundColor: myRequest.status === 'pending' ? Colors.warning + '12' : myRequest.status === 'accepted' ? Colors.success + '12' : Colors.error + '12',
                            borderColor: myRequest.status === 'pending' ? Colors.warning : myRequest.status === 'accepted' ? Colors.success : Colors.error,
                        }]}>
                            <Ionicons
                                name={myRequest.status === 'pending' ? 'hourglass-outline' : myRequest.status === 'accepted' ? 'checkmark-circle' : 'close-circle'}
                                size={20}
                                color={myRequest.status === 'pending' ? Colors.warning : myRequest.status === 'accepted' ? Colors.success : Colors.error}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: myRequest.status === 'pending' ? Colors.warning : myRequest.status === 'accepted' ? Colors.success : Colors.error }}>
                                    {myRequest.status === 'pending' ? 'Request Pending' : myRequest.status === 'accepted' ? 'Request Accepted!' : 'Request Declined'}
                                </Text>
                                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 2 }}>
                                    {myRequest.status === 'pending'
                                        ? 'Waiting for the host to review your request.'
                                        : myRequest.status === 'accepted'
                                            ? 'You have been approved to join this meal!'
                                            : 'The host did not accept your request this time.'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Host: pending requests */}
                    {isHost && postRequests.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Pending Requests ({postRequests.length})</Text>
                            <View style={{ gap: 12, marginTop: 14 }}>
                                {postRequests.map((req) => (
                                    <View key={req.id} style={[styles.requestItem, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                                        <TouchableOpacity
                                            style={styles.requesterInfo}
                                            onPress={() => navigation.navigate('UserProfile' as any, { userId: req.requesterId })}
                                        >
                                            <View style={[styles.rAvatar, { backgroundColor: Colors.backgroundCard, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }]}>
                                                {(() => {
                                                    const reqUser = req.requesterId === user?.id
                                                        ? user
                                                        : Object.values(TEST_USERS).map(t => t.user).find(u => u.id === req.requesterId);
                                                    const photo = reqUser?.photoURL || req.requester?.photoURL;
                                                    return photo ? (
                                                        <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} />
                                                    ) : (
                                                        <Text style={{ fontSize: 14 }}>👤</Text>
                                                    );
                                                })()}
                                            </View>
                                            <Text style={[styles.rName, { color: Colors.textPrimary }]}>{req.requester?.name || 'User'}</Text>
                                        </TouchableOpacity>
                                        <View style={styles.requestActions}>
                                            <TouchableOpacity
                                                onPress={() => handleRequestAction(req.id, 'rejected')}
                                                style={[styles.actionIcon, { backgroundColor: Colors.error + '20' }]}
                                            >
                                                <Ionicons name="close" size={18} color={Colors.error} />
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => handleRequestAction(req.id, 'accepted')}
                                                style={[styles.actionIcon, { backgroundColor: Colors.success + '20' }]}
                                            >
                                                <Ionicons name="checkmark" size={18} color={Colors.success} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* HOSTED BY section */}
                    <View style={styles.hostedBySection}>
                        <Text style={[styles.hostedByLabel, { color: Colors.textMuted }]}>HOSTED BY</Text>
                        <View style={styles.hostRow}>
                            <TouchableOpacity onPress={() => navigation.navigate('UserProfile' as any, { userId: post.hostId })} style={[styles.hostAvatarWrap, { borderColor: Colors.border }]}>
                                {hostParticipant.photoURL ? (
                                    <Image source={{ uri: hostParticipant.photoURL }} style={styles.hostAvatar} />
                                ) : (
                                    <View style={[styles.hostAvatar, { backgroundColor: Colors.backgroundElevated, justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ fontSize: 24 }}>👤</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            <View style={styles.hostMetaCol}>
                                <TouchableOpacity onPress={() => navigation.navigate('UserProfile' as any, { userId: post.hostId })}>
                                    <Text style={[styles.hostName, { color: Colors.textPrimary }]}>{hostParticipant.name || 'Host'}</Text>
                                </TouchableOpacity>
                                <View style={styles.hostRepRow}>
                                    <View style={[styles.ratingPill, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.15)' }]}>
                                        <Ionicons name="star" size={12} color="#FFFFFF" />
                                        <Text style={[styles.ratingText, { color: '#FFFFFF' }]}>{hostRating.toFixed(1)}</Text>
                                    </View>
                                    <TastePointsBadge points={hostReputation?.totalTastePoints ?? hostUser?.points ?? 100} tier={hostReputation?.tier} size="sm" showTier={false} />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* MEET WITH section */}
                    <View style={styles.meetWithSection}>
                        <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Meet With</Text>
                        <View style={styles.avatarRow}>
                            {/* Other participants (excluding host) */}
                            {participants.filter(p => p.id !== post.hostId).map((p) => {
                                const resolvedUser = p.id === user?.id
                                    ? user
                                    : Object.values(TEST_USERS).map(t => t.user).find(u => u.id === p.id);
                                const photo = resolvedUser?.photoURL || p.photoURL;
                                const name = resolvedUser?.name || p.name;
                                return (
                                    <TouchableOpacity key={p.id} onPress={() => navigation.navigate('UserProfile' as any, { userId: p.id })} style={styles.avatarSlot}>
                                        <View style={[styles.participantAvatarWrap, { borderColor: Colors.border, borderWidth: 2 }]}>
                                            {photo ? (
                                                <Image source={{ uri: photo }} style={styles.participantAvatar} />
                                            ) : (
                                                <View style={[styles.participantAvatar, { backgroundColor: Colors.backgroundElevated, justifyContent: 'center', alignItems: 'center' }]}>
                                                    <Text style={{ fontSize: 22 }}>👤</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.avatarName, { color: Colors.textPrimary }]} numberOfLines={1}>{name.split(' ')[0]}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            {/* Waiting slots */}
                            {Array.from({ length: Math.max(0, post.maxGroupSize - participants.length) }).map((_, i) => (
                                <View key={`empty-${i}`} style={styles.avatarSlot}>
                                    <View style={[styles.participantAvatarWrap, styles.waitingAvatar]}>
                                        <Ionicons name="person-add" size={22} color="#888" />
                                    </View>
                                    <Text style={[styles.avatarName, { color: Colors.textMuted }]}>Waiting</Text>
                                </View>
                            ))}
                        </View>

                        {/* Create Group Chat button — full-width solid yellow, visible to joined participants */}
                        {isJoined && participants.length >= 2 && (
                            <TouchableOpacity
                                style={styles.createGroupBtn}
                                onPress={handleCreateGroupChat}
                                disabled={creatingGroup}
                            >
                                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                                    <Path d="M17.5 12.5C17.5 13.4205 16.7538 14.1667 15.8333 14.1667H5.83333L2.5 17.5V4.16667C2.5 3.24619 3.24619 2.5 4.16667 2.5H15.8333C16.7538 2.5 17.5 3.24619 17.5 4.16667V12.5Z" fill="black"/>
                                </Svg>
                                <Text style={styles.createGroupText}>
                                    {creatingGroup ? 'Creating...' : 'Create Group Chat'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* I prefer */}
                    {personalityTags.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>I prefer</Text>
                            <Text style={styles.hashtagText}>
                                {personalityTags.map(toHashtag).join('  ')}
                            </Text>
                        </View>
                    )}

                    {/* Others */}
                    {post.extras && post.extras.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Others</Text>
                            <View style={styles.othersRow}>
                                {post.extras.map((val, idx) => (
                                    <View key={`${val}-${idx}`} style={[styles.otherChip, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                                        <Text style={[styles.otherChipText, { color: Colors.textPrimary }]}>{formatExtraLabel(val)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* About the Meal */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>About the Meal</Text>
                        <Text style={styles.descriptionText}>
                            {post.description || 'No additional details provided by the host.'}
                        </Text>
                        {post.cuisineDescription ? (
                            <Text style={[styles.descriptionText, { marginTop: 12, fontStyle: 'italic' }]}>
                                {post.cuisineDescription}
                            </Text>
                        ) : null}
                    </View>

                    {/* Closed Dining Reviews — only for completed dining */}
                    {isCompleted && <ClosedDiningReviews postId={post.id} />}
                </View>
            </ScrollView>

            {/* Bottom CTA + Tab bar */}
            <View style={[styles.footer, { backgroundColor: Colors.background }]}>
                {ctaConfig && (
                    <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
                        <TouchableOpacity
                            style={[styles.mainBtn, { backgroundColor: ctaConfig.color, opacity: ctaConfig.disabled ? 0.7 : 1 }]}
                            disabled={ctaConfig.disabled}
                            onPress={ctaConfig.onPress}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.mainBtnText}>{ctaConfig.label}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

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


    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 4,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    backText: { fontSize: 14, fontWeight: '500' },
    iconBtn: { padding: 6 },
    menuPopover: {
        position: 'absolute',
        top: 36,
        right: 0,
        minWidth: 160,
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 6,
        zIndex: 20,
        elevation: 8,
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
    menuItemText: { fontSize: 14, fontWeight: '600' },

    // Body
    body: { paddingHorizontal: 12, paddingTop: 8 },

    // Title + location
    title: { fontSize: 25, fontWeight: 'bold', lineHeight: 28, letterSpacing: -0.5 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    locationText: { fontSize: 12, fontWeight: 'normal', flexShrink: 1 },

    // Host card
    hostCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 22,
        paddingBottom: 8,
    },
    hostAvatarWrap: { width: 62, height: 62, borderRadius: 31, overflow: 'hidden', borderWidth: 1 },
    hostAvatar: { width: 60, height: 60, borderRadius: 30 },
    hostName: { fontSize: 16, fontWeight: 'bold' },

    // Post-dining review prompt — flat, no card border
    reviewPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        paddingHorizontal: 0,
        marginTop: 20,
    },
    reviewPromptDivider: {
        height: 1,
        backgroundColor: 'rgba(128,128,128,0.2)',
        marginBottom: 4,
    },
    reviewPromptIcon: {
        width: 52, height: 48,
        justifyContent: 'center', alignItems: 'center',
    },
    reviewPromptTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: 20,
    },
    reviewPromptSub: {
        fontSize: 12,
        fontWeight: '400',
        color: '#9CA3AF',
        lineHeight: 15,
        marginTop: 2,
    },

    // Info list
    infoList: { marginTop: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    infoIconCol: { width: 32, alignItems: 'flex-start' },
    infoValue: { fontSize: 16, fontWeight: 'bold', lineHeight: 26, flex: 1 },
    divider: { height: 1, backgroundColor: 'rgba(128,128,128,0.15)', width: '100%', marginVertical: 0 },

    // Banner
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginTop: 18,
    },

    // Section
    section: { marginTop: 28 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '500',
        color: '#FFFFFF',
        lineHeight: 28,
    },

    // HOSTED BY section
    hostedBySection: { marginTop: 20 },
    hostedByLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
    hostRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    hostMetaCol: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'center',
        gap: 6,
    },
    hostRepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ratingPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // MEET WITH section
    meetWithSection: { marginTop: 24 },

    // Avatar row (HOSTED BY)
    avatarRow: { flexDirection: 'row', gap: 14, marginTop: 12, flexWrap: 'wrap' },
    avatarSlot: { alignItems: 'center', width: 60 },
    participantAvatarWrap: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden' },
    participantAvatar: { width: 58, height: 58, borderRadius: 29 },
    waitingAvatar: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#2A2A2A', borderWidth: 2, borderColor: '#444', borderStyle: 'dashed' },
    avatarName: { fontSize: 12, fontWeight: '500', marginTop: 6, textAlign: 'center' },

    // Create group chat button — full-width solid yellow pill
    createGroupBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 17, borderRadius: 10, marginTop: 20,
        backgroundColor: '#FFB534',
    },
    createGroupText: { fontSize: 15, fontWeight: '700', color: '#000' },

    // Hashtags
    hashtagText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 14,
        lineHeight: 24,
        color: '#FFB800',
        fontFamily: 'System',
    },

    // Others chips
    othersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
    otherChip: { paddingVertical: 9, paddingHorizontal: 17, borderRadius: 4, borderWidth: 1 },
    otherChipText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },

    // About the meal
    descriptionText: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 26,
        color: '#9CA3AF',
        marginTop: 12,
        fontFamily: 'System',
    },

    // Pending request items (host)
    requestItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, justifyContent: 'space-between' },
    requesterInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    rAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    rName: { fontSize: 14, fontWeight: '800' },
    requestActions: { flexDirection: 'row', gap: 8 },
    actionIcon: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },

    // Footer
    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
    },
    ctaWrap: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 36 },
    mainBtn: { height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffb534' },
    mainBtnText: { color: '#000000', fontSize: 16, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },

    errorText: { fontSize: 18, fontWeight: '700', marginTop: 20 },
});
