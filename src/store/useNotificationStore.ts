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
    { id: 'n1', userId: 'swalih', type: 'join_request', title: 'Join Request', body: 'Roshan wants to join your plan.', isRead: false, createdAt: new Date() },
    { id: 'n2', userId: 'swalih', type: 'request_accepted', title: 'Request Accepted', body: 'Your request was accepted.', isRead: false, createdAt: new Date() },
    { id: 'n3', userId: 'swalih', type: 'request_rejected', title: 'Request Rejected', body: 'Your request was rejected.', isRead: true, createdAt: new Date() },
    { id: 'n4', userId: 'swalih', type: 'participant_left', title: 'Participant Left', body: 'Don left your plan.', isRead: true, createdAt: new Date() },
    { id: 'n5', userId: 'swalih', type: 'new_message', title: 'New Message', body: 'You have a new message from Roshan.', isRead: false, createdAt: new Date() },
    { id: 'n6', userId: 'swalih', type: 'review', title: 'New Review', body: 'Roshan left you a review.', isRead: false, createdAt: new Date() },
    { id: 'n7', userId: 'swalih', type: 'event', title: 'Event Update', body: 'The event starts soon.', isRead: true, createdAt: new Date() },
    { id: 'n8', userId: 'swalih', type: 'follow_request', title: 'Follow Request', body: 'Jane requested to follow you.', isRead: false, createdAt: new Date() },
    { id: 'n9', userId: 'swalih', type: 'follow_accepted', title: 'Follow Accepted', body: 'Jane accepted your follow request.', isRead: true, createdAt: new Date() },
    { id: 'n10', userId: 'swalih', type: 'new_meal', title: 'New Meal Plan', body: 'Don posted a new meal plan.', isRead: true, createdAt: new Date() },
    { id: 'n11', userId: 'swalih', type: 'report', title: 'Report Update', body: 'Your report was reviewed.', isRead: true, createdAt: new Date() },
    { id: 'n12', userId: 'swalih', type: 'welcome', title: 'Welcome', body: 'Welcome to Bite Buddy!', isRead: true, createdAt: new Date() },
    { id: 'n13', userId: 'swalih', type: 'system', title: 'System Update', body: 'App maintenance scheduled.', isRead: true, createdAt: new Date() },
    { id: 'n14', userId: 'swalih', type: 'invite_received', title: 'Invite Received', body: 'You were invited to a plan.', isRead: false, createdAt: new Date() },
    { id: 'n15', userId: 'swalih', type: 'invite_accepted', title: 'Invite Accepted', body: 'Roshan accepted your invite.', isRead: false, createdAt: new Date() },
    { id: 'n16', userId: 'swalih', type: 'invite_rejected', title: 'Invite Rejected', body: 'Viknesh declined your invite.', isRead: true, createdAt: new Date() },
    { id: 'n17', userId: 'swalih', type: 'review_request', title: 'Review Request', body: 'Please review your recent host.', isRead: false, createdAt: new Date() }
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
