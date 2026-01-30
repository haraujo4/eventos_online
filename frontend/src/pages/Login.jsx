import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Lock, Mail, Loader2, User, ShieldCheck } from 'lucide-react';
import { formatWithMask } from '../utils/maskUtils';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    
    const [customData, setCustomData] = useState({});

    
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const navigate = useNavigate();
    const { login, register, verify2FA, isLoading, error, requires2fa, authFields, fetchAuthFields } = useAuthStore();

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
                alert('Cadastro realizado com sucesso! Por favor faça login.');
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
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
                <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <div className="bg-blue-500/10 p-4 rounded-full">
                                    <ShieldCheck className="w-10 h-10 text-blue-500" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Autenticação de Dois Fatores</h2>
                            <p className="text-gray-400 mt-2 text-sm">
                                Digite o código de verificação enviado ao seu e-mail.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Código de Verificação</label>
                                <input
                                    type="text"
                                    required
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-center tracking-[0.5em] text-lg font-mono"
                                    placeholder="123456"
                                    maxLength={6}
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
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
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            {isLogin ? 'Bem-vindo de Volta' : 'Criar Conta'}
                        </h2>
                        <p className="text-gray-400 mt-2">
                            {isLogin ? 'Faça login para acessar o evento' : 'Cadastre-se para participar do evento'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300 ml-1">Nome Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>

                                {}
                                {authFields.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300 ml-1">
                                            {field.label} {field.is_required && <span className="text-red-400">*</span>}
                                        </label>
                                        <div className="relative">
                                            {field.input_type === 'checkbox' ? (
                                                <div className="flex items-center pt-2 pl-1">
                                                    <input
                                                        type="checkbox"
                                                        required={field.is_required}
                                                        checked={!!customData[field.field_name]}
                                                        onChange={(e) => handleCustomFieldChange(field.field_name, null, 'checkbox', e.target.checked)}
                                                        className="w-4 h-4 text-blue-600 rounded bg-gray-900 border-gray-600 focus:ring-blue-500"
                                                    />
                                                    <span className="ml-2 text-sm text-gray-400">Sim</span>
                                                </div>
                                            ) : field.input_type === 'dropdown' ? (
                                                <select
                                                    required={field.is_required}
                                                    value={customData[field.field_name] || ''}
                                                    onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none"
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
                                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Endereço de E-mail</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 ml-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
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

                <div className="bg-gray-700/30 p-4 text-center text-sm text-gray-400 border-t border-gray-700">
                    {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-blue-400 hover:text-blue-300 ml-2 font-medium focus:outline-none"
                    >
                        {isLogin ? 'Cadastre-se agora' : 'Entrar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
