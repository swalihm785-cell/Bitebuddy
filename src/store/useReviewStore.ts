import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiningReview } from '../types';

interface ReviewState {
    reviews: DiningReview[];
    // Actions
    addReview: (review: DiningReview) => void;
    getReviewsForPost: (postId: string) => DiningReview[];
    getReviewsForHost: (hostId: string) => DiningReview[];
    hasUserReviewedPost: (postId: string, reviewerId: string) => boolean;
}

export const useReviewStore = create<ReviewState>()(
    persist(
        (set, get) => ({
            reviews: [],

            addReview: (review) =>
                set((state) => ({ reviews: [...state.reviews, review] })),

            getReviewsForPost: (postId) =>
                get().reviews.filter((r) => r.postId === postId),

            getReviewsForHost: (hostId) =>
                get().reviews.filter((r) => r.hostId === hostId),

            hasUserReviewedPost: (postId, reviewerId) =>
                get().reviews.some(
                    (r) => r.postId === postId && r.reviewerId === reviewerId
                ),
        }),
        {
            name: 'bite-buddy-reviews',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
