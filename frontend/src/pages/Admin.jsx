import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useAdminStore } from '../store/useAdminStore';

import { LayoutDashboard, Users, Video, MessageSquare, LogOut, Menu, X, Settings, Play, Moon, Sun, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardHome } from '../components/admin/DashboardHome';
import { UserManagement } from '../components/admin/UserManagement';
import { MediaConfig } from '../components/admin/MediaConfig';
import ReactionReport from '../components/admin/ReactionReport';

import { ChatModeration } from '../components/admin/ChatModeration';
import { EventSettings } from '../components/admin/EventSettings';
import { ResourceManager } from '../components/admin/ResourceManager';
import { Sparkles } from 'lucide-react';

export default function Admin() {
    const { user, logout } = useAuthStore();
    const [activeTab, setActiveTab] = useState(user?.role === 'moderator' ? 'chat' : 'dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { connectSocket, disconnectSocket, fetchMediaSettings, theme, toggleTheme } = useAdminStore();
    const navigate = useNavigate();

    useEffect(() => {
        fetchMediaSettings();
        connectSocket();


        return () => disconnectSocket();
    }, [connectSocket, disconnectSocket, fetchMediaSettings]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
        { id: 'users', label: 'Usuários', icon: Users },
        { id: 'media', label: 'Mídia', icon: Video },
        { id: 'chat', label: 'Moderação', icon: MessageSquare },
        { id: 'recursos', label: 'Recursos', icon: Sparkles },
        { id: 'reactions', label: 'Interações', icon: ThumbsUp },
        { id: 'settings', label: 'Configuração', icon: Settings },
    ].filter(item => {
        if (user?.role === 'moderator') {
            return item.id === 'chat';
        }
        return true;
    });

    useEffect(() => {
        if (user?.role === 'moderator' && activeTab !== 'chat') {
            setActiveTab('chat');
        }
    }, [user, activeTab]);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <DashboardHome />;
            case 'users': return <UserManagement />;
            case 'media': return <MediaConfig />;
            case 'reactions': return <ReactionReport />;
            case 'chat': return <ChatModeration />;
            case 'recursos': return <ResourceManager />;
            case 'settings': return <EventSettings />;
            default: return <DashboardHome />;
        }
    };

    return (
        <div className="h-screen flex bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-200">
            { }
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            { }
            <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-30 transition-all duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center">A</div>
                        Painel Admin
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500 dark:text-gray-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                    </button>
                    <button
                        onClick={() => navigate('/player')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Play className="w-5 h-5" />
                        Voltar ao Player
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sair
                    </button>
                </div>
            </aside>

            { }
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-6 lg:hidden">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="ml-4 font-semibold text-gray-800 dark:text-white">Menu</span>
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-5xl mx-auto">
                        {renderContent()}
                    </div>
                </div>
            </main>
        </div>
    );
}
