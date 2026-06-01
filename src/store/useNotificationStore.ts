import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notification as NotificationType } from '../types';

interface NotificationState {
    notifications: NotificationType[];
    addNotification: (notif: Omit<NotificationType, 'id' | 'createdAt' | 'isRead'> & { createdAt?: Date }, isFromSocket?: boolean) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const SEED_NOTIFICATIONS: NotificationType[] = [
    { id: 'n1', userId: 'swalih', type: 'join_request', title: 'Join Request', body: 'Roshan wants to join your plan.', isRead: false, createdAt: new Date() },
    { id: 'n2', userId: 'swalih', type: 'request_accepted', title: 'Request Accepted', body: 'Your request was accepted.', isRead: false, createdAt: new Date(Date.now() - 2 * 3600 * 1000) }, // 2 hours ago
    { id: 'n3', userId: 'swalih', type: 'request_rejected', title: 'Request Rejected', body: 'Your request was rejected.', isRead: true, createdAt: new Date(Date.now() - 5 * 3600 * 1000) }, // 5 hours ago
    { id: 'n4', userId: 'swalih', type: 'participant_left', title: 'Participant Left', body: 'Don left your plan.', isRead: true, createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000) }, // 1 day ago (Last 7 days)
    { id: 'n5', userId: 'swalih', type: 'new_message', title: 'New Message', body: 'You have a new message from Roshan.', isRead: false, createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) }, // 2 days ago (Last 7 days)
    { id: 'n6', userId: 'swalih', type: 'review', title: 'New Review', body: 'Roshan left you a review.', isRead: false, createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) }, // 3 days ago (Last 7 days)
    { id: 'n7', userId: 'swalih', type: 'event', title: 'Event Update', body: 'The event starts soon.', isRead: true, createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000) }, // 6 days ago (Last 7 days)
    { id: 'n8', userId: 'swalih', type: 'follow_request', title: 'Follow Request', body: 'Jane requested to follow you.', isRead: false, createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000) }, // 9 days ago (Last month)
    { id: 'n9', userId: 'swalih', type: 'follow_accepted', title: 'Follow Accepted', body: 'Jane accepted your follow request.', isRead: true, createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000) }, // 14 days ago (Last month)
    { id: 'n10', userId: 'swalih', type: 'new_meal', title: 'New Meal Plan', body: 'Don posted a new meal plan.', isRead: true, createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000) }, // 20 days ago (Last month)
    { id: 'n11', userId: 'swalih', type: 'report', title: 'Report Update', body: 'Your report was reviewed.', isRead: true, createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000) }, // 25 days ago (Last month)
    { id: 'n12', userId: 'swalih', type: 'welcome', title: 'Welcome', body: 'Welcome to Bite Buddy!', isRead: true, createdAt: new Date(Date.now() - 35 * 24 * 3600 * 1000) }, // 35 days ago (Earlier)
    { id: 'n13', userId: 'swalih', type: 'system', title: 'System Update', body: 'App maintenance scheduled.', isRead: true, createdAt: new Date(Date.now() - 40 * 24 * 3600 * 1000) }, // 40 days ago (Earlier)
    { id: 'n14', userId: 'swalih', type: 'invite_received', title: 'Invite Received', body: 'You were invited to a plan.', isRead: false, createdAt: new Date(Date.now() - 50 * 24 * 3600 * 1000) }, // 50 days ago (Earlier)
    { id: 'n15', userId: 'swalih', type: 'invite_accepted', title: 'Invite Accepted', body: 'Roshan accepted your invite.', isRead: false, createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000) }, // 60 days ago (Earlier)
    { id: 'n16', userId: 'swalih', type: 'invite_rejected', title: 'Invite Rejected', body: 'Viknesh declined your invite.', isRead: true, createdAt: new Date(Date.now() - 70 * 24 * 3600 * 1000) }, // 70 days ago (Earlier)
    { id: 'n17', userId: 'swalih', type: 'review_request', title: 'Review Request', body: 'Please review your recent host.', isRead: false, createdAt: new Date(Date.now() - 80 * 24 * 3600 * 1000) } // 80 days ago (Earlier)
];

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: SEED_NOTIFICATIONS,
            addNotification: (notif, isFromSocket = false) => set((state) => {
                const newNotif = {
                    ...notif,
                    id: Math.random().toString(36).substr(2, 9),
                    createdAt: notif.createdAt || new Date(),
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
            clearNotifications: () => set({ notifications: SEED_NOTIFICATIONS }),
        }),
        {
            name: 'bite-buddy-notifications-v8', // Incremented to v3 to reset all data
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
