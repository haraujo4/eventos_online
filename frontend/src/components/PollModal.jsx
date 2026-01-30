import { useState, useEffect } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { BarChart2, Check, X } from 'lucide-react';

export default function PollModal({ isOpen, onClose }) {
    const { socket } = useAdminStore();
    const { user } = useAuthStore();
    const [poll, setPoll] = useState(null);
    const [loading, setLoading] = useState(false);
    const [votedOption, setVotedOption] = useState(null);
    const [results, setResults] = useState(null);

    const fetchActivePoll = async () => {
        try {
            const response = await api.get('/polls/active');
            if (response.data) {
                setPoll(response.data);
                setVotedOption(response.data.userVote?.option_id);
                if (response.data.show_results) setResults(response.data.results);
            } else {
                setPoll(null);
            }
        } catch (err) {
            console.error('Failed to fetch active poll');
        }
    };

    useEffect(() => {
        if (isOpen) fetchActivePoll();

        if (socket) {
            socket.on('poll:new', (newPoll) => {
                setPoll(newPoll);
                setVotedOption(null);
                setResults(null);
            });
            socket.on('poll:results', (data) => {
                if (poll && data.pollId === poll.id) {
                    setResults(data.results);
                }
            });
            socket.on('poll:closed', (data) => {
                if (poll && data.id === poll.id) {
                    setPoll(prev => ({ ...prev, is_active: false }));
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('poll:new');
                socket.off('poll:results');
                socket.off('poll:closed');
            }
        };
    }, [isOpen, socket, poll?.id]);

    const handleVote = async (optionId) => {
        if (votedOption || !poll?.is_active) return;
        setLoading(true);
        try {
            await api.post('/polls/vote', { pollId: poll.id, optionId });
            setVotedOption(optionId);
            // Result will come via socket if enabled
        } catch (err) {
            alert(err.response?.data?.error || 'Erro ao votar');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-blue-600">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" />
                        Enquete ao Vivo
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {!poll ? (
                        <div className="text-center py-8 text-gray-500">
                            Nenhuma enquete ativa no momento.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h4 className="text-xl font-bold dark:text-white line-height-tight">
                                {poll.question}
                            </h4>

                            <div className="space-y-3">
                                {poll.options.map((opt) => {
                                    const result = results?.find(r => r.id === opt.id);
                                    const totalVotes = results?.reduce((acc, r) => acc + r.votes, 0) || 1;
                                    const percent = result ? Math.round((result.votes / totalVotes) * 100) : 0;

                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleVote(opt.id)}
                                            disabled={!!votedOption || !poll.is_active || loading}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all relative overflow-hidden group ${votedOption === opt.id
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                    : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'
                                                } ${(!poll.is_active || votedOption) && 'cursor-default'}`}
                                        >
                                            {/* Progress Bar background if results exist */}
                                            {results && (
                                                <div
                                                    className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 transition-all duration-1000"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            )}

                                            <div className="relative z-10 flex justify-between items-center">
                                                <span className={`font-medium ${votedOption === opt.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {opt.text}
                                                </span>
                                                {votedOption === opt.id && <Check className="w-4 h-4 text-blue-500" />}
                                                {results && <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{percent}%</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {!poll.is_active && (
                                <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">Enquete Encerrada</p>
                            )}
                            {votedOption && poll.is_active && !results && (
                                <p className="text-center text-sm text-gray-500 italic">Voto registrado! Aguarde o resultado.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
