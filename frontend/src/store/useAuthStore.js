import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    error: null,
    requires2fa: false,
    tempUserId: null, 
    authFields: [],

    fetchAuthFields: async () => {
        try {
            const response = await api.get('/settings'); 
            set({ authFields: response.data.authFields });
        } catch (err) {
            console.error('Error fetching auth fields:', err);
        }
    },

    register: async (name, email, password, customData = {}) => {
        set({ isLoading: true, error: null });
        try {
            await api.post('/auth/register', { name, email, password, customData });
            set({ isLoading: false });
            return true;
        } catch (err) {
            set({ error: err.response?.data?.message || 'Registration failed', isLoading: false });
            return false;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data.requires2fa) {
                set({
                    isLoading: false,
                    requires2fa: true,
                    tempUserId: response.data.userId
                });
                return { requires2fa: true };
            }

            const { user, token } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            set({ user, isAuthenticated: true, isLoading: false, requires2fa: false, tempUserId: null });
            return { success: true };
        } catch (err) {
            console.error(err);
            set({
                error: err.response?.data?.message || 'Invalid credentials',
                isLoading: false
            });
            throw err;
        }
    },

    verify2FA: async (code) => {
        set({ isLoading: true, error: null });
        try {
            const userId = get().tempUserId;
            const response = await api.post('/auth/verify-2fa', { userId, code });
            const { user, token } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            set({ user, isAuthenticated: true, isLoading: false, requires2fa: false, tempUserId: null });
            return true;
        } catch (err) {
            set({ error: err.response?.data?.message || 'Verification failed', isLoading: false });
            return false;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
    },
}));
