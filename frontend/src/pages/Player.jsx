import { ThemeToggle } from '../components/ThemeToggle';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, ThumbsUp, ThumbsDown, BarChart2, HelpCircle, LayoutDashboard, MessageSquare, X } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import { useReactionStore } from '../store/useReactionStore';
import { useEffect, useState } from 'react';
import api from '../services/api';
import PollModal from '../components/PollModal';
import QuestionBanner from '../components/QuestionBanner';
import QuestionForm from '../components/QuestionForm';
import CommentSection from '../components/CommentSection';
import { toast } from 'react-toastify';

export default function Player() {
    const { user, logout } = useAuthStore();
    const { mediaSettings, eventSettings, connectSocket, disconnectSocket, fetchMediaSettings, fetchSettings } = useAdminStore();
    const { stats, userReaction, fetchReactionStats, toggleReaction } = useReactionStore();
    const navigate = useNavigate();



    const [localActiveStream, setLocalActiveStream] = useState(null);
    const [isPollOpen, setIsPollOpen] = useState(false);
    const [isQuestionOpen, setIsQuestionOpen] = useState(false);
    const [hasActivePoll, setHasActivePoll] = useState(false);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    useEffect(() => {
        const checkPoll = async () => {
            if (!localActiveStream?.id) return;
            try {
                const res = await api.get(`/polls/active?streamId=${localActiveStream.id}`);
                setHasActivePoll(!!res.data);
            } catch (err) { }
        };
        checkPoll();
    }, [localActiveStream?.id]);

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

            socket.on('poll:new', (poll) => {
                const normalize = (val) => (val === null || val === undefined || val === 'null' || val === '') ? null : Number(val);
                const incomingStreamId = normalize(poll.stream_id);
                const currentStreamId = normalize(localActiveStream?.id);

                if (incomingStreamId === null || incomingStreamId === currentStreamId) {
                    setHasActivePoll(true);
                }
            });

            socket.on('poll:results', (data) => {
                const normalize = (val) => (val === null || val === undefined || val === 'null' || val === '') ? null : Number(val);
                const incomingStreamId = normalize(data.streamId);
                const currentStreamId = normalize(localActiveStream?.id);

                if (incomingStreamId === null || incomingStreamId === currentStreamId) {
                    setIsPollOpen(true); // Open modal to show results
                }
            });

            socket.on('poll:closed', (data) => {
                const normalize = (val) => (val === null || val === undefined || val === 'null' || val === '') ? null : Number(val);
                const incomingStreamId = normalize(data.streamId);
                const currentStreamId = normalize(localActiveStream?.id);

                if (incomingStreamId === null || incomingStreamId === currentStreamId) {
                    setHasActivePoll(false);
                }
            });
        }

        return () => {
            const socket = useAdminStore.getState().socket;
            if (socket) {
                socket.emit('leave:viewers');
                socket.off('reaction:update');
                socket.off('poll:new');
                socket.off('poll:closed');
                socket.off('poll:results');
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
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                            title="Painel Admin"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm">Painel Admin</span>
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
                <div className="flex-1 min-w-0 flex flex-col overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 transition-colors">
                    {/* Video Player Container */}
                    <div className="w-full bg-black flex justify-center flex-shrink-0">
                        <div className={`w-full ${eventSettings?.chat_enabled ? 'lg:max-w-[75%]' : 'lg:max-w-[65%]'} aspect-video relative`}>
                            <VideoPlayer
                                streams={mediaSettings.streams}
                                poster={mediaSettings.posterUrl}
                                isLive={mediaSettings.isLive}
                            />
                            <QuestionBanner streamId={localActiveStream?.id} />
                        </div>
                    </div>

                    {/* Stream Info & Controls */}
                    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 sm:p-6 flex-shrink-0 transition-colors">
                        {/* Header & Language Select */}
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                                    {localActiveStream?.title || "Transmissão ao Vivo do Evento"}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider ${mediaSettings.isLive ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                        {mediaSettings.isLive ? 'AO VIVO' : 'OFFLINE'}
                                    </span>

                                    {eventSettings?.polls_enabled && hasActivePoll && (
                                        <button
                                            onClick={() => setIsPollOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-0.5 bg-blue-600 text-white rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider animate-pulse ring-2 ring-blue-400/50 shadow-lg"
                                        >
                                            <BarChart2 className="w-3 h-3" />
                                            Enquete
                                        </button>
                                    )}

                                    {eventSettings?.questions_enabled && (
                                        <button
                                            onClick={() => setIsQuestionOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-0.5 bg-purple-600 text-white rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider hover:bg-purple-700 transition-colors shadow-lg"
                                        >
                                            <HelpCircle className="w-3 h-3" />
                                            Perguntar
                                        </button>
                                    )}

                                    <span className="text-gray-400">•</span>
                                    <span className="text-[10px] sm:text-xs">{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 mt-2">
                                {/* Actions Bar: Reactions & Languages */}
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                    {/* Reaction Buttons */}
                                    <div className={`flex items-center h-10 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl ${!localActiveStream?.id ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <button
                                            onClick={() => toggleReaction(localActiveStream?.id, 'like')}
                                            disabled={!localActiveStream?.id}
                                            className={`flex items-center gap-2 px-3 h-full rounded-lg transition-all ${userReaction === 'like'
                                                ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            title="Gostei"
                                        >
                                            <ThumbsUp className={`w-4 h-4 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                                            <span className="text-xs sm:text-sm font-bold">{stats.likes}</span>
                                        </button>
                                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
                                        <button
                                            onClick={() => toggleReaction(localActiveStream?.id, 'dislike')}
                                            disabled={!localActiveStream?.id}
                                            className={`flex items-center gap-2 px-3 h-full rounded-lg transition-all ${userReaction === 'dislike'
                                                ? 'text-red-600 dark:text-red-400 bg-white dark:bg-gray-700 shadow-sm'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            title="Não gostei"
                                        >
                                            <ThumbsDown className={`w-4 h-4 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                                            <span className="text-xs sm:text-sm font-bold">{stats.dislikes}</span>
                                        </button>
                                    </div>

                                    {/* Language Pills */}
                                    <div className="flex items-center h-10 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                        {mediaSettings.streams.map(stream => (
                                            <button
                                                key={stream.id}
                                                onClick={() => document.dispatchEvent(new CustomEvent('change-language', { detail: stream.id }))}
                                                className={`px-4 h-full rounded-lg text-xs sm:text-sm font-bold transition-all ${(localActiveStream?.id === stream.id)
                                                    ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {stream.language}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-800">
                            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
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
                    <>
                        {/* Mobile Overlay */}
                        {isMobileChatOpen && (
                            <div
                                className="lg:hidden fixed inset-0 bg-black/50 z-[90] backdrop-blur-sm transition-opacity"
                                onClick={() => setIsMobileChatOpen(false)}
                            />
                        )}

                        {/* Mobile Floating Button */}
                        <button
                            onClick={() => setIsMobileChatOpen(true)}
                            className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50 active:scale-90 transition-transform"
                        >
                            <MessageSquare className="w-6 h-6" />
                        </button>

                        {/* Chat Container */}
                        <aside className={`
                            w-full lg:w-96 flex-shrink-0 transition-all duration-300 z-[100] lg:z-40
                            fixed inset-0 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] overflow-y-auto no-scrollbar
                            ${isMobileChatOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                        `}>
                            <div className="h-full relative bg-white dark:bg-gray-900 flex flex-col">
                                {/* Mobile Header Close */}
                                <div className="lg:hidden p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                                    <h3 className="font-bold">Chat</h3>
                                    <button onClick={() => setIsMobileChatOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <Chat />
                                </div>
                            </div>
                        </aside>
                    </>
                )}
            </main>

            {/* Modals */}
            <PollModal isOpen={isPollOpen} onClose={() => setIsPollOpen(false)} streamId={localActiveStream?.id} />
            <QuestionForm isOpen={isQuestionOpen} onClose={() => setIsQuestionOpen(false)} streamId={localActiveStream?.id} />
        </div>
    );
}
