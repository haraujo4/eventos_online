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

        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000');

        socket.on('connect', () => {
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

        socket.on('stats:viewers:streams', (counts) => {
            set({ streamViewers: counts });
        });

        socket.on('stats:activity', (activity) => {
            set(state => ({
                stats: {
                    ...state.stats,
                    recentActivity: [activity, ...(state.stats?.recentActivity || [])].slice(0, 5)
                }
            }));
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
            // A API agora retorna { events: [], isLive: boolean }
            const { events, isLive } = response.data;
            
            set(state => ({
                mediaSettings: { 
                    ...state.mediaSettings, 
                    streams: events || [],
                    isLive: isLive ?? false
                }
            }));
        } catch (err) {
            console.error('Error fetching media settings:', err);
        }
    },

    fetchEventById: async (id) => {
        try {
            const response = await api.get(`/media/${id}`);
            return response.data;
        } catch (err) {
            console.error('Error fetching event by id:', err);
            return null;
        }
    },

    toggleLive: async () => {
        try {
            const currentLive = get().mediaSettings.isLive;
            const response = await api.post('/media/live', { is_live: !currentLive });
            const newState = response.data.isLive;
            
            set(state => ({
                mediaSettings: { ...state.mediaSettings, isLive: newState }
            }));

            if (newState) {
                toast.success('Modo AO VIVO ativado!');
            } else {
                toast.info('Modo AO VIVO desativado.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Erro ao alternar modo ao vivo');
        }
    },




    addEvent: async (eventData, posterFile, videoFiles = []) => {
        try {
            const formData = new FormData();
            formData.append('title', eventData.title || '');
            formData.append('description', eventData.description || '');
            formData.append('category', eventData.category || 'Geral');
            formData.append('is_featured', eventData.is_featured);
            formData.append('scheduled_at', eventData.scheduled_at || '');
            if (eventData.poster_url) formData.append('posterUrl', eventData.poster_url);
            
            // Interaction Flags
            formData.append('chat_enabled', eventData.chat_enabled ?? true);
            formData.append('chat_global', eventData.chat_global ?? true);
            formData.append('chat_moderated', eventData.chat_moderated ?? false);
            formData.append('polls_enabled', eventData.polls_enabled ?? true);
            formData.append('questions_enabled', eventData.questions_enabled ?? true);
            formData.append('comments_enabled', eventData.comments_enabled ?? true);
            formData.append('is_live', eventData.is_live ?? false);
            
            // Critical fix: Handle both 'languages' and 'streams'
            const streamsToAdd = eventData.languages || eventData.streams || [];
            formData.append('streams', JSON.stringify(streamsToAdd));

            if (posterFile) formData.append('poster', posterFile);
            
            // Adicionar arquivos de vídeo indexados
            videoFiles.forEach((file, index) => {
                if (file) formData.append(`video_${index}`, file);
            });

            const response = await api.post('/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            get().fetchMediaSettings();
            return response.data;
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    updateEvent: async (id, eventData, posterFile, videoFiles = []) => {
        try {
            const formData = new FormData();
            formData.append('title', eventData.title || '');
            formData.append('description', eventData.description || '');
            formData.append('category', eventData.category || 'Geral');
            formData.append('is_featured', eventData.is_featured);
            formData.append('scheduled_at', eventData.scheduled_at || '');
            if (eventData.poster_url) formData.append('posterUrl', eventData.poster_url);

            // Interaction Flags - Ensure we use consistent naming and fallbacks
            formData.append('chat_enabled', eventData.chat_enabled ?? true);
            formData.append('chat_global', eventData.chat_global ?? true);
            formData.append('chat_moderated', eventData.chat_moderated ?? false);
            formData.append('polls_enabled', eventData.polls_enabled ?? true);
            formData.append('questions_enabled', eventData.questions_enabled ?? true);
            formData.append('comments_enabled', eventData.comments_enabled ?? true);
            formData.append('is_live', eventData.is_live ?? false);
            
            // Critical fix: Handle both 'languages' (from MediaConfig) and 'streams' (from API/Store)
            const streamsToUpdate = eventData.languages || eventData.streams || [];
            formData.append('streams', JSON.stringify(streamsToUpdate));

            if (posterFile) formData.append('poster', posterFile);
            
            videoFiles.forEach((file, index) => {
                if (file) formData.append(`video_${index}`, file);
            });

            await api.put(`/media/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            get().fetchMediaSettings();
            return true;
        } catch (err) {
            console.error(err);
            throw err;
        }
    },

    removeEvent: async (id) => {
        try {
            await api.delete(`/media/${id}`);
            await get().fetchMediaSettings();
        } catch (err) {
            console.error(err);
        }
    },

    toggleEventLive: async (id, currentIsLive) => {
        try {
            const newStatus = !currentIsLive;
            await api.patch(`/media/${id}/live`, { is_live: newStatus });
            get().fetchMediaSettings();
            
            if (newStatus) {
                toast.success('Evento agora está AO VIVO!');
            } else {
                toast.info('Evento não está mais ao vivo.');
            }
            return true;
        } catch (err) {
            console.error(err);
            toast.error('Erro ao alternar modo ao vivo do evento');
            return false;
        }
    },

    updateStream: async (id, streamData, videoFile, posterFile) => {
        try {
            const formData = new FormData();
            if (streamData.language) formData.append('language', streamData.language);
            if (streamData.title) formData.append('title', streamData.title);
            if (streamData.description) formData.append('description', streamData.description);
            if (streamData.url) formData.append('url', streamData.url);
            if (streamData.category) formData.append('category', streamData.category);
            if (streamData.is_featured !== undefined) formData.append('is_featured', streamData.is_featured);
            if (streamData.scheduled_at) formData.append('scheduled_at', streamData.scheduled_at);
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
        totalMessages: 0,
        totalLikes: 0,
        totalDislikes: 0,
        totalPollVotes: 0,
        pendingModeration: 0,
        recentActivity: []
    },
    currentViewers: 0,
    streamViewers: {}, // Map of streamId -> count
    viewerStatsHistory: [],
    onlineUsers: [], // List of users currently online
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

    exportChat: async (eventId = null) => {
        try {
            const query = eventId ? `?eventId=${eventId}` : '';
            const response = await api.get(`/chat/export${query}`, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', eventId ? `chat_history_event_${eventId}.xlsx` : 'chat_history_geral.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error exporting chat:', err);
        }
    },


    fetchChatHistory: async (eventId = null) => {
        try {
            const query = eventId ? `?includeAll=true&streamId=${eventId}` : '?includeAll=true';
            const response = await api.get(`/chat${query}`);
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


    fetchStats: async (eventId = null) => {
        try {
            const query = eventId ? `?eventId=${eventId}` : '';
            const response = await api.get(`/stats${query}`);
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

    fetchAnalyticsHistory: async (interval = 'minute', eventId = null) => {
        try {
            const query = eventId ? `&eventId=${eventId}` : '';
            const response = await api.get(`/stats/history?interval=${interval}${query}`);

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

    fetchOnlineUsers: async (eventId = null) => {
        try {
            const query = eventId ? `?eventId=${eventId}` : '';
            const response = await api.get(`/stats/online${query}`);
            set({ onlineUsers: response.data });
        } catch (err) {
            console.error('Error fetching online users:', err);
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
    },

    // Event Reset
    resetEvent: async () => {
        try {
            await api.delete('/settings/reset');
            // Clear local state after reset
            set({
                users: [],
                chatHistory: [],
                polls: [],
                pendingComments: [],
                approvedComments: [],
                questions: []
            });
        } catch (err) {
            console.error('Error resetting event:', err);
            throw err;
        }
    }
}));
