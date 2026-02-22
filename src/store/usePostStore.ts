import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiningPost, JoinRequest, Participant, Invite } from '../types';

interface PostState {
    posts: DiningPost[];
    joinRequests: JoinRequest[];
    invites: Invite[];
    addPost: (post: DiningPost) => void;
    updatePost: (id: string, updates: Partial<DiningPost>) => void;
    deletePost: (id: string) => void;
    addJoinRequest: (request: JoinRequest) => void;
    updateJoinRequest: (id: string, status: JoinRequest['status']) => void;
    addInvite: (invite: Invite) => void;
    updateInvite: (id: string, status: Invite['status'], note?: string) => void;
    removeInvite: (id: string) => void;
    leavePost: (postId: string, userId: string) => void;
}

// Date helpers relative to now
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000);

const MOCK_POSTS: DiningPost[] = [
    {
        id: 'post_1',
        hostId: 'swalih',
        title: 'Cozy Italian Night 🍝',
        cuisineTypes: ['Italian'],
        restaurantName: 'La Bella Roma',
        restaurantAddress: 'MG Road, Bangalore',
        area: 'MG Road',
        city: 'Bangalore',
        minGroupSize: 2,
        maxGroupSize: 4,
        currentParticipants: 1,
        dateTime: daysFromNow(1),
        isImmediate: false,
        budgetRange: 'range2',
        visibility: 'public',
        status: 'open',
        description: 'Looking for Italian food lovers! Let\'s share a homely Italian dinner and exchange stories over pasta and wine.',
        autoApprove: false,
        expiresAt: daysFromNow(2),
        createdAt: new Date(),
        participants: [
            { id: 'swalih', name: 'Swalih', age: 24, gender: 'Male' }
        ]
    },
    {
        id: 'post_2',
        hostId: 'roshan',
        title: 'Biryani & Chai Meetup 🍛',
        cuisineTypes: ['Indian'],
        restaurantName: 'Paradise Biryani',
        restaurantAddress: 'Koramangala, Bangalore',
        area: 'Koramangala',
        city: 'Bangalore',
        minGroupSize: 3,
        maxGroupSize: 6,
        currentParticipants: 1,
        dateTime: daysFromNow(2),
        isImmediate: false,
        budgetRange: 'range1',
        visibility: 'public',
        status: 'open',
        description: 'Big fans of biryani? Let\'s get together for an authentic hyderabadi biryani experience. Chai included!',
        autoApprove: true,
        expiresAt: daysFromNow(3),
        createdAt: new Date(),
        participants: [
            { id: 'roshan', name: 'Roshan', age: 26, gender: 'Male' }
        ]
    },
    {
        id: 'post_3',
        hostId: 'viknesh',
        title: 'Vegan Power Lunch 🥗',
        cuisineTypes: ['Vegan'],
        restaurantName: 'The Green House',
        restaurantAddress: 'Indiranagar, Bangalore',
        area: 'Indiranagar',
        city: 'Bangalore',
        minGroupSize: 2,
        maxGroupSize: 5,
        currentParticipants: 1,
        dateTime: daysFromNow(7),
        isImmediate: false,
        budgetRange: 'range1',
        visibility: 'public',
        status: 'open',
        description: 'Calling all plant-based food enthusiasts! Let\'s have a healthy vegan lunch and talk about sustainable living.',
        autoApprove: true,
        expiresAt: daysFromNow(8),
        createdAt: new Date(),
        participants: [
            { id: 'viknesh', name: 'Viknesh', age: 23, gender: 'Male' }
        ]
    },
    {
        id: 'post_4',
        hostId: 'don',
        title: 'Sushi & Sake Evening 🍣',
        cuisineTypes: ['Japanese'],
        restaurantName: 'Hashi Sushi Bar',
        restaurantAddress: 'Whitefield, Bangalore',
        area: 'Whitefield',
        city: 'Bangalore',
        minGroupSize: 2,
        maxGroupSize: 4,
        currentParticipants: 1,
        dateTime: daysFromNow(10),
        isImmediate: false,
        budgetRange: 'range3',
        visibility: 'public',
        status: 'open',
        description: 'Love Japanese cuisine? Let\'s explore the best sushi platter in town. A curated tasting menu with optional sake pairing.',
        autoApprove: false,
        expiresAt: daysFromNow(11),
        createdAt: new Date(),
        participants: [
            { id: 'don', name: 'Don', age: 25, gender: 'Male' }
        ]
    }
];

export const usePostStore = create<PostState>()(
    persist(
        (set) => ({
            posts: MOCK_POSTS,
            joinRequests: [],
            invites: [],
            addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
            updatePost: (id, updates) => set((state) => ({
                posts: state.posts.map((p) => p.id === id ? { ...p, ...updates } : p)
            })),
            deletePost: (id) => set((state) => ({
                posts: state.posts.filter((p) => p.id !== id),
                joinRequests: state.joinRequests.filter((r) => r.postId !== id)
            })),
            addJoinRequest: (request) => set((state) => ({
                joinRequests: [request, ...state.joinRequests]
            })),
            updateJoinRequest: (id, status) => set((state) => {
                const request = state.joinRequests.find(r => r.id === id);
                if (!request) return state;

                let updatedPosts = state.posts;
                if (status === 'accepted') {
                    updatedPosts = state.posts.map(p => {
                        if (p.id === request.postId) {
                            const isAlreadyParticipant = p.participants.some(part => part.id === request.requesterId);
                            if (isAlreadyParticipant) return p;
                            const newParticipant: Participant = {
                                id: request.requesterId,
                                name: request.requester?.name || 'User',
                                age: request.requester?.age || 25,
                                gender: request.requester?.gender
                            };
                            return {
                                ...p,
                                participants: [...p.participants, newParticipant],
                                currentParticipants: p.participants.length + 1
                            };
                        }
                        return p;
                    });
                }

                return {
                    joinRequests: state.joinRequests.map(r => r.id === id ? { ...r, status } : r),
                    posts: updatedPosts
                };
            }),
            leavePost: (postId, userId) => set((state) => ({
                posts: state.posts.map(p => {
                    if (p.id === postId) {
                        return {
                            ...p,
                            participants: p.participants.filter(part => part.id !== userId),
                            currentParticipants: Math.max(0, p.currentParticipants - 1)
                        };
                    }
                    return p;
                }),
                joinRequests: state.joinRequests.filter(r => !(r.postId === postId && r.requesterId === userId))
            })),
            addInvite: (invite) => set((state) => ({
                invites: [invite, ...state.invites]
            })),
            updateInvite: (id, status, note) => set((state) => {
                const invite = state.invites.find(i => i.id === id);
                if (!invite) return state;

                let updatedPosts = state.posts;
                if (status === 'accepted') {
                    updatedPosts = state.posts.map(p => {
                        if (p.id === invite.postId) {
                            const isAlready = p.participants.some(part => part.id === invite.inviteeId);
                            if (isAlready) return p;
                            const newParticipant: Participant = {
                                id: invite.inviteeId,
                                name: invite.inviteeName,
                                age: 25,
                            };
                            return {
                                ...p,
                                participants: [...p.participants, newParticipant],
                                currentParticipants: p.participants.length + 1
                            };
                        }
                        return p;
                    });
                }

                return {
                    invites: state.invites.map(i => i.id === id ? { ...i, status, note: note || i.note } : i),
                    posts: updatedPosts
                };
            }),
            removeInvite: (id) => set((state) => ({
                invites: state.invites.filter(i => i.id !== id)
            })),
        }),
        {
            name: 'bite-buddy-posts-v2',  // Changed key to force reset of old data
            storage: createJSONStorage(() => ({
                getItem: async (name) => {
                    const str = await AsyncStorage.getItem(name);
                    if (!str) return null;
                    return JSON.parse(str, (key, value) => {
                        if (key === 'dateTime' || key === 'expiresAt' || key === 'createdAt') {
                            return new Date(value);
                        }
                        return value;
                    });
                },
                setItem: (name, value) => AsyncStorage.setItem(name, JSON.stringify(value)),
                removeItem: (name) => AsyncStorage.removeItem(name),
            })),
        }
    )
);
