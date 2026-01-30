import ReactPlayer from 'react-player';
import { Play, Globe } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';

const VideoPlayer = ({ streams = [], poster, isLive }) => {
    // ... component implementation ...
    // Copy the entire component body here.
    const [activeStream, setActiveStream] = useState(streams[0]);

    const [error, setError] = useState(false);

    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        if (streams.length > 0) {
            if (!activeStream) {
                setActiveStream(streams[0]);
            } else {

                const updated = streams.find(s => s.id === activeStream.id);
                if (updated) {

                    if (updated.url !== activeStream.url || updated.language !== activeStream.language) {
                        setActiveStream(updated);
                    }
                } else {

                    setActiveStream(streams[0]);
                }
            }
        }
        setError(false);
    }, [streams, activeStream]);


    useEffect(() => {
        const handleLangChange = (e) => {
            const streamId = e.detail;
            const targetStream = streams.find(s => s.id === streamId);
            if (targetStream) setActiveStream(targetStream);
        };
        document.addEventListener('change-language', handleLangChange);
        return () => document.removeEventListener('change-language', handleLangChange);
    }, [streams]);

    const handleError = (e) => {
        console.error("Video Playback Error. Attempted URL:", activeStream?.url, e);
        setError(true);
    };

    const getPlayableUrl = (url) => {
        if (!url) return null;


        if (url.includes('player.vimeo.com/video/')) {
            try {

                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                const videoId = pathParts[pathParts.length - 1];
                const hash = urlObj.searchParams.get('h');

                if (videoId && hash) {
                    return `https://vimeo.com/${videoId}/${hash}`;
                } else if (videoId) {
                    return `https://vimeo.com/${videoId}`;
                }
            } catch (e) {
                console.error("Error parsing Vimeo URL", e);
                return url;
            }
        }


        if (url.includes('youtube.com/embed/')) {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                const videoId = pathParts[pathParts.length - 1];
                if (videoId) {
                    return `https://www.youtube.com/watch?v=${videoId}`;
                }
            } catch (e) {
                return url;
            }
        }


        if (url.includes('youtube.com/live/')) {
            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                const videoId = pathParts[pathParts.length - 1];
                if (videoId) {
                    return `https://www.youtube.com/watch?v=${videoId}`;
                }
            } catch (e) {
                return url;
            }
        }

        return url;
    };

    return (
        <div className="relative w-full h-full bg-black flex items-center justify-center group overflow-hidden">
            { }
            { }

            {isLive && activeStream ? (
                <>
                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-20">
                            <p className="text-red-500 font-bold mb-2">Erro de Reprodução</p>
                            <p className="text-sm text-gray-400 px-4 text-center">Não foi possível reproduzir o vídeo fornecido.</p>
                            <p className="text-xs text-gray-500 mt-2">Verifique a URL. Depuração: {activeStream?.url}</p>
                        </div>
                    ) : null}

                    {activeStream.type === 'embed' ? (
                        <div
                            className="w-full h-full flex items-center justify-center [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(activeStream.url, { ADD_TAGS: ["iframe"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"] })
                            }}
                        />
                    ) : activeStream.type === 'file' ? (
                        <video
                            src={activeStream.url}
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                            poster={activeStream.posterUrl}
                            controlsList="nodownload"
                        >
                            Seu navegador não suporta a tag de vídeo.
                        </video>
                    ) : (
                        <ReactPlayer
                            url={getPlayableUrl(activeStream.url)}
                            width="100%"
                            height="100%"
                            playing={true}
                            controls={false}
                            muted={isMuted}
                            onPlay={() => setError(false)}
                            onError={handleError}
                            config={{
                                file: {
                                    attributes: {
                                        poster: poster,
                                        crossOrigin: 'anonymous'
                                    }
                                }
                            }}
                        />
                    )}

                    { }
                    {isMuted && activeStream.type !== 'embed' && (
                        <button
                            onClick={() => setIsMuted(false)}
                            className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black/90 transition-opacity z-20"
                        >
                            Clique para ativar o som
                        </button>
                    )}

                </>
            ) : (
                <div className="absolute inset-0 z-0">
                    { }
                    {(activeStream?.posterUrl || poster) && (
                        <img
                            src={activeStream?.posterUrl || poster}
                            alt="Event Poster"
                            className="w-full h-full object-cover opacity-50 transition-opacity duration-300"
                        />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm mx-auto mb-4">
                            <Play className="w-8 h-8 text-white/50 fill-white/50 ml-1" />
                        </div>
                        <p className="text-gray-300 font-medium text-lg">A transmissão está offline no momento</p>
                        <p className="text-gray-500 text-sm mt-2">Aguardando o início da transmissão...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(VideoPlayer);
