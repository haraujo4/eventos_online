import { useEffect, useState, useRef, useMemo } from 'react';
import { Send, User, Smile, Star, Clock, Check, Trash2 } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Chat({ eventSettings, streamSettings, isReadOnly }) {
    const [message, setMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const scrollRef = useRef(null);
    const { messages, connectSocket, disconnectSocket, fetchMessages, sendMessage, approveMessage, deleteMessage, setActiveStream } = useChatStore();
    const { user } = useAuthStore();
    const emojiRef = useRef(null);

    const isModerated = streamSettings?.chat_moderated ?? eventSettings?.chat_moderated ?? false;
    const isModerator = ['admin', 'moderator'].includes(user?.role);

    // Filter messages for common users if chat is moderated
    const visibleMessages = useMemo(() => {
        if (!isModerated || isModerator) return messages;
        return messages.filter(msg => msg.isApproved || msg.userId === user?.id || msg.userRole === 'system');
    }, [messages, isModerated, isModerator, user?.id]);

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setShowEmoji(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (streamSettings?.id) {
            connectSocket();
            setActiveStream(streamSettings.id);
            fetchMessages(streamSettings.id);
        }
        return () => disconnectSocket();
    }, [connectSocket, disconnectSocket, fetchMessages, setActiveStream, streamSettings?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [visibleMessages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;
        sendMessage(message);
        setMessage('');
    };

    const handleApprove = async (msgId) => {
        try {
            await approveMessage(msgId);
            toast.success('Mensagem aprovada');
        } catch (err) {
            toast.error('Erro ao aprovar');
        }
    };

    const handleDelete = async (msgId) => {
        if (window.confirm('Excluir esta mensagem?')) {
            try {
                await deleteMessage(msgId);
                toast.success('Mensagem excluída');
            } catch (err) {
                toast.error('Erro ao excluir');
            }
        }
    };

    return (
        <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10 transition-colors">
                <div className="flex flex-col">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Chat ao Vivo</h3>
                    {isModerated && <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">Moderação Ativa</span>}
                </div>
                <span className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full animate-pulse font-black uppercase">
                    ● Online
                </span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {visibleMessages.map((msg) => {
                    const isMe = msg.userId === user?.id;
                    const msgIsModerator = ['admin', 'moderator'].includes(msg.userRole);
                    const isPending = (msg.isApproved === false || msg.is_approved === false) && msg.userRole !== 'system';

                    return (
                        <div key={msg.id} className={`flex flex-col ${msg.userRole === 'system' ? 'items-center my-4' : (isMe ? 'items-end' : 'items-start')}`}>
                            {msg.userRole === 'system' ? (
                                <span className="text-[10px] text-center text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-3 py-1 rounded-full font-bold uppercase tracking-wider">{msg.content}</span>
                            ) : (
                                <div className={`group relative flex gap-3 max-w-[90%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative ${isMe ? 'bg-blue-600' : (msgIsModerator ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-gray-800')}`}>
                                        <User className={`w-4 h-4 ${isMe || msgIsModerator ? 'text-white' : 'text-gray-500'}`} />
                                    </div>

                                    {/* Message Body */}
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[11px] font-black uppercase tracking-tight ${isMe ? 'text-blue-600' : (msgIsModerator ? 'text-yellow-600' : 'text-gray-500')}`}>
                                                {isMe ? 'Você' : msg.userName}
                                            </span>
                                            {isPending && (
                                                <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter flex items-center gap-1">
                                                    <Clock className="w-2.5 h-2.5" /> Pendente
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                                            isMe ? 'bg-blue-600 text-white rounded-tr-none' : 
                                            (msgIsModerator ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 text-gray-800 dark:text-yellow-100 rounded-tl-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none')
                                        } ${isPending && isModerator ? 'opacity-60 ring-1 ring-amber-500/30' : ''}`}>
                                            {msg.content}
                                        </div>

                                        {/* Moderação Actions (Só visível para Admin/Mod) */}
                                        {isModerator && !msgIsModerator && (
                                            <div className="flex gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isPending && (
                                                    <button onClick={() => handleApprove(msg.id)} className="text-[9px] font-black uppercase text-green-600 hover:text-green-700 flex items-center gap-0.5 bg-green-50 px-2 py-0.5 rounded-full">
                                                        <Check className="w-3 h-3" /> Aprovar
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(msg.id)} className="text-[9px] font-black uppercase text-red-500 hover:text-red-600 flex items-center gap-0.5 bg-red-50 px-2 py-0.5 rounded-full">
                                                    <Trash2 className="w-3 h-3" /> Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 relative transition-colors">
                {isReadOnly && !isModerator ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl text-center">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Chat em Modo de Leitura</span>
                    </div>
                ) : (
                    <>
                        {showEmoji && (
                            <div className="absolute bottom-20 left-4 z-50 shadow-2xl" ref={emojiRef}>
                                <EmojiPicker onEmojiClick={(obj) => setMessage(p => p + obj.emoji)} theme="auto" width={300} />
                            </div>
                        )}
                        <form onSubmit={handleSend} className="relative flex items-center gap-2">
                            <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-2 text-gray-400 hover:text-yellow-500"><Smile className="w-5 h-5" /></button>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={isModerated && !isModerator ? "Sua mensagem aguardará aprovação..." : "Digite uma mensagem..."}
                                className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            />
                            <button type="submit" disabled={!message.trim()} className="bg-blue-600 text-white p-3 rounded-xl disabled:bg-gray-300 active:scale-95 transition-all"><Send className="w-4 h-4" /></button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
