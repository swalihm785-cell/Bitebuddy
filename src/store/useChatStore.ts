import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { TEST_USERS } from '../data/testUsers';
import { Platform } from 'react-native';
import { Notification as NotificationType } from '../types';

export const API_URL = 'http://10.238.216.229:5001';

export type ChatStatus = 'pending' | 'accepted' | 'blocked' | 'deleted';
export type MessageType = 'text' | 'image' | 'video' | 'contact';

export interface ChatMessage {
    id: string;
    senderId: string;
    text?: string;
    mediaUri?: string;
    mediaType?: 'image' | 'video';
    contactData?: { label: string; value: string };
    type: MessageType;
    time: string;
}

export interface ChatConversation {
    id: string;
    ownerId: string;
    participantId: string;
    participantName: string;
    participantAvatar?: string;
    isGroup: boolean;
    groupName?: string;
    status: ChatStatus;
    myStatus?: 'pending' | 'approved';
    initiatedByMe: boolean;
    lastMessage?: string;
    lastMessageAt?: Date;
    unreadCount: number;
    createdAt: Date;
    participantsCount?: number;
    members?: Array<{ user_id: string; status: 'pending' | 'approved'; unread_count: number }>;
    planId?: string;
    initiatorId: string;
}

interface ChatState {
    conversations: ChatConversation[];
    messages: Record<string, ChatMessage[]>;
    socket: Socket | null;

    fetchChats: (userId: string) => Promise<void>;
    fetchMessages: (chatId: string) => Promise<void>;

    sendChatRequest: (owner: { id: string; name: string; avatar?: string }, to: { id: string; name: string; avatar?: string }, initialMessage?: string) => Promise<string>;
    createGroupChat: (initiatorId: string, planId: string, groupName: string, participants: string[], isPro: boolean) => Promise<{ success: boolean; chatId?: string; error?: string }>;
    acceptRequest: (chatId: string) => Promise<void>;
    blockConversation: (chatId: string, userId: string) => Promise<void>;
    deleteRequest: (chatId: string, userId: string) => Promise<void>;
    deleteConversation: (chatId: string, myId: string) => Promise<void>;
    clearMessages: (chatId: string) => Promise<void>;

    updateLastMessage: (chatId: string, message: string, senderId: string) => void;
    addMessage: (chatId: string, message: ChatMessage) => void;
    sendMessageOut: (chatId: string, message: ChatMessage) => void;
    markRead: (chatId: string, myId: string) => Promise<void>;

    respondToGroupInvite: (chatId: string, userId: string, action: 'approved' | 'rejected') => Promise<void>;
    addGroupMember: (chatId: string, userId: string) => Promise<void>;
    leaveGroupChat: (chatId: string, userId: string) => Promise<void>;
    removeGroupMember: (chatId: string, userId: string, hostId: string) => Promise<void>;
    deleteGroupChat: (chatId: string, userId: string, deleteAll: boolean) => Promise<void>;

    clearAll: () => void;
    wsConnect: (userId: string) => void;
    wsDisconnect: () => void;
    sendNotificationOut: (notification: Omit<NotificationType, 'id' | 'createdAt' | 'isRead'>) => void;
}

export const ALL_USERS = Object.values(TEST_USERS).map(u => u.user);

export const useChatStore = create<ChatState>()(
    (set, get) => ({
        conversations: [],
        messages: {},
        socket: null,

        fetchChats: async (userId) => {
            try {
                const res = await fetch(`${API_URL}/chats?userId=${userId}`);
                const rows = await res.json();

                const convos: ChatConversation[] = rows.map((r: any) => {
                    const isGroup = r.type === 'group';
                    let participantId = '';
                    let participantName = '';
                    let participantAvatar = undefined;

                    if (isGroup) {
                        participantId = 'group';
                        participantName = r.name || 'Group Chat';
                    } else {
                        participantId = r.initiator_id === userId ? r.receiver_id : r.initiator_id;
                        const u = ALL_USERS.find(x => x.id === participantId);
                        participantName = u ? u.name : 'Unknown User';
                        participantAvatar = u ? u.photoURL : undefined;
                    }

                    return {
                        id: r.id,
                        ownerId: userId,
                        participantId,
                        participantName,
                        participantAvatar,
                        isGroup,
                        groupName: isGroup ? r.name : undefined,
                        status: isGroup
                            ? (r.myStatus === 'pending' ? 'pending' : 'accepted')
                            : r.status,
                        initiatedByMe: r.initiator_id === userId,
                        lastMessage: r.last_message,
                        lastMessageAt: r.last_message_at ? new Date(r.last_message_at) : undefined,
                        unreadCount: isGroup ? r.unread_count : (r.initiator_id === userId ? r.initiator_unread : r.receiver_unread),
                        createdAt: r.last_message_at ? new Date(r.last_message_at) : new Date(),
                        // Attach members if group
                        participantsCount: isGroup && r.members ? r.members.length : 2,
                        myStatus: isGroup ? r.myStatus : undefined,
                        members: isGroup ? r.members : undefined,
                        planId: r.plan_id,
                        initiatorId: r.initiator_id
                    } as ChatConversation;
                });

                set({ conversations: convos });
            } catch (err) {
                console.error('Failed to fetch chats:', err);
            }
        },

        fetchMessages: async (chatId) => {
            try {
                const res = await fetch(`${API_URL}/messages?chatId=${chatId}`);
                const rows = await res.json();

                const mapped = rows.map((r: any) => ({
                    id: r.id,
                    senderId: r.sender_id,
                    text: r.text,
                    mediaUri: r.media_uri,
                    mediaType: r.media_type,
                    type: r.type,
                    contactData: r.contact_label ? { label: r.contact_label, value: r.contact_value } : undefined,
                    time: r.time
                }));

                set(state => ({
                    messages: { ...state.messages, [chatId]: mapped }
                }));
            } catch (err) {
                console.error('Failed to fetch messages:', err);
            }
        },

        sendChatRequest: async (owner, to, initialMessage = 'Hello') => {
            try {
                const res = await fetch(`${API_URL}/chats/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initiator_id: owner.id, receiver_id: to.id, initial_message: initialMessage })
                });
                const chat = await res.json();
                await get().fetchChats(owner.id);
                return chat.id;
            } catch (err) {
                console.error(err);
                return '';
            }
        },

        createGroupChat: async (initiatorId, planId, groupName, participants, isPro) => {
            try {
                const res = await fetch(`${API_URL}/chats/group`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initiator_id: initiatorId, plan_id: planId, group_name: groupName, participants, is_pro: isPro })
                });
                const data = await res.json();
                if (data.success) {
                    await get().fetchChats(initiatorId);
                    return { success: true, chatId: data.chatId };
                }
                return { success: false, error: data.error };
            } catch (err: any) {
                console.error(err);
                return { success: false, error: err.message };
            }
        },

        acceptRequest: async (chatId) => {
            await fetch(`${API_URL}/chats/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId })
            });
            set(state => ({
                conversations: state.conversations.map(c =>
                    c.id === chatId ? { ...c, status: 'accepted', unreadCount: 0 } : c
                )
            }));
        },

        blockConversation: async (chatId, userId) => {
            await fetch(`${API_URL}/chats/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, userId })
            });
            set(state => ({
                conversations: state.conversations.map(c =>
                    c.id === chatId ? { ...c, status: 'blocked' } : c
                )
            }));
        },

        deleteRequest: async (chatId, userId) => {
            await fetch(`${API_URL}/chats/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, userId })
            });
            set(state => ({
                conversations: state.conversations.filter(c => c.id !== chatId)
            }));
        },

        deleteConversation: async (chatId, myId) => {
            await fetch(`${API_URL}/chats/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, userId: myId })
            });
            set(state => ({
                conversations: state.conversations.filter(c => !(c.id === chatId && c.ownerId === myId)),
            }));
        },

        clearMessages: async (chatId) => {
            await fetch(`${API_URL}/chats/clearMessages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId })
            });
            set(state => ({
                messages: { ...state.messages, [chatId]: [] }
            }));
        },

        updateLastMessage: (chatId, message, senderId) => set(state => ({
            conversations: state.conversations.map(c =>
                c.id === chatId
                    ? {
                        ...c,
                        lastMessage: message,
                        lastMessageAt: new Date(),
                        unreadCount: c.ownerId === senderId ? c.unreadCount : c.unreadCount + 1
                    }
                    : c
            )
        })),

        addMessage: (chatId, message) => set(state => {
            const existingMessages = state.messages[chatId] || [];
            if (existingMessages.find(m => m.id === message.id)) return state;
            return {
                messages: {
                    ...state.messages,
                    [chatId]: [...existingMessages, message]
                }
            };
        }),

        sendMessageOut: (chatId, message) => {
            const { socket } = get();
            if (socket) {
                socket.emit('sendMessage', { chatId, message });
            }
        },

        markRead: async (chatId, myId) => {
            await fetch(`${API_URL}/chats/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId, userId: myId })
            });
            set(state => ({
                conversations: state.conversations.map(c =>
                    (c.id === chatId && c.ownerId === myId) ? { ...c, unreadCount: 0 } : c
                )
            }));
        },

        respondToGroupInvite: async (chatId, userId, action) => {
            try {
                await fetch(`${API_URL}/chats/group/respond`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chatId, userId, action })
                });
                await get().fetchChats(userId);
            } catch (err) {
                console.error(err);
            }
        },

        addGroupMember: async (chatId, userId) => {
            try {
                await fetch(`${API_URL}/chats/group/${chatId}/add`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
            } catch (err) {
                console.error(err);
            }
        },

        leaveGroupChat: async (chatId, userId) => {
            try {
                await fetch(`${API_URL}/chats/group/leave`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chatId, userId })
                });
                await get().fetchChats(userId);
            } catch (err) {
                console.error(err);
            }
        },

        removeGroupMember: async (chatId, userId, hostId) => {
            try {
                await fetch(`${API_URL}/chats/group/${chatId}/remove`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, hostId })
                });
                await get().fetchChats(hostId);
            } catch (err) {
                console.error(err);
            }
        },

        deleteGroupChat: async (chatId, userId, deleteAll) => {
            try {
                await fetch(`${API_URL}/chats/group/delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chatId, userId, deleteAll })
                });
                await get().fetchChats(userId);
            } catch (err) {
                console.error(err);
            }
        },

        clearAll: () => set({ conversations: [], messages: {} }),

        wsConnect: (userId) => {
            const existing = get().socket;
            if (existing) return;

            console.log('[WebSocket] Connecting to backend server...');
            const socket = io(API_URL, {
                transports: ["websocket"],
            });

            socket.on('connect', () => {
                console.log('[WebSocket] Connected');
                socket.emit('join_room', { userId });
            });

            socket.on('new_notification', (data) => {
                console.log('[WebSocket] Notification received', data);
                // Use a dynamic require to avoid circular dependency
                const { useNotificationStore } = require('./useNotificationStore');
                useNotificationStore.getState().addNotification(data, true); // true = from socket
            });

            socket.on('receive_message', (data) => {
                const { chatId, ...message } = data;
                console.log('[WebSocket] Message received', message);
                get().addMessage(chatId, message);

                const lastMsgText = message.type === 'text' ? message.text : (message.type === 'contact' ? 'Shared contact' : 'Sent media');
                get().updateLastMessage(chatId, lastMsgText, message.senderId);
            });

            socket.on('chatRequest', (data) => {
                console.log('[WebSocket] Chat Request Received', data);
                get().fetchChats(userId);
            });

            socket.on('chatAccepted', (data) => {
                console.log('[WebSocket] Chat Accepted', data);
                get().fetchChats(userId);
            });

            socket.on('chatBlocked', (data) => {
                console.log('[WebSocket] Chat Blocked', data);
                get().fetchChats(userId);
            });

            socket.on('groupDeleted', (data) => {
                console.log('[WebSocket] Group Deleted Received', data);
                get().fetchChats(userId);
            });

            set({ socket });
        },

        wsDisconnect: () => {
            const { socket } = get();
            if (socket) {
                console.log('[WebSocket] Disconnecting...');
                socket.disconnect();
                set({ socket: null });
            }
        },

        sendNotificationOut: (notification) => {
            const { socket } = get();
            if (socket) {
                console.log('[WebSocket] Sending notification out', notification);
                socket.emit('send_notification', notification);
            }
        }
    })
);
