import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function ProtectedRoute({ allowedRoles = [] }) {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
        
        
        

        let destination = '/player';
        if (user.role === 'admin' || user.role === 'moderator') {
            destination = '/admin';
        }

        
        if (window.location.pathname === destination) {
            return <div className="p-8 text-center">Você não tem permissão para visualizar esta página.</div>;
        }

        return <Navigate to={destination} replace />;
    }

    return <Outlet />;
}
