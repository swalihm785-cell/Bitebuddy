import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { TEST_USERS } from '../data/testUsers';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    hasCompletedOnboarding: boolean;
    hasCompletedProfile: boolean;

    setUser: (user: User | null) => void;
    setLoading: (isLoading: boolean) => void;
    setOnboardingComplete: () => void;
    setProfileComplete: () => void;
    toggleFollow: (userId: string) => void;
    sendBuddyRequest: (userId: string) => void;
    cancelBuddyRequest: (userId: string) => void;
    acceptFollowRequest: (userId: string) => void;
    rejectFollowRequest: (userId: string) => void;
    upgradePlan: () => void;
    cancelSubscription: () => void;
    updateUser: (updates: Partial<User>) => void;
    blockUser: (userId: string) => void;
    unblockUser: (userId: string) => void;
    reportUser: (reportedId: string, reason: string, description?: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticated: true,
            isLoading: false,
            hasCompletedOnboarding: true,
            hasCompletedProfile: true,
            user: TEST_USERS['swalih@gmail.com'].user,

            setUser: (user) => set({
                user,
                isAuthenticated: !!user,
                isLoading: false,
            }),

            setLoading: (isLoading) => set({ isLoading }),

            setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

            setProfileComplete: () => set({ hasCompletedProfile: true }),

            toggleFollow: (userId) => set((state) => {
                if (!state.user) return state;
                const following = state.user.following || [];
                const followers = state.user.followers || [];
                const isFollowing = following.includes(userId);
                if (!isFollowing) return state; // Use sendBuddyRequest for adding
                const updatedFollowing = following.filter(id => id !== userId);
                const updatedFollowers = followers.filter(id => id !== userId);
                return {
                    user: {
                        ...state.user,
                        following: updatedFollowing,
                        followingCount: updatedFollowing.length,
                        followers: updatedFollowers,
                        followersCount: updatedFollowers.length,
                    }
                };
            }),

            sendBuddyRequest: (userId) => set((state) => {
                if (!state.user) return state;
                const sent = state.user.sentBuddyRequests || [];
                const following = state.user.following || [];
                if (sent.includes(userId)) return state;
                if (following.includes(userId)) return state;
                return {
                    user: {
                        ...state.user,
                        sentBuddyRequests: [...sent, userId]
                    }
                };
            }),

            cancelBuddyRequest: (userId) => set((state) => {
                if (!state.user) return state;
                return {
                    user: {
                        ...state.user,
                        sentBuddyRequests: (state.user.sentBuddyRequests || []).filter(id => id !== userId)
                    }
                };
            }),

            acceptFollowRequest: (userId) => set((state) => {
                if (!state.user) return state;
                const followers = state.user.followers || [];
                const following = state.user.following || [];
                const followRequests = state.user.followRequests || [];
                const sentBuddyRequests = state.user.sentBuddyRequests || [];
                const updatedFollowers = followers.includes(userId)
                    ? followers
                    : [...followers, userId];
                const updatedFollowing = following.includes(userId)
                    ? following
                    : [...following, userId];
                const updatedRequests = followRequests.filter(id => id !== userId);
                const updatedSent = sentBuddyRequests.filter(id => id !== userId);
                return {
                    user: {
                        ...state.user,
                        followers: updatedFollowers,
                        followersCount: updatedFollowers.length,
                        following: updatedFollowing,
                        followingCount: updatedFollowing.length,
                        followRequests: updatedRequests,
                        sentBuddyRequests: updatedSent,
                    }
                };
            }),

            rejectFollowRequest: (userId) => set((state) => {
                if (!state.user) return state;
                return {
                    user: {
                        ...state.user,
                        followRequests: (state.user.followRequests || []).filter(id => id !== userId)
                    }
                };
            }),

            upgradePlan: () => set((state) => {
                if (!state.user) return state;
                return {
                    user: {
                        ...state.user,
                        plan: 'pro',
                        isPremium: true,
                        subscriptionStatus: 'active',
                        subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                };
            }),

            cancelSubscription: () => set((state) => {
                if (!state.user) return state;
                return {
                    user: {
                        ...state.user,
                        subscriptionStatus: 'cancelled'
                    }
                };
            }),

            updateUser: (updates) => set((state) => {
                if (!state.user) return state;
                return { user: { ...state.user, ...updates } };
            }),

            blockUser: (userId) => set((state) => {
                if (!state.user) return state;
                const blocked = state.user.blockedUsers || [];
                if (blocked.includes(userId)) return state;
                const newFollowing = (state.user.following || []).filter(id => id !== userId);
                const newFollowers = (state.user.followers || []).filter(id => id !== userId);
                return {
                    user: {
                        ...state.user,
                        blockedUsers: [...blocked, userId],
                        following: newFollowing,
                        followers: newFollowers,
                        followingCount: newFollowing.length,
                        followersCount: newFollowers.length,
                    }
                };
            }),

            unblockUser: (userId) => set((state) => {
                if (!state.user) return state;
                return {
                    user: {
                        ...state.user,
                        blockedUsers: (state.user.blockedUsers || []).filter(id => id !== userId)
                    }
                };
            }),

            reportUser: (reportedId, reason, description) => {
                console.log(`[Report] User ${reportedId} reported for "${reason}": ${description}`);
            },

            logout: () => set({
                user: null,
                isAuthenticated: false,
            }),
        }),
        {
            name: 'bite-buddy-auth-v2',  // v2 forces reset of old persisted state
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
