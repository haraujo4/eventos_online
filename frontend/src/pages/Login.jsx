import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, Loader2, User, ShieldCheck } from 'lucide-react';
import { formatWithMask } from '../utils/maskUtils';
import { ThemeToggle } from '../components/ThemeToggle';
import { toast } from 'react-toastify';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');


    const [customData, setCustomData] = useState({});


    const [twoFactorCode, setTwoFactorCode] = useState('');

    const navigate = useNavigate();
    const { login, register, verify2FA, isLoading, error, requires2fa, authFields, fetchAuthFields, eventSettings } = useAuthStore();

    // Helper to get full URL for images
    const getImageUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `http://localhost:3000${url}`;
    };

    useEffect(() => {
        fetchAuthFields();
    }, [fetchAuthFields]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (requires2fa) {
            const success = await verify2FA(twoFactorCode);
            if (success) {
                const user = JSON.parse(localStorage.getItem('user'));
                navigate('/player');
            }
            return;
        }

        if (isLogin) {
            const result = await login(email, password);
            if (result && result.success) {
                navigate('/player');
            }

        } else {
            const success = await register(name, email, password, customData);
            if (success) {
                setIsLogin(true);
                toast.success('Cadastro realizado com sucesso! Por favor faça login.', {
                    position: "top-center",
                    autoClose: 5000
                });
            }
        }
    };

    const handleCustomFieldChange = (fieldName, value, type, checked) => {
        let finalValue = type === 'checkbox' ? checked : value;


        const fieldConfig = authFields.find(f => f.field_name === fieldName);
        if (type !== 'checkbox' && fieldConfig && fieldConfig.mask) {
            finalValue = formatWithMask(value, fieldConfig.mask);
        }

        setCustomData(prev => ({
            ...prev,
            [fieldName]: finalValue
        }));
    };

    if (requires2fa) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat bg-gray-50 dark:bg-gray-900"
                style={eventSettings?.background_url ? { backgroundImage: `url(${getImageUrl(eventSettings.background_url)})` } : {}}
            >
                {/* Overlay for better readability if there is a background */}
                {eventSettings?.background_url && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
                )}

                <div className="absolute top-4 right-4 z-50">
                    <ThemeToggle />
                </div>

                <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden relative z-10 transition-colors duration-300">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <div className="bg-blue-500/10 p-4 rounded-full">
                                    <ShieldCheck className="w-10 h-10 text-blue-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Autenticação de Dois Fatores</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                                Digite o código de verificação enviado ao seu e-mail.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Código de Verificação</label>
                                <input
                                    type="text"
                                    required
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-center tracking-[0.5em] text-lg font-mono"
                                    placeholder="123456"
                                    maxLength={6}
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-200"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                                    </span>
                                ) : 'Verificar Código'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat transition-all duration-700 bg-gray-50 dark:bg-gray-900"
            style={eventSettings?.background_url ? { backgroundImage: `url(${getImageUrl(eventSettings.background_url)})` } : {}}
        >
            {/* Background Overlay */}
            {eventSettings?.background_url && (
                <div className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[1px]" />
            )}

            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md bg-white/70 dark:bg-gray-900/40 backdrop-blur-2xl rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/40 dark:border-white/10 overflow-hidden relative z-10 transition-all duration-300">
                <div className="p-8">
                    <div className="text-center mb-8">
                        {eventSettings?.logo_url && eventSettings.logo_url !== '' && (
                            <div className="flex justify-center mb-8">
                                <img
                                    src={getImageUrl(eventSettings.logo_url)}
                                    alt="Logo"
                                    className="h-20 w-auto object-contain drop-shadow-lg"
                                />
                            </div>
                        )}
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                            {isLogin ? 'Bem-vindo de Volta' : 'Criar Conta'}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-2 font-medium">
                            {isLogin ? 'Faça login para acessar o evento' : 'Cadastre-se para participar do evento'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Auth Fields */}
                                {authFields.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                                            {field.label} {field.is_required && <span className="text-red-500 dark:text-red-400">*</span>}
                                        </label>
                                        <div className="relative">
                                            {field.input_type === 'checkbox' ? (
                                                <div className="flex items-center pt-2 pl-1">
                                                    <input
                                                        type="checkbox"
                                                        required={field.is_required}
                                                        checked={!!customData[field.field_name]}
                                                        onChange={(e) => handleCustomFieldChange(field.field_name, null, 'checkbox', e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 rounded bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Sim</span>
                                                </div>
                                            ) : field.input_type === 'dropdown' ? (
                                                <select
                                                    required={field.is_required}
                                                    value={customData[field.field_name] || ''}
                                                    onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
                                                >
                                                    <option value="">Selecione uma opção</option>
                                                    {field.options && JSON.parse(field.options)?.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.input_type}
                                                    required={field.is_required}
                                                    value={customData[field.field_name] || ''}
                                                    onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                                                    placeholder={field.placeholder || ''}
                                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Endereço de E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pl-10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {isLogin ? 'Entrando...' : 'Cadastrando...'}
                                </>
                            ) : (
                                isLogin ? 'Entrar' : 'Criar Conta'
                            )}
                        </button>
                    </form>
                </div>

                <div className="bg-white/50 dark:bg-black/20 backdrop-blur-md p-4 text-center text-sm text-gray-600 dark:text-gray-300 border-t border-white/20 dark:border-white/5">
                    {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 ml-2 font-bold focus:outline-none transition-colors"
                    >
                        {isLogin ? 'Cadastre-se agora' : 'Entrar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
