import { ThemeToggle } from '../components/ThemeToggle';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, BarChart2, HelpCircle, LayoutDashboard, MessageSquare, X, Clock, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import { useReactionStore } from '../store/useReactionStore';
import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../services/api';
import PollModal from '../components/PollModal';
import QuestionBanner from '../components/QuestionBanner';
import QuestionForm from '../components/QuestionForm';
import CommentSection from '../components/CommentSection';
import ShareModal from '../components/ShareModal';
import { useChatStore } from '../store/useChatStore';
import { getFullImageUrl } from '../utils/urlHelper';

export default function Player() {
    const { user, logout } = useAuthStore();
    const { mediaSettings, eventSettings, connectSocket, disconnectSocket, fetchEventById, fetchSettings } = useAdminStore();
    const { fetchReactionStats, stats, userReaction, toggleReaction } = useReactionStore();
    
    const setActiveStream = useChatStore(state => state.setActiveStream);
    const fetchMessages = useChatStore(state => state.fetchMessages);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('id');

    const [currentEvent, setCurrentEvent] = useState(null);
    const [localActiveStream, setLocalActiveStream] = useState(null);
    const [isPollOpen, setIsPollOpen] = useState(false);
    const [isQuestionOpen, setIsQuestionOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [hasActivePoll, setHasActivePoll] = useState(false);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

    useEffect(() => {
        if (eventId) {
            fetchEventById(eventId).then(data => {
                if (data) {
                    setCurrentEvent(data);
                    if (data.streams && data.streams.length > 0) {
                        setLocalActiveStream(data.streams[0]);
                    }
                }
            });
        }
    }, [eventId, fetchEventById]);

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
        if (localActiveStream?.id) {
            fetchReactionStats(localActiveStream.id);
            setActiveStream(localActiveStream.id);
            fetchMessages(localActiveStream.id);
        }
    }, [localActiveStream?.id, fetchReactionStats, setActiveStream, fetchMessages]);

    useEffect(() => {
        fetchSettings();
        connectSocket();

        const socket = useAdminStore.getState().socket;
        if (socket && user && localActiveStream?.id) {
            socket.emit('join:viewers', { userId: user.id, streamId: localActiveStream.id });

            socket.on('reaction:update', ({ streamId, stats }) => {
                if (localActiveStream?.id === streamId) {
                    useReactionStore.getState().updateStats(stats);
                }
            });

            socket.on('poll:new', (poll) => {
                const incomingStreamId = (poll.stream_id === 'null' || !poll.stream_id) ? null : Number(poll.stream_id);
                const currentStreamId = localActiveStream?.id;
                if (!incomingStreamId || incomingStreamId === currentStreamId) setHasActivePoll(true);
            });

            socket.on('poll:results', (data) => {
                const incomingStreamId = (data.streamId === 'null' || !data.streamId) ? null : Number(data.streamId);
                const currentStreamId = localActiveStream?.id;
                if (!incomingStreamId || incomingStreamId === currentStreamId) setIsPollOpen(true);
            });

            socket.on('poll:closed', (data) => {
                const incomingStreamId = (data.streamId === 'null' || !data.streamId) ? null : Number(data.streamId);
                const currentStreamId = localActiveStream?.id;
                if (!incomingStreamId || incomingStreamId === currentStreamId) setHasActivePoll(false);
            });

            socket.on('media:update', ({ type, event }) => {
                if (event.id === Number(eventId)) {
                    setCurrentEvent(event);
                    if (localActiveStream) {
                        const updatedStream = event.streams.find(s => s.id === localActiveStream.id);
                        if (updatedStream) setLocalActiveStream(updatedStream);
                    }
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
                socket.off('media:update');
            }
            disconnectSocket();
        };
    }, [connectSocket, disconnectSocket, fetchSettings, user, localActiveStream?.id]);

    const handleLogout = useCallback(() => {
        logout();
        navigate('/');
    }, [logout, navigate]);

    const handleLanguageChange = useCallback((stream) => {
        setLocalActiveStream(stream);
    }, []);

    if (!currentEvent) {
        return (
            <div className="h-screen bg-[#050510] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const isFeatureEnabled = (feature) => {
        if (!currentEvent) return false;
        
        const flagKey = `${feature}_enabled`;
        const eventValue = currentEvent[flagKey];

        // 1. If disabled at Event Level, it's OFF for everyone
        if (eventValue === false) return false;
        
        // 2. If enabled at Event Level, check for Stream Level override
        if (eventValue === true || eventValue === null || eventValue === undefined) {
            const streamValue = localActiveStream ? localActiveStream[flagKey] : null;
            // If stream has a specific override (true or false), use it
            if (streamValue === false) return false;
            if (streamValue === true) return true;
            
            // If event was null/undefined but we interpreted as allowed, or if it was true
            return eventValue ?? true; 
        }

        return false;
    };

    const chatEnabledAtEvent = currentEvent.chat_enabled ?? true;
    const chatEnabledAtStream = localActiveStream ? (localActiveStream.chat_enabled ?? true) : true;
    
    // Chat is ONLY hidden if disabled at the specific language/stream level
    const isChatVisible = chatEnabledAtStream;
    
    const pollsEnabled = isFeatureEnabled('polls');
    const questionsEnabled = isFeatureEnabled('questions');
    const commentsEnabled = isFeatureEnabled('comments');

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans overflow-hidden">
            <header className="h-16 flex-shrink-0 px-6 bg-white dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center z-50">
                <div className="flex items-center gap-2">
                    {eventSettings?.logo_url ? (
                        <img
                            src={getFullImageUrl(eventSettings.logo_url)}
                            alt="Logo"
                            className="h-8 object-contain cursor-pointer"
                            onClick={() => navigate('/')}
                        />
                    ) : (
                        <h1 
                            className="text-lg font-black tracking-tighter bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent italic cursor-pointer uppercase"
                            onClick={() => navigate('/')}
                        >
                            {eventSettings?.event_name || 'EVENTOS ONLINE'}
                        </h1>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    {(user?.role === 'admin' || user?.role === 'moderator') && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:px-4 sm:py-2 rounded-lg font-bold flex items-center gap-2"
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span className="hidden sm:inline text-[10px] uppercase font-black">Admin</span>
                        </button>
                    )}
                    <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500" title="Sair">
                        <LogOut className="w-5 h-5" />
                    </button>
                    
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                <div className="flex-1 min-w-0 flex flex-col overflow-y-auto no-scrollbar bg-white dark:bg-gray-900">
                    <div className="w-full bg-black flex justify-center flex-shrink-0">
                        <div className="w-full aspect-video relative">
                            {localActiveStream && (
                                <VideoPlayer
                                    key={localActiveStream.id}
                                    streams={currentEvent.streams}
                                    activeStreamId={localActiveStream.id}
                                    poster={currentEvent.poster_url}
                                    isLive={currentEvent.is_live}
                                    onLanguageChange={handleLanguageChange}
                                />
                            )}
                            <QuestionBanner streamId={localActiveStream?.id} eventId={currentEvent.id} />
                        </div>
                    </div>

                    <div className="p-4 sm:p-8 max-w-5xl mx-auto w-full">
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b dark:border-gray-800 pb-8">
                            <div className="flex-1">
                                <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tighter uppercase italic">
                                    {currentEvent.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${currentEvent.is_live ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'}`}>
                                            {currentEvent.is_live ? '• AO VIVO' : '• OFFLINE'}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                            {currentEvent.category}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                                            <Clock className="w-3 h-3" /> {new Date(currentEvent.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 ml-auto">
                                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-1 py-1 mr-2 border border-gray-200 dark:border-gray-700">
                                            <button 
                                                onClick={() => toggleReaction(localActiveStream?.id, 'like')}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${userReaction === 'like' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500'}`}
                                            >
                                                <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === 'like' ? 'fill-current' : ''}`} />
                                                <span className="text-[10px] font-black">{stats.likes || 0}</span>
                                            </button>
                                            <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                            <button 
                                                onClick={() => toggleReaction(localActiveStream?.id, 'dislike')}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${userReaction === 'dislike' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500'}`}
                                            >
                                                <ThumbsDown className={`w-3.5 h-3.5 ${userReaction === 'dislike' ? 'fill-current' : ''}`} />
                                                <span className="text-[10px] font-black">{stats.dislikes || 0}</span>
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setIsShareOpen(true)}
                                            className="bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-blue-600 p-2.5 rounded-full transition-all border border-gray-200 dark:border-gray-700"
                                            title="Compartilhar"
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>

                                        {questionsEnabled && (
                                            <button
                                                onClick={() => setIsQuestionOpen(true)}
                                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
                                            >
                                                <HelpCircle className="w-3.5 h-3.5" /> Fazer Pergunta
                                            </button>
                                        )}
                                        {pollsEnabled && hasActivePoll && (
                                            <button
                                                onClick={() => setIsPollOpen(true)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 animate-bounce"
                                            >
                                                <BarChart2 className="w-3.5 h-3.5" /> Enquetes
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {currentEvent.streams.length > 1 && (
                            <div className="flex gap-2 mb-8">
                                {currentEvent.streams.map(stream => (
                                    <button
                                        key={stream.id}
                                        onClick={() => setLocalActiveStream(stream)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${localActiveStream?.id === stream.id 
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent' 
                                            : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {stream.language}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-gray-50 dark:bg-gray-800/40 rounded-3xl p-8 border border-gray-100 dark:border-white/5">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">DESCRIÇÃO</h4>
                            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed font-medium">
                                {currentEvent.description}
                            </p>
                        </div>

                        <div className="mt-12">
                            {/* Comment Section (Read-only if disabled, hidden if disabled and empty) */}
                            <CommentSection 
                                streamId={localActiveStream?.id} 
                                eventId={currentEvent.id} 
                                isEnabled={commentsEnabled} 
                            />
                        </div>
                    </div>
                </div>

                {isChatVisible && (
                    <aside className={`
                        w-full lg:w-[400px] flex-shrink-0 order-first lg:order-last
                        ${isMobileChatOpen ? 'fixed inset-0 z-[60] flex' : 'hidden lg:flex'}
                        bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800
                        h-full flex flex-col overflow-hidden
                    `}>
                        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                            {isMobileChatOpen && (
                                <button 
                                    onClick={() => setIsMobileChatOpen(false)}
                                    className="absolute top-4 right-4 z-50 p-2 bg-gray-100 dark:bg-gray-800 rounded-full lg:hidden"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                            {/* Pass global chat_enabled to determine if it's read-only */}
                            <Chat 
                                eventSettings={currentEvent} 
                                streamSettings={localActiveStream} 
                                isReadOnly={!chatEnabledAtEvent}
                            />
                        </div>
                    </aside>
                )}
            </main>

            <PollModal isOpen={isPollOpen} onClose={() => setIsPollOpen(false)} streamId={localActiveStream?.id} eventId={currentEvent.id} />
            <QuestionForm isOpen={isQuestionOpen} onClose={() => setIsQuestionOpen(false)} streamId={localActiveStream?.id} eventId={currentEvent.id} />
            <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} eventTitle={currentEvent.title} />
            {isChatVisible && (
                <button 
                    className="lg:hidden fixed bottom-6 right-6 z-[60] w-14 h-14 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all animate-in slide-in-from-bottom-10 duration-500"
                    onClick={() => setIsMobileChatOpen(!isMobileChatOpen)}
                >
                    {isMobileChatOpen ? <X className="w-6 h-6 rotate-90 transition-transform" /> : <MessageSquare className="w-6 h-6" />}
                </button>
            )}
        </div>
    );
}
