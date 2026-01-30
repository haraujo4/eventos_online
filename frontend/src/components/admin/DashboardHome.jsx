import { Users, MessageSquare, AlertTriangle, Activity, Video, Eye, Download } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useState } from 'react';

export function DashboardHome() {
    const { stats, fetchStats, currentViewers, fetchAnalyticsHistory, viewerStatsHistory, exportAudienceReport } = useAdminStore();
    const [interval, setIntervalState] = useState('minute');

    useEffect(() => {
        fetchStats();
        fetchAnalyticsHistory(interval);


        const timer = setInterval(() => fetchAnalyticsHistory(interval), 60000);
        return () => clearInterval(timer);
    }, [fetchStats, fetchAnalyticsHistory, interval]);

    const StatCard = ({ title, value, icon: Icon, color }) => (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`p-4 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Visão Geral do Painel</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Espectadores ao Vivo" value={currentViewers || 0} icon={Eye} color="bg-red-500" />
                <StatCard title="Usuários Totais" value={stats?.totalUsers || 0} icon={Users} color="bg-blue-500" />
                <StatCard title="Total de Mensagens" value={stats?.totalMessages || 0} icon={MessageSquare} color="bg-indigo-500" />
                <StatCard title="Streams Ativas" value={stats?.activeStreams || 0} icon={Activity} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                { }
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white">Tendências de Audiência</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
                                {['minute', 'hour', 'day'].map((i) => (
                                    <button
                                        key={i}
                                        onClick={() => setIntervalState(i)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${interval === i ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        {i === 'minute' ? 'minuto' : i === 'hour' ? 'hora' : 'dia'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={exportAudienceReport}
                                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                title="Exportar Relatório de Audiência"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        {viewerStatsHistory && viewerStatsHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={viewerStatsHistory}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" strokeOpacity={0.2} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis allowDecimals={false} tick={{ fill: '#9ca3af' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="viewers"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                Dados insuficientes...
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4">Atividade Recente</h3>
                    <div className="space-y-4">
                        {stats?.recentActivity?.length > 0 ? (
                            stats.recentActivity.map((activity, index) => (
                                <div key={activity.id || index} className="flex items-center gap-4 text-sm">
                                    <div className={`flex-shrink-0 w-2 h-2 rounded-full ${activity.type === 'message' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium text-gray-900 dark:text-white">
                                        {activity.type === 'message' ? 'Nova Mensagem' : 'Sistema'}
                                    </span> {activity.action}</p>
                                    <span className="text-gray-400 ml-auto whitespace-nowrap">{new Date(activity.time).toLocaleTimeString()}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhuma atividade recente</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
