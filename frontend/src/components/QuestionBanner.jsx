import { useEffect, useState } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { HelpCircle } from 'lucide-react';

export default function QuestionBanner() {
    const { socket } = useAdminStore();
    const [currentQuestion, setCurrentQuestion] = useState(null);

    useEffect(() => {
        if (socket) {
            socket.on('question:display', (data) => {
                setCurrentQuestion(data);
                setTimeout(() => setCurrentQuestion(null), data.duration || 15000);
            });
        }
        return () => {
            if (socket) socket.off('question:display');
        };
    }, [socket]);

    if (!currentQuestion) return null;

    return (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl transform transition-all duration-500 animate-in slide-in-from-bottom-8">
            <div className="bg-blue-600/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl border border-blue-400/30 flex items-center gap-4">
                <div className="bg-white/20 p-2 rounded-xl">
                    <HelpCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-80 mb-0.5">Pergunta Selecionada</p>
                    <p className="font-bold text-sm mb-1">{currentQuestion.user_name}</p>
                    <p className="text-lg leading-tight font-medium">"{currentQuestion.content}"</p>
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
