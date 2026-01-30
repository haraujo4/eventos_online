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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold mt-2 text-gray-900">{value}</p>
                </div>
                <div className={`p-4 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Visão Geral do Painel</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Espectadores ao Vivo" value={currentViewers || 0} icon={Eye} color="bg-red-500" />
                <StatCard title="Usuários Totais" value={stats?.totalUsers || 0} icon={Users} color="bg-blue-500" />
                <StatCard title="Total de Mensagens" value={stats?.totalMessages || 0} icon={MessageSquare} color="bg-indigo-500" />
                <StatCard title="Streams Ativas" value={stats?.activeStreams || 0} icon={Activity} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800">Tendências de Audiência</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                                {['minute', 'hour', 'day'].map((i) => (
                                    <button
                                        key={i}
                                        onClick={() => setIntervalState(i)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${interval === i ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {i === 'minute' ? 'minuto' : i === 'hour' ? 'hora' : 'dia'}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={exportAudienceReport}
                                className="text-gray-500 hover:text-blue-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
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
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="time" hide />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Atividade Recente</h3>
                    <div className="space-y-4">
                        {stats?.recentActivity?.length > 0 ? (
                            stats.recentActivity.map((activity, index) => (
                                <div key={activity.id || index} className="flex items-center gap-4 text-sm">
                                    <div className={`w-2 h-2 rounded-full ${activity.type === 'message' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                    <p><span className="font-medium">
                                        {activity.type === 'message' ? 'Nova Mensagem' : 'Sistema'}
                                    </span> {activity.action}</p>
                                    <span className="text-gray-400 ml-auto">{new Date(activity.time).toLocaleTimeString()}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">Nenhuma atividade recente</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
