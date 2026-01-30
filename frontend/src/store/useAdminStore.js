import { create } from 'zustand';
import api from '../services/api';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

export const useAdminStore = create((set, get) => ({
    mediaSettings: {
        isLive: false,
        posterUrl: '',
        streams: []
    },
    eventSettings: {},
    authFields: [],
    socket: null,

    // Theme State
    theme: localStorage.getItem('theme') || 'light',
    toggleTheme: () => {
        set(state => {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return { theme: newTheme };
        });
    },


    connectSocket: () => {
        if (get().socket) return;

        const socket = io('http://localhost:3000');

        socket.on('connect', () => {
            console.log('Socket connected');
        });

        socket.on('media:update', (data) => {



            if (data.type === 'add') {
                const currentStreams = get().mediaSettings.streams;
                set(state => ({
                    mediaSettings: { ...state.mediaSettings, streams: [...currentStreams, data.stream] }
                }));
            } else if (data.type === 'update') {
                const currentStreams = get().mediaSettings.streams;
                const updated = currentStreams.map(s => s.id === data.stream.id ? data.stream : s);
                set(state => ({
                    mediaSettings: { ...state.mediaSettings, streams: updated }
                }));
            } else if (data.type === 'delete') {
                const currentStreams = get().mediaSettings.streams;
                const filtered = currentStreams.filter(s => s.id !== parseInt(data.id));
                set(state => ({
                    mediaSettings: { ...state.mediaSettings, streams: filtered }
                }));
            }
        });

        socket.on('stream:status', (data) => {
            set(state => ({
                mediaSettings: { ...state.mediaSettings, isLive: data.isLive }
            }));
        });

        socket.on('stats:viewers', (data) => {
            set({ currentViewers: data.count });
        });

        socket.on('settings:update', (data) => {
            set(state => ({
                eventSettings: { ...state.eventSettings, ...data }
            }));
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    },

    fetchMediaSettings: async () => {
        try {
            const response = await api.get('/media');

            const data = response.data;
            console.log('Fetched media settings data:', data);
            if (Array.isArray(data)) {
                set(state => ({
                    mediaSettings: { ...state.mediaSettings, streams: data }
                }));
            } else {
                set(state => ({
                    mediaSettings: {
                        ...state.mediaSettings,
                        streams: data.streams || [],
                        isLive: data.isLive ?? false
                    }
                }));
            }
        } catch (err) {
            console.error('Error fetching media settings:', err);
        }
    },

    toggleLive: async () => {
        try {
            const currentLive = get().mediaSettings.isLive;
            const response = await api.post('/media/live', { isLive: !currentLive });
            set(state => ({
                mediaSettings: { ...state.mediaSettings, isLive: response.data.isLive }
            }));
        } catch (err) {
            console.error(err);
        }
    },




    addStream: async (streamData, videoFile, posterFile) => {
        try {
            const formData = new FormData();
            formData.append('language', streamData.language);
            formData.append('title', streamData.title || '');
            formData.append('description', streamData.description || '');
            formData.append('url', streamData.url || '');

            if (streamData.type) formData.append('type', streamData.type);

            if (streamData.posterUrl) formData.append('poster_url', streamData.posterUrl);

            if (videoFile) formData.append('video', videoFile);
            if (posterFile) formData.append('poster', posterFile);

            const response = await api.post('/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });


            return response.data;
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    removeStream: async (id) => {
        try {
            await api.delete(`/media/${id}`);

        } catch (err) {
            console.error(err);
        }
    },

    updateStream: async (id, streamData, videoFile, posterFile) => {
        try {
            const formData = new FormData();
            if (streamData.language) formData.append('language', streamData.language);
            if (streamData.title) formData.append('title', streamData.title);
            if (streamData.description) formData.append('description', streamData.description);
            if (streamData.url) formData.append('url', streamData.url);
            if (streamData.type) formData.append('type', streamData.type);
            if (streamData.posterUrl) formData.append('poster_url', streamData.posterUrl);

            if (videoFile) formData.append('video', videoFile);
            if (posterFile) formData.append('poster', posterFile);

            const response = await api.put(`/media/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            return response.data;
        } catch (err) {
            console.error(err);
            throw err;
        }
    },


    users: [],
    stats: {
        totalUsers: 0,
        totalStreams: 0,
        activeStreams: 0,
        totalMessages: 0
    },
    stats: {
        totalUsers: 0,
        totalStreams: 0,
        activeStreams: 0,
        totalMessages: 0
    },
    currentViewers: 0,
    viewerStatsHistory: [],
    chatHistory: [],


    fetchUsers: async () => {
        try {
            const response = await api.get('/users');
            set({ users: response.data });
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    },

    toggleUserStatus: async (id, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'banned' : 'active';
            const response = await api.patch(`/users/${id}/status`, { status: newStatus });

            set(state => ({
                users: state.users.map(u => u.id === id ? response.data : u)
            }));
        } catch (err) {
            console.error('Error updating user status:', err);
        }
    },

    downloadUserTemplate: async () => {
        try {
            const response = await api.get('/users/import/template', { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'import_users_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error downloading template:', err);
        }
    },

    importUsers: async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/users/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            get().fetchUsers();
            return response.data;
        } catch (err) {
            console.error('Error importing users:', err);
            throw err;
        }
    },

    exportUsers: async () => {
        try {
            const response = await api.get('/users/export', { responseType: 'blob' });


            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_export.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error exporting users:', err);
        }
    },

    createUser: async (userData) => {
        try {
            await api.post('/users', userData);
            get().fetchUsers();
        } catch (err) {
            console.error('Error creating user:', err);
            throw err;
        }
    },

    updateUser: async (id, userData) => {
        try {
            await api.put(`/users/${id}`, userData);
            get().fetchUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            throw err;
        }
    },

    exportChat: async () => {
        try {
            const response = await api.get('/chat/export', { responseType: 'blob' });


            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'chat_history.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error exporting chat:', err);
        }
    },


    fetchChatHistory: async () => {
        try {
            const response = await api.get('/chat');
            set({ chatHistory: response.data });
        } catch (err) {
            console.error('Error fetching chat history:', err);
        }
    },

    deleteMessage: async (id) => {
        try {
            await api.delete(`/chat/${id}`);
            set(state => ({
                chatHistory: state.chatHistory.filter(msg => msg.id !== id)
            }));
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    },

    banUser: async (userId) => {
        try {
            await api.post(`/chat/users/${userId}/ban`);
            get().fetchUsers();

        } catch (err) {
            console.error('Error banning user:', err);
        }
    },

    unbanUser: async (userId) => {
        try {
            await api.post(`/chat/users/${userId}/unban`);
            get().fetchUsers();
        } catch (err) {
            console.error('Error unbanning user:', err);
        }
    },

    toggleHighlight: async (messageId) => {
        try {
            await api.put(`/chat/${messageId}/highlight`);


            set(state => ({
                chatHistory: state.chatHistory.map(msg =>
                    msg.id === messageId ? { ...msg, isHighlighted: !msg.isHighlighted } : msg
                )
            }));
        } catch (err) {
            console.error('Error highlighting message:', err);
        }
    },


    fetchStats: async () => {
        try {
            const response = await api.get('/stats');
            set({ stats: response.data });
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    },


    fetchSettings: async () => {
        try {
            const response = await api.get('/settings');
            set({
                eventSettings: response.data.settings,
                authFields: response.data.authFields
            });
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    },

    updateSettings: async (settingsData) => {
        try {
            const response = await api.put('/settings', settingsData);
            set(state => ({
                eventSettings: { ...state.eventSettings, ...response.data }
            }));
            return response.data;
        } catch (err) {
            console.error('Error updating settings:', err);
            throw err;
        }
    },

    updateAuthFields: async (fields) => {
        try {
            await api.put('/auth-fields', { fields });
            set({ authFields: fields });
        } catch (err) {
            console.error('Error updating auth fields:', err);
            throw err;
        }
    },

    uploadLogo: async (file) => {
        try {
            const formData = new FormData();
            formData.append('logo', file);
            const response = await api.post('/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            set(state => ({
                eventSettings: { ...state.eventSettings, logo_url: response.data.logoUrl }
            }));
            return response.data;
        } catch (err) {
            console.error('Error uploading logo:', err);
            throw err;
        }
    },

    uploadBackground: async (file) => {
        try {
            const formData = new FormData();
            formData.append('background', file);
            const response = await api.post('/background', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            set(state => ({
                eventSettings: { ...state.eventSettings, background_url: response.data.backgroundUrl }
            }));
            return response.data;
        } catch (err) {
            console.error('Error uploading background:', err);
            throw err;
        }
    },

    removeBackground: async () => {
        try {
            await api.delete('/background');
            set(state => ({
                eventSettings: { ...state.eventSettings, background_url: null }
            }));
        } catch (err) {
            console.error('Error removing background:', err);
            throw err;
        }
    },

    fetchAnalyticsHistory: async (interval = 'minute') => {
        try {
            const response = await api.get(`/stats/history?interval=${interval}`);

            const formatted = response.data.map(item => {
                const date = new Date(item.time_bucket);

                let timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (interval === 'day') {
                    timeLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }

                return {
                    time: timeLabel,
                    viewers: item.active_viewers
                };
            });
            set({ viewerStatsHistory: formatted });
        } catch (err) {
            console.error('Error fetching analytics history:', err);
        }
    },
    exportAudienceReport: async () => {
        try {
            const response = await api.get('/stats/audience/export', { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'audience_report.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error exporting audience report:', err);
        }
    },

    // Polls
    polls: [],
    fetchPolls: async () => {
        try {
            const response = await api.get('/polls');
            set({ polls: response.data });
        } catch (err) {
            console.error('Error fetching polls:', err);
        }
    },
    createPoll: async (pollData) => {
        try {
            await api.post('/polls', pollData);
            get().fetchPolls();
        } catch (err) {
            console.error('Error creating poll:', err);
            throw err;
        }
    },
    updatePollStatus: async (pollId, status) => {
        try {
            await api.put(`/polls/${pollId}/status`, status);
            get().fetchPolls();

            // Priority ordering for toast notifications
            if (status.show_results) {
                toast.success('Resultados da enquete liberados para os espectadores!');
            } else if (status.is_active === true) {
                toast.success('Enquete ativada com sucesso!');
            } else if (status.is_active === false) {
                toast.info('Enquete encerrada.');
            }
        } catch (err) {
            console.error('Error updating poll status:', err);
            throw err;
        }
    },
    deletePoll: async (pollId) => {
        try {
            await api.delete(`/polls/${pollId}`);
            get().fetchPolls();
            toast.success('Enquete excluída.');
        } catch (err) {
            console.error('Error deleting poll:', err);
            throw err;
        }
    },

    // Comments
    pendingComments: [],
    approvedComments: [],
    fetchPendingComments: async () => {
        try {
            const response = await api.get('/comments/pending');
            set({ pendingComments: response.data });
        } catch (err) {
            console.error('Error fetching pending comments:', err);
        }
    },
    approveComment: async (commentId) => {
        try {
            await api.put(`/comments/${commentId}/approve`);
            get().fetchPendingComments();
            toast.success('Comentário aprovado!');
        } catch (err) {
            console.error('Error approving comment:', err);
            throw err;
        }
    },
    deleteComment: async (commentId) => {
        try {
            await api.delete(`/comments/${commentId}`);
            get().fetchPendingComments();
            toast.warning('Comentário removido.');
        } catch (err) {
            console.error('Error deleting comment:', err);
            throw err;
        }
    },

    // Questions
    questions: [],
    fetchQuestions: async () => {
        try {
            const response = await api.get('/questions');
            set({ questions: response.data });
        } catch (err) {
            console.error('Error fetching questions:', err);
        }
    },
    displayQuestion: async (questionId, isGlobal = false) => {
        try {
            await api.put(`/questions/${questionId}/display`, { isGlobal });
            get().fetchQuestions();
            toast.success(isGlobal ? 'Pergunta exibida para TODOS!' : 'Pergunta exibida na tela local.');
        } catch (err) {
            console.error('Error displaying question:', err);
            throw err;
        }
    },
    deleteQuestion: async (questionId) => {
        try {
            await api.delete(`/questions/${questionId}`);
            get().fetchQuestions();
        } catch (err) {
            console.error('Error deleting question:', err);
            throw err;
        }
    }
}));
