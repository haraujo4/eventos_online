import { create } from 'zustand';
import api from '../services/api';

export const useReactionStore = create((set, get) => ({
    stats: { likes: 0, dislikes: 0 },
    userReaction: null,
    loading: false,

    updateStats: (newStats) => set({ stats: newStats }),

    fetchReactionStats: async (streamId) => {
        if (!streamId) return;
        set({ loading: true });
        try {
            const response = await api.get(`/reactions/${streamId}`);
            set({
                stats: response.data.stats,
                userReaction: response.data.userReaction,
                loading: false
            });
        } catch (error) {
            console.error('Error fetching reaction stats:', error);
            set({ loading: false });
        }
    },

    toggleReaction: async (streamId, type) => {
        const { userReaction, stats } = get();

        let newReaction = type;

        // Optimistic UI Update
        if (userReaction === type) {
            // Removing reaction
            newReaction = null;
            set({
                userReaction: null,
                stats: {
                    ...stats,
                    [type === 'like' ? 'likes' : 'dislikes']: stats[type === 'like' ? 'likes' : 'dislikes'] - 1
                }
            });

            try {
                const response = await api.delete('/reactions', { data: { streamId } });
                set({ stats: response.data.stats });
            } catch (error) {
                // Revert on error
                set({ userReaction, stats });
                console.error('Error removing reaction:', error);
            }

        } else {
            // Adding/Changing reaction
            set({
                userReaction: type,
                stats: {
                    likes: stats.likes + (type === 'like' ? 1 : (userReaction === 'like' ? -1 : 0)),
                    dislikes: stats.dislikes + (type === 'dislike' ? 1 : (userReaction === 'dislike' ? -1 : 0))
                }
            });

            try {
                const response = await api.post('/reactions', { streamId, type });
                set({
                    stats: response.data.stats,
                    userReaction: response.data.reaction.type
                });
            } catch (error) {
                // Revert
                set({ userReaction, stats });
                console.error('Error updating reaction:', error);
            }
        }
    }
}));
