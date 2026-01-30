import { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import {
    BarChart2,
    MessageSquare,
    HelpCircle,
    Plus,
    Trash2,
    Check,
    X,
    Eye,
    Play,
    Pause,
    MessageCircle,
    Globe,
    LayoutDashboard
} from 'lucide-react';
import { toast } from 'react-toastify';

export function ResourceManager() {
    const [activeTab, setActiveTab] = useState('polls');
    const {
        polls, fetchPolls, createPoll, updatePollStatus, deletePoll,
        pendingComments, fetchPendingComments, approveComment, deleteComment,
        questions, fetchQuestions, displayQuestion, deleteQuestion,
        eventSettings, updateSettings, mediaSettings, fetchMediaSettings,
        socket
    } = useAdminStore();

    useEffect(() => {
        if (activeTab === 'polls') {
            fetchPolls();
            fetchMediaSettings();
        }
        if (activeTab === 'comments') fetchPendingComments();
        if (activeTab === 'questions') fetchQuestions();

        if (socket) {
            socket.on('question:new', fetchQuestions);
            socket.on('comment:pending', fetchPendingComments);
            socket.on('poll:new', fetchPolls);
        }

        return () => {
            if (socket) {
                socket.off('question:new', fetchQuestions);
                socket.off('comment:pending', fetchPendingComments);
                socket.off('poll:new', fetchPolls);
            }
        };
    }, [activeTab, socket]);

    const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''], streamId: '' });

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        try {
            await createPoll({
                question: newPoll.question,
                options: newPoll.options.filter(o => o.trim() !== ''),
                streamId: newPoll.streamId || null
            });
            setNewPoll({ question: '', options: ['', ''], streamId: '' });
            toast.success('Enquete criada com sucesso!');
        } catch (err) {
            toast.error('Erro ao criar enquete');
        }
    };

    const addOption = () => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
    const updateOption = (index, value) => {
        const options = [...newPoll.options];
        options[index] = value;
        setNewPoll({ ...newPoll, options });
    };

    const renderPolls = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    Crie enquetes para interagir com o público em tempo real.
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-400">Recurso:</span>
                    <button
                        onClick={() => updateSettings({ polls_enabled: !eventSettings?.polls_enabled })}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${eventSettings?.polls_enabled ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-400 text-white'}`}
                    >
                        {eventSettings?.polls_enabled ? 'Enquetes Habilitadas' : 'Enquetes Desabilitadas'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                    <Plus className="w-5 h-5 text-blue-500" />
                    Criar Nova Enquete
                </h3>
                <form onSubmit={handleCreatePoll} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Pergunta</label>
                            <input
                                type="text"
                                placeholder="Pergunta da enquete..."
                                value={newPoll.question}
                                onChange={e => setNewPoll({ ...newPoll, question: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Idioma / Stream</label>
                            <select
                                value={newPoll.streamId}
                                onChange={e => setNewPoll({ ...newPoll, streamId: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            >
                                <option value="">Global</option>
                                {mediaSettings.streams.map(s => (
                                    <option key={s.id} value={s.id}>{s.language}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Alternativas</label>
                        {newPoll.options.map((opt, i) => (
                            <input
                                key={i}
                                type="text"
                                placeholder={`Alternativa ${i + 1}`}
                                value={opt}
                                onChange={e => updateOption(i, e.target.value)}
                                className="w-full px-4 py-1.5 rounded-lg border dark:border-gray-600 dark:bg-gray-700 text-sm"
                                required
                            />
                        ))}
                    </div>
                    <div className="flex justify-between">
                        <button type="button" onClick={addOption} className="text-sm text-blue-500 hover:underline">
                            + Adicionar Alternativa
                        </button>
                        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold">
                            Criar Enquete
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-300">Enquetes Anteriores</h3>
                {polls.map(poll => (
                    <div key={poll.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                    {poll.stream_language || 'Global'}
                                </span>
                                <p className="font-medium text-gray-900 dark:text-white">{poll.question}</p>
                            </div>
                            <p className="text-[10px] text-gray-500">{new Date(poll.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => updatePollStatus(poll.id, { is_active: !poll.is_active, show_results: false })}
                                className={`p-2 rounded-lg transition-colors ${poll.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}
                                title={poll.is_active ? 'Desativar' : 'Ativar'}
                            >
                                {poll.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => updatePollStatus(poll.id, { is_active: poll.is_active, show_results: !poll.show_results })}
                                className={`p-2 rounded-lg transition-colors ${poll.show_results ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                                title="Mostrar Resultados"
                            >
                                <BarChart2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deletePoll(poll.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderComments = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    Os comentários aparecem aqui para aprovação antes de serem exibidos no evento.
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-400">Status:</span>
                    <button
                        onClick={() => updateSettings({ comments_enabled: !eventSettings?.comments_enabled })}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${eventSettings?.comments_enabled ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}
                    >
                        {eventSettings?.comments_enabled ? 'Habilitado' : 'Desabilitado'}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Usuário</th>
                            <th className="px-6 py-3 font-semibold">Comentário</th>
                            <th className="px-6 py-3 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {pendingComments.length === 0 ? (
                            <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">Nenhum comentário pendente</td></tr>
                        ) : (
                            pendingComments.map(comment => (
                                <tr key={comment.id}>
                                    <td className="px-6 py-4">
                                        <p className="font-medium">{comment.user_name}</p>
                                        <p className="text-xs text-gray-500">{comment.user_email}</p>
                                    </td>
                                    <td className="px-6 py-4">{comment.content}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => approveComment(comment.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Aprovar">
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteComment(comment.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Excluir">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderQuestions = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                    Clique em "Exibir" para mostrar a pergunta em um banner na tela de todos os usuários por 15 segundos.
                </p>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-gray-400">Status:</span>
                    <button
                        onClick={() => updateSettings({ questions_enabled: !eventSettings?.questions_enabled })}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${eventSettings?.questions_enabled ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}
                    >
                        {eventSettings?.questions_enabled ? 'Habilitado' : 'Desabilitado'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.length === 0 ? (
                    <div className="col-span-2 py-12 text-center text-gray-500 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                        Nenhuma pergunta recebida ainda
                    </div>
                ) : (
                    questions.map(q => (
                        <div key={q.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm relative overflow-hidden">
                            {q.displayed_at && (
                                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">EXIBIDA</div>
                            )}
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                            {q.stream_language || 'Global'}
                                        </span>
                                        <p className="font-bold text-gray-800 dark:text-white">{q.user_name}</p>
                                    </div>
                                    <p className="text-xs text-gray-400">{q.user_email}</p>
                                </div>
                                <span className="text-[10px] text-gray-400">{new Date(q.created_at).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border dark:border-gray-700">
                                "{q.content}"
                            </p>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    onClick={() => displayQuestion(q.id)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors"
                                    title="Exibir apenas para o idioma desta pergunta"
                                >
                                    <Eye className="w-3 h-3" />
                                    EXIBIR LOCAL
                                </button>
                                <button
                                    onClick={() => displayQuestion(q.id, true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-[10px] font-bold hover:bg-purple-700 transition-colors"
                                    title="Exibir para TODOS os idiomas"
                                >
                                    <Globe className="w-3 h-3" />
                                    EXIBIR GLOBAL
                                </button>
                                <button onClick={() => deleteQuestion(q.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg ml-2">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recursos do Evento</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie enquetes, comentários e perguntas em tempo real</p>
                </div>
            </div>

            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                {[
                    { id: 'polls', label: 'Enquetes', icon: BarChart2 },
                    { id: 'comments', label: 'Comentários', icon: MessageSquare },
                    { id: 'questions', label: 'Perguntas', icon: HelpCircle },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-8">
                {activeTab === 'polls' && renderPolls()}
                {activeTab === 'comments' && renderComments()}
                {activeTab === 'questions' && renderQuestions()}
            </div>
        </div>
    );
}
