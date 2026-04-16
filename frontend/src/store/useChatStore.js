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

    setActiveStream: (streamId) => {
        set({ activeStreamId: streamId });
        const socket = get().socket;
        if (socket && streamId) {
            socket.emit('join:room', { streamId });
        }
    },

    connectSocket: () => {
        if (get().socket) return;

        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000');

        socket.on('connect', () => {
            set({ isConnected: true });
            const streamId = get().activeStreamId;
            if (streamId) {
                socket.emit('join:room', { streamId });
            }
        });

        socket.on('disconnect', () => {
            set({ isConnected: false });
        });

        socket.on('chat:message', (msg) => {
            // Como agora usamos ROOMS, o servidor só nos manda o que é relevante
            // Removemos o filtro de cliente para simplificar
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
        });

        socket.on('chat:pending', (msg) => {
            const { user } = useAuthStore.getState();
            const isAdmin = user && ['admin', 'moderator'].includes(user.role);

            // Se for MINHA mensagem ou se eu for ADMIN, mostrar no chat principal
            if ((user && msg.userId === user.id) || isAdmin) {
                set(state => {
                    const exists = state.messages.find(m => m.id === msg.id);
                    if (exists) return state;
                    return {
                        messages: [...state.messages, { ...msg, isApproved: false }]
                    };
                });

                // Toast para o moderador saber que tem mensagem nova aguardando
                if (isAdmin && user && msg.userId !== user.id) {
                    const { toast } = require('react-toastify');
                    toast.info(`Nova mensagem de ${msg.userName} aguardando moderação`, {
                        position: "top-right",
                        autoClose: 3000
                    });
                }
            }

            // Manter também na lista separada de pendentes
            set(state => ({
                pendingMessages: [...state.pendingMessages.filter(m => m.id !== msg.id), msg]
            }));
        });

        socket.on('chat:approved', (msg) => {
            // Se a mensagem aprovada chegar, adicionamos na lista principal
            // e removemos da lista de pendentes se ela estava lá
            set(state => ({
                messages: [...state.messages.filter(m => m.id !== msg.id), { ...msg, isApproved: true }],
                pendingMessages: state.pendingMessages.filter(m => m.id !== msg.id)
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
            const { user } = useAuthStore.getState();
            const isAdmin = user && ['admin', 'moderator'].includes(user.role);
            
            let query = currentStreamId ? `?streamId=${currentStreamId}` : '';
            // includeAll should NOT be forced here, the player always wants isolated history

            const response = await api.get(`/chat${query}`);
            set({ messages: response.data });
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    },

    fetchPendingMessages: async (eventId = null) => {
        try {
            const query = eventId ? `?eventId=${eventId}` : '';
            const response = await api.get(`/chat/pending${query}`);
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
    },

    deleteMessage: async (id) => {
        try {
            await api.delete(`/chat/${id}`);
        } catch (err) {
            console.error('Error deleting message:', err);
            throw err;
        }
    }
}));
