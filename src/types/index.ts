export interface User {
    id: string;
    name: string;
    email?: string;
    phone?: string;
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
    createdAt: Date;
}

export interface Participant {
    id: string;
    name: string;
    age: number;
    gender?: string;
}

export interface GeoPoint {
    latitude: number;
    longitude: number;
}

export interface DiningPost {
    id: string;
    hostId: string;
    host?: User;
    title: string;
    cuisineTypes: string[];
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
    budgetRange: 'range1' | 'range2' | 'range3' | 'range4' | 'custom';
    budgetMin?: number;
    budgetMax?: number;
    participants: Participant[];
    visibility: 'public' | 'friends' | 'verified';
    status: 'open' | 'full' | 'expired' | 'cancelled';
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
    postId: string;
    reviewerId: string;
    revieweeId: string;
    isPunctual: number; // 1-5
    isFriendly: number; // 1-5
    foodCompatibility: number; // 1-5
    written?: string;
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
    type: 'join_request' | 'request_accepted' | 'new_message' | 'review' | 'event';
    title: string;
    body: string;
    data?: Record<string, string>;
    isRead: boolean;
    createdAt: Date;
}

export type RootStackParamList = {
    Splash: undefined;
    Onboarding: undefined;
    Login: undefined;
    SignUp: undefined;
    OTP: { phoneNumber: string };
    ProfileSetup: undefined;
    Main: undefined;
    PostDetail: { postId: string };
    ChatDetail: { chatId: string; chatName: string };
    EditProfile: undefined;
    CreatePost: undefined;
};

export type MainTabParamList = {
    Dashboard: undefined;
    Create: undefined;
    Messages: undefined;
    Profile: undefined;
    Notifications: undefined;
};
