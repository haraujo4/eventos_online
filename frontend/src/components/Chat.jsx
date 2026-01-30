import { useEffect, useState, useRef } from 'react';
import { Send, User, Smile, Star, Clock } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';

export default function Chat() {
    const [message, setMessage] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const messagesEndRef = useRef(null);
    const { messages, connectSocket, disconnectSocket, fetchMessages, sendMessage } = useChatStore();
    const { eventSettings } = useAdminStore();
    const { user } = useAuthStore();
    const emojiRef = useRef(null);

    const isChatEnabled = eventSettings?.chat_enabled ?? true;
    const isModerator = ['admin', 'moderator'].includes(user?.role);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiRef.current && !emojiRef.current.contains(event.target)) {
                setShowEmoji(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const onEmojiClick = (emojiObject) => {
        setMessage((prev) => prev + emojiObject.emoji);
    };

    useEffect(() => {
        connectSocket();
        fetchMessages();

        return () => {
            disconnectSocket();
        };
    }, [connectSocket, disconnectSocket, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        sendMessage(message);
        setMessage('');
    };

    return (
        <div className="flex flex-col w-full h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 z-10 transition-colors">
                <h3 className="font-semibold text-gray-900 dark:text-white">Chat ao Vivo</h3>
                <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded-full animate-pulse">
                    ● Ao Vivo
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {messages.map((msg) => {
                    const isMe = msg.userId === user?.id;
                    const isModerator = ['admin', 'moderator'].includes(msg.userRole);
                    const isPending = msg.isPending;

                    return (
                        <div key={msg.id} className={`flex flex-col ${msg.userRole === 'system' ? 'items-center my-4' : (isMe ? 'items-end' : 'items-start')} ${isPending ? 'opacity-70' : ''}`}>
                            {msg.userRole === 'system' ? (
                                <span className="text-xs text-center text-gray-500 bg-gray-100 dark:bg-gray-800/50 px-3 py-1 rounded-full">{msg.content}</span>
                            ) : (
                                <div className={`flex gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative ${isMe ? 'bg-blue-500/20' : (isModerator ? 'bg-yellow-500/20' : 'bg-indigo-500/20')
                                        } ${msg.isHighlighted ? 'ring-2 ring-yellow-400' : ''}`}>
                                        <User className={`w-4 h-4 ${isMe ? 'text-blue-600 dark:text-blue-400' : (isModerator ? 'text-yellow-600 dark:text-yellow-400' : 'text-indigo-600 dark:text-indigo-400')}`} />
                                        {msg.isHighlighted && (
                                            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                                                <Star className="w-2 h-2 text-black fill-current" />
                                            </div>
                                        )}
                                    </div>
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-baseline gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <span className={`text-sm font-medium flex items-center gap-1 ${isMe ? 'text-blue-600 dark:text-blue-400' : (isModerator ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-700 dark:text-gray-300')
                                                }`}>
                                                {isMe ? 'Você' : msg.userName}
                                                {isModerator && !isMe && (
                                                    <span className="text-[10px] bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 px-1.5 rounded uppercase font-bold tracking-wider">
                                                        MOD
                                                    </span>
                                                )}
                                                {isPending && (
                                                    <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> Aguardando
                                                    </span>
                                                )}
                                            </span>
                                            <span className="text-[10px] text-gray-500 dark:text-gray-600">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`mt-1 p-3 rounded-2xl text-sm leading-relaxed relative ${msg.isHighlighted ? 'border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : ''
                                            } ${isMe
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : (isModerator ? 'bg-gray-100 dark:bg-gray-800 border border-yellow-500/30 text-gray-800 dark:text-gray-200 rounded-tl-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded-tl-none')
                                            }`}>
                                            {msg.isHighlighted && (
                                                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                                    <Star className="w-2 h-2 fill-current" /> FIXADO
                                                </div>
                                            )}
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 relative transition-colors">
                {!isChatEnabled && !isModerator ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                        <span className="text-red-500 dark:text-red-400 text-sm font-medium">O chat está desativado no momento</span>
                    </div>
                ) : (
                    <>
                        {showEmoji && (
                            <div className="absolute bottom-20 left-4 z-50 shadow-xl rounded-lg" ref={emojiRef}>
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme="auto"
                                    width={300}
                                    height={400}
                                />
                            </div>
                        )}
                        <form onSubmit={handleSend} className="relative flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowEmoji(!showEmoji)}
                                className={`p-2 rounded-lg transition-colors ${showEmoji ? 'text-yellow-500 dark:text-yellow-400 bg-yellow-400/10' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            >
                                <Smile className="w-5 h-5" />
                            </button>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Digite uma mensagem..."
                                    className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500/50 border border-transparent focus:border-blue-500/50 transition-all placeholder-gray-500 dark:placeholder-gray-500"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                                    disabled={!message.trim()}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
