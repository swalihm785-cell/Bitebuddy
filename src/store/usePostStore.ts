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
        id: 'plan_new_1',
        hostId: 'swalih',
        title: 'Exclusive Closed Dining Event 🍽️',
        cuisineTypes: ['Continental', 'Exclusive'],
        area: 'Downtown',
        city: 'Kozhikode',
        restaurantName: 'The Secret Table',
        location: { latitude: 11.2588, longitude: 75.7804 },
        minGroupSize: 2,
        maxGroupSize: 4,
        currentParticipants: 4,
        dateTime: daysFromNow(2),
        isImmediate: false,
        budgetRange: 'range3',
        visibility: 'public',
        status: 'closed',
        description: 'This is a private, closed dining event.',
        autoApprove: false,
        expiresAt: daysFromNow(3),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1549488344-c6cbd5d4ea6e?auto=format&fit=crop&w=800&q=80',
        participants: [
            { id: 'swalih', name: 'Swalih', age: 24, gender: 'Male' },
            { id: 'roshan', name: 'Roshan', age: 26, gender: 'Male' },
            { id: 'viknesh', name: 'Viknesh', age: 23, gender: 'Male' },
            { id: 'don', name: 'Don', age: 25, gender: 'Male' }
        ]
    },
    {
        id: 'plan_upcoming_1',
        hostId: 'roshan',
        title: 'Weekend Biryani Feast 🍛',
        cuisineTypes: ['Indian', 'Malabar'],
        area: 'Marine Drive',
        city: 'Kochi',
        restaurantName: 'Paragon',
        location: { latitude: 9.9760, longitude: 76.2770 },
        minGroupSize: 2,
        maxGroupSize: 6,
        currentParticipants: 1,
        dateTime: daysFromNow(5),
        isImmediate: false,
        budgetRange: 'range2',
        visibility: 'public',
        status: 'open',
        description: 'Craving some authentic Malabar biryani this weekend. Who is in?',
        autoApprove: true,
        expiresAt: daysFromNow(6),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
        participants: [{ id: 'roshan', name: 'Roshan', age: 26, gender: 'Male' }]
    },
    {
        id: 'plan_upcoming_2',
        hostId: 'viknesh',
        title: 'Sushi & Catch Up 🍣',
        cuisineTypes: ['Japanese', 'Asian'],
        area: 'Panampilly Nagar',
        city: 'Kochi',
        restaurantName: 'Tokyo Cafe',
        location: { latitude: 9.9547, longitude: 76.2976 },
        minGroupSize: 2,
        maxGroupSize: 4,
        currentParticipants: 2,
        dateTime: daysFromNow(7),
        isImmediate: false,
        budgetRange: 'range3',
        visibility: 'public',
        status: 'open',
        description: 'It has been a while! Let us catch up over some amazing sushi rolls.',
        autoApprove: false,
        expiresAt: daysFromNow(8),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
        participants: [
            { id: 'viknesh', name: 'Viknesh', age: 23, gender: 'Male' },
            { id: 'don', name: 'Don', age: 25, gender: 'Male' }
        ]
    },
    {
        id: 'plan_upcoming_3',
        hostId: 'don',
        title: 'Late Night Coffee Run ☕',
        cuisineTypes: ['Cafe', 'Dessert'],
        area: 'Fort Kochi',
        city: 'Kochi',
        restaurantName: 'Qissa Cafe',
        location: { latitude: 9.9678, longitude: 76.2422 },
        minGroupSize: 2,
        maxGroupSize: 8,
        currentParticipants: 1,
        dateTime: daysFromNow(3),
        isImmediate: false,
        budgetRange: 'range1',
        visibility: 'public',
        status: 'open',
        description: 'Working late? Let us grab some midnight coffee and cake.',
        autoApprove: true,
        expiresAt: daysFromNow(4),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
        participants: [{ id: 'don', name: 'Don', age: 25, gender: 'Male' }]
    },
    {
        id: 'plan_swalih_open_1',
        hostId: 'swalih',
        title: 'Authentic Malabar Fish Curry 🐟',
        cuisineTypes: ['Seafood', 'Indian'],
        area: 'Calicut Beach',
        city: 'Kozhikode',
        restaurantName: 'Bombay Hotel',
        location: { latitude: 11.2588, longitude: 75.7804 },
        minGroupSize: 2,
        maxGroupSize: 5,
        currentParticipants: 1,
        dateTime: daysFromNow(4),
        isImmediate: false,
        budgetRange: 'range2',
        visibility: 'public',
        status: 'open',
        description: 'Looking for 4 people to join me for the best spicy fish curry in town!',
        foodItems: ['Ayala Curry', 'Fish Fry', 'Kappa (Tapioca)', 'Parotta'],
        autoApprove: true,
        expiresAt: daysFromNow(5),
        createdAt: new Date(),
        imageURL: 'https://images.unsplash.com/photo-1623595119708-26b1f7300075?auto=format&fit=crop&w=800&q=80',
        participants: [{ id: 'swalih', name: 'Swalih', age: 24, gender: 'Male' }]
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
            name: 'bite-buddy-posts-v7',  // Incremented to v7 to clear cache
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
