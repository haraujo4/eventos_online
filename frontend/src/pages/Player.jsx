import { ThemeToggle } from '../components/ThemeToggle';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, ThumbsUp, ThumbsDown } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import { useReactionStore } from '../store/useReactionStore';
import { useEffect, useState } from 'react';
import { BarChart2, HelpCircle } from 'lucide-react';
import api from '../services/api';
import PollModal from '../components/PollModal';
import QuestionBanner from '../components/QuestionBanner';
import QuestionForm from '../components/QuestionForm';
import CommentSection from '../components/CommentSection';

export default function Player() {
    const { user, logout } = useAuthStore();
    const { mediaSettings, eventSettings, connectSocket, disconnectSocket, fetchMediaSettings, fetchSettings } = useAdminStore();
    const { stats, userReaction, fetchReactionStats, toggleReaction } = useReactionStore();
    const navigate = useNavigate();



    const [localActiveStream, setLocalActiveStream] = useState(null);
    const [isPollOpen, setIsPollOpen] = useState(false);
    const [isQuestionOpen, setIsQuestionOpen] = useState(false);
    const [hasActivePoll, setHasActivePoll] = useState(false);

    useEffect(() => {
        const checkPoll = async () => {
            try {
                const res = await api.get('/polls/active');
                setHasActivePoll(!!res.data);
            } catch (err) { }
        };
        checkPoll();
    }, []);

    useEffect(() => {
        if (mediaSettings.streams.length > 0 && !localActiveStream) {
            setLocalActiveStream(mediaSettings.streams[0]);
        }
    }, [mediaSettings.streams, localActiveStream]);

    useEffect(() => {
        if (localActiveStream?.id) {
            fetchReactionStats(localActiveStream.id);
        }
    }, [localActiveStream?.id, fetchReactionStats]);


    useEffect(() => {
        const handleLangChange = (e) => {
            const streamId = e.detail;
            const stream = mediaSettings.streams.find(s => s.id === streamId);
            if (stream) setLocalActiveStream(stream);
        };
        document.addEventListener('change-language', handleLangChange);
        return () => document.removeEventListener('change-language', handleLangChange);
    }, [mediaSettings.streams]);

    useEffect(() => {
        fetchMediaSettings();
        fetchSettings();
        connectSocket();





        const socket = useAdminStore.getState().socket;
        if (socket && user) {
            socket.emit('join:viewers', { userId: user.id });

            socket.on('reaction:update', ({ streamId, stats }) => {
                if (localActiveStream?.id === streamId) {
                    useReactionStore.getState().updateStats(stats);
                }
            });

            socket.on('poll:new', () => setHasActivePoll(true));
            socket.on('poll:closed', () => setHasActivePoll(false));
        }

        return () => {
            const socket = useAdminStore.getState().socket;
            if (socket) {
                socket.emit('leave:viewers');
                socket.off('reaction:update');
                socket.off('poll:new');
                socket.off('poll:closed');
            }
            disconnectSocket();
        };
    }, [connectSocket, disconnectSocket, fetchMediaSettings, fetchSettings, user, localActiveStream?.id]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
            { }
            <header className="sticky top-0 h-16 px-6 bg-white dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center backdrop-blur-sm z-50">
                <div className="flex items-center gap-2">
                    {eventSettings?.logo_url ? (
                        <img
                            src={eventSettings.logo_url.startsWith('http') ? eventSettings.logo_url : `http://localhost:3000${eventSettings.logo_url}`}
                            alt="Event Logo"
                            className="w-8 h-8 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            <span className="font-bold">{eventSettings?.event_name?.charAt(0) || 'E'}</span>
                        </div>
                    )}
                    <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">{eventSettings?.event_name || 'Evento Corporativo'}</h1>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {(user?.role === 'admin' || user?.role === 'moderator') && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Painel Admin
                        </button>
                    )}
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name || 'Visitante'}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role || 'Espectador'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-500 dark:hover:bg-red-500/10 dark:text-gray-400 dark:hover:text-red-400 rounded-lg transition-colors"
                        title="Sair"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col lg:flex-row relative">
                {/* Video Area */}
                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Video Player Container */}
                    <div className="w-full bg-black flex justify-center flex-shrink-0">
                        <div className="w-full lg:max-w-[75%] aspect-video relative">
                            <VideoPlayer
                                streams={mediaSettings.streams}
                                poster={mediaSettings.posterUrl}
                                isLive={mediaSettings.isLive}
                            />
                            <QuestionBanner />
                        </div>
                    </div>

                    {/* Stream Info & Controls */}
                    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex-shrink-0 transition-colors">
                        {/* Header & Language Select */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {localActiveStream?.title || "Transmissão ao Vivo do Evento"}
                                </h2>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${mediaSettings.isLive ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                        {mediaSettings.isLive ? 'AO VIVO' : 'OFFLINE'}
                                    </span>

                                    {(hasActivePoll || eventSettings?.polls_enabled) && (
                                        <button
                                            onClick={() => setIsPollOpen(true)}
                                            className={`flex items-center gap-1.5 px-3 py-0.5 rounded text-xs font-bold uppercase tracking-wider transition-all animate-pulse shadow-lg ${hasActivePoll ? 'bg-blue-600 text-white ring-2 ring-blue-400/50' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                                        >
                                            <BarChart2 className="w-3 h-3" />
                                            Enquete
                                        </button>
                                    )}
                                    <span>•</span>
                                    <span>{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                {/* Reaction Buttons */}
                                <div className={`flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg ${!localActiveStream?.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <button
                                        onClick={() => toggleReaction(localActiveStream?.id, 'like')}
                                        disabled={!localActiveStream?.id}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-l-md transition-colors ${userReaction === 'like'
                                            ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        title="Gostei"
                                    >
                                        <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                                        <span className="text-sm font-medium">{stats.likes}</span>
                                    </button>
                                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                                    <button
                                        onClick={() => toggleReaction(localActiveStream?.id, 'dislike')}
                                        disabled={!localActiveStream?.id}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-r-md transition-colors ${userReaction === 'dislike'
                                            ? 'text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            }`}
                                        title="Não gostei"
                                    >
                                        <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                                        <span className="text-sm font-medium">{stats.dislikes}</span>
                                    </button>
                                </div>

                                {/* Language Pills */}
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    {mediaSettings.streams.map(stream => (
                                        <button
                                            key={stream.id}
                                            onClick={() => document.dispatchEvent(new CustomEvent('change-language', { detail: stream.id }))}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${(localActiveStream?.id === stream.id)
                                                ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {stream.language}
                                        </button>
                                    ))}
                                </div>

                                {eventSettings?.questions_enabled && (
                                    <button
                                        onClick={() => setIsQuestionOpen(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        Perguntar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {localActiveStream?.description || "Nenhuma descrição disponível para esta transmissão."}
                            </p>
                        </div>

                        {/* Comments Section */}
                        {eventSettings?.comments_enabled && (
                            <CommentSection streamId={localActiveStream?.id} />
                        )}
                    </div>
                </div>

                {/* Sidebar (Chat) */}
                {eventSettings?.chat_enabled && (
                    <aside className="w-full lg:w-96 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 flex-shrink-0 transition-colors z-40">
                        <Chat />
                    </aside>
                )}
            </main>

            {/* Modals */}
            <PollModal isOpen={isPollOpen} onClose={() => setIsPollOpen(false)} />
            <QuestionForm isOpen={isQuestionOpen} onClose={() => setIsQuestionOpen(false)} streamId={localActiveStream?.id} />
        </div>
    );
}
