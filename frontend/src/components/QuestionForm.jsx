import { useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Send, HelpCircle, X, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function QuestionForm({ isOpen, onClose, streamId }) {
    const { eventSettings } = useAdminStore();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await api.post('/questions', { streamId, content });
            setContent('');
            setSubmitted(true);
        } catch (err) {
            toast.error('Falha ao enviar pergunta. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSubmitted(false);
        onClose();
    };

    if (!isOpen || !eventSettings?.questions_enabled) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-purple-600">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        Envie sua Pergunta
                    </h3>
                    <button onClick={handleClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {submitted ? (
                        <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10" />
                            </div>
                            <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Sucesso!</h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Sua pergunta foi enviada com sucesso e será analisada pelos moderadores.
                            </p>
                            <button
                                onClick={handleClose}
                                className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Sua pergunta será enviada aos moderadores e poderá ser exibida na tela durante a transmissão.
                            </p>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="Escreva sua pergunta aqui..."
                                className="w-full h-32 px-4 py-3 rounded-xl border dark:border-gray-700 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none"
                                required
                            />
                            <button
                                type="submit"
                                disabled={!content.trim() || isSubmitting}
                                className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                {isSubmitting ? 'Enviando...' : 'Enviar Pergunta'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
