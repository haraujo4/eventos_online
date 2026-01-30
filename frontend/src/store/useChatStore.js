import { create } from 'zustand';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
    messages: [],
    pendingMessages: [],
    socket: null,
    isConnected: false,
    activeStreamId: null,

    setActiveStream: (streamId) => set({ activeStreamId: streamId }),

    connectSocket: () => {
        if (get().socket) return;

        const socket = io('http://localhost:3000');

        socket.on('connect', () => {
            console.log('Chat Socket connected');
            set({ isConnected: true });
        });

        socket.on('disconnect', () => {
            set({ isConnected: false });
        });

        socket.on('chat:message', (msg) => {
            const currentStreamId = get().activeStreamId;
            // Allow if global (null) or matches current stream
            const matchesStream = msg.streamId === null || (currentStreamId && Number(msg.streamId) === Number(currentStreamId));

            if (matchesStream) {
                set(state => {
                    const exists = state.messages.find(m => m.id === msg.id);
                    if (exists) {
                        return {
                            messages: state.messages.map(m => m.id === msg.id ? msg : m)
                        };
                    }
                    return {
                        messages: [...state.messages, msg]
                    };
                });
            }
        });

        socket.on('chat:pending', (msg) => {
            const { user } = useAuthStore.getState();

            // If it's MY message, show it in my chat as pending
            if (user && msg.userId === user.id) {
                set(state => ({
                    messages: [...state.messages, { ...msg, isPending: true }]
                }));
            }

            // Pending messages might be relevant for admins to see in a moderation list
            // We'll store them in pendingMessages
            set(state => ({
                pendingMessages: [...state.pendingMessages, msg]
            }));
        });

        socket.on('chat:approved', ({ id }) => {
            set(state => ({
                pendingMessages: state.pendingMessages.filter(m => m.id !== parseInt(id))
            }));
        });

        socket.on('chat:delete', (data) => {
            set(state => ({
                messages: state.messages.filter(m => m.id !== parseInt(data.id)),
                pendingMessages: state.pendingMessages.filter(m => m.id !== parseInt(data.id))
            }));
        });

        socket.on('chat:update', (updatedMsg) => {
            set(state => ({
                messages: state.messages.map(m => m.id === updatedMsg.id ? updatedMsg : m)
            }));
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    fetchMessages: async (streamId) => {
        try {
            const currentStreamId = streamId !== undefined ? streamId : get().activeStreamId;
            const query = currentStreamId ? `?streamId=${currentStreamId}` : '';
            const response = await api.get(`/chat${query}`);

            set({ messages: response.data });
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    },

    fetchPendingMessages: async () => {
        try {
            const response = await api.get('/chat/pending');
            set({ pendingMessages: response.data });
        } catch (err) {
            // Silently fail if forbidden (regular user)
        }
    },

    sendMessage: (content) => {
        const socket = get().socket;
        const { user } = useAuthStore.getState();
        const streamId = get().activeStreamId;

        if (socket && user) {
            socket.emit('chat:message', {
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                content,
                streamId: streamId ? parseInt(streamId) : null
            });
        }
    },

    approveMessage: async (id) => {
        try {
            await api.put(`/chat/${id}/approve`);
        } catch (err) {
            console.error('Error approving message:', err);
            throw err;
        }
    }
}));
