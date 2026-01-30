import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Search, Download } from 'lucide-react';
import api from '../../services/api';
import * as XLSX from 'xlsx';

export default function ReactionReport() {
    const [interactions, setInteractions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchInteractions = async () => {
        try {
            const response = await api.get('/reactions/report');
            setInteractions(response.data);
        } catch (error) {
            console.error('Failed to fetch interactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInteractions();
    }, []);

    const filteredInteractions = interactions.filter(interaction =>
        interaction.user_name.toLowerCase().includes(search.toLowerCase()) ||
        interaction.user_email.toLowerCase().includes(search.toLowerCase()) ||
        interaction.stream_title?.toLowerCase().includes(search.toLowerCase())
    );

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(interactions.map(i => ({
            'Usuário': i.user_name,
            'Email': i.user_email,
            'Transmissão': i.stream_title || 'N/A',
            'Idioma': i.stream_language || 'N/A',
            'Reação': i.type === 'like' ? 'Gostei' : 'Não Gostei',
            'Data/Hora': new Date(i.created_at).toLocaleString('pt-BR')
        })));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Reações");
        XLSX.writeFile(workbook, "relatorio_reacoes.xlsx");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Relatório de Interações</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Visualize quem curtiu ou não curtiu as transmissões</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Exportar Excel
                </button>
            </div>

            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por usuário, email ou transmissão..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Usuário</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Transmissão</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Reação</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredInteractions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Nenhuma interação encontrada.
                                    </td>
                                </tr>
                            ) : (
                                filteredInteractions.map((interaction) => (
                                    <tr key={interaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{interaction.user_name}</p>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs">{interaction.user_email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 dark:text-white font-medium">{interaction.stream_title || 'N/A'}</span>
                                                <span className="text-xs text-gray-500 capitalize">{interaction.stream_language || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${interaction.type === 'like'
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                                                }`}>
                                                {interaction.type === 'like' ? (
                                                    <><ThumbsUp className="w-3 h-3" /> Gostei</>
                                                ) : (
                                                    <><ThumbsDown className="w-3 h-3" /> Não Gostei</>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(interaction.created_at).toLocaleString('pt-BR')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
