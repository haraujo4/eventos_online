import { useState, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Save, Upload, Trash2, Plus, Shield, Settings, Image } from 'lucide-react';
import { toast } from 'react-toastify';

export function EventSettings() {
    const { eventSettings, authFields, fetchSettings, updateSettings, updateAuthFields, uploadLogo, uploadBackground, removeBackground } = useAdminStore();
    const [loading, setLoading] = useState(false);


    const [settingsForm, setSettingsForm] = useState({
        event_name: '',
        auth_mode: 'standard',
        two_factor_enabled: false,
        allow_registration: true,
        chat_enabled: true,
        polls_enabled: true,
        comments_enabled: true,
        questions_enabled: true,
        smtp_config: { host: '', port: 587, user: '', pass: '', secure: false }
    });

    const [fieldsForm, setFieldsForm] = useState([]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        if (eventSettings) {
            setSettingsForm(prev => ({
                ...prev,
                event_name: eventSettings.event_name || '',
                auth_mode: eventSettings.auth_mode || 'standard',
                two_factor_enabled: eventSettings.two_factor_enabled || false,
                allow_registration: eventSettings.allow_registration ?? true,
                chat_enabled: eventSettings.chat_enabled ?? true,
                polls_enabled: eventSettings.polls_enabled ?? true,
                comments_enabled: eventSettings.comments_enabled ?? true,
                questions_enabled: eventSettings.questions_enabled ?? true,
                smtp_config: { ...prev.smtp_config, ...(eventSettings.smtp_config || {}) }
            }));
        }
        if (authFields) {
            setFieldsForm(authFields);
        }
    }, [eventSettings, authFields]);

    const handleSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('smtp_')) {
            const smtpKey = name.replace('smtp_', '');
            setSettingsForm(prev => ({
                ...prev,
                smtp_config: {
                    ...prev.smtp_config,
                    [smtpKey]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setSettingsForm(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateSettings(settingsForm);
            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            toast.error('Falha ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await uploadLogo(file);
            toast.success('Logo enviada com sucesso!');
        } catch (error) {
            toast.error('Falha ao enviar logo');
        }
    };

    const handleBackgroundUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await uploadBackground(file);
            toast.success('Papel de parede enviado com sucesso!');
        } catch (error) {
            toast.error('Falha ao enviar papel de parede');
        }
    };

    const handleRemoveBackground = async () => {
        if (!confirm('Deseja realmente remover o papel de parede?')) return;
        try {
            await removeBackground();
            toast.success('Papel de parede removido!');
        } catch (error) {
            toast.error('Falha ao remover papel de parede');
        }
    };


    const addField = () => {
        setFieldsForm([
            ...fieldsForm,
            {
                field_name: `field_${Date.now()}`,
                label: 'Novo Campo',
                input_type: 'text',
                is_required: false,
                display_order: fieldsForm.length
            }
        ]);
    };

    const removeField = (index) => {
        const newFields = fieldsForm.filter((_, i) => i !== index);
        setFieldsForm(newFields);
    };

    const updateField = (index, key, value) => {
        const newFields = [...fieldsForm];
        newFields[index] = { ...newFields[index], [key]: value };

        if (key === 'label') {
            newFields[index].field_name = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
        }
        setFieldsForm(newFields);
    };

    const handleSaveFields = async () => {
        setLoading(true);
        try {
            await updateAuthFields(fieldsForm);
            toast.success('Campos atualizados com sucesso!');
        } catch (error) {
            toast.error('Falha ao atualizar campos');
        } finally {
            setLoading(false);
        }
    };

    if (!eventSettings) return <div className="p-8 text-center text-gray-600 dark:text-gray-400">Carregando configurações...</div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Configuração do Evento</h2>
            </div>

            { }
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center gap-3">
                    <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-800 dark:text-white">Configurações Gerais</h3>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSaveSettings} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Evento</label>
                                <input
                                    type="text"
                                    name="event_name"
                                    value={settingsForm.event_name}
                                    onChange={handleSettingsChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo do Evento</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                        {eventSettings.logo_url ? (
                                            <img
                                                src={eventSettings.logo_url.startsWith('http') ? eventSettings.logo_url : `http://localhost:3000${eventSettings.logo_url}`}
                                                alt="Logo"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <Image className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="logo-upload"
                                        className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Enviar Logo
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Papel de Parede (Login)</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                        {eventSettings.background_url ? (
                                            <img
                                                src={eventSettings.background_url.startsWith('http') ? eventSettings.background_url : `http://localhost:3000${eventSettings.background_url}`}
                                                alt="Background"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Image className="w-8 h-8 text-gray-400" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        id="bg-upload"
                                        accept="image/*"
                                        onChange={handleBackgroundUpload}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="bg-upload"
                                        className="cursor-pointer bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Enviar Background
                                    </label>

                                    {eventSettings.background_url && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveBackground}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Remover Background"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                Authentication & Security
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modo de Autenticação</label>
                                    <select
                                        name="auth_mode"
                                        value={settingsForm.auth_mode}
                                        onChange={handleSettingsChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="standard">Padrão (E-mail/Senha)</option>
                                        <option value="sso">Login Único (SSO)</option>
                                        <option value="open">Aberto (Sem Autenticação)</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-8 pt-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="allow_registration"
                                            checked={settingsForm.allow_registration}
                                            onChange={handleSettingsChange}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Permitir Cadastro</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="two_factor_enabled"
                                            checked={settingsForm.two_factor_enabled}
                                            onChange={handleSettingsChange}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Habilitar 2FA (E-mail)</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                Interação
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="chat_enabled"
                                        checked={settingsForm.chat_enabled}
                                        onChange={handleSettingsChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Chat ao Vivo</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="polls_enabled"
                                        checked={settingsForm.polls_enabled}
                                        onChange={handleSettingsChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Habilitar Enquetes</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="comments_enabled"
                                        checked={settingsForm.comments_enabled}
                                        onChange={handleSettingsChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Habilitar Comentários</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="questions_enabled"
                                        checked={settingsForm.questions_enabled}
                                        onChange={handleSettingsChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Habilitar Perguntas</span>
                                </label>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Configuração SMTP (Para E-mails)</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        name="smtp_host"
                                        placeholder="SMTP Host"
                                        value={settingsForm.smtp_config.host}
                                        onChange={handleSettingsChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        name="smtp_port"
                                        placeholder="Porta"
                                        value={settingsForm.smtp_config.port}
                                        onChange={handleSettingsChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="smtp_secure"
                                            checked={settingsForm.smtp_config.secure}
                                            onChange={handleSettingsChange}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Seguro (SSL/TLS)</span>
                                    </label>
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        name="smtp_user"
                                        placeholder="Usuário SMTP"
                                        value={settingsForm.smtp_config.user}
                                        onChange={handleSettingsChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="password"
                                        name="smtp_pass"
                                        placeholder="Senha SMTP"
                                        value={settingsForm.smtp_config.pass}
                                        onChange={handleSettingsChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                Salvar Configurações
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            { }
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Settings className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold text-gray-800 dark:text-white">Campos de Cadastro Personalizados</h3>
                    </div>
                    <button
                        onClick={addField}
                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Campo
                    </button>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {fieldsForm.length === 0 && (
                            <p className="text-center text-gray-400 py-4 text-sm">Nenhum campo personalizado definido.</p>
                        )}
                        {fieldsForm.map((field, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <div className="flex-1 w-full">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Rótulo</label>
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => updateField(index, 'label', e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="Nome de Exibição"
                                    />
                                </div>
                                <div className="w-full md:w-40">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Tipo</label>
                                    <select
                                        value={field.input_type}
                                        onChange={(e) => updateField(index, 'input_type', e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="text">Texto</option>
                                        <option value="number">Número</option>
                                        <option value="dropdown">Lista Suspensa</option>
                                        <option value="checkbox">Caixa de Seleção</option>
                                    </select>
                                </div>
                                <div className="w-full md:w-1/4">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Placeholder (Dica)</label>
                                    <input
                                        type="text"
                                        value={field.placeholder || ''}
                                        onChange={(e) => updateField(index, 'placeholder', e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="Ex: (99) ..."
                                    />
                                </div>
                                <div className="w-full md:w-1/4">
                                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 block">Máscara (9=Num, a=Letra)</label>
                                    <input
                                        type="text"
                                        value={field.mask || ''}
                                        onChange={(e) => updateField(index, 'mask', e.target.value)}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="Ex: (99) 99999-9999"
                                    />
                                </div>
                                <div className="flex items-center pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={field.is_required}
                                            onChange={(e) => updateField(index, 'is_required', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                                        />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Obrigatório</span>
                                    </label>
                                </div>
                                <div className="pt-5">
                                    <button
                                        onClick={() => removeField(index)}
                                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-6">
                        <button
                            onClick={handleSaveFields}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            Atualizar Campos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
