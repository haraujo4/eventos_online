import { useState, useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { Send, Smile, Heart, Laugh, Frown, Angry } from 'lucide-react';

const EMOJI_MAP = {
    happy: { icon: Smile, label: 'Feliz', color: 'text-yellow-500' },
    funny: { icon: Laugh, label: 'Engraçado', color: 'text-orange-500' },
    love: { icon: Heart, label: 'Amei', color: 'text-red-500' },
    sad: { icon: Frown, label: 'Triste', color: 'text-blue-500' },
    angry: { icon: Angry, label: 'Bravo', color: 'text-red-700' },
};

export default function CommentSection({ streamId }) {
    const { socket, eventSettings } = useAdminStore();
    const { user } = useAuthStore();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = async () => {
        if (!streamId) return;
        try {
            const response = await api.get(`/comments/stream/${streamId}`);
            setComments(response.data);
        } catch (err) {
            console.error('Failed to fetch comments');
        }
    };

    useEffect(() => {
        fetchComments();

        if (socket) {
            socket.on('comment:new', (comment) => {
                if (comment.stream_id === streamId) {
                    setComments(prev => [...prev, comment]);
                }
            });
            socket.on('comment:deleted', ({ id }) => {
                setComments(prev => prev.filter(c => c.id !== parseInt(id)));
            });
            socket.on('comment:reaction', ({ commentId, reactions }) => {
                setComments(prev => prev.map(c =>
                    c.id === commentId ? { ...c, reactions } : c
                ));
            });
        }

        return () => {
            if (socket) {
                socket.off('comment:new');
                socket.off('comment:deleted');
                socket.off('comment:reaction');
            }
        };
    }, [streamId, socket]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await api.post('/comments', { streamId, content: newComment });
            setNewComment('');
            alert('Comentário enviado para moderação!');
        } catch (err) {
            alert('Erro ao enviar comentário');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReact = async (commentId, type) => {
        try {
            await api.post('/comments/react', { commentId, type });
        } catch (err) {
            console.error('Failed to react');
        }
    };

    if (!eventSettings?.comments_enabled) return null;

    return (
        <div className="mt-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
                Comentários
                <span className="text-sm font-normal text-gray-500">({comments.length})</span>
            </h3>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 space-y-2">
                    <textarea
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Deixe seu comentário..."
                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-blue-500 transition-colors py-1 resize-none h-10 focus:h-20 outline-none"
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={!newComment.trim() || isSubmitting}
                            className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Comentar
                        </button>
                    </div>
                </div>
            </form>

            {/* List */}
            <div className="space-y-6 pt-4">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold flex-shrink-0">
                            {comment.user_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{comment.user_name}</span>
                                <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>

                            {/* Reactions */}
                            <div className="flex items-center gap-2 mt-2">
                                {Object.entries(EMOJI_MAP).map(([type, { icon: Icon, color }]) => {
                                    const reaction = comment.reactions?.find(r => r.type === type);
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => handleReact(comment.id, type)}
                                            className={`flex items-center gap-1 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${reaction ? 'ring-1 ring-blue-500/30 bg-blue-50 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <Icon className={`w-3.5 h-3.5 ${color}`} />
                                            {reaction && <span className="text-[10px] font-bold">{reaction.count}</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
