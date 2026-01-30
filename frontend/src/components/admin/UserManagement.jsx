import { useAdminStore } from '../../store/useAdminStore';
import { Ban, CheckCircle, Search, Download, Upload, Plus, Edit2, X, Save, Loader2, AlertCircle, ClipboardList, CheckCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { formatWithMask } from '../../utils/maskUtils';
import { toast } from 'react-toastify';

export function UserManagement() {
    const { users, fetchUsers, toggleUserStatus, importUsers, exportUsers, createUser, updateUser, authFields } = useAdminStore();
    const [search, setSearch] = useState('');
    const fileInputRef = useRef(null);
    const [importing, setImporting] = useState(false);


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [importResults, setImportResults] = useState(null);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user',
        status: 'active',
        custom_data: {}
    });

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = () => exportUsers();

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImporting(true);
        const toastId = toast.loading('Importando usuários...');
        try {
            const result = await importUsers(file);

            setImportResults(result);
            setIsResultModalOpen(true);

            if (result.failed > 0) {
                toast.update(toastId, {
                    render: `Importação finalizada com ${result.failed} problemas.`,
                    type: 'warning',
                    isLoading: false,
                    autoClose: 3000
                });
            } else {
                toast.update(toastId, {
                    render: `Importação concluída! ${result.success} usuários adicionados.`,
                    type: 'success',
                    isLoading: false,
                    autoClose: 3000
                });
            }
            e.target.value = null;
        } catch (err) {
            toast.update(toastId, {
                render: 'Falha na importação: ' + (err.response?.data?.message || err.message),
                type: 'error',
                isLoading: false,
                autoClose: 5000
            });
        } finally {
            setImporting(false);
        }
    };


    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'user',
            status: 'active',
            custom_data: {}
        });
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            status: user.status,
            custom_data: user.custom_data || {}
        });
        setIsModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('custom_')) {
            const fieldKey = name.replace('custom_', '');


            const fieldConfig = authFields.find(f => f.field_name === fieldKey);
            let finalValue = value;

            if (fieldConfig && fieldConfig.mask) {



                finalValue = formatWithMask(value, fieldConfig.mask);
            }

            setFormData(prev => ({
                ...prev,
                custom_data: { ...prev.custom_data, [fieldKey]: finalValue }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingUser) {

                const updates = { ...formData };
                if (!updates.password) delete updates.password;
                await updateUser(editingUser.id, updates);
                toast.success('Usuário atualizado com sucesso');
            } else {
                await createUser(formData);
                toast.success('Usuário criado com sucesso');
            }
            setIsModalOpen(false);
        } catch (err) {
            toast.error('Operação falhou: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gerenciamento de Usuários</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie acessos e permissões do sistema</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Adicionar Usuário</span>
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                        <button
                            onClick={() => useAdminStore.getState().downloadUserTemplate()}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-md transition-colors text-sm font-medium"
                            title="Baixar Modelo de Importação"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden lg:inline">Modelo</span>
                        </button>
                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>
                        <button
                            onClick={handleImportClick}
                            disabled={importing}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-md transition-colors text-sm font-medium disabled:opacity-50"
                            title="Importar Usuários via Excel"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden lg:inline">{importing ? 'Importando...' : 'Importar'}</span>
                        </button>
                        <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-1"></div>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-md transition-colors text-sm font-medium"
                            title="Exportar Usuários para Excel"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden lg:inline">Exportar</span>
                        </button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xlsx, .xls, .json"
                        className="hidden"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Usuário</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Função</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 text-right">Ações</th>
                            </tr>

                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs">{user.email}</p>
                                            {user.custom_data && Object.keys(user.custom_data).length > 0 && (
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                    {Object.entries(user.custom_data).map(([key, value]) => (
                                                        <span key={key} className="inline-flex items-center text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                                                            <span className="opacity-60 mr-1">{key}:</span> {value && value.toString()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`capitalize px-2.5 py-0.5 rounded-full border text-xs ${user.role === 'admin' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' :
                                            user.role === 'moderator' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                                                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                                            }`}>
                                            {user.role === 'admin' ? 'Administrador' : user.role === 'moderator' ? 'Moderador' : 'Usuário'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.status === 'active'
                                            ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                                            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {user.status === 'active' ? 'Ativo' : 'Banido'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="text-gray-500 hover:text-blue-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-700 p-2 rounded transition-colors"
                                            title="Edit User"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        {user.status === 'active' ? (
                                            <button
                                                onClick={() => toggleUserStatus(user.id, user.status)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 p-2 rounded transition-colors"
                                                title="Banir Usuário"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => toggleUserStatus(user.id, user.status)}
                                                className="text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/30 p-2 rounded transition-colors"
                                                title="Ativar Usuário"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                            <h3 className="font-semibold text-gray-800 dark:text-white">{editingUser ? 'Editar Usuário' : 'Criar Usuário'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Senha {editingUser && <span className="text-gray-400 font-normal">(Deixe em branco para manter a atual)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Função</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="user">Usuário</option>
                                        <option value="moderator">Moderador</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleFormChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="banned">Banido</option>
                                    </select>
                                </div>
                            </div>

                            {authFields && authFields.length > 0 && (
                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
                                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Campos Personalizados</h4>
                                    <div className="space-y-3">
                                        {authFields.map(field => (
                                            <div key={field.field_name}>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{field.label}</label>
                                                {field.input_type === 'dropdown' ? (
                                                    <select
                                                        name={`custom_${field.field_name}`}
                                                        value={formData.custom_data[field.field_name] || ''}
                                                        onChange={handleFormChange}
                                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {field.options && field.options.map(opt => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.input_type === 'number' ? 'number' : 'text'}
                                                        name={`custom_${field.field_name}`}
                                                        value={formData.custom_data[field.field_name] || ''}
                                                        onChange={handleFormChange}
                                                        placeholder={field.placeholder || ''}
                                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {isSaving ? 'Salvando...' : (editingUser ? 'Salvar Alterações' : 'Criar Usuário')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isResultModalOpen && importResults && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${importResults.failed > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                    <ClipboardList className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 dark:text-white">Resumo da Importação</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Registros processados: {importResults.success + importResults.failed}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsResultModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                                    <p className="text-green-600 dark:text-green-400 text-xs font-medium uppercase tracking-wider mb-1">Sucesso</p>
                                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">{importResults.success}</p>
                                </div>
                                <div className={`rounded-xl p-4 border ${importResults.failed > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600'}`}>
                                    <p className={`${importResults.failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} text-xs font-medium uppercase tracking-wider mb-1`}>Falha</p>
                                    <p className={`text-2xl font-bold ${importResults.failed > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>{importResults.failed}</p>
                                </div>
                            </div>

                            {importResults.errors && importResults.errors.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                        Falhas na Importação ({importResults.errors.length})
                                    </h4>
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 overflow-hidden">
                                        <div className="max-h-60 overflow-y-auto divide-y divide-red-100 dark:divide-red-800">
                                            {importResults.errors.map((err, i) => (
                                                <div key={i} className="p-3 text-sm flex gap-3">
                                                    <div className="flex-1">
                                                        <span className="font-semibold text-red-800 dark:text-red-300 block">{err.email || 'Registro Desconhecido'}</span>
                                                        <span className="text-red-600 dark:text-red-400 text-xs">{err.error}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {importResults.createdUsers && importResults.createdUsers.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                                        <CheckCheck className="w-4 h-4 text-green-500" />
                                        Adicionados com Sucesso ({importResults.createdUsers.length})
                                    </h4>
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 overflow-hidden">
                                        <div className="max-h-60 overflow-y-auto divide-y divide-green-100 dark:divide-green-800">
                                            {importResults.createdUsers.map((user, i) => (
                                                <div key={i} className="p-3 text-sm flex justify-between items-center text-green-900 dark:text-green-300">
                                                    <span>{user.name}</span>
                                                    <span className="text-green-700 dark:text-green-400 opacity-70 text-xs">{user.email}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
                            <button
                                onClick={() => setIsResultModalOpen(false)}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                            >
                                Fechar Relatório
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
