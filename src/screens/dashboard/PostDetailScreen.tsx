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

    // ── Info row component (realistic Material icons matching Figma) ──
    const InfoRow = ({ icon, label, children }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; children: React.ReactNode }) => (
        <View style={styles.infoRow}>
            <View style={styles.infoIconCol}>
                <MaterialCommunityIcons name={icon} size={20} color={'#ffb534'} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>{label}</Text>
                <View style={{ marginTop: 2 }}>{children}</View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: '#000000' }]}>
            {/* Shared brand bar — matches listing/dashboard top padding */}
            <BrandBar />

            {/* Header row (back, share, menu) */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={'#ffb534'} />
                    <Text style={styles.backText}>Event Details</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity onPress={() => handleDiningPlanShare(post)} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="share-outline" size={20} color={'#FFFFFF'} />
                    </TouchableOpacity>
                    {isHost && !isCompleted && (
                        <TouchableOpacity onPress={() => navigation.navigate('EditPost' as any, { postId: post.id })} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Svg width="18" height="18" viewBox="0 0 494.936 494.936" fill="#FFFFFF">
                                <Path d="M389.844,182.85c-6.743,0-12.21,5.467-12.21,12.21v222.968c0,23.562-19.174,42.735-42.736,42.735H67.157 c-23.562,0-42.736-19.174-42.736-42.735V150.285c0-23.562,19.174-42.735,42.736-42.735h267.741c6.743,0,12.21-5.467,12.21-12.21 s-5.467-12.21-12.21-12.21H67.157C30.126,83.13,0,113.255,0,150.285v267.743c0,37.029,30.126,67.155,67.157,67.155h267.741 c37.03,0,67.156-30.126,67.156-67.155V195.061C402.054,188.318,396.587,182.85,389.844,182.85z" fill="#FFFFFF" />
                                <Path d="M483.876,20.791c-14.72-14.72-38.669-14.714-53.377,0L221.352,229.944c-0.28,0.28-3.434,3.559-4.251,5.396l-28.963,65.069 c-2.057,4.619-1.056,10.027,2.521,13.6c2.337,2.336,5.461,3.576,8.639,3.576c1.675,0,3.362-0.346,4.96-1.057l65.07-28.963 c1.83-0.815,5.114-3.97,5.396-4.25L483.876,74.169c7.131-7.131,11.06-16.61,11.06-26.692 C494.936,37.396,491.007,27.915,483.876,20.791z M466.61,56.897L257.457,266.05c-0.035,0.036-0.055,0.078-0.089,0.107 l-33.989,15.131L238.51,247.3c0.03-0.036,0.071-0.055,0.107-0.09L447.765,38.058c5.038-5.039,13.819-5.033,18.846,0.005 c2.518,2.51,3.905,5.855,3.905,9.414C470.516,51.036,469.127,54.38,466.61,56.897z" fill="#FFFFFF" />
                            </Svg>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={styles.body}>
                    {/* Title + location */}
                    <Text style={styles.title}>{post.title}</Text>
                    <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color={'#938f99'} />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {(post.restaurantName || 'Restaurant') + ' • ' + post.area}
                        </Text>
                    </View>

                    {/* Host card */}
                    <View style={styles.hostCard}>
                        <TouchableOpacity onPress={() => navigation.navigate('UserProfile' as any, { userId: post.hostId })} style={styles.hostAvatarWrap}>
                            {hostParticipant.photoURL ? (
                                <Image source={{ uri: hostParticipant.photoURL }} style={styles.hostAvatar} />
                            ) : (
                                <View style={[styles.hostAvatar, { backgroundColor: Colors.backgroundElevated, justifyContent: 'center', alignItems: 'center' }]}>
                                    <Text style={{ fontSize: 28 }}>👤</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('UserProfile' as any, { userId: post.hostId })} style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.hostLabel}>HOSTED BY</Text>
                            <Text style={styles.hostName}>{hostParticipant.name || 'Host'}</Text>
                        </TouchableOpacity>
                        <View style={styles.ratingPill}>
                            <Svg width="14" height="13" viewBox="0 0 14 13" fill="none">
                                <Path d="M2.55 12.6667L3.63333 7.98333L0 4.83333L4.8 4.41667L6.66667 0L8.53333 4.41667L13.3333 4.83333L9.7 7.98333L10.7833 12.6667L6.66667 10.1833L2.55 12.6667Z" fill="#00FF41" />
                            </Svg>
                            <Text style={styles.ratingText}>{hostRating.toFixed(1)}</Text>
                        </View>
                    </View>

                    {/* Post-dining review prompt — shown only to joined participants on completed dining who haven't reviewed */}
                    {isCompleted && isJoined && !hasReviewed && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => navigation.navigate('DiningReview', { postId: post.id })}
                            style={[styles.reviewPrompt, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary }]}
                        >
                            <View style={[styles.reviewPromptIcon, { backgroundColor: Colors.primary }]}>
                                <Text style={{ fontSize: 18 }}>🍽️</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.reviewPromptTitle, { color: Colors.textPrimary }]}>How was your dining?</Text>
                                <Text style={[styles.reviewPromptSub, { color: Colors.textSecondary }]}>
                                    Share your experience and award Taste Points to the host.
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                        </TouchableOpacity>
                    )}

                    {/* Info list */}
                    <View style={styles.infoList}>
                        <InfoRow icon="calendar-blank-outline" label="DATE & TIME">
                            <Text style={styles.infoValue}>
                                {post.isImmediate ? 'Right Now! 🔥' : formatDate(post.dateTime)}
                            </Text>
                        </InfoRow>
                        <View style={styles.divider} />
                        <InfoRow icon="account-multiple-outline" label="PARTICIPANTS">
                            <Text style={styles.infoValue}>
                                {participants.length} / {post.maxGroupSize} joined
                            </Text>
                        </InfoRow>
                        <View style={styles.divider} />
                        <InfoRow icon="cash-multiple" label="BUDGET">
                            <Text style={styles.infoValue}>
                                ₹{BUDGET_LABELS[post.budgetRange]}
                            </Text>
                        </InfoRow>
                        <View style={styles.divider} />
                        <InfoRow icon="room-service-outline" label="CUISINES & DISHES">
                            <Text style={styles.infoValue}>
                                <Text style={{ fontWeight: 'bold' }}>{post.cuisineTypes.join(', ')}:</Text>
                                {(() => {
                                    const dishes = (post.foodItems && post.foodItems.length > 0)
                                        ? post.foodItems
                                        : (post.selectedFoodOptions || []).map(o => o.name);
                                    return dishes.length > 0 ? (
                                        <Text style={{ color: '#938f99', fontWeight: 'normal' }}>{` ${dishes.join(', ')}`}</Text>
                                    ) : null;
                                })()}
                            </Text>
                        </InfoRow>
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

                    {/* Meeting With */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Meeting With</Text>
                        <View style={styles.avatarRow}>
                            {participants.map((p) => {
                                const resolvedUser = p.id === user?.id
                                    ? user
                                    : Object.values(TEST_USERS).map(t => t.user).find(u => u.id === p.id);
                                const photo = resolvedUser?.photoURL || p.photoURL;
                                const name = resolvedUser?.name || p.name;
                                return (
                                    <TouchableOpacity key={p.id} onPress={() => navigation.navigate('UserProfile' as any, { userId: p.id })} style={styles.avatarSlot}>
                                        <View style={styles.participantAvatarWrap}>
                                            {photo ? (
                                                <Image source={{ uri: photo }} style={styles.participantAvatar} />
                                            ) : (
                                                <View style={[styles.participantAvatar, { backgroundColor: Colors.backgroundElevated, justifyContent: 'center', alignItems: 'center' }]}>
                                                    <Text style={{ fontSize: 22 }}>👤</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.avatarName} numberOfLines={1}>{name.split(' ')[0]}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            {Array.from({ length: Math.max(0, post.maxGroupSize - participants.length) }).map((_, i) => (
                                <View key={`empty-${i}`} style={styles.avatarSlot}>
                                    <View style={[styles.participantAvatarWrap, styles.waitingAvatar]}>
                                        <Ionicons name="person-add" size={22} color="#FFF" />
                                    </View>
                                    <Text style={styles.avatarName}>Waiting</Text>
                                </View>
                            ))}
                        </View>

                        {/* Create Group Chat button — visible to joined participants */}
                        {isJoined && participants.length >= 2 && (
                            <TouchableOpacity
                                style={[styles.createGroupBtn, { borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '10' }]}
                                onPress={handleCreateGroupChat}
                                disabled={creatingGroup}
                            >
                                <Ionicons name="chatbubbles" size={18} color={Colors.primary} />
                                <Text style={[styles.createGroupText, { color: Colors.primary }]}>
                                    {creatingGroup ? 'Creating...' : 'Create Group Chat'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* I prefer */}
                    {personalityTags.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>I prefer</Text>
                            <Text style={styles.hashtagText}>
                                {personalityTags.map(toHashtag).join(' ')}
                            </Text>
                        </View>
                    )}

                    {/* Others */}
                    {post.extras && post.extras.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Others</Text>
                            <View style={styles.othersRow}>
                                {post.extras.map((val, idx) => (
                                    <View key={`${val}-${idx}`} style={styles.otherChip}>
                                        <Text style={styles.otherChipText}>{formatExtraLabel(val)}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* About the Meal */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About the Meal</Text>
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
                    <View style={styles.ctaWrap}>
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
    backText: { fontSize: 14, fontWeight: '500', color: '#FFFFFF' },
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
    title: { fontSize: 25, fontWeight: 'bold', lineHeight: 28, letterSpacing: -0.5, color: '#FFFFFF' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    locationText: { fontSize: 12, fontWeight: 'normal', color: '#938f99', flexShrink: 1 },

    // Host card
    hostCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 22,
        paddingBottom: 8,
    },
    hostAvatarWrap: { width: 62, height: 62, borderRadius: 31, overflow: 'hidden', borderWidth: 1, borderColor: '#FFFFFF' },
    hostAvatar: { width: 60, height: 60, borderRadius: 30 },
    hostLabel: { fontSize: 12, fontWeight: '300', letterSpacing: 0.55, color: '#FFFFFF', textTransform: 'uppercase' },
    hostName: { fontSize: 16, fontWeight: 'bold', marginTop: 2, color: '#FFFFFF' },
    ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 3.3, backgroundColor: '#353534' },
    ratingText: { fontSize: 15, fontWeight: '700', color: '#EBFFE2', lineHeight: 19.7 },

    // Post-dining review prompt
    reviewPrompt: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        marginTop: 8,
        marginBottom: 6,
    },
    reviewPromptIcon: {
        width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center',
    },
    reviewPromptTitle: { fontSize: 15, fontWeight: '900' },
    reviewPromptSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },

    // Info list
    infoList: { marginTop: 4 },
    infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14 },
    infoIconCol: { width: 32, alignItems: 'flex-start', paddingTop: 2 },
    infoLabel: { fontSize: 12, fontWeight: 'normal', letterSpacing: 1, color: '#fff2dc', textTransform: 'uppercase' },
    infoValue: { fontSize: 16, fontWeight: 'bold', lineHeight: 26, color: '#FFFFFF' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', width: '100%', marginVertical: 0 },

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
    sectionTitle: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },

    // Avatar row (Meeting With)
    avatarRow: { flexDirection: 'row', gap: 18, marginTop: 16, flexWrap: 'wrap' },
    avatarSlot: { alignItems: 'center', width: 64 },
    participantAvatarWrap: { width: 62, height: 62, borderRadius: 31, overflow: 'hidden', borderWidth: 1, borderColor: '#FFFFFF', backgroundColor: '#353534' },
    participantAvatar: { width: 60, height: 60, borderRadius: 30 },
    waitingAvatar: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffb534' },
    avatarName: { fontSize: 12, fontWeight: '500', marginTop: 6, textAlign: 'center', color: '#FFFFFF' },

    // Create group chat button
    createGroupBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 18,
    },
    createGroupText: { fontSize: 14, fontWeight: '700' },

    // Hashtags
    hashtagText: { fontSize: 15, fontWeight: '300', marginTop: 14, lineHeight: 18, color: '#ffb534' },

    // Others chips
    othersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
    otherChip: { paddingVertical: 9, paddingHorizontal: 17, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(59,75,55,0.2)', backgroundColor: '#1c1b1b' },
    otherChipText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', color: '#FFFFFF' },

    // About the meal
    descriptionText: { fontSize: 12, lineHeight: 18, marginTop: 12, color: '#FFFFFF', opacity: 0.8, fontWeight: '300' },

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
