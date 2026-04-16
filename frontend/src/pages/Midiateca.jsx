import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/useAdminStore';
import { useAuthStore } from '../store/useAuthStore';
import { Calendar, Play, Clock, Search, LogOut, Layout, User, Info, X, Film } from 'lucide-react';
import { getFullImageUrl } from '../utils/urlHelper';
import { toast } from 'react-toastify';

const Midiateca = () => {
    const { mediaSettings, fetchMediaSettings, eventSettings } = useAdminStore();
    const { user, logout, isAuthenticated } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeInfo, setActiveInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMediaSettings();
    }, [fetchMediaSettings]);

    // Ordenação e Filtros
    const streams = mediaSettings.streams || [];
    const featuredStream = streams.find(s => s.is_featured) || streams[0];
    
    const sortedStreams = [...streams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const filteredStreams = sortedStreams.filter(s => 
        s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const upcomingEvents = filteredStreams.filter(s => s.scheduled_at && new Date(s.scheduled_at) > new Date());
    const pastEvents = filteredStreams.filter(s => !s.scheduled_at || new Date(s.scheduled_at) <= new Date());

    const handleWatch = (streamId) => {
        setActiveInfo(null);
        if (!isAuthenticated) {
            navigate(`/login?redirectTo=${encodeURIComponent(`/player?id=${streamId}`)}`);
            return;
        }
        navigate(`/player?id=${streamId}`);
    };

    const ImageWithFallback = ({ src, alt, className }) => {
        const [error, setError] = useState(false);

        if (!src || error) {
            return (
                <div className={`${className} bg-slate-900 flex items-center justify-center border border-white/5`}>
                    <Film className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
            );
        }

        return (
            <img 
                src={src} 
                alt={alt} 
                className={className} 
                onError={() => setError(true)}
            />
        );
    };

    return (
        <div className={`min-h-screen bg-[#050510] text-white font-sans selection:bg-blue-500/30 ${activeInfo ? 'overflow-hidden h-screen' : ''}`}>
            {/* Header */}
            <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-4">
                    {eventSettings?.logo_url ? (
                        <img src={getFullImageUrl(eventSettings.logo_url)} alt="Logo" className="h-10 object-contain" />
                    ) : (
                        <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent italic">
                            {eventSettings?.event_name || 'EVENTOS ONLINE'}
                        </div>
                    )}
                    <nav className="ml-8 hidden md:flex gap-8 text-[11px] uppercase tracking-[0.2em] font-black text-gray-400">
                        <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-white transition-colors">Início</button>
                        <button onClick={() => document.getElementById('proximos')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-white transition-colors">Próximos</button>
                        <button onClick={() => document.getElementById('anteriores')?.scrollIntoView({behavior: 'smooth'})} className="hover:text-white transition-colors">Acervo</button>
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative hidden lg:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
                        <input 
                            type="text" 
                            placeholder="Buscar vídeos..." 
                            className="bg-white/5 border border-white/10 rounded-full pl-11 pr-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-72 transition-all relative z-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        {(user?.role === 'admin' || user?.role === 'moderator') && (
                            <button 
                                onClick={() => navigate('/admin')}
                                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all active:scale-90"
                            >
                                <Layout className="w-5 h-5 text-gray-300" />
                            </button>
                        )}
                        
                        {isAuthenticated ? (
                            <div className="flex items-center gap-3 pl-2">
                                <div className="flex flex-col items-end hidden sm:flex font-black">
                                    <span className="text-[10px] text-white uppercase tracking-widest">{user?.name}</span>
                                    <button onClick={logout} className="text-[9px] text-gray-500 hover:text-red-400 transition-colors uppercase">SAIR</button>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border border-white/20">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => navigate('/login')}
                                className="bg-white text-black px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-95"
                            >
                                ENTRAR
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            {featuredStream && (
                <section className="relative h-[85vh] w-full overflow-hidden bg-black">
                    <div className="absolute inset-0 pointer-events-none">
                        <ImageWithFallback 
                            src={featuredStream.poster_url} 
                            alt={featuredStream.title} 
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#050510] via-[#050510]/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent" />
                    </div>

                    <div className="relative h-full flex flex-col justify-end p-12 md:p-20 max-w-4xl z-20">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-blue-600 text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest text-white">EM DESTAQUE</span>
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-none">{featuredStream.category || 'Geral'}</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.85] text-white">
                            {featuredStream.title}
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl mb-10 line-clamp-3 max-w-2xl leading-relaxed">
                            {featuredStream.description || 'Assista aos melhores momentos das nossas transmissões exclusivas.'}
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleWatch(featuredStream.id)}
                                className="bg-white text-black px-10 py-4 rounded-md font-black text-sm uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 cursor-pointer"
                            >
                                <Play className="w-5 h-5 fill-current" /> Assistir Agora
                            </button>
                            <button 
                                onClick={() => setActiveInfo(featuredStream)}
                                className="bg-white/10 backdrop-blur-xl text-white px-10 py-4 rounded-md font-black text-sm uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all flex items-center gap-3 active:scale-95 cursor-pointer"
                            >
                                <Info className="w-5 h-5" /> Detalhes
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Modal de Informações */}
            {activeInfo && (
                <div 
                    className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl transition-all"
                    onClick={() => setActiveInfo(null)}
                >
                    <div 
                        className="bg-[#0a0a15] w-full max-w-xl max-h-[85vh] rounded-2xl overflow-y-auto shadow-2xl relative border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            onClick={() => setActiveInfo(null)} 
                            className="sticky top-4 float-right mr-4 p-2 bg-black/60 rounded-full hover:bg-white/20 transition-all z-[1001] text-white border border-white/10 cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        
                        <div className="p-8">
                            <div className="aspect-video w-full mb-8 rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
                                <ImageWithFallback src={activeInfo.poster_url} className="w-full h-full object-cover" />
                            </div>
                            
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-blue-400 font-bold text-[10px] uppercase tracking-[0.2em]">{activeInfo.category || 'Geral'}</span>
                            </div>
                            <h3 className="text-3xl md:text-5xl font-black mb-6 text-white tracking-tighter leading-tight">{activeInfo.title}</h3>
                            <p className="text-gray-400 text-lg leading-relaxed mb-10">
                                {activeInfo.description || 'Assista a este conteúdo exclusivo em nossa plataforma.'}
                            </p>
                            <button 
                                onClick={() => handleWatch(activeInfo.id)}
                                className="w-full bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all shadow-2xl cursor-pointer shadow-blue-500/10"
                            >
                                <Play className="w-5 h-5 fill-current" /> Iniciar Agora
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Lists */}
            <main className="px-6 md:px-12 py-16 relative z-10 space-y-24 bg-[#050510]">
                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                    <section id="proximos">
                        <h2 className="text-2xl font-black tracking-widest uppercase flex items-center gap-3 mb-10">
                            <Calendar className="w-6 h-6 text-blue-500" /> Próximos Eventos
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {upcomingEvents.map(stream => (
                                <div 
                                    key={stream.id} 
                                    className="group cursor-pointer block"
                                    onClick={() => handleWatch(stream.id)}
                                >
                                    <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-white/5 bg-gray-950 shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                                        <ImageWithFallback 
                                            src={stream.poster_url} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                        />
                                        <div className="absolute top-4 left-4 flex gap-2 z-10">
                                            {stream.is_live && (
                                                <div className="px-3 py-1 bg-red-600 rounded text-[9px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 bg-white rounded-full" /> AO VIVO
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600 rounded text-[9px] font-black uppercase tracking-widest z-10">
                                            {stream.scheduled_at ? new Date(stream.scheduled_at).toLocaleDateString() : 'BREVE'}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-all tracking-widest uppercase">
                                                <Info className="w-4 h-4" /> Ver Detalhes
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors uppercase leading-snug">{stream.title}</h3>
                                    <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest font-black">{stream.category || 'PROGRAMAÇÃO'}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Past Events */}
                <section id="anteriores">
                    <h2 className="text-2xl font-black tracking-widest uppercase flex items-center gap-3 mb-10">
                        <Clock className="w-6 h-6 text-blue-500" /> Acervo de Conteúdo
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                        {pastEvents.map(stream => (
                            <div 
                                key={stream.id} 
                                className="group cursor-pointer block"
                                onClick={() => handleWatch(stream.id)}
                            >
                                <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 border border-white/5 bg-gray-950 shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                                    <ImageWithFallback 
                                        src={stream.poster_url} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                                    />
                                    {stream.is_live && (
                                        <div className="absolute top-4 left-4 px-3 py-1 bg-red-600 rounded text-[9px] font-black uppercase tracking-widest animate-pulse flex items-center gap-1.5 z-10 shadow-lg">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full" /> AO VIVO
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-6">
                                        <div className="flex items-center gap-3 text-[10px] font-black text-blue-400 opacity-0 group-hover:opacity-100 transition-all tracking-widest uppercase">
                                            <Play className="w-4 h-4 fill-current" /> Assistir
                                        </div>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-white group-hover:text-amber-500 transition-colors leading-tight">{stream.title}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{stream.category || 'EVENTO'}</span>
                                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                                    <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{stream.views || 0} VIEWS</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-20 px-12 text-gray-700 text-[10px] font-black tracking-[0.3em] flex flex-col md:flex-row justify-between items-center gap-8 bg-black/40 uppercase">
                <p>© 2026 {eventSettings?.event_name || 'Eventos Online'}. All Rights Reserved.</p>
                <div className="flex gap-10">
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                </div>
            </footer>
        </div>
    );
};

export default Midiateca;
