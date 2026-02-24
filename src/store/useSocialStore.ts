import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocialPost, Review } from '../types';

interface SocialState {
    socialPosts: SocialPost[];
    reviews: Review[];
    addSocialPost: (post: SocialPost) => void;
    addReview: (review: Review) => void;
    toggleLikeSocial: (postId: string, userId: string) => void;
    toggleLikeReview: (reviewId: string, userId: string) => void;
}

const SEED_SOCIAL: SocialPost[] = [
    {
        id: 's1',
        userId: 'swalih',
        content: 'Just had the best coffee in Kochi! ☕️ The atmosphere here is incredible.',
        mediaUri: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
        location: 'Kochi, Kerala',
        cuisine: 'Cafe',
        likes: ['roshan', 'don'],
        commentsCount: 3,
        createdAt: new Date(Date.now() - 3600000)
    },
    {
        id: 's2',
        userId: 'roshan',
        content: 'Exploring the street food scene in Bangalore. Any recommendations? 🥟',
        location: 'Indiranagar, Bangalore',
        likes: ['swalih'],
        commentsCount: 12,
        createdAt: new Date(Date.now() - 86400000)
    }
];

const SEED_REVIEWS: Review[] = [
    {
        id: 'r1',
        restaurantName: 'Paragon Restaurant',
        rating: 5,
        reviewText: 'Their Biryani is legendary for a reason. Worth every penny!',
        mediaUri: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0',
        reviewerId: 'don',
        likes: ['swalih', 'roshan'],
        commentsCount: 5,
        createdAt: new Date(Date.now() - 172800000)
    },
    {
        id: 'r2',
        restaurantName: 'The Pizza Place',
        rating: 4,
        reviewText: 'Great crust and fresh toppings. Service was a bit slow though.',
        reviewerId: 'viknesh',
        likes: [],
        commentsCount: 2,
        createdAt: new Date(Date.now() - 259200000)
    }
];

export const useSocialStore = create<SocialState>()(
    persist(
        (set) => ({
            socialPosts: SEED_SOCIAL,
            reviews: SEED_REVIEWS,
            addSocialPost: (post) => set((state) => ({ socialPosts: [post, ...state.socialPosts] })),
            addReview: (review) => set((state) => ({ reviews: [review, ...state.reviews] })),
            toggleLikeSocial: (postId, userId) => set((state) => ({
                socialPosts: state.socialPosts.map(p => {
                    if (p.id === postId) {
                        const liked = p.likes.includes(userId);
                        return {
                            ...p,
                            likes: liked ? p.likes.filter(id => id !== userId) : [...p.likes, userId]
                        };
                    }
                    return p;
                })
            })),
            toggleLikeReview: (reviewId, userId) => set((state) => ({
                reviews: state.reviews.map(r => {
                    if (r.id === reviewId) {
                        const liked = r.likes.includes(userId);
                        return {
                            ...r,
                            likes: liked ? r.likes.filter(id => id !== userId) : [...r.likes, userId]
                        };
                    }
                    return r;
                })
            })),
        }),
        {
            name: 'bite-buddy-social-v1',
            storage: createJSONStorage(() => ({
                getItem: async (name) => {
                    const str = await AsyncStorage.getItem(name);
                    if (!str) return null;
                    return JSON.parse(str, (key, value) => {
                        if (key === 'createdAt') return new Date(value);
                        return value;
                    });
                },
                setItem: (name, value) => AsyncStorage.setItem(name, JSON.stringify(value)),
                removeItem: (name) => AsyncStorage.removeItem(name),
            })),
        }
    )
);
