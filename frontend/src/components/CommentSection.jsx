import { useState, useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { Send, Smile, Heart, Laugh, Frown, Angry, CheckCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';

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
    const [showSuccessModal, setShowSuccessModal] = useState(false);

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
            setShowSuccessModal(true);
        } catch (err) {
            toast.error('Erro ao enviar comentário');
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
        <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                Comentários
                <span className="text-xs sm:text-sm font-normal text-gray-500">({comments.length})</span>
            </h3>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs sm:text-base font-bold flex-shrink-0">
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

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-blue-600">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Comentário Enviado
                            </h3>
                            <button onClick={() => setShowSuccessModal(false)} className="text-white/80 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h4 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Recebemos seu comentário!</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                Seu comentário foi enviado para moderação e em breve estará disponível para todos.
                            </p>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                Entendi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
