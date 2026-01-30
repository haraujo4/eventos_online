import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Search, Download, BarChart2, MessageCircle } from 'lucide-react';
import api from '../../services/api';
import * as XLSX from 'xlsx';

export function ReactionReport() {
    const [activeTab, setActiveTab] = useState('reactions');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            let response;
            if (activeTab === 'reactions') {
                response = await api.get('/reactions/report');
            } else if (activeTab === 'polls') {
                response = await api.get('/polls/votes/report');
            } else if (activeTab === 'questions') {
                response = await api.get('/questions');
            }
            setData(response.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const filteredData = data.filter(item => {
        const searchLower = search.toLowerCase();
        if (activeTab === 'reactions') {
            return item.user_name.toLowerCase().includes(searchLower) ||
                item.user_email.toLowerCase().includes(searchLower) ||
                item.stream_title?.toLowerCase().includes(searchLower);
        } else if (activeTab === 'polls') {
            return item.user_name.toLowerCase().includes(searchLower) ||
                item.poll_question?.toLowerCase().includes(searchLower) ||
                item.choice_text?.toLowerCase().includes(searchLower);
        } else if (activeTab === 'questions') {
            return item.user_name.toLowerCase().includes(searchLower) ||
                item.content?.toLowerCase().includes(searchLower);
        }
        return false;
    });

    const exportToExcel = () => {
        let worksheet;
        let fileName;

        if (activeTab === 'reactions') {
            worksheet = XLSX.utils.json_to_sheet(filteredData.map(i => ({
                'Usuário': i.user_name,
                'Email': i.user_email,
                'Transmissão': i.stream_title || 'N/A',
                'Idioma': i.stream_language || 'N/A',
                'Reação': i.type === 'like' ? 'Gostei' : 'Não Gostei',
                'Data/Hora': new Date(i.created_at).toLocaleString('pt-BR')
            })));
            fileName = 'relatorio_reacoes.xlsx';
        } else if (activeTab === 'polls') {
            worksheet = XLSX.utils.json_to_sheet(filteredData.map(i => ({
                'Usuário': i.user_name,
                'Email': i.user_email,
                'Enquete': i.poll_question,
                'Opção Escolhida': i.choice_text,
                'Transmissão': i.stream_title || 'Geral',
                'Idioma': i.stream_language || 'Todos',
                'Data/Hora': new Date(i.created_at).toLocaleString('pt-BR')
            })));
            fileName = 'relatorio_enquetes.xlsx';
        } else if (activeTab === 'questions') {
            worksheet = XLSX.utils.json_to_sheet(filteredData.map(i => ({
                'Usuário': i.user_name,
                'Email': i.user_email,
                'Pergunta': i.content,
                'Transmissão': i.stream_language ? `Stream ${i.stream_language}` : 'Geral',
                'Exibida em': i.displayed_at ? new Date(i.displayed_at).toLocaleString('pt-BR') : 'Não',
                'Data/Hora': new Date(i.created_at).toLocaleString('pt-BR')
            })));
            fileName = 'relatorio_perguntas.xlsx';
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
        XLSX.writeFile(workbook, fileName);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Relatório de Interações</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Acompanhe o engajamento do público</p>
                </div>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                    <Download className="w-4 h-4" />
                    Exportar Excel
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => { setActiveTab('reactions'); setSearch(''); }}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'reactions'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    <ThumbsUp className="w-4 h-4" />
                    Reações
                </button>
                <button
                    onClick={() => { setActiveTab('polls'); setSearch(''); }}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'polls'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    <BarChart2 className="w-4 h-4" />
                    Votos em Enquetes
                </button>
                <button
                    onClick={() => { setActiveTab('questions'); setSearch(''); }}
                    className={`pb-3 px-4 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'questions'
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    <MessageCircle className="w-4 h-4" />
                    Perguntas Enviadas
                </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder={
                            activeTab === 'reactions' ? "Buscar por usuário, email ou transmissão..." :
                                activeTab === 'polls' ? "Buscar por usuário, pergunta ou opção..." :
                                    "Buscar por usuário ou conteúdo da pergunta..."
                        }
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Usuário</th>
                                {activeTab === 'reactions' && (
                                    <>
                                        <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Transmissão</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Reação</th>
                                    </>
                                )}
                                {activeTab === 'polls' && (
                                    <>
                                        <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Enquete</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Opção Escolhida</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Transmissão</th>
                                    </>
                                )}
                                {activeTab === 'questions' && (
                                    <>
                                        <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Pergunta</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Transmissão</th>
                                        <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Exibida?</th>
                                    </>
                                )}
                                <th className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Nenhum registro encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{item.user_name}</p>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs">{item.user_email}</p>
                                            </div>
                                        </td>

                                        {/* Reactions Columns */}
                                        {activeTab === 'reactions' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-900 dark:text-white font-medium">{item.stream_title || 'N/A'}</span>
                                                        <span className="text-xs text-gray-500 capitalize">{item.stream_language || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.type === 'like'
                                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                                                        }`}>
                                                        {item.type === 'like' ? (
                                                            <><ThumbsUp className="w-3 h-3" /> Gostei</>
                                                        ) : (
                                                            <><ThumbsDown className="w-3 h-3" /> Não Gostei</>
                                                        )}
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {/* Polls Columns */}
                                        {activeTab === 'polls' && (
                                            <>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                    {item.poll_question}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-medium border border-indigo-100 dark:border-indigo-800">
                                                        {item.choice_text}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-gray-500">{item.stream_title || 'Geral'}</span>
                                                        {item.stream_language && <span className="text-[10px] text-gray-400 capitalize">{item.stream_language}</span>}
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {/* Questions Columns */}
                                        {activeTab === 'questions' && (
                                            <>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300 max-w-md truncate" title={item.content}>
                                                    {item.content}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-500 capitalize">
                                                        {item.stream_language || 'Geral'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.displayed_at ? (
                                                        <span className="text-green-600 text-xs font-bold bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Sim</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">Não</span>
                                                    )}
                                                </td>
                                            </>
                                        )}

                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(item.created_at).toLocaleString('pt-BR')}
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

// Ensure default export compatibility
export default ReactionReport;
