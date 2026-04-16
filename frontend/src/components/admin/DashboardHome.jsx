import { 
    Users, MessageSquare, Activity, Eye, Download, 
    ThumbsUp, ThumbsDown, Vote, ShieldAlert, Calendar, X
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardHome() {
    const { 
        stats, fetchStats, mediaSettings, fetchMediaSettings,
        fetchAnalyticsHistory, viewerStatsHistory, exportAudienceReport,
        currentViewers, streamViewers, onlineUsers, fetchOnlineUsers
    } = useAdminStore();
    const [interval, setIntervalState] = useState('minute');
    const [selectedEventId, setSelectedEventId] = useState('');
    const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);

    // Calculate real-time viewers for the selected view
    const activeViewers = selectedEventId 
        ? Object.entries(streamViewers).reduce((sum, [streamId, count]) => {
            const event = mediaSettings.streams.find(e => e.id == selectedEventId);
            const stream = event?.streams?.find(s => s.id == streamId);
            return stream ? sum + count : sum;
        }, 0)
        : currentViewers;

    useEffect(() => {
        fetchMediaSettings();
    }, [fetchMediaSettings]);

    useEffect(() => {
        fetchStats(selectedEventId);
        fetchAnalyticsHistory(interval, selectedEventId);

        const timer = setInterval(() => {
            fetchStats(selectedEventId);
            fetchAnalyticsHistory(interval, selectedEventId);
            if (isOnlineModalOpen) fetchOnlineUsers(selectedEventId);
        }, 10000); // 10s for dashboard stats
        return () => clearInterval(timer);
    }, [fetchStats, fetchAnalyticsHistory, interval, selectedEventId, isOnlineModalOpen, fetchOnlineUsers]);

    // Fetch once when modal opens
    useEffect(() => {
        if (isOnlineModalOpen) {
            fetchOnlineUsers(selectedEventId);
        }
    }, [isOnlineModalOpen, selectedEventId, fetchOnlineUsers]);

    const StatCard = ({ title, value, icon: Icon, color, border, onClick }) => (
        <div 
            onClick={onClick}
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border ${border || 'border-gray-100 dark:border-gray-700'} transition-all hover:shadow-md group ${onClick ? 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-500' : ''}`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
                    <p className="text-4xl font-black mt-2 text-gray-900 dark:text-white transition-all group-hover:scale-110 origin-left">{value}</p>
                </div>
                <div className={`p-4 rounded-xl ${color} shadow-lg transition-transform group-hover:rotate-12`}>
                    <Icon className="w-7 h-7 text-white" />
                </div>
            </div>
            {onClick && (
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-700/50 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    <Activity className="w-3 h-3" />
                    Ver Detalhes
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Online Users Modal */}
            {isOnlineModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
                                    Usuários Online Agora
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                    {selectedEventId ? `Filtrado pelo evento selecionado` : `Visualização global de todos os eventos`}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsOnlineModalOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                            {onlineUsers.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 backdrop-blur-md">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Participante</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Evento / Idioma</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Entrada</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {onlineUsers.map(u => (
                                            <tr key={u.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-gray-900 dark:text-white text-base">{u.name}</span>
                                                        <span className="text-xs text-gray-400 font-medium">{u.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-col">
                                                        <span className="text-gray-700 dark:text-gray-300 font-bold text-sm">{u.event_title}</span>
                                                        <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">{u.stream_language}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                        {new Date(u.entry_time).toLocaleTimeString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-20 flex flex-col items-center justify-center text-gray-400 gap-4">
                                    <Users className="w-16 h-16 opacity-10" />
                                    <p className="font-bold">Nenhum usuário online no momento.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                            <button 
                                onClick={() => setIsOnlineModalOpen(false)}
                                className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Estatísticas do Evento</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">Acompanhe métricas e engajamento em tempo real.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:border-blue-500">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <select 
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="bg-transparent border-none font-bold text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer min-w-[200px]"
                    >
                        <option value="">TODOS OS EVENTOS</option>
                        {mediaSettings.streams.map(event => (
                            <option key={event.id} value={event.id}>{event.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Usuários On" 
                    value={activeViewers || 0} 
                    icon={Eye} 
                    color="bg-gradient-to-br from-red-500 to-rose-600"
                    border="border-red-100 dark:border-red-900/30"
                    onClick={() => setIsOnlineModalOpen(true)}
                />
                <StatCard 
                    title="Participação Enquetes" 
                    value={stats?.totalPollVotes || 0} 
                    icon={Vote} 
                    color="bg-gradient-to-br from-orange-400 to-amber-500" 
                    border="border-orange-100 dark:border-orange-900/30"
                />
                <StatCard 
                    title="Total de Mensagens" 
                    value={stats?.totalMessages || 0} 
                    icon={MessageSquare} 
                    color="bg-gradient-to-br from-blue-500 to-indigo-600" 
                />
                <StatCard 
                    title="Pendentes Moderacao" 
                    value={stats?.pendingModeration || 0} 
                    icon={ShieldAlert} 
                    color={stats?.pendingModeration > 0 ? "bg-gradient-to-br from-rose-500 to-red-700" : "bg-gradient-to-br from-green-500 to-emerald-600"}
                />
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <ThumbsUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Likes</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats?.totalLikes || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
                            <ThumbsDown className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Dislikes</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats?.totalDislikes || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl transition-transform group-hover:scale-110">
                            <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shadow-sm" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Atividade Global</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{(stats?.totalMessages || 0) + (stats?.totalPollVotes || 0) + (stats?.totalLikes || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts and History */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-xl text-gray-800 dark:text-white">Tendências de Audiência</h3>
                            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-bold animate-pulse">LIVE</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 gap-1 border border-gray-200 dark:border-gray-600">
                                {['minute', 'hour', 'day'].map((i) => (
                                    <button
                                        key={i}
                                        onClick={() => setIntervalState(i)}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${interval === i 
                                            ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300' 
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        {i === 'minute' ? 'minuto' : i === 'hour' ? 'hora' : 'dia'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={exportAudienceReport}
                                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 transition-all p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                                title="Exportar Relatório de Audiência"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        {viewerStatsHistory && viewerStatsHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={viewerStatsHistory}>
                                    <defs>
                                        <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.1} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="viewers"
                                        stroke="#ef4444"
                                        strokeWidth={4}
                                        dot={false}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                        animationDuration={2000}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                                <Activity className="w-12 h-12 opacity-20 animate-pulse" />
                                <span className="text-sm font-bold">Capturando dados em tempo real...</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors flex flex-col">
                    <h3 className="font-black text-xl text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        Atividade Recente
                        <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
                    </h3>
                    <div className="space-y-4 flex-1 overflow-y-auto max-h-[280px] custom-scrollbar">
                        {stats?.recentActivity?.length > 0 ? (
                            stats.recentActivity.map((activity, index) => (
                                <div key={activity.id || index} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                                    <div className={`mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full ring-4 ${
                                        activity.type === 'message' 
                                        ? 'bg-blue-500 ring-blue-500/10' 
                                        : 'bg-green-500 ring-green-500/10'
                                    }`}></div>
                                    <div className="flex-1">
                                        <p className="text-gray-700 dark:text-gray-300 leading-tight">
                                            <span className="font-black text-gray-900 dark:text-white mr-1 text-xs uppercase tracking-tighter">
                                                {activity.type === 'message' ? '[Chat]' : '[Sistema]'}
                                            </span> 
                                            {activity.action}
                                        </p>
                                        <span className="text-[10px] uppercase font-black text-gray-400 mt-1 block tracking-widest italic font-serif">
                                            {new Date(activity.time).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                                <span className="text-sm font-bold">Nenhuma atividade registrada.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
