import { useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { Send, HelpCircle, X } from 'lucide-react';
import api from '../services/api';

export default function QuestionForm({ isOpen, onClose, streamId }) {
    const { eventSettings } = useAdminStore();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await api.post('/questions', { streamId, content });
            setContent('');
            alert('Sua pergunta foi enviada com sucesso!');
            onClose();
        } catch (err) {
            alert('Falha ao enviar pergunta');
        } finally {
            setIsSubmitting(false);
        }
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
                    <button onClick={onClose} className="text-white/80 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            </div>
        </div>
    );
}
