import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { 
    Globe, Plus, Trash2, Video, Link as LinkIcon, 
    Upload, Save, X, Star, Edit3, Play, 
    MoreHorizontal, Calendar, Layout, 
    Eye, Shield, BarChart3, Radio, MessageSquare
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getFullImageUrl } from '../../utils/urlHelper';

const MediaConfig = () => {
    const { 
        mediaSettings, fetchMediaSettings, addEvent, 
        removeEvent, updateEvent, toggleEventLive 
    } = useAdminStore();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventData, setEventData] = useState({
        title: '',
        description: '',
        category: 'Geral',
        is_featured: false,
        scheduled_at: '',
        chat_enabled: true,
        chat_global: true,
        chat_moderated: false,
        polls_enabled: true,
        questions_enabled: true,
        comments_enabled: true,
        is_live: false,
        languages: [{ 
            language: 'Português', type: 'youtube', url: '', videoFile: null,
            chat_enabled: null, chat_moderated: null, polls_enabled: null, questions_enabled: null, comments_enabled: null
        }]
    });

    const [posterFile, setPosterFile] = useState(null);
    const [posterPreview, setPosterPreview] = useState(null);
    const [isEditing, setIsEditing] = useState(null);

    const handlePosterChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPosterFile(file);
            setPosterPreview(URL.createObjectURL(file));
        }
    };

    useEffect(() => {
        fetchMediaSettings();
    }, [fetchMediaSettings]);

    const handleAddLanguage = () => {
        setEventData(prev => ({
            ...prev,
            languages: [...prev.languages, { 
                language: '', type: 'youtube', url: '', videoFile: null,
                chat_enabled: null, chat_moderated: null, polls_enabled: null, questions_enabled: null, comments_enabled: null
            }]
        }));
    };

    const handleRemoveLanguage = (index) => {
        const newLanguages = eventData.languages.filter((_, i) => i !== index);
        setEventData(prev => ({ ...prev, languages: newLanguages }));
    };

    const handleLanguageChange = (index, field, value) => {
        const newLanguages = [...eventData.languages];
        newLanguages[index][field] = value;
        setEventData(prev => ({ ...prev, languages: newLanguages }));
    };

    const handleOpenCreateModal = () => {
        setIsEditing(null);
        setEventData({
            title: '',
            description: '',
            category: 'Geral',
            is_featured: false,
            scheduled_at: '',
            chat_enabled: true,
            chat_global: true,
            chat_moderated: false,
            polls_enabled: true,
            questions_enabled: true,
            comments_enabled: true,
            is_live: false,
            languages: [{ 
                language: 'Português', type: 'youtube', url: '', videoFile: null,
                chat_enabled: null, chat_moderated: null, polls_enabled: null, questions_enabled: null, comments_enabled: null
            }]
        });
        setPosterFile(null);
        setPosterPreview(null);
        setIsModalOpen(true);
    };

    const handleEdit = (event) => {
        setIsEditing(event.id);
        const streams = (event.streams || []).map(s => ({
            id: s.id,
            language: s.language || '',
            url: s.url || '',
            type: s.type || 'file',
            videoFile: null,
            chat_enabled: s.chat_enabled ?? true,
            chat_moderated: s.chat_moderated ?? false,
            polls_enabled: s.polls_enabled ?? true,
            questions_enabled: s.questions_enabled ?? true,
            comments_enabled: s.comments_enabled ?? true
        }));

        setEventData({
            title: event.title || '',
            description: event.description || '',
            category: event.category || 'Geral',
            is_featured: event.is_featured || false,
            is_live: event.is_live || false,
            scheduled_at: event.scheduled_at ? new Date(event.scheduled_at).toISOString().slice(0, 16) : '',
            chat_enabled: event.chat_enabled ?? true,
            chat_global: event.chat_global ?? true,
            chat_moderated: event.chat_moderated ?? false,
            polls_enabled: event.polls_enabled ?? true,
            questions_enabled: event.questions_enabled ?? true,
            comments_enabled: event.comments_enabled ?? true,
            poster_url: event.poster_url || null,
            languages: streams.length > 0 ? streams : [{ 
                language: 'Português', type: 'youtube', url: '', videoFile: null,
                chat_enabled: null, chat_moderated: null, polls_enabled: null, questions_enabled: null, comments_enabled: null
            }]
        });

        if (event.poster_url) {
            setPosterPreview(getFullImageUrl(event.poster_url));
        } else {
            setPosterPreview(null);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setIsEditing(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const videoFiles = eventData.languages.map(l => l.videoFile);
            
            if (isEditing) {
                await updateEvent(isEditing, eventData, posterFile, videoFiles);
                toast.success('Evento atualizado com sucesso!');
            } else {
                await addEvent(eventData, posterFile, videoFiles);
                toast.success('Evento criado com sucesso!');
            }
            
            handleCloseModal();
        } catch (err) {
            toast.error(isEditing ? 'Erro ao atualizar evento' : 'Erro ao criar evento');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este evento?')) {
            await removeEvent(id);
            toast.success('Evento removido');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Gestão da Midiateca</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Gerencie seus eventos, lives e acervo digital.</p>
                </div>
                <button 
                    onClick={handleOpenCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    NOVO EVENTO
                </button>
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mediaSettings.streams.map(event => (
                    <div key={event.id} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
                        {/* Poster Section */}
                        <div className="relative aspect-video overflow-hidden">
                            <img 
                                src={getFullImageUrl(event.poster_url) || '/midiateca_hero_banner.png'} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                alt={event.title}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                            
                            {/* Top Badges */}
                            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                                {event.is_live && (
                                    <div className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 animate-pulse shadow-lg">
                                        <Radio className="w-3 h-3" /> AO VIVO
                                    </div>
                                )}
                                {event.is_featured && (
                                    <div className="bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                        <Star className="w-3 h-3 fill-amber-900" /> DESTAQUE
                                    </div>
                                )}
                            </div>

                            {/* Category Badge */}
                            <div className="absolute top-3 right-3">
                                <span className="bg-black/40 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase border border-white/20">
                                    {event.category || 'Geral'}
                                </span>
                            </div>

                            {/* Scheduled Time */}
                            {event.scheduled_at && (
                                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/90 text-[10px] font-bold">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(event.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                            )}
                        </div>

                        {/* Content Section */}
                        <div className="p-5 flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-1">{event.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                                {event.description || 'Nenhuma descrição fornecida.'}
                            </p>

                            <div className="flex flex-wrap gap-1.5 mb-4">
                                {event.streams?.map((s, idx) => (
                                    <span key={idx} className="text-[9px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md font-black uppercase border border-blue-100 dark:border-blue-900/50">
                                        {s.language}
                                    </span>
                                ))}
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => toggleEventLive(event.id, event.is_live)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                                            event.is_live 
                                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                            : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                                        }`}
                                    >
                                        <Play className={`w-3 h-3 ${event.is_live ? 'fill-red-600' : ''}`} />
                                        {event.is_live ? 'ENCERRAR' : 'MODO LIVE'}
                                    </button>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => handleEdit(event)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Editar"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(event.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State / Add New Placeholder */}
                <button 
                    onClick={handleOpenCreateModal}
                    className="min-h-[300px] border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/10 transition-all group p-10"
                >
                    <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-blue-500 rounded-full flex items-center justify-center transition-colors">
                        <Plus className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                        <span className="block font-bold text-gray-700 dark:text-gray-200 group-hover:text-blue-600">Novo Evento</span>
                        <span className="text-xs text-gray-400">Clique para adicionar à midiateca</span>
                    </div>
                </button>
            </div>

            {/* Creation/Editing Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                        onClick={handleCloseModal}
                    />
                    
                    {/* Modal Content */}
                    <div className="relative bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                                    <Video className="w-6 h-6 text-blue-600" />
                                    {isEditing ? 'Editar Evento' : 'Novo Evento na Midiateca'}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Configure os detalhes e conteúdos do seu evento.</p>
                            </div>
                            <button 
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <form id="media-form" onSubmit={handleSubmit} className="space-y-10">
                                {/* Basic Info & Poster Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                    <Edit3 className="w-3 h-3" /> Título do Evento
                                                </label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                                                    placeholder="Ex: Summit Global 2026 - Abertura"
                                                    value={eventData.title}
                                                    onChange={e => setEventData({...eventData, title: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                    <Layout className="w-3 h-3" /> Categoria
                                                </label>
                                                <input 
                                                    type="text"
                                                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                                                    placeholder="Geral, Tecnologia, Saúde..."
                                                    value={eventData.category}
                                                    onChange={e => setEventData({...eventData, category: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                <X className="w-3 h-3 rotate-45" /> Descrição
                                            </label>
                                            <textarea 
                                                className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none h-28 resize-none dark:text-white transition-all"
                                                placeholder="Descreva o que acontecerá neste evento..."
                                                value={eventData.description}
                                                onChange={e => setEventData({...eventData, description: e.target.value})}
                                            />
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                                    <Calendar className="w-3 h-3" /> Agendar Para (Opcional)
                                                </label>
                                                <input 
                                                    type="datetime-local"
                                                    className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                                                    value={eventData.scheduled_at}
                                                    onChange={e => setEventData({...eventData, scheduled_at: e.target.value})}
                                                />
                                            </div>
                                            <div className="flex items-end gap-3 pb-1">
                                                <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-900 transition-all flex-1 md:flex-none">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-5 h-5 text-blue-600 rounded"
                                                        checked={eventData.is_featured}
                                                        onChange={e => setEventData({...eventData, is_featured: e.target.checked})}
                                                    />
                                                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-2 uppercase">
                                                        <Star className={`w-4 h-4 ${eventData.is_featured ? 'fill-amber-400 text-amber-400' : ''}`} />
                                                        Destaque
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Poster / Preview Section */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                            <Upload className="w-3 h-3" /> Banner & Preview
                                        </label>
                                        <div className="relative group aspect-[16/10] rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex items-center justify-center">
                                            {posterPreview ? (
                                                <>
                                                    <img src={posterPreview} className="w-full h-full object-cover" alt="Preview" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                                        <label className="bg-white text-gray-900 p-2.5 rounded-full cursor-pointer hover:scale-110 transition-transform">
                                                            <Upload className="w-5 h-5" />
                                                            <input type="file" className="hidden" accept="image/*" onChange={handlePosterChange} />
                                                        </label>
                                                        <button 
                                                            type="button"
                                                            onClick={() => { setPosterFile(null); setPosterPreview(null); }}
                                                            className="bg-red-500 text-white p-2.5 rounded-full hover:scale-110 transition-transform"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="flex flex-col items-center gap-3 cursor-pointer p-8 text-center">
                                                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                                                        <Plus className="w-7 h-7" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black text-gray-800 dark:text-gray-200 block uppercase tracking-tighter">Poster (16:9)</span>
                                                        <span className="text-[10px] text-gray-400 uppercase">PNG/JPG Recomendado</span>
                                                    </div>
                                                    <input type="file" className="hidden" accept="image/*" onChange={handlePosterChange} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Activity/Live Toggle In Edit */}
                                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <label className="flex items-center justify-between cursor-pointer">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-gray-800 dark:text-white uppercase tracking-widest">Modo ao Vivo Agora</span>
                                                    <span className="text-[9px] text-gray-500">Torna este evento ativo imediatamente</span>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full transition-all relative ${eventData.is_live ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                                    onClick={() => setEventData({...eventData, is_live: !eventData.is_live})}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${eventData.is_live ? 'left-7' : 'left-1'}`} />
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Resource Settings Section */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Shield className="w-4 h-4" /> Recursos Interativos & Permissões
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[
                                            { id: 'chat_enabled', label: 'Chat ao Vivo', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50/50' },
                                            { id: 'chat_global', label: 'Chat Unificado', icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50/50', deps: 'chat_enabled' },
                                            { id: 'chat_moderated', label: 'Chat Moderado', icon: Shield, color: 'text-red-500', bg: 'bg-red-50/50', deps: 'chat_enabled' },
                                            { id: 'polls_enabled', label: 'Enquetes', icon: BarChart3, color: 'text-purple-500', bg: 'bg-purple-50/50' },
                                            { id: 'questions_enabled', label: 'Perguntas', icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-50/50' },
                                            { id: 'comments_enabled', label: 'Comentários', icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
                                        ].map(feature => {
                                            const Icon = feature.icon;
                                            const isLocked = feature.deps && !eventData[feature.deps];
                                            return (
                                                <label 
                                                    key={feature.id} 
                                                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                                                        eventData[feature.id] 
                                                        ? 'bg-white dark:bg-gray-800 border-blue-500 shadow-md ring-4 ring-blue-500/5' 
                                                        : 'bg-gray-50 dark:bg-gray-800/50 border-transparent hover:border-gray-200'
                                                    } ${isLocked ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                                                >
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.bg} ${feature.color}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="block text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight">{feature.label}</span>
                                                        <input 
                                                            type="checkbox"
                                                            className="hidden"
                                                            checked={eventData[feature.id]}
                                                            onChange={e => setEventData({...eventData, [feature.id]: e.target.checked})}
                                                        />
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${eventData[feature.id] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                                        {eventData[feature.id] && <Plus className="w-3 h-3 text-white rotate-45" />}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Languages & Sources Section */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-gray-900 dark:bg-black p-4 rounded-2xl">
                                        <h3 className="font-black text-white text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-blue-500" /> IDIOMAS E FONTES DE TRANSMISSÃO
                                        </h3>
                                        <button 
                                            type="button"
                                            onClick={handleAddLanguage}
                                            className="text-[10px] font-black text-blue-400 flex items-center gap-1.5 hover:text-white transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> NOVO IDIOMA
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {eventData.languages.map((lang, index) => (
                                            <div key={index} className="flex flex-col lg:flex-row gap-4 p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm animate-in slide-in-from-right-4 duration-300 group">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Idioma</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                            placeholder="Ex: Português"
                                                            value={lang.language}
                                                            onChange={e => handleLanguageChange(index, 'language', e.target.value)}
                                                            required
                                                        />
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Fonte</label>
                                                        <select 
                                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                                                            value={lang.type}
                                                            onChange={e => handleLanguageChange(index, 'type', e.target.value)}
                                                        >
                                                            <option value="youtube">YouTube</option>
                                                            <option value="vimeo">Vimeo</option>
                                                            <option value="embed">Iframe / Incorporação</option>
                                                            <option value="live">URL de Live (.m3u8)</option>
                                                            <option value="file">Arquivo Local</option>
                                                        </select>
                                                    </div>

                                                    <div className="md:col-span-2 space-y-1">
                                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Link ou Vídeo</label>
                                                        {lang.type === 'file' ? (
                                                            <div className="relative">
                                                                <input 
                                                                    type="file" 
                                                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-[10px] border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                                    onChange={e => handleLanguageChange(index, 'videoFile', e.target.files[0])}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <input 
                                                                type="text" 
                                                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs border-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                                                                placeholder="https://..."
                                                                value={lang.url}
                                                                onChange={e => handleLanguageChange(index, 'url', e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:pl-4 border-gray-50 dark:border-gray-700">
                                                    <div className="flex bg-gray-50 dark:bg-gray-900 p-1.5 rounded-xl gap-1">
                                                        {[
                                                            { id: 'chat_enabled', label: 'Chat' },
                                                            { id: 'polls_enabled', label: 'Votos' },
                                                            { id: 'questions_enabled', label: 'Q&A' }
                                                        ].map(flag => (
                                                            <button 
                                                                key={flag.id}
                                                                type="button"
                                                                onClick={() => handleLanguageChange(index, flag.id, !(lang[flag.id] ?? true))}
                                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                                                                    (lang[flag.id] ?? true)
                                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                                    : 'text-gray-400 hover:text-gray-600'
                                                                }`}
                                                            >
                                                                {flag.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    
                                                    {eventData.languages.length > 1 && (
                                                        <button 
                                                            type="button"
                                                            onClick={() => handleRemoveLanguage(index)}
                                                            className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 z-10">
                            <button 
                                type="button"
                                onClick={handleCloseModal}
                                className="px-6 py-3 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-200 transition-all uppercase"
                            >
                                Cancelar
                            </button>
                            <button 
                                form="media-form"
                                type="submit"
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest"
                            >
                                <Save className="w-4 h-4" /> {isEditing ? 'Atualizar Alterações' : 'Finalizar e Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export { MediaConfig };
