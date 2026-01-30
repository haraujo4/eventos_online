import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Player from './pages/Player';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        {}
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
