import { create } from 'zustand';
import api from '../services/api';
import { io } from 'socket.io-client';
import { useAuthStore } from './useAuthStore';

export const useChatStore = create((set, get) => ({
    messages: [],
    socket: null,
    isConnected: false,

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
            set(state => ({
                messages: [...state.messages, msg]
            }));
        });

        socket.on('chat:delete', (data) => {
            set(state => ({
                messages: state.messages.filter(m => m.id !== parseInt(data.id))
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

    fetchMessages: async () => {
        try {
            const response = await api.get('/chat');
            
            set({ messages: response.data });
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    },

    sendMessage: (content, options = {}) => {
        const socket = get().socket;
        const { user } = useAuthStore.getState(); 
        if (socket && user) {
            socket.emit('chat:message', {
                userId: user.id,
                userName: options.userName || user.name,
                userRole: options.userRole || user.role,
                content
            });
        }
    }
}));
