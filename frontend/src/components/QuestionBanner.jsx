import { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { HelpCircle } from 'lucide-react';

export default function QuestionBanner({ streamId }) {
    const { socket, eventSettings } = useAdminStore();
    const [currentQuestion, setCurrentQuestion] = useState(null);

    useEffect(() => {
        if (socket) {
            socket.on('question:display', (data) => {
                const normalize = (val) => (val === null || val === undefined || val === 'null' || val === '') ? null : Number(val);

                const incomingStreamId = normalize(data.streamId);
                const currentStreamId = normalize(streamId);

                if (incomingStreamId === null || incomingStreamId === currentStreamId) {
                    setCurrentQuestion(data);
                    setTimeout(() => setCurrentQuestion(null), data.duration || 15000);
                }
            });
        }
        return () => {
            if (socket) socket.off('question:display');
        };
    }, [socket, streamId]);

    if (!eventSettings?.questions_enabled || !currentQuestion) return null;

    return (
        <div className="absolute bottom-4 sm:bottom-16 left-1/2 -translate-x-1/2 z-[100] w-[95%] sm:w-[90%] max-w-2xl transform transition-all duration-500 animate-in slide-in-from-bottom-8">
            <div className="bg-blue-600/90 backdrop-blur-md text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xl border border-blue-400/30 flex items-center gap-3 sm:gap-4">
                <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                    <HelpCircle className="w-5 h-5 sm:w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest opacity-80 mb-0.5">Pergunta Selecionada</p>
                    <p className="font-bold text-xs sm:text-sm mb-0.5 sm:mb-1 truncate">{currentQuestion.user_name}</p>
                    <p className="text-sm sm:text-lg leading-tight font-medium line-clamp-2">"{currentQuestion.content}"</p>
                </div>
                <div className="h-10 w-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white animate-shrink-y" style={{ animationDuration: '15s' }}></div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shrink-y {
                    from { height: 100%; }
                    to { height: 0%; }
                }
                .animate-shrink-y {
                    animation-name: shrink-y;
                    animation-timing-function: linear;
                    animation-fill-mode: forwards;
                }
            `}</style>
        </div>
    );
}
