import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useChatStore } from '../../store/useChatStore';
import { Trash2, ShieldAlert, Star, Send, Download, Check, Clock } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function ChatModeration() {
    const { chatHistory, fetchChatHistory, deleteMessage, toggleHighlight } = useAdminStore();
    const { sendMessage, connectSocket, pendingMessages, approveMessage, fetchPendingMessages } = useChatStore();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('pending');
    const [adminMsg, setAdminMsg] = useState('');

    useEffect(() => {
        fetchChatHistory();
        useAdminStore.getState().fetchUsers();

        fetchPendingMessages();
        connectSocket();

        const interval = setInterval(fetchChatHistory, 5000);
        return () => clearInterval(interval);
    }, [fetchChatHistory, connectSocket, fetchPendingMessages]);

    const handleSendAdmin = (e) => {
        e.preventDefault();
        if (!adminMsg.trim()) return;
        sendMessage(adminMsg);
        setAdminMsg('');

        setTimeout(fetchChatHistory, 500);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Moderação do Chat</h2>

            {/* Admin Message Input */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Enviar como Moderador</h3>
                <form onSubmit={handleSendAdmin} className="flex gap-2">
                    <input
                        type="text"
                        value={adminMsg}
                        onChange={(e) => setAdminMsg(e.target.value)}
                        placeholder="Postar uma mensagem oficial..."
                        className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!adminMsg.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Enviar
                    </button>
                </form>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'pending'
                        ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Fila de Moderação
                    {pendingMessages.length > 0 && (
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                            {pendingMessages.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('live')}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'live'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Mensagens ao Vivo
                    </span>
                </button>
            </div>

            {/* Pending Messages (Moderation Queue) */}
            {activeTab === 'pending' && (
                <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl shadow-sm border border-orange-100 dark:border-orange-800 overflow-hidden">
                    {pendingMessages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            Nenhuma mensagem aguardando aprovação.
                        </div>
                    ) : (
                        <div className="divide-y divide-orange-100 dark:divide-orange-800/30">
                            {pendingMessages.map((msg) => (
                                <div key={msg.id} className="p-4 flex items-start justify-between bg-white/50 dark:bg-gray-800/50">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 dark:text-white">{msg.userName}</span>
                                            {msg.streamName && (
                                                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-medium whitespace-nowrap">
                                                    {msg.streamName}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">{msg.content}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => approveMessage(msg.id)}
                                            className="text-green-600 hover:text-white hover:bg-green-600 p-2 rounded transition-colors"
                                            title="Aprovar Mensagem"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteMessage(msg.id)}
                                            className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded transition-colors"
                                            title="Rejeitar/Excluir"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Live Messages */}
            {activeTab === 'live' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Histórico do Chat</h3>
                            <button
                                onClick={() => useAdminStore.getState().exportChat()}
                                className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 px-2.5 py-1.5 rounded-lg border border-green-200 dark:border-green-800 transition-colors font-medium"
                                title="Exportar histórico do chat para Excel"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Exportar
                            </button>
                        </div>
                        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Modo: {pendingMessages.length > 0 || true ? 'Moderado' : 'Aberto'}
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {chatHistory.map((msg) => {
                            const { users, banUser, unbanUser } = useAdminStore.getState();
                            const isBanned = users.find(u => u.id === msg.userId)?.status === 'banned';

                            return (
                                <div key={msg.id} className={`p-4 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isBanned ? 'bg-red-50/50 dark:bg-red-900/10' : ''} ${msg.isHighlighted ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 dark:text-white">{msg.userName}</span>
                                            {msg.streamName && (
                                                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-medium whitespace-nowrap">
                                                    {msg.streamName}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                            <span className="capitalize bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs">
                                                {msg.userRole}
                                            </span>
                                            {isBanned && (
                                                <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                                    BANIDO
                                                </span>
                                            )}
                                            {msg.isHighlighted && (
                                                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Star className="w-3 h-3 fill-current" /> Destacado
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300">{msg.content}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleHighlight(msg.id)}
                                            className={`p-2 rounded transition-colors ${msg.isHighlighted ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'}`}
                                            title={msg.isHighlighted ? "Remover Destaque" : "Destacar Mensagem"}
                                        >
                                            <Star className={`w-4 h-4 ${msg.isHighlighted ? 'fill-current' : ''}`} />
                                        </button>

                                        <button
                                            onClick={() => deleteMessage(msg.id)}
                                            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                            title="Excluir Mensagem"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        {isBanned ? (
                                            <button
                                                onClick={() => unbanUser(msg.userId)}
                                                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                title="Desbanir Usuário"
                                            >
                                                <ShieldAlert className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => banUser(msg.userId)}
                                                className="text-gray-400 hover:text-red-700 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                title="Banir Usuário"
                                            >
                                                <ShieldAlert className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {chatHistory.length === 0 && (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                Nenhuma mensagem recente.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
