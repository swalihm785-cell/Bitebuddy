import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiningPost } from '../types';

interface PostState {
    posts: DiningPost[];
    addPost: (post: DiningPost) => void;
    updatePost: (id: string, updates: Partial<DiningPost>) => void;
    deletePost: (id: string) => void;
}

const MOCK_POSTS: DiningPost[] = [
    {
        id: '1', hostId: 'u1', title: 'Sushi Night at Nobu',
        cuisineTypes: ['Japanese'], restaurantName: 'Nobu Restaurant',
        restaurantAddress: '40 W 57th St, New York', area: 'Midtown', city: 'New York',
        minGroupSize: 2, maxGroupSize: 4, currentParticipants: 2,
        dateTime: new Date(Date.now() + 3600000), isImmediate: false,
        budgetRange: 'range2', visibility: 'public', status: 'open',
        description: 'Looking for fellow sushi enthusiasts! Join me for an unforgettable omakase experience.',
        autoApprove: false, expiresAt: new Date(Date.now() + 7200000), createdAt: new Date(),
        participants: [
            { id: 'u1', name: 'Alex Chen', age: 28, gender: 'Male' },
            { id: 'u5', name: 'Sarah J.', age: 24, gender: 'Female' }
        ]
    },
    {
        id: '2', hostId: 'u2', title: 'Vegan Brunch Adventure',
        cuisineTypes: ['Vegan', 'American'], restaurantName: 'The Green Table',
        restaurantAddress: '512 W 25th St, Chelsea', area: 'Chelsea', city: 'New York',
        minGroupSize: 2, maxGroupSize: 6, currentParticipants: 3,
        dateTime: new Date(Date.now() + 86400000), isImmediate: false,
        budgetRange: 'range1', visibility: 'public', status: 'open',
        description: 'Plant-based brunch lovers wanted! Great conversation guaranteed.',
        autoApprove: true, expiresAt: new Date(Date.now() + 90000000), createdAt: new Date(),
        participants: [
            { id: 'u2', name: 'Mike Brown', age: 32, gender: 'Male' },
            { id: 'u6', name: 'Emma W.', age: 29, gender: 'Female' },
            { id: 'u7', name: 'John D.', age: 35, gender: 'Male' }
        ]
    }
];

export const usePostStore = create<PostState>()(
    persist(
        (set) => ({
            posts: MOCK_POSTS,
            addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
            updatePost: (id, updates) => set((state) => ({
                posts: state.posts.map((p) => p.id === id ? { ...p, ...updates } : p)
            })),
            deletePost: (id) => set((state) => ({
                posts: state.posts.filter((p) => p.id !== id)
            })),
        }),
        {
            name: 'bite-buddy-posts',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
