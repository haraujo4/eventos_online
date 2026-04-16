import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Player from './pages/Player';
import Admin from './pages/Admin';
import Midiateca from './pages/Midiateca';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAdminStore } from './store/useAdminStore';
import { getFullImageUrl } from './utils/urlHelper';
import { useAuthStore } from './store/useAuthStore';

function RootRedirect() {
  const { eventSettings, mediaSettings } = useAdminStore();
  const { isAuthenticated } = useAuthStore();

  if (eventSettings?.midiateca_enabled) {
    return <Midiateca />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const featuredEvent = mediaSettings.streams.find(e => e.is_featured);
  if (featuredEvent) {
    return <Navigate to={`/player?id=${featuredEvent.id}`} replace />;
  }

  if (mediaSettings.streams.length > 0) {
    return <Navigate to={`/player?id=${mediaSettings.streams[0].id}`} replace />;
  }

  return <Login />;
}

function App() {
  const { eventSettings, fetchSettings, fetchMediaSettings, theme } = useAdminStore();

  useEffect(() => {
    fetchSettings();
    fetchMediaSettings();
  }, [fetchSettings, fetchMediaSettings]);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    // Update Title
    if (eventSettings?.event_name) {
      document.title = eventSettings.event_name;
    }

    // Update Favicon
    if (eventSettings?.logo_url) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';

      const logoUrl = getFullImageUrl(eventSettings.logo_url);

      link.href = logoUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [eventSettings]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={['user', 'admin', 'moderator']} />}>
          <Route path="/player" element={<Player />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin', 'moderator']} />}>
          <Route path="/admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
}

export default App;
