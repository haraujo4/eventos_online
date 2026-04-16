import { X, Copy, Check, Facebook, Linkedin, Twitter, MessageCircle, Code } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

export default function ShareModal({ isOpen, onClose, eventTitle }) {
    const [copied, setCopied] = useState(false);
    const [embedCopied, setEmbedCopied] = useState(false);
    
    const shareUrl = window.location.href;
    const embedCode = `<iframe src="${shareUrl}" width="100%" height="500px" frameborder="0" allowfullscreen></iframe>`;

    const handleCopy = (text, setter) => {
        navigator.clipboard.writeText(text);
        setter(true);
        toast.success('Copiado para a área de transferência!');
        setTimeout(() => setter(false), 2000);
    };

    if (!isOpen) return null;

    const socialLinks = [
        { 
            name: 'WhatsApp', 
            icon: MessageCircle, 
            color: 'bg-[#25D366]', 
            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(eventTitle + ': ' + shareUrl)}` 
        },
        { 
            name: 'Facebook', 
            icon: Facebook, 
            color: 'bg-[#1877F2]', 
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` 
        },
        { 
            name: 'Twitter', 
            icon: Twitter, 
            color: 'bg-[#1DA1F2]', 
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(eventTitle)}&url=${encodeURIComponent(shareUrl)}` 
        },
        { 
            name: 'LinkedIn', 
            icon: Linkedin, 
            color: 'bg-[#0A66C2]', 
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` 
        },
    ];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
                        <Share2 className="w-4 h-4 text-blue-500" />
                        Compartilhar Evento
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Social Grid */}
                    <div className="grid grid-cols-4 gap-4">
                        {socialLinks.map((social) => (
                            <a
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className={`${social.color} p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform active:scale-95`}>
                                    <social.icon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{social.name}</span>
                            </a>
                        ))}
                    </div>

                    {/* Direct Link */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Link Direto</label>
                        <div className="flex gap-2 p-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
                            <input 
                                type="text" 
                                readOnly 
                                value={shareUrl}
                                className="flex-1 bg-transparent border-none text-xs px-2 outline-none text-gray-600 dark:text-gray-400 font-medium"
                            />
                            <button 
                                onClick={() => handleCopy(shareUrl, setCopied)}
                                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90'}`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        </div>
                    </div>

                    {/* Embed Code */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incorporar (Embed)</label>
                            <button 
                                onClick={() => handleCopy(embedCode, setEmbedCopied)}
                                className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1"
                            >
                                {embedCopied ? <Check className="w-3 h-3" /> : <Code className="w-3 h-3" />}
                                {embedCopied ? 'Copiado!' : 'Copiar Código'}
                            </button>
                        </div>
                        <div className="bg-gray-950 p-3 rounded-xl border border-white/5 overflow-hidden">
                            <code className="text-[10px] text-blue-400 break-all leading-relaxed font-mono block h-16 overflow-y-auto no-scrollbar">
                                {embedCode}
                            </code>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Internal Share2 icon for title since we didn't import it in socialLinks
function Share2({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
    );
}
