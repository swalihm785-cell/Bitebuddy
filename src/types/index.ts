export interface User {
    id: string;
    name: string;
    // ── Private fields (only visible to owner) ──
    email?: string;
    phone?: string;
    instagramId?: string;
    facebookId?: string;
    twitterId?: string;
    whatsappNumber?: string;
    // ── Public fields ──
    age?: number;
    gender?: string;
    bio?: string;
    photoURL?: string;
    cuisineInterests: string[];
    dietaryRestrictions: string[];
    personalityTags: string[];
    location?: GeoPoint;
    city?: string;
    reputationScore: number;
    badges: Badge[];
    points: number;
    isVerified: boolean;
    isPremium: boolean;
    role: 'user' | 'admin' | 'super_admin';
    plan: 'free' | 'pro';
    subscriptionStatus?: 'active' | 'expiring' | 'cancelled';
    subscriptionExpiryDate?: Date;
    profession?: string;
    interests?: string[];
    favoriteCuisines?: string[];
    dietaryPreference?: string;
    socialPreference?: string;
    languagesSpoken?: string[];
    followersCount: number;
    followingCount: number;
    followers: string[];
    following: string[];
    followRequests: string[];
    sentBuddyRequests: string[];
    blockedUsers: string[];
    createdAt: Date;
}

export interface Participant {
    id: string;
    name: string;
    age: number;
    gender?: string;
    photoURL?: string;
}

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

export interface FoodOption {
    name: string;
    imageUrl: string;
    priceRange: string;
    source: string;
}

export interface DiningPost {
    id: string;
    hostId: string;
    host?: User;
    title: string;
    cuisineTypes: string[];
    foodItems?: string[];
    selectedFoodOptions?: FoodOption[];
    cuisineDescription?: string;
    restaurantName?: string;
    restaurantAddress?: string;
    location?: GeoPoint;
    area: string;
    city: string;
    minGroupSize: number;
    maxGroupSize: number;
    currentParticipants: number;
    dateTime: Date;
    isImmediate: boolean;
    isUrgent?: boolean;
    extras?: string[];
    budgetRange: 'range1' | 'range2' | 'range3' | 'range4' | 'free' | 'custom';
    budgetMin?: number;
    budgetMax?: number;
    participants: Participant[];
    visibility: 'public' | 'friends' | 'verified';
    status: 'open' | 'full' | 'expired' | 'cancelled' | 'closed';
    description?: string;
    imageURL?: string;
    autoApprove: boolean;
    expiresAt: Date;
    createdAt: Date;
}

export interface JoinRequest {
    id: string;
    postId: string;
    requesterId: string;
    requester?: User;
    message?: string;
    status: 'pending' | 'accepted' | 'rejected' | 'waitlisted';
    createdAt: Date;
}

export interface Invite {
    id: string;
    postId: string;
    inviterId: string;
    inviteeId: string;
    inviteeName: string;
    inviteePhotoURL?: string;
    status: 'pending' | 'accepted' | 'rejected';
    note?: string;
    createdAt: Date;
}

export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    sender?: User;
    text?: string;
    imageURL?: string;
    locationShared?: GeoPoint;
    createdAt: Date;
}

export interface Chat {
    id: string;
    type: 'private' | 'group';
    postId?: string;
    participants: string[];
    lastMessage?: string;
    lastMessageAt?: Date;
    unreadCount?: number;
}

export interface Review {
    id: string;
    postId?: string; // Optional if it's a general restaurant review not tied to a dining plan
    reviewerId: string;
    revieweeId?: string; // Optional if it's a restaurant review
    restaurantName?: string;
    rating: number; // 1-5
    reviewText?: string;
    mediaUri?: string;
    likes: string[]; // user ids
    commentsCount: number;
    isPunctual?: number; // 1-5 (for user reviews)
    isFriendly?: number; // 1-5 (for user reviews)
    foodCompatibility?: number; // 1-5 (for user reviews)
    written?: string;
    createdAt: Date;
}

/** Post-dining review submitted by a participant after a dining event closes */
export interface DiningReview {
    id: string;
    postId: string;
    hostId: string;
    reviewerId: string;
    reviewerName: string;
    reviewerPhotoURL?: string;
    // Ratings (1–5)
    overallRating: number;
    foodQuality: number;
    atmosphere: number;
    hostExperience: number;
    // Optional content
    reviewText?: string;
    photoUrls?: string[];
    // Food-themed host appreciation
    tastePointsAwarded: 0 | 5 | 10 | 25;
    createdAt: Date;
}

/** Tier name based on total Taste Points */
export type HostTier = 'Sous Chef' | 'Chef' | 'Star Chef' | 'Elite Culinary Host';

export interface HostMilestone {
    points: number;
    title: string;
    icon: string;
    description: string;
    unlocked: boolean;
}

/** Per-host reputation object aggregated from all their dining events */
export interface HostReputation {
    hostId: string;
    totalTastePoints: number;
    tier: HostTier;
    earnedBadges: string[];
    milestones: HostMilestone[];
    recentAwards: { awardedBy: string; awardedByName: string; points: number; postId: string; createdAt: Date }[];
    averageRating: number;
    totalReviews: number;
}

export interface SocialPost {
    id: string;
    userId: string;
    content: string;
    mediaUri?: string;
    mediaType?: 'image' | 'video';
    location?: string;
    cuisine?: string;
    likes: string[]; // user ids
    commentsCount: number;
    createdAt: Date;
}

export interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: 'join_request' | 'request_accepted' | 'request_rejected' | 'participant_left' | 'new_message' | 'review' | 'event' | 'follow_request' | 'follow_accepted' | 'new_meal' | 'report' | 'welcome' | 'system' | 'invite_received' | 'invite_accepted' | 'invite_rejected' | 'review_request';
    title: string;
    body: string;
    data?: Record<string, string>;
    isRead: boolean;
    createdAt: Date;
}

export type ReportReason = 'spam' | 'harassment' | 'fake_profile' | 'inappropriate' | 'other';

export interface Report {
    id: string;
    reporterId: string;
    reportedId: string;
    reason: ReportReason;
    description?: string;
    status: 'pending' | 'reviewed' | 'resolved';
    createdAt: Date;
}

export type RootStackParamList = {
    Auth: undefined;
    Splash: undefined;
    Onboarding: undefined;
    Login: undefined;
    SignUp: undefined;
    OTP: { phoneNumber: string };
    ProfileSetup: undefined;
    Main: undefined;
    Profile: undefined;
    PostDetail: { postId: string };
    ChatList: undefined;
    ChatDetail: { chatId: string; chatName: string; isGroup?: boolean; chatAvatar?: string };
    EditProfile: undefined;
    CreatePost: undefined;
    EditPost: { postId: string };
    UserProfile: { userId: string };
    Settings: undefined;
    ProfileSettings: undefined;
    Notifications: undefined;
    Plan: undefined;
    ManageSubscription: undefined;
    SnapDetails: { snapId: string };
    FollowList: undefined;
    BlockedUsers: undefined;
    Offers: undefined;
    CreateGeneralPost: undefined;
    CreateReview: undefined;
    CreateMenu: undefined;
    Community: undefined;
    CreateGroupChat: undefined;
    // Post-dining features
    DiningReview: { postId: string };
    HostRewards: { hostId: string };
    ReviewSuccess: { hostId: string; postId: string };
};

export type MainTabParamList = {
    Dashboard: undefined;
    Community: undefined;
    Create: undefined;
    Messages: undefined;
    Snap: undefined;
};
