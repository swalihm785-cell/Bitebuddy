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
    removeJoinRequest: (id: string) => void;
    addInvite: (invite: Invite) => void;
    updateInvite: (id: string, status: Invite['status'], note?: string) => void;
    removeInvite: (id: string) => void;
    leavePost: (postId: string, userId: string) => void;
}

// Date helpers relative to now
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 86400000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

const SEED_POSTS: DiningPost[] = [
    {
        id: 'plan_closed_1',
        hostId: 'swalih',
        title: 'Epic Biryani Feast 🍛',
        cuisineTypes: ['Indian', 'Mughlai'],
        area: 'Downtown',
        city: 'Kozhikode',
        restaurantName: 'Paragon',
        location: { latitude: 11.2588, longitude: 75.7804 },
        minGroupSize: 2,
        maxGroupSize: 4,
        currentParticipants: 4,
        dateTime: daysAgo(2),
        isImmediate: false,
        budgetRange: 'range2',
        visibility: 'public',
        status: 'closed',
        description: 'This was an amazing Biryani run.',
        autoApprove: true,
        expiresAt: daysAgo(1),
        createdAt: daysAgo(5),
        imageURL: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        participants: [
            { id: 'swalih', name: 'Swalih', age: 24, gender: 'Male' },
            { id: 'roshan', name: 'Roshan', age: 26, gender: 'Male' },
            { id: 'viknesh', name: 'Viknesh', age: 23, gender: 'Male' },
            { id: 'don', name: 'Don', age: 25, gender: 'Male' }
        ]
    },
    {
        id: 'plan_closed_2',
        hostId: 'roshan',
        title: 'Late Night Coffee & Dessert ☕',
        cuisineTypes: ['Cafe', 'Dessert'],
        area: 'Marine Drive',
        city: 'Kochi',
        restaurantName: 'Qissa Cafe',
        location: { latitude: 9.9760, longitude: 76.2770 },
        minGroupSize: 2,
        maxGroupSize: 4,
        currentParticipants: 2,
        dateTime: daysAgo(1),
        isImmediate: false,
        budgetRange: 'range1',
        visibility: 'public',
        status: 'closed',
        description: 'Quiet coffee meetup.',
        autoApprove: true,
        expiresAt: daysAgo(0.5),
        createdAt: daysAgo(3),
        imageURL: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
        participants: [
            { id: 'roshan', name: 'Roshan', age: 26, gender: 'Male' },
            { id: 'jane', name: 'Jane', age: 22, gender: 'Female' }
        ]
    },
    {
        id: 'plan_open_1',
        hostId: 'swalih',
        title: 'Sushi Weekend 🍣',
        cuisineTypes: ['Japanese'],
        area: 'Panampilly Nagar',
        city: 'Kochi',
        restaurantName: 'Tokyo Cafe',
        location: { latitude: 9.9547, longitude: 76.2976 },
        minGroupSize: 2,
        maxGroupSize: 6,
        currentParticipants: 1,
        dateTime: daysFromNow(4),
        isImmediate: false,
        budgetRange: 'range3',
        visibility: 'public',
        status: 'open',
        description: 'Looking forward to some amazing Sushi rolls!',
        autoApprove: false,
        expiresAt: daysFromNow(5),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
        participants: [
            { id: 'swalih', name: 'Swalih', age: 24, gender: 'Male' }
        ]
    }
];

const SEED_JOIN_REQUESTS: JoinRequest[] = [];
const SEED_INVITES: Invite[] = [];



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
            removeJoinRequest: (id) => set((state) => ({
                joinRequests: state.joinRequests.filter((r) => r.id !== id)
            })),
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
            name: 'bite-buddy-posts-v8',  // Incremented to v7 to clear cache
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
