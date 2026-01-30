import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import { useEffect, useState } from 'react';

export default function Player() {
    const { user, logout } = useAuthStore();
    const { mediaSettings, eventSettings, connectSocket, disconnectSocket, fetchMediaSettings, fetchSettings } = useAdminStore();
    const navigate = useNavigate();

    
    
    const [localActiveStream, setLocalActiveStream] = useState(null);

    useEffect(() => {
        if (mediaSettings.streams.length > 0 && !localActiveStream) {
            setLocalActiveStream(mediaSettings.streams[0]);
        }
    }, [mediaSettings.streams, localActiveStream]);

    
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
        }

        return () => {
            const socket = useAdminStore.getState().socket;
            if (socket) {
                socket.emit('leave:viewers');
            }
            disconnectSocket();
        };
    }, [connectSocket, disconnectSocket, fetchMediaSettings, fetchSettings]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
            {}
            <header className="h-16 px-6 bg-gray-900/90 border-b border-gray-800 flex justify-between items-center backdrop-blur-sm z-50">
                <div className="flex items-center gap-2">
                    {eventSettings?.logo_url ? (
                        <img
                            src={eventSettings.logo_url.startsWith('http') ? eventSettings.logo_url : `http://localhost:3000${eventSettings.logo_url}`}
                            alt="Event Logo"
                            className="w-8 h-8 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold">{eventSettings?.event_name?.charAt(0) || 'E'}</span>
                        </div>
                    )}
                    <h1 className="text-lg font-bold tracking-tight">{eventSettings?.event_name || 'Evento Corporativo'}</h1>
                </div>

                <div className="flex items-center gap-4">
                    {(user?.role === 'admin' || user?.role === 'moderator') && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            Painel Admin
                        </button>
                    )}
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-white">{user?.name || 'Visitante'}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role || 'Espectador'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                        title="Sair"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {}
                <div className="flex-1 min-w-0 h-full flex flex-col">
                    {}
                    <div className="flex-1 relative bg-black min-h-0">
                        <VideoPlayer
                            streams={mediaSettings.streams}
                            poster={mediaSettings.posterUrl}
                            isLive={mediaSettings.isLive}
                            onStreamChange={(stream) => setLocalActiveStream(stream)}
                        />
                    </div>

                    {}
                    <div className="bg-gray-900 border-t border-gray-800 p-6 flex-shrink-0">
                        {}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {localActiveStream?.title || "Transmissão ao Vivo do Evento"}
                                </h2>
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <span className="bg-red-600 text-white px-2 py-0.5 rounded textxs font-bold uppercase tracking-wider">
                                        {mediaSettings.isLive ? 'AO VIVO' : 'OFFLINE'}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>

                            {}
                            <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg">
                                {mediaSettings.streams.map(stream => (
                                    <button
                                        key={stream.id}
                                        onClick={() => document.dispatchEvent(new CustomEvent('change-language', { detail: stream.id }))}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${(localActiveStream?.id === stream.id)
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                            }`}
                                    >
                                        {stream.language}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {}
                        <div className="bg-gray-800/50 rounded-xl p-4">
                            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {localActiveStream?.description || "Nenhuma descrição disponível para esta transmissão."}
                            </p>
                        </div>
                    </div>
                </div>

                {}
                {eventSettings?.chat_enabled && (
                    <aside className="w-full lg:w-96 h-[40vh] lg:h-full bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-800 flex-shrink-0">
                        <Chat />
                    </aside>
                )}
            </main>
        </div>
    );
}
