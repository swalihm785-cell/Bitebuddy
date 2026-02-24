import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notification as NotificationType } from '../types';

interface NotificationState {
    notifications: NotificationType[];
    addNotification: (notif: Omit<NotificationType, 'id' | 'createdAt' | 'isRead'>, isFromSocket?: boolean) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const SEED_NOTIFICATIONS: NotificationType[] = [
    {
        id: 'notif_1',
        userId: 'swalih',
        type: 'join_request',
        title: 'New Join Request',
        body: 'Roshan wants to join your Malabar Biryani plan.',
        isRead: false,
        createdAt: new Date(),
        data: { postId: 'plan_kozhikode_1' }
    },
    {
        id: 'notif_2',
        userId: 'don',
        type: 'invite_received',
        title: 'Dining Invite',
        body: 'Swalih invited you to join Legendary Malabar Biryani.',
        isRead: false,
        createdAt: new Date(),
        data: { postId: 'plan_kozhikode_1' }
    }
];

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: SEED_NOTIFICATIONS,
            addNotification: (notif, isFromSocket = false) => set((state) => {
                const newNotif = {
                    ...notif,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: new Date(),
                    isRead: false
                } as NotificationType;

                if (!isFromSocket) {
                    const { useChatStore } = require('./useChatStore');
                    useChatStore.getState().sendNotificationOut(newNotif);
                }

                return {
                    notifications: [
                        newNotif,
                        ...state.notifications
                    ]
                };
            }),
            markAsRead: (id) => set((state) => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
            })),
            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true }))
            })),
            clearNotifications: () => set({ notifications: [] }),
        }),
        {
            name: 'bite-buddy-notifications-v3', // Incremented to v3 to reset all data
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
