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

const SEED_POSTS: DiningPost[] = [
    {
        id: 'plan_kozhikode_1',
        hostId: 'swalih',
        title: 'Legendary Malabar Biryani 🍛',
        cuisineTypes: ['Indian', 'Malabar'],
        area: 'Beach Road',
        city: 'Kozhikode',
        restaurantName: 'Paragon Restaurant',
        location: { latitude: 11.2622, longitude: 75.7735 },
        minGroupSize: 2,
        maxGroupSize: 6,
        currentParticipants: 1,
        dateTime: daysFromNow(10),
        isImmediate: false,
        budgetRange: 'range2',
        visibility: 'public',
        status: 'open',
        description: 'Experience the world-famous Malabar Biryani at the iconic Paragon. A must-try for every foodie!',
        autoApprove: false,
        expiresAt: daysFromNow(11),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        participants: [{ id: 'swalih', name: 'Swalih', age: 24, gender: 'Male' }]
    },
    {
        id: 'plan_kochi_1',
        hostId: 'roshan',
        title: 'LuLu Mall Food Adventure 🍔',
        cuisineTypes: ['American', 'Fast Food'],
        area: 'Edappally',
        city: 'Kochi',
        restaurantName: 'LuLu Mall Food Court',
        location: { latitude: 10.0270, longitude: 76.3080 },
        minGroupSize: 2,
        maxGroupSize: 4,
        currentParticipants: 2,
        dateTime: daysFromNow(12),
        isImmediate: false,
        budgetRange: 'range2',
        visibility: 'public',
        status: 'open',
        description: 'Exploring the massive food court at LuLu. Burgers, pizzas, and more!',
        autoApprove: true,
        expiresAt: daysFromNow(13),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=800&q=80',
        participants: [
            { id: 'roshan', name: 'Roshan', age: 26, gender: 'Male' },
            { id: 'viknesh', name: 'Viknesh', age: 23, gender: 'Male' }
        ]
    },
    {
        id: 'plan_tvm_1',
        hostId: 'viknesh',
        title: 'Vazhuthacaud Traditional Lunch 🍱',
        cuisineTypes: ['Kerala', 'Indian'],
        area: 'Vazhuthacaud',
        city: 'Trivandrum',
        restaurantName: 'Azad Hotel',
        location: { latitude: 8.4997, longitude: 76.9575 },
        minGroupSize: 2,
        maxGroupSize: 3,
        currentParticipants: 1,
        dateTime: daysFromNow(14),
        isImmediate: false,
        budgetRange: 'range2',
        visibility: 'public',
        status: 'open',
        description: 'Authentic Trivandrum style lunch with traditional curries.',
        autoApprove: false,
        expiresAt: daysFromNow(15),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?auto=format&fit=crop&w=800&q=80',
        participants: [{ id: 'viknesh', name: 'Viknesh', age: 23, gender: 'Male' }]
    },
    {
        id: 'plan_blr_1',
        hostId: 'don',
        title: 'MTR 1924 South Indian Classics 🥘',
        cuisineTypes: ['Indian', 'South Indian'],
        area: 'Lalbagh',
        city: 'Bangalore',
        restaurantName: 'MTR 1924',
        location: { latitude: 12.9550, longitude: 77.5855 },
        minGroupSize: 2,
        maxGroupSize: 8,
        currentParticipants: 1,
        dateTime: daysFromNow(15),
        isImmediate: false,
        budgetRange: 'range2',
        visibility: 'public',
        status: 'open',
        description: 'Famous Rava Idli and Filter Coffee at the legendary MTR.',
        autoApprove: true,
        expiresAt: daysFromNow(16),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
        participants: [{ id: 'don', name: 'Don', age: 25, gender: 'Male' }]
    }
];

const SEED_JOIN_REQUESTS: JoinRequest[] = [
    {
        id: 'req_1',
        postId: 'plan_kozhikode_1',
        requesterId: 'roshan',
        status: 'pending',
        message: 'Would love to join for the Biryani!',
        createdAt: new Date(),
        requester: { id: 'roshan', name: 'Roshan', age: 26, gender: 'Male' } as any
    },
    {
        id: 'req_2',
        postId: 'plan_tvm_1',
        requesterId: 'don',
        status: 'rejected',
        message: 'Hi, I will be in TVM that day.',
        createdAt: new Date(),
        requester: { id: 'don', name: 'Don', age: 25, gender: 'Male' } as any
    }
];

const SEED_INVITES: Invite[] = [
    {
        id: 'inv_1',
        postId: 'plan_kozhikode_1',
        inviterId: 'swalih',
        inviteeId: 'don',
        inviteeName: 'Don',
        status: 'pending',
        note: 'Hey Don, join us for Biryani!',
        createdAt: new Date()
    }
];


export const usePostStore = create<PostState>()(
    persist(
        (set) => ({
            posts: SEED_POSTS,
            joinRequests: SEED_JOIN_REQUESTS,
            invites: SEED_INVITES,
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
            name: 'bite-buddy-posts-v3',  // Incremented to v3 to reset all data
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
