import { Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { Logo } from './components/AuthLayout.jsx';
import Home from './components/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import OAuthCallback from './pages/OAuthCallback.jsx';

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const linkClass = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '');

  return (
    <nav className="nav">
      <Link to="/" className="brand"><Logo /> <span>AuthApp</span></Link>
      <NavLink to="/" className={linkClass} end>Inicio</NavLink>
      {!user && <NavLink to="/login" className={linkClass}>Login</NavLink>}
      {!user && <NavLink to="/register" className={linkClass}>Registro</NavLink>}
      {user && <NavLink to="/dashboard" className={linkClass}>Mi panel</NavLink>}
      {user && (
        <button className="btn btn-secondary nav-logout" onClick={() => { logout(); navigate('/login'); }}>
          Cerrar sesión
        </button>
      )}
    </nav>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const go = (view) => navigate(view === 'home' ? '/' : `/${view}`);

  if (loading) return <p className="loading">Cargando…</p>;

  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<Home user={user} variant="Versión React Router" go={go} />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<div className="center-page"><h1>404</h1><p className="muted">Esta página no existe.</p><Link className="btn btn-primary" to="/">Volver al inicio</Link></div>} />
      </Routes>
    </>
  );
}
