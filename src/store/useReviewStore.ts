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

const SEED_REVIEWS: DiningReview[] = [
    {
        id: 'rev_1',
        postId: 'plan_closed_1',
        hostId: 'swalih',
        reviewerId: 'roshan',
        reviewerName: 'Roshan',
        overallRating: 5,
        foodQuality: 5,
        atmosphere: 4,
        hostExperience: 5,
        reviewText: 'Amazing biryani and great host!',
        tastePointsAwarded: 25,
        createdAt: new Date()
    },
    {
        id: 'rev_2',
        postId: 'plan_closed_1',
        hostId: 'swalih',
        reviewerId: 'viknesh',
        reviewerName: 'Viknesh',
        overallRating: 4,
        foodQuality: 5,
        atmosphere: 4,
        hostExperience: 4,
        reviewText: 'Food was delicious, highly recommend this plan.',
        tastePointsAwarded: 10,
        createdAt: new Date()
    },
    {
        id: 'rev_3',
        postId: 'plan_closed_1',
        hostId: 'swalih',
        reviewerId: 'don',
        reviewerName: 'Don',
        overallRating: 5,
        foodQuality: 5,
        atmosphere: 5,
        hostExperience: 5,
        reviewText: '10/10 experience.',
        tastePointsAwarded: 25,
        createdAt: new Date()
    },
    {
        id: 'rev_4',
        postId: 'plan_closed_1',
        hostId: 'swalih',
        reviewerId: 'swalih',
        reviewerName: 'Swalih',
        overallRating: 5,
        foodQuality: 5,
        atmosphere: 5,
        hostExperience: 5,
        reviewText: 'Loved hosting this group!',
        tastePointsAwarded: 0,
        createdAt: new Date()
    },
    {
        id: 'rev_5',
        postId: 'plan_closed_2',
        hostId: 'roshan',
        reviewerId: 'jane',
        reviewerName: 'Jane',
        overallRating: 4,
        foodQuality: 4,
        atmosphere: 5,
        hostExperience: 5,
        reviewText: 'Very chill vibe.',
        tastePointsAwarded: 10,
        createdAt: new Date()
    }
];

export const useReviewStore = create<ReviewState>()(
    persist(
        (set, get) => ({
            reviews: SEED_REVIEWS,

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
            name: 'bite-buddy-reviews-v8',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
