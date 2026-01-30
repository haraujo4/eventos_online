import { useState } from 'react';
import ReactPlayer from 'react-player';
import { useAdminStore } from '../../store/useAdminStore';
import { Save, Loader2, Play, Plus, Trash2, Radio, Edit, X } from 'lucide-react';
import DOMPurify from 'dompurify';

export function MediaConfig() {
    const { mediaSettings, updateMediaSettings, addStream, removeStream, updateStream, toggleLive } = useAdminStore();


    const [streamLang, setStreamLang] = useState('');
    const [streamTitle, setStreamTitle] = useState('');
    const [streamDesc, setStreamDesc] = useState('');
    const [streamUrl, setStreamUrl] = useState('');
    const [streamPoster, setStreamPoster] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [posterFile, setPosterFile] = useState(null);
    const [inputType, setInputType] = useState('youtube');

    const [editingStreamId, setEditingStreamId] = useState(null);
    const [previewStreamId, setPreviewStreamId] = useState(null);


    const resetForm = () => {
        setStreamLang('');
        setStreamTitle('');
        setStreamDesc('');
        setStreamUrl('');
        setStreamPoster('');
        setVideoFile(null);
        setPosterFile(null);
        setEditingStreamId(null);
        setInputType('youtube');
    };

    const handleEdit = (stream) => {
        setStreamLang(stream.language);
        setStreamTitle(stream.title || '');
        setStreamDesc(stream.description || '');
        setStreamUrl(stream.url);
        setStreamPoster(stream.posterUrl || '');
        setEditingStreamId(stream.id);
        setVideoFile(null);
        setPosterFile(null);

        if (stream.type) {
            setInputType(stream.type);
        } else {

            setInputType(stream.file_path ? 'file' : 'url');
        }
    };

    const handleSubmitStream = async (e) => {
        e.preventDefault();
        try {
            if (editingStreamId) {
                await updateStream(editingStreamId, {
                    language: streamLang,
                    title: streamTitle,
                    description: streamDesc,
                    url: streamUrl,
                    posterUrl: streamPoster,
                    type: inputType
                }, videoFile, posterFile);
            } else {
                await addStream({
                    language: streamLang,
                    title: streamTitle,
                    description: streamDesc,
                    url: inputType !== 'file' ? streamUrl : '',
                    posterUrl: streamPoster,
                    type: inputType
                }, videoFile, posterFile);
            }
            resetForm();
        } catch (error) {
            console.error("Submit Stream Error:", error);
            const msg = error.response?.data?.message || error.message;
            alert(`Falha ao salvar stream: ${msg}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Configuração de Mídia</h2>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${mediaSettings.isLive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                        <div className={`w-2 h-2 rounded-full ${mediaSettings.isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        {mediaSettings.isLive ? 'AO VIVO' : 'OFFLINE'}
                    </div>
                    <button
                        onClick={toggleLive}
                        className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${mediaSettings.isLive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {mediaSettings.isLive ? 'Parar Transmissão' : 'Iniciar Transmissão'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Stream List & Form */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Streams Multi-idioma</h3>

                        {/* Form Area */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    {editingStreamId ? 'Editar Stream' : 'Adicionar Nova Stream'}
                                </span>
                                {editingStreamId && (
                                    <button onClick={resetForm} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSubmitStream} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Idioma</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Português"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                        value={streamLang}
                                        onChange={(e) => setStreamLang(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Título da Stream</label>
                                    <input
                                        type="text"
                                        placeholder="ex: Sessão da Manhã - Keynote"
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                        value={streamTitle}
                                        onChange={(e) => setStreamTitle(e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Descrição</label>
                                    <textarea
                                        placeholder="Breve descrição desta stream..."
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                        value={streamDesc}
                                        onChange={(e) => setStreamDesc(e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo de Fonte</label>
                                    <div className="flex gap-2 mb-4">
                                        <select
                                            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={inputType}
                                            onChange={(e) => {
                                                setInputType(e.target.value);

                                                if (e.target.value === 'file') setStreamUrl('');
                                            }}
                                        >
                                            <option value="youtube">YouTube</option>
                                            <option value="vimeo">Vimeo</option>
                                            <option value="embed">Código de Incorporação Puro (Iframe)</option>
                                            <option value="url">URL Direta (HLS/M3U8)</option>
                                            <option value="file">Upload de Arquivo (MP4)</option>
                                        </select>
                                    </div>

                                    {inputType === 'file' ? (
                                        <input
                                            type="file"
                                            accept="video/*"
                                            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                                            onChange={(e) => setVideoFile(e.target.files[0])}
                                            required={!editingStreamId}
                                        />
                                    ) : (
                                        <div className="space-y-2">
                                            {inputType === 'embed' ? (
                                                <textarea
                                                    placeholder="Cole o código <iframe> completo aqui..."
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none h-24 font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                                    value={streamUrl}
                                                    onChange={(e) => setStreamUrl(e.target.value)}
                                                    required={!editingStreamId}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder={
                                                        inputType === 'youtube' ? 'Cole o Link do YouTube ou Código de Incorporação' :
                                                            inputType === 'vimeo' ? 'Cole o Link do Vimeo ou Código de Incorporação' :
                                                                'URL Direta do Vídeo (https://...)'
                                                    }
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                                    value={streamUrl}
                                                    onChange={(e) => {
                                                        const val = e.target.value;

                                                        const srcMatch = val.match(/src="([^"]+)"/);
                                                        if (srcMatch && srcMatch[1]) {
                                                            setStreamUrl(srcMatch[1]);
                                                        } else {
                                                            setStreamUrl(val);
                                                        }
                                                    }}
                                                    required={!editingStreamId}
                                                />
                                            )}
                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                {inputType === 'youtube' && 'Suporta: URL Padrão, URL de Live, Código de Incorporação'}
                                                {inputType === 'vimeo' && 'Suporta: URL Padrão, URL do Player, Código de Incorporação'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Poster Específico da Stream (Opcional)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="URL do Poster"
                                            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                            value={streamPoster}
                                            onChange={(e) => setStreamPoster(e.target.value)}
                                        />
                                        <span className="self-center text-xs text-gray-400 dark:text-gray-500">OU</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="poster-upload"
                                            onChange={(e) => setPosterFile(e.target.files[0])}
                                        />
                                        <label
                                            htmlFor="poster-upload"
                                            className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-600"
                                        >
                                            Upload
                                        </label>
                                    </div>
                                    {posterFile && <p className="text-xs text-green-600 dark:text-green-400 mt-1">Arquivo selecionado: {posterFile.name}</p>}
                                </div>

                                <div className="md:col-span-2 flex justify-end gap-3 pt-4">
                                    {editingStreamId && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingStreamId ? 'Atualizar Stream' : 'Adicionar Stream'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-6">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Preview & Status</h3>

                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-md">
                            {(mediaSettings.isLive || editingStreamId || previewStreamId) ? (
                                <div className="w-full h-full relative">
                                    {(editingStreamId && inputType === 'embed') || (!editingStreamId && mediaSettings.streams.find(s => s.id === previewStreamId)?.type === 'embed') ? (
                                        <div
                                            className="w-full h-full flex items-center justify-center bg-black overflow-hidden"
                                            dangerouslySetInnerHTML={{
                                                __html: DOMPurify.sanitize(editingStreamId
                                                    ? streamUrl
                                                    : (mediaSettings.streams.find(s => s.id === previewStreamId)?.url || ""), { ADD_TAGS: ["iframe"], ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling"] })
                                            }}
                                        />
                                    ) : (editingStreamId && inputType === 'file') || (!editingStreamId && mediaSettings.streams.find(s => s.id === previewStreamId)?.type === 'file') ? (
                                        <video
                                            src={editingStreamId ? null : mediaSettings.streams.find(s => s.id === previewStreamId)?.url}
                                            controls
                                            className="w-full h-full object-contain"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <ReactPlayer
                                            url={
                                                editingStreamId
                                                    ? (streamUrl || null)
                                                    : (mediaSettings.streams.find(s => s.id === previewStreamId)?.url || mediaSettings.streams[0]?.url || null)
                                            }
                                            width="100%"
                                            height="100%"
                                            controls={true}
                                            playing={true}
                                            muted={true}
                                            onError={(e) => console.error("Preview Error:", e)}
                                            config={{
                                                file: { attributes: { poster: mediaSettings.streams.find(s => s.id === previewStreamId)?.posterUrl } }
                                            }}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Selecione uma stream para visualizar</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Idiomas Disponíveis (Clique para Visualizar):</p>
                            <div className="flex flex-wrap gap-2">
                                {mediaSettings.streams.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setPreviewStreamId(s.id)}
                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${previewStreamId === s.id
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                    >
                                        {s.language}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
