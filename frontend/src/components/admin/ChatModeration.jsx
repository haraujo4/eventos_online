import { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useChatStore } from '../../store/useChatStore'; 
import { Trash2, ShieldAlert, Star, Send, Download } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore'; 

export function ChatModeration() {
    const { chatHistory, fetchChatHistory, deleteMessage, toggleHighlight } = useAdminStore();
    const { sendMessage, connectSocket } = useChatStore(); 
    const { user } = useAuthStore();
    const [adminMsg, setAdminMsg] = useState('');

    useEffect(() => {
        fetchChatHistory();
        useAdminStore.getState().fetchUsers();

        
        connectSocket();

        const interval = setInterval(fetchChatHistory, 5000);
        return () => clearInterval(interval);
    }, [fetchChatHistory, connectSocket]);

    const handleSendAdmin = (e) => {
        e.preventDefault();
        if (!adminMsg.trim()) return;
        sendMessage(adminMsg);
        setAdminMsg('');
        
        setTimeout(fetchChatHistory, 500);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Moderação do Chat</h2>

            {}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-2">Enviar como Moderador</h3>
                <form onSubmit={handleSendAdmin} className="flex gap-2">
                    <input
                        type="text"
                        value={adminMsg}
                        onChange={(e) => setAdminMsg(e.target.value)}
                        placeholder="Postar uma mensagem oficial..."
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-gray-700">Mensagens ao Vivo</h3>
                        <button
                            onClick={() => useAdminStore.getState().exportChat()}
                            className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg border border-green-200 transition-colors font-medium"
                            title="Exportar histórico do chat para Excel"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Exportar Histórico
                        </button>
                    </div>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        Modo de Moderação Ativo
                    </span>
                </div>
                <div className="divide-y divide-gray-100">
                    {chatHistory.map((msg) => {
                        const { users, banUser, unbanUser } = useAdminStore.getState();
                        const isBanned = users.find(u => u.id === msg.userId)?.status === 'banned';

                        return (
                            <div key={msg.id} className={`p-4 flex items-start justify-between hover:bg-gray-50 transition-colors ${isBanned ? 'bg-red-50/50' : ''} ${msg.isHighlighted ? 'bg-yellow-50/50' : ''}`}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-900">{msg.userName}</span>
                                        <span className="text-xs text-gray-500">{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                        <span className="capitalize bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                                            {msg.userRole}
                                        </span>
                                        {isBanned && (
                                            <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                                BANIDO
                                            </span>
                                        )}
                                        {msg.isHighlighted && (
                                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-current" /> Destacado
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600">{msg.content}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleHighlight(msg.id)}
                                        className={`p-2 rounded transition-colors ${msg.isHighlighted ? 'text-yellow-500 bg-yellow-100 hover:bg-yellow-200' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                                        title={msg.isHighlighted ? "Remover Destaque" : "Destacar Mensagem"}
                                    >
                                        <Star className={`w-4 h-4 ${msg.isHighlighted ? 'fill-current' : ''}`} />
                                    </button>

                                    <button
                                        onClick={() => deleteMessage(msg.id)}
                                        className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded transition-colors"
                                        title="Excluir Mensagem"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>

                                    {isBanned ? (
                                        <button
                                            onClick={() => unbanUser(msg.userId)}
                                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded transition-colors"
                                            title="Desbanir Usuário"
                                        >
                                            <ShieldAlert className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => banUser(msg.userId)}
                                            className="text-gray-400 hover:text-red-700 p-2 hover:bg-red-100 rounded transition-colors"
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
                        <div className="p-8 text-center text-gray-500">
                            Nenhuma mensagem recente para moderar.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
