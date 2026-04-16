import ReactPlayer from 'react-player';
import { Play } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';

const VideoPlayer = ({ streams = [], activeStreamId, poster, isLive, onLanguageChange }) => {
    const [error, setError] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    // Encontrar a stream ativa com base no ID passado pelo pai
    const activeStream = useMemo(() => {
        return streams.find(s => s.id === activeStreamId) || streams[0];
    }, [streams, activeStreamId]);

    useEffect(() => {
        setError(false);
    }, [activeStreamId]);

    const handleError = (e) => {
        console.error("Video Playback Error. Attempted URL:", activeStream?.url, e);
        setError(true);
    };

    const getPlayableUrl = (url) => {
        if (!url) return null;
        
        if (url.startsWith('http') && (url.includes(':9000') || url.includes('/thumbnails/') || url.includes('/videos/'))) {
            return url;
        }

        if (url.includes('player.vimeo.com/video/')) {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                const videoId = pathParts[pathParts.length - 1];
                const hash = urlObj.searchParams.get('h');
                if (videoId && hash) return `https://vimeo.com/${videoId}/${hash}`;
                if (videoId) return `https://vimeo.com/${videoId}`;
            } catch (e) { return url; }
        }

        if (url.includes('youtube.com/embed/')) {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                const videoId = pathParts[pathParts.length - 1];
                if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
            } catch (e) { return url; }
        }

        return url;
    };

    const embedHtml = useMemo(() => {
        if (activeStream?.type !== 'embed' || !activeStream?.url) return null;
        return DOMPurify.sanitize(activeStream.url, { 
            ADD_TAGS: ["iframe"], 
            ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "src"] 
        });
    }, [activeStream?.url, activeStream?.type]);

    if (!activeStream) return null;

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center group overflow-hidden">
            {/* Error Overlay */}
            {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 border-2 border-red-500/20 text-white z-20">
                    <p className="text-red-500 font-black text-xs uppercase tracking-widest mb-2">Erro de Reprodução</p>
                    <p className="text-[10px] text-gray-500 px-4 text-center max-w-xs">{activeStream.url}</p>
                </div>
            )}

            {activeStream.type === 'embed' ? (
                <div
                    className="w-full h-full flex items-center justify-center [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                    dangerouslySetInnerHTML={{ __html: embedHtml }}
                />
            ) : activeStream.type === 'file' ? (
                <video
                    src={activeStream.url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    poster={poster}
                    controlsList="nodownload"
                >
                    Seu navegador não suporta a tag de vídeo.
                </video>
            ) : (
                <div className="w-full h-full">
                    <ReactPlayer
                        url={getPlayableUrl(activeStream.url)}
                        width="100%"
                        height="100%"
                        playing={true}
                        controls={true}
                        muted={isMuted}
                        onPlay={() => setError(false)}
                        onError={handleError}
                        config={{
                            youtube: { playerVars: { showinfo: 0, autoplay: 1, rel: 0 } },
                            vimeo: { playerOptions: { autoplay: true, muted: true } },
                            file: { attributes: { poster: poster, crossOrigin: 'anonymous' } }
                        }}
                    />
                </div>
            )}

            {isMuted && activeStream.type !== 'embed' && (
                <button
                    onClick={() => setIsMuted(false)}
                    className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all z-20 shadow-xl"
                >
                    Clique para ativar o som
                </button>
            )}
        </div>
    );
};

export default React.memo(VideoPlayer);
