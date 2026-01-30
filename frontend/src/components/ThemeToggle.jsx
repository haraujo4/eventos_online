import { Moon, Sun } from 'lucide-react';
import { useAdminStore } from '../store/useAdminStore';

export function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useAdminStore();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800 ${className}`}
            title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
        >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>
    );
}
