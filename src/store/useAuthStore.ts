import { create } from 'zustand';
import { User } from '../types';

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
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    hasCompletedOnboarding: false,
    hasCompletedProfile: false,

    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        }),

    setLoading: (isLoading) => set({ isLoading }),

    setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

    setProfileComplete: () => set({ hasCompletedProfile: true }),

    logout: () =>
        set({
            user: null,
            isAuthenticated: false,
        }),
}));
