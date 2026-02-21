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

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: [],
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
            name: 'bite-buddy-notifications-v2',
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
