import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Alert, Modal, Share, TextInput, Clipboard, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BrandBar from '../../components/common/BrandBar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, User, ReportReason, DiningPost } from '../../types';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useReportStore } from '../../store/useReportStore';
import { useHostReputationStore } from '../../store/useHostReputationStore';
import { isCurrentlyPro } from '../../utils/authUtils';
import { showMessage } from 'react-native-flash-message';
import { TastePointsBadge } from '../../components/dining/TastePointsBadge';
import { TEST_USERS } from '../../data/testUsers';

const { width } = Dimensions.get('window');

const REPORT_REASONS: { label: string; value: ReportReason }[] = [
    { label: 'Spam', value: 'spam' },
    { label: 'Harassment', value: 'harassment' },
    { label: 'Fake Profile', value: 'fake_profile' },
    { label: 'Inappropriate Behavior', value: 'inappropriate' },
    { label: 'Other', value: 'other' },
];

const TASTE_POINT_OPTIONS: Array<{ value: 0 | 5 | 10 | 25; label: string; icon: string }> = [
    { value: 5, label: '5 pts', icon: '🥄' },
    { value: 10, label: '10 pts', icon: '👨‍🍳' },
    { value: 25, label: '25 pts', icon: '🏆' },
];

const MOCK_USERS: Record<string, Partial<User>> = {
    'swalih': {
        name: 'Swalih', bio: 'Food adventurer from Kerala. Big fan of Italian cuisine and coffee culture.',
        plan: 'pro', profession: 'Software Engineer', city: 'Bangalore',
        dietaryPreference: 'None', socialPreference: 'Casual & Networking',
        languagesSpoken: ['English', 'Hindi', 'Tamil'], favoriteCuisines: ['Italian', 'Mediterranean'],
        cuisineInterests: ['Italian', 'Mediterranean', 'Indian'], personalityTags: ['Foodie', 'Adventurous', 'Punctual'],
        reputationScore: 4.8, points: 520, followersCount: 12, followingCount: 8, isVerified: true,
        subscriptionExpiryDate: new Date(Date.now() + 30 * 86400000),
    },
    'roshan': {
        name: 'Roshan', bio: "Biryani connoisseur and weekend chef. Let's eat and vibe!",
        plan: 'pro', profession: 'Product Manager', city: 'Bangalore',
        dietaryPreference: 'None', socialPreference: 'Friend Hangout',
        languagesSpoken: ['English', 'Hindi', 'Malayalam'], favoriteCuisines: ['Indian', 'Thai'],
        cuisineInterests: ['Indian', 'Thai', 'American'], personalityTags: ['Chatty', 'Spontaneous', 'Foodie'],
        reputationScore: 4.5, points: 210, followersCount: 8, followingCount: 14, isVerified: true,
        subscriptionExpiryDate: new Date(Date.now() + 30 * 86400000),
    },
    'viknesh': {
        name: 'Viknesh', bio: 'Health-conscious foodie. Plant-based diet advocate and yoga enthusiast.',
        plan: 'free', profession: 'UX Designer', city: 'Bangalore',
        dietaryPreference: 'Vegan', socialPreference: 'Casual & Networking',
        languagesSpoken: ['English', 'Tamil'], favoriteCuisines: ['Vegan', 'Mediterranean'],
        cuisineInterests: ['Vegan', 'Mediterranean', 'Japanese'], personalityTags: ['Health-Conscious', 'Chill'],
        reputationScore: 4.7, points: 310, followersCount: 5, followingCount: 10, isVerified: true,
    },
    'don': {
        name: 'Don', bio: 'Sushi master in training. Love Japanese culture and fine dining.',
        plan: 'free', profession: 'Data Scientist', city: 'Bangalore',
        dietaryPreference: 'None', socialPreference: 'Business Lunch',
        languagesSpoken: ['English', 'Hindi'], favoriteCuisines: ['Japanese', 'Korean'],
        cuisineInterests: ['Japanese', 'Korean', 'Chinese'], personalityTags: ['Adventurous', 'Punctual'],
        reputationScore: 4.6, points: 180, followersCount: 7, followingCount: 6, isVerified: false,
    },
};

export default function UserProfileScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const { userId } = route.params;
    const { user: currentUser, toggleFollow, sendBuddyRequest, cancelBuddyRequest, blockUser } = useAuthStore();
    const { addReport } = useReportStore();
    const { posts } = usePostStore();
    const { addNotification } = useNotificationStore();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;

    const [menuVisible, setMenuVisible] = useState(false);
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportReason, setReportReason] = useState<ReportReason | null>(null);
    const [reportDescription, setReportDescription] = useState('');
    
    const [givePointsModalVisible, setGivePointsModalVisible] = useState(false);
    const [tastePoints, setTastePoints] = useState<0 | 5 | 10 | 25>(0);

    const { getReputation, awardTastePoints } = useHostReputationStore();

    const isMe = userId === currentUser?.id;
    const isFollowing = currentUser?.following?.includes(userId);
    const hasRequested = currentUser?.sentBuddyRequests?.includes(userId);
    const isBlocked = currentUser?.blockedUsers?.includes(userId);
    const hostRep = getReputation(userId);

    const mockData = MOCK_USERS[userId] || { name: 'Foodie Buddy', bio: 'Bite Buddy member.' };
    const userIsPro = isCurrentlyPro(isMe && currentUser ? currentUser : mockData as any);

    // Build the profile object — private fields stripped for non-owners
    const testUserObj = Object.values(TEST_USERS).find(u => u.user.id === userId);
    const user: Partial<User> = isMe && currentUser ? currentUser : {
        id: userId,
        name: mockData.name || 'User',
        bio: mockData.bio || 'Food enthusiast',
        photoURL: testUserObj?.user.photoURL || `https://i.pravatar.cc/150?u=${userId}`,
        profession: mockData.profession,
        city: mockData.city,
        cuisineInterests: mockData.cuisineInterests || [],
        personalityTags: mockData.personalityTags || [],
        favoriteCuisines: mockData.favoriteCuisines,
        dietaryPreference: mockData.dietaryPreference,
        socialPreference: mockData.socialPreference,
        languagesSpoken: mockData.languagesSpoken,
        reputationScore: mockData.reputationScore || 4.5,
        points: mockData.points || 100,
        followersCount: mockData.followersCount || 0,
        followingCount: mockData.followingCount || 0,
        isVerified: mockData.isVerified || false,
        plan: (mockData.plan as any) || 'free',
        subscriptionExpiryDate: mockData.subscriptionExpiryDate,
        // ── Private fields – intentionally omitted for non-owners ──
        email: undefined,
        phone: undefined,
        instagramId: undefined,
        facebookId: undefined,
        twitterId: undefined,
        whatsappNumber: undefined,
    };

    const userPosts = posts.filter(p => p.hostId === userId);

    const StatCard = ({ value, label, onPress }: { value: string | number; label: string; onPress?: () => void }) => (
        <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress}>
            <Text style={[styles.statValue, { color: Colors.textPrimary }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: Colors.textMuted }]}>{label}</Text>
        </TouchableOpacity>
    );

    const handleFollow = () => {
        if (!currentUser) return;
        if (isFollowing) {
            // Already buddies — prompt to un-buddy
            Alert.alert('Remove Buddy', `Are you sure you want to remove ${user.name} as a buddy?`, [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove', style: 'destructive', onPress: () => {
                        toggleFollow(userId);
                        showMessage({ message: 'Buddy Removed', type: 'info', icon: 'info' });
                    }
                }
            ]);
        } else if (hasRequested) {
            // Cancel pending request
            cancelBuddyRequest(userId);
            showMessage({ message: 'Request Cancelled', description: 'Buddy request withdrawn.', type: 'info', icon: 'info' });
        } else {
            // Send new buddy request
            sendBuddyRequest(userId);
            addNotification({
                userId: userId,
                type: 'follow_request',
                title: 'New Buddy Request',
                body: `${currentUser.name} wants to be your food buddy!`,
                data: { userId: currentUser.id }
            });
            showMessage({ message: 'Request Sent!', description: `Buddy request sent to ${user.name}.`, type: 'success', icon: 'success' });
        }
    };

    const handleShare = async () => {
        setMenuVisible(false);
        const shareUrl = `https://bitebuddy.app/profile/${userId}`;
        const shareMessage = `👤 Check out ${user.name}'s profile on Bite Buddy!\n${shareUrl}`;

        try {
            await Share.share({
                message: shareMessage,
                url: shareUrl
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleCopyLink = () => {
        setMenuVisible(false);
        const shareUrl = `https://bitebuddy.app/profile/${userId}`;
        Clipboard.setString(shareUrl);
        showMessage({
            message: 'Link Copied!',
            description: 'Profile link copied to clipboard.',
            type: 'success',
            icon: 'success'
        });
    };

    const handleBlock = () => {
        setMenuVisible(false);
        Alert.alert('Block User', `Are you sure you want to block ${user.name}? They will no longer be able to message you or see your plans.`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Block', style: 'destructive', onPress: () => {
                    blockUser(userId);
                    Alert.alert('Blocked', 'This user has been blocked.');
                    navigation.goBack();
                }
            }
        ]);
    };

    const handleSubmitReport = () => {
        if (!currentUser) return;
        if (!reportReason) {
            Alert.alert('Error', 'Please select a reason.');
            return;
        }
        addReport({
            reporterId: currentUser.id,
            reportedId: userId,
            reason: reportReason,
            description: reportDescription,
        });

        // Notify Reporter
        addNotification({
            userId: currentUser.id,
            type: 'report',
            title: 'Report Submitted',
            body: `You reported ${user.name}. Our team will review this shortly.`,
            data: { reportedId: userId }
        });

        // Notify Admin (Mock)
        addNotification({
            userId: 'admin_123',
            type: 'report',
            title: 'New User Report',
            body: `${currentUser.name} reported ${user.name} for ${reportReason}.`,
            data: { reporterId: currentUser.id, reportedId: userId }
        });

        setReportModalVisible(false);
        setReportReason(null);
        setReportDescription('');
        Alert.alert('Report Received', 'Thank you for helping keep our community safe.');
    };

    const handleGivePoints = () => {
        if (!currentUser || tastePoints === 0) return;
        awardTastePoints(userId, tastePoints, currentUser.id, currentUser.name || 'Food Buddy', 'profile_gift');
        
        addNotification({
            userId: userId,
            type: 'system',
            title: 'You got Taste Points! 🏆',
            body: `${currentUser.name} gave you ${tastePoints} points from your profile!`,
            data: { userId: currentUser.id }
        });
        
        setGivePointsModalVisible(false);
        setTastePoints(0);
        showMessage({ message: 'Points Awarded!', description: `You gave ${tastePoints} Taste Points to ${user.name}.`, type: 'success', icon: 'success' });
    };

    if (isBlocked) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', padding: 40 }]}>
                <Ionicons name="lock-closed" size={64} color={Colors.textMuted} />
                <Text style={[styles.userName, { color: Colors.textPrimary, marginTop: 20 }]}>User Blocked</Text>
                <Text style={[styles.bio, { color: Colors.textSecondary, marginBottom: 30 }]}>You have blocked this user.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.followBtn, { backgroundColor: Colors.primary, width: '100%', borderColor: Colors.primary }]}>
                    <Text style={{ color: '#FFF', fontWeight: '800' }}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <BrandBar />
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    {!isMe && (
                        <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard, justifyContent: 'center', alignItems: 'center' }} onPress={() => setMenuVisible(true)}>
                            <Ionicons name="ellipsis-vertical" size={20} color={Colors.textPrimary} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.profileCard, { backgroundColor: Colors.background, marginTop: 10 }]}>
                    <View style={[styles.avatarContainer, { marginTop: 0 }]}>
                        <View style={[styles.avatarBorder, { borderColor: Colors.background }]}>
                            {user?.photoURL ? (
                                <Image source={{ uri: user.photoURL }} style={styles.avatarImg} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.backgroundElevated }]}>
                                    <Text style={{ fontSize: 60 }}>👤</Text>
                                </View>
                            )}
                        </View>
                        {userIsPro && (
                            <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.proBadgeLarge}>
                                <Ionicons name="star" size={16} color="#FFF" />
                            </LinearGradient>
                        )}
                    </View>

                    <View style={styles.userInfo}>
                        <View style={styles.nameContainer}>
                            <Text style={[styles.userName, { color: Colors.textPrimary }]}>{user?.name}</Text>
                            {user?.isVerified && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
                        </View>
                        <View style={styles.badgeRow}>
                            <Text style={[styles.userHandle, { color: Colors.textMuted }]}>@{user?.name?.toLowerCase().replace(' ', '_')}</Text>
                        </View>
                        <Text style={[styles.bio, { color: Colors.textSecondary }]}>
                            {user?.bio}
                        </Text>
                    </View>

                    {
                        !isMe && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.followBtn,
                                    isFollowing
                                        ? { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }
                                        : hasRequested
                                            ? { backgroundColor: Colors.backgroundCard, borderColor: Colors.warning || '#F59E0B' }
                                            : { backgroundColor: Colors.primary, borderColor: Colors.primary }
                                    ]}
                                    onPress={handleFollow}
                                >
                                    <Text style={[styles.followBtnText,
                                    isFollowing
                                        ? { color: Colors.textPrimary }
                                        : hasRequested
                                            ? { color: Colors.warning || '#F59E0B' }
                                            : { color: '#FFF' }
                                    ]}>
                                        {isFollowing ? 'Buddy ✓' : hasRequested ? 'Requested ⏳' : 'Add Buddy'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.msgBtn, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                                    onPress={async () => {
                                        if (!currentUser) return;
                                        const { findConversationByParticipantId, sendChatRequest } = useChatStore.getState();
                                        const existing = findConversationByParticipantId(userId);

                                        if (existing) {
                                            navigation.navigate('ChatDetail', {
                                                chatId: existing.id,
                                                chatName: user.name || 'User',
                                                isGroup: false,
                                                chatAvatar: user.photoURL
                                            });
                                        } else {
                                            const newChatId = await sendChatRequest(
                                                { id: currentUser.id, name: currentUser.name || 'User', avatar: currentUser.photoURL },
                                                { id: userId, name: user.name || 'User', avatar: user.photoURL },
                                                'Hi! Let\'s be buddies!'
                                            );
                                            if (newChatId) {
                                                navigation.navigate('ChatDetail', {
                                                    chatId: newChatId,
                                                    chatName: user.name || 'User',
                                                    isGroup: false,
                                                    chatAvatar: user.photoURL
                                                });
                                            }
                                        }
                                    }}
                                >
                                    <Ionicons name="chatbubble-outline" size={20} color={Colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        )
                    }

                    <View style={[styles.statsRow, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, marginTop: 20 }]}>
                        <StatCard value={userPosts.length} label="Plans" />
                        <View style={[styles.vDivider, { backgroundColor: Colors.border }]} />
                        <StatCard value={(user?.followersCount || 0) + (user?.followingCount || 0)} label="Food Buddies" />
                    </View>
                </View >

                <View style={styles.content}>
                    <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>About</Text>
                    <View style={[styles.detailsGrid, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        {user.profession && <DetailItem icon="briefcase-outline" label="Profession" value={user.profession} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                        {user.city && <DetailItem icon="location-outline" label="City" value={user.city} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                        {user.dietaryPreference && <DetailItem icon="nutrition-outline" label="Dietary" value={user.dietaryPreference} color={Colors.success} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                        {user.socialPreference && <DetailItem icon="people-outline" label="Social Vibe" value={user.socialPreference} color={Colors.secondary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                        {user.languagesSpoken && user.languagesSpoken.length > 0 && (
                            <DetailItem icon="language-outline" label="Languages" value={user.languagesSpoken.join(', ')} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                        )}
                        {user.favoriteCuisines && user.favoriteCuisines.length > 0 && (
                            <DetailItem icon="restaurant-outline" label="Fav Cuisine" value={user.favoriteCuisines.join(', ')} color={Colors.primary} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />
                        )}
                    </View>

                    {/* Cuisine Interests */}
                    {user.cuisineInterests && user.cuisineInterests.length > 0 && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Cuisine Interests</Text>
                            <View style={styles.chipRow}>
                                {user.cuisineInterests.map(c => (
                                    <View key={c} style={[styles.chip, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
                                        <Text style={[styles.chipTxt, { color: Colors.primary }]}>{c}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Personality / Vibe */}
                    {user.personalityTags && user.personalityTags.length > 0 && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Vibe</Text>
                            <View style={styles.chipRow}>
                                {user.personalityTags.map(t => (
                                    <View key={t} style={[styles.chip, { backgroundColor: Colors.secondary + '15', borderColor: Colors.secondary + '30' }]}>
                                        <Text style={[styles.chipTxt, { color: Colors.secondary }]}>{t}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Host Reputation Card */}
                    <View style={{ marginTop: 20 }}>
                        <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Reputation & Taste Points</Text>
                        <TouchableOpacity
                            style={[styles.repCard, { borderColor: Colors.border }]}
                            onPress={isMe ? () => navigation.navigate('HostRewards' as any, { hostId: userId }) : undefined}
                            activeOpacity={isMe ? 0.85 : 1}
                        >
                            <LinearGradient colors={['#FF6B3512', '#6C63FF0A']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                            <View style={styles.repRow}>
                                <View style={{ flex: 1, gap: 6 }}>
                                    <TastePointsBadge points={hostRep.totalTastePoints} tier={hostRep.tier} size="md" showTier />
                                    <Text style={[styles.repStat, { color: Colors.textMuted }]}>
                                        ★ {hostRep.averageRating.toFixed(1)} avg · {hostRep.totalReviews} review{hostRep.totalReviews !== 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <View style={styles.repRight}>
                                    {hostRep.earnedBadges.slice(0, 2).map((b, i) => (
                                        <View key={i} style={[styles.miniChip, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
                                            <Text style={{ fontSize: 12 }}>🏅</Text>
                                            <Text style={[styles.miniChipTxt, { color: Colors.primary }]} numberOfLines={1}>{b}</Text>
                                        </View>
                                    ))}
                                    {isMe && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
                                    {!isMe && (
                                        <TouchableOpacity 
                                            style={{ backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 4 }}
                                            onPress={() => setGivePointsModalVisible(true)}
                                        >
                                            <Text style={{ color: '#000', fontWeight: '800', fontSize: 12 }}>+ Give Points</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Dining Plans */}
                    {userPosts.length > 0 && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>Hosted Dining</Text>
                            {[...userPosts]
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map((post: DiningPost) => {
                                    const isCurrent = post.status === 'open' && new Date(post.dateTime) > new Date();
                                    return (
                                        <TouchableOpacity
                                            key={post.id}
                                            style={[styles.postCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                                            onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                                            activeOpacity={0.75}
                                        >
                                            {post.imageURL && (
                                                <Image source={{ uri: post.imageURL }} style={styles.postImage} />
                                            )}
                                            <View style={styles.postInfo}>
                                                <View style={styles.postTopRow}>
                                                    <Text style={[styles.postTitle, { color: Colors.textPrimary }]} numberOfLines={1}>
                                                        {post.title}
                                                    </Text>
                                                    <View style={[styles.postTag, { backgroundColor: isCurrent ? '#22C55E18' : Colors.border + '60' }]}>
                                                        <View style={[styles.postTagDot, { backgroundColor: isCurrent ? '#22C55E' : Colors.textMuted }]} />
                                                        <Text style={[styles.postTagText, { color: isCurrent ? '#22C55E' : Colors.textMuted }]}>
                                                            {isCurrent ? 'Active' : 'Past'}
                                                        </Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.postMeta, { color: Colors.textMuted }]} numberOfLines={1}>
                                                    {post.cuisineTypes.join(', ')}
                                                </Text>
                                                <View style={styles.postBottomRow}>
                                                    <View style={styles.postMetaItem}>
                                                        <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
                                                        <Text style={[styles.postMetaText, { color: Colors.textMuted }]}>
                                                            {new Date(post.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.postMetaItem}>
                                                        <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
                                                        <Text style={[styles.postMetaText, { color: Colors.textMuted }]}>
                                                            {post.currentParticipants}/{post.maxGroupSize}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.postMetaItem}>
                                                        <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
                                                        <Text style={[styles.postMetaText, { color: Colors.textMuted }]} numberOfLines={1}>
                                                            {post.area}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })
                            }
                        </View>
                    )}

                    {/* Private info — only for profile owner */}
                    {isMe && currentUser && (
                        <View style={{ marginTop: 20 }}>
                            <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>
                                Private Information <Text style={{ fontSize: 12, color: Colors.textMuted }}>(Only you can see this)</Text>
                            </Text>
                            <View style={[styles.detailsGrid, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                                {currentUser.email && <DetailItem icon="mail-outline" label="Email" value={currentUser.email} color={Colors.warning} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                                {currentUser.phone && <DetailItem icon="call-outline" label="Phone" value={currentUser.phone} color={Colors.warning} textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                                {currentUser.instagramId && <DetailItem icon="logo-instagram" label="Instagram" value={`@${currentUser.instagramId}`} color="#E4405F" textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                                {currentUser.twitterId && <DetailItem icon="logo-twitter" label="Twitter / X" value={currentUser.twitterId} color="#1DA1F2" textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                                {currentUser.whatsappNumber && <DetailItem icon="logo-whatsapp" label="WhatsApp" value={currentUser.whatsappNumber} color="#25D366" textColor={Colors.textPrimary} mutedColor={Colors.textMuted} />}
                            </View>
                        </View>
                    )}
                </View>
                <View style={{ height: 60 }} />
            </ScrollView >

            <Modal visible={menuVisible} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
                    <View style={[styles.menuContainer, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        <View style={[styles.modalHandle, { backgroundColor: Colors.border }]} />
                        <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                            <Ionicons name="share-social-outline" size={20} color={Colors.textPrimary} />
                            <Text style={[styles.menuText, { color: Colors.textPrimary }]}>Share Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={handleCopyLink}>
                            <Ionicons name="copy-outline" size={20} color={Colors.textPrimary} />
                            <Text style={[styles.menuText, { color: Colors.textPrimary }]}>Copy Profile Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setReportModalVisible(true); }}>
                            <Ionicons name="flag-outline" size={20} color={Colors.error} />
                            <Text style={[styles.menuText, { color: Colors.error }]}>Report User</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={handleBlock}>
                            <Ionicons name="ban-outline" size={20} color={Colors.error} />
                            <Text style={[styles.menuText, { color: Colors.error }]}>Block User</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.cancelMenuBtn, { backgroundColor: Colors.backgroundElevated }]} onPress={() => setMenuVisible(false)}>
                            <Text style={[styles.cancelMenuText, { color: Colors.textPrimary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={reportModalVisible} transparent animationType="fade">
                <View style={styles.reportOverlay}>
                    <View style={[styles.reportContainer, { backgroundColor: Colors.backgroundCard }]}>
                        <Text style={[styles.reportTitle, { color: Colors.textPrimary }]}>Report User</Text>
                        <Text style={[styles.reportSub, { color: Colors.textMuted }]}>Select a reason for reporting {user.name}:</Text>

                        {REPORT_REASONS.map(r => (
                            <TouchableOpacity
                                key={r.value}
                                style={[styles.reasonItem, reportReason === r.value && { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' }, { borderColor: Colors.border }]}
                                onPress={() => setReportReason(r.value)}
                            >
                                <Text style={[styles.reasonText, { color: reportReason === r.value ? Colors.primary : Colors.textPrimary }]}>{r.label}</Text>
                                {reportReason === r.value && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
                            </TouchableOpacity>
                        ))}

                        <TextInput
                            style={[styles.reportInput, { backgroundColor: Colors.background, color: Colors.textPrimary, borderColor: Colors.border }]}
                            placeholder="Optional description..."
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            numberOfLines={3}
                            value={reportDescription}
                            onChangeText={setReportDescription}
                        />

                        <View style={styles.reportActions}>
                            <TouchableOpacity style={styles.reportCancel} onPress={() => setReportModalVisible(false)}>
                                <Text style={{ color: Colors.textMuted, fontWeight: '700' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.reportSubmit, { backgroundColor: Colors.primary }]} onPress={handleSubmitReport}>
                                <Text style={{ color: '#FFF', fontWeight: '800' }}>Submit Report</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={givePointsModalVisible} transparent animationType="fade">
                <View style={styles.reportOverlay}>
                    <View style={[styles.reportContainer, { backgroundColor: Colors.backgroundCard }]}>
                        <Text style={[styles.reportTitle, { color: Colors.textPrimary }]}>Give Taste Points</Text>
                        <Text style={[styles.reportSub, { color: Colors.textMuted }]}>Reward {user.name} for being a great Food Buddy!</Text>

                        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                            {TASTE_POINT_OPTIONS.map((opt) => {
                                const selected = tastePoints === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => setTastePoints(opt.value)}
                                        style={[{
                                            flex: 1, minWidth: 70, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 2, gap: 6,
                                            borderColor: selected ? Colors.primary : Colors.border,
                                            backgroundColor: selected ? Colors.primary + '18' : Colors.backgroundCard,
                                        }]}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: selected ? Colors.primary : Colors.textSecondary }}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.reportActions}>
                            <TouchableOpacity style={styles.reportCancel} onPress={() => { setGivePointsModalVisible(false); setTastePoints(0); }}>
                                <Text style={{ color: Colors.textMuted, fontWeight: '700' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.reportSubmit, { backgroundColor: tastePoints > 0 ? Colors.primary : Colors.border }]} onPress={handleGivePoints} disabled={tastePoints === 0}>
                                <Text style={{ color: tastePoints > 0 ? '#000' : Colors.textMuted, fontWeight: '800' }}>Give Points</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const DetailItem = ({ icon, label, value, color, textColor, mutedColor }: any) => (
    <View style={styles.detailRow}>
        <Ionicons name={icon} size={18} color={color} />
        <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: mutedColor }}>{label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{value || 'Not specified'}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    hero: { height: 180 },
    topActions: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
    circleBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
    profileCard: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 20 },
    avatarContainer: { alignSelf: 'center', marginTop: -65, position: 'relative' },
    avatarBorder: { width: 130, height: 130, borderRadius: 65, borderWidth: 6, overflow: 'hidden' },
    avatarImg: { width: '100%', height: '100%' },
    avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    proBadgeLarge: { position: 'absolute', bottom: 5, right: 5, width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    userInfo: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
    nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userName: { fontSize: 24, fontWeight: '900' },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    pBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    pBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
    userHandle: { fontSize: 14, fontWeight: '600' },
    bio: { fontSize: 12, fontWeight: '400', lineHeight: 18, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
    actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
    followBtn: { flex: 4, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    followBtnText: { fontWeight: '700', fontSize: 15 },
    msgBtn: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    statsRow: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 20, padding: 20, borderWidth: 1, alignItems: 'center' },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '900' },
    statLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 },
    vDivider: { width: 1, height: 30 },
    content: { padding: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '600', letterSpacing: 0.6, marginBottom: 16 },
    detailsGrid: { padding: 16, borderRadius: 24, borderWidth: 1, gap: 16 },
    detailRow: { flexDirection: 'row', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalHandle: { width: 40, height: 5, borderRadius: 2.5, alignSelf: 'center', marginBottom: 20 },
    menuContainer: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderWidth: 1 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
    menuText: { fontSize: 16, fontWeight: '700' },
    cancelMenuBtn: { height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    cancelMenuText: { fontSize: 16, fontWeight: '700' },
    reportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
    reportContainer: { borderRadius: 24, padding: 24 },
    reportTitle: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
    reportSub: { fontSize: 14, marginBottom: 20 },
    reasonItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
    reasonText: { fontSize: 15, fontWeight: '700' },
    reportInput: { borderRadius: 16, borderWidth: 1, padding: 16, height: 80, marginTop: 10, textAlignVertical: 'top' },
    reportActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
    reportCancel: { flex: 1, height: 50, justifyContent: 'center', alignItems: 'center' },
    reportSubmit: { flex: 2, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },
    chipTxt: { fontSize: 12, fontWeight: '700' },
    // ── Reputation Card ──
    repCard: { borderRadius: 20, borderWidth: 1, padding: 18, overflow: 'hidden' },
    repRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    repStat: { fontSize: 13, fontWeight: '600' },
    repRight: { alignItems: 'flex-end', gap: 6 },
    miniChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, maxWidth: 120 },
    miniChipTxt: { fontSize: 10, fontWeight: '700', flex: 1 },
    // ── Post Card Styles ──
    postCard: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
    postImage: { width: 90, height: 90, backgroundColor: '#E5E7EB' },
    postInfo: { flex: 1, padding: 12, justifyContent: 'center', gap: 4 },
    postTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    postTitle: { fontSize: 15, fontWeight: '800', flex: 1 },
    postTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    postTagDot: { width: 6, height: 6, borderRadius: 3 },
    postTagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
    postMeta: { fontSize: 12, fontWeight: '600' },
    postBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 },
    postMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    postMetaText: { fontSize: 11, fontWeight: '600' },
});
