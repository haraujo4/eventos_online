import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Player from './pages/Player';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAdminStore } from './store/useAdminStore';

function App() {
  const { eventSettings, fetchSettings, theme } = useAdminStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

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

      const logoUrl = eventSettings.logo_url.startsWith('http')
        ? eventSettings.logo_url
        : `http://localhost:3000${eventSettings.logo_url}`;

      link.href = logoUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [eventSettings]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        { }
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
