import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Snap {
    id: string;
    userId: string;
    userName: string;
    image: string;
    views: number;
    viewers: string[]; // List of user IDs who viewed
    createdAt: string;
    expiresAt: string;
}

interface SnapState {
    snaps: Snap[];
    addSnap: (snap: Omit<Snap, 'id' | 'views' | 'viewers' | 'createdAt' | 'expiresAt'>) => void;
    deleteSnap: (id: string) => void;
    viewSnap: (snapId: string, viewerId: string) => void;
    clearExpiredSnaps: () => void;
}

export const useSnapStore = create<SnapState>()(
    persist(
        (set, get) => ({
            snaps: [
                {
                    id: '1', userId: 'u2', userName: 'Yuki',
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
                    views: 42, viewers: ['user_123', 'u3', 'u4'],
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    expiresAt: new Date(Date.now() + 82800000).toISOString()
                },
                {
                    id: '2', userId: 'u3', userName: 'Sarah',
                    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445',
                    views: 128, viewers: ['user_123'],
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    expiresAt: new Date(Date.now() + 79200000).toISOString()
                }
            ],
            addSnap: (snap) => set((state) => ({
                snaps: [
                    {
                        ...snap,
                        id: Math.random().toString(36).substr(2, 9),
                        views: 0,
                        viewers: [],
                        createdAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 86400000).toISOString()
                    },
                    ...state.snaps
                ]
            })),
            deleteSnap: (id) => set((state) => ({
                snaps: state.snaps.filter(s => s.id !== id)
            })),
            viewSnap: (snapId, viewerId) => set((state) => ({
                snaps: state.snaps.map(s => {
                    if (s.id === snapId && !s.viewers.includes(viewerId)) {
                        return { ...s, views: s.views + 1, viewers: [...s.viewers, viewerId] };
                    }
                    return s;
                })
            })),
            clearExpiredSnaps: () => set((state) => ({
                snaps: state.snaps.filter(s => new Date(s.expiresAt) > new Date())
            })),
        }),
        {
            name: 'bite-buddy-snaps',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
