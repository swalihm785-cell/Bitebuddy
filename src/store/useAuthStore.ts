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
                const isFollowing = state.user.following.includes(userId);
                const updatedFollowing = isFollowing
                    ? state.user.following.filter(id => id !== userId)
                    : [...state.user.following, userId];
                return {
                    user: {
                        ...state.user,
                        following: updatedFollowing,
                        followingCount: updatedFollowing.length
                    }
                };
            }),

            acceptFollowRequest: (userId) => set((state) => {
                if (!state.user) return state;
                const updatedFollowers = [...state.user.followers, userId];
                const updatedRequests = state.user.followRequests.filter(id => id !== userId);
                return {
                    user: {
                        ...state.user,
                        followers: updatedFollowers,
                        followersCount: updatedFollowers.length,
                        followRequests: updatedRequests
                    }
                };
            }),

            rejectFollowRequest: (userId) => set((state) => {
                if (!state.user) return state;
                return {
                    user: {
                        ...state.user,
                        followRequests: state.user.followRequests.filter(id => id !== userId)
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
                const newFollowing = state.user.following.filter(id => id !== userId);
                const newFollowers = state.user.followers.filter(id => id !== userId);
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
