import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';

function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const linkClass = ({ isActive }) => 'nav-link' + (isActive ? ' active' : '');

  return (
    <nav className="nav">
      <NavLink to="/" className={linkClass} end>Inicio</NavLink>
      {!user && <NavLink to="/login" className={linkClass}>Login</NavLink>}
      {!user && <NavLink to="/register" className={linkClass}>Registro</NavLink>}
      {user && <NavLink to="/dashboard" className={linkClass}>Mi panel</NavLink>}
      {user && (
        <button
          className="btn btn-secondary nav-logout"
          onClick={() => { logout(); navigate('/login'); }}
        >
          Cerrar sesión
        </button>
      )}
    </nav>
  );
}

export default function App() {
  const { user } = useAuth();
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={
          <div className="hero">
            <h1>Bienvenido {user ? user.name : 'a la Auth App v1'}</h1>
            <p>Registrate o iniciá sesión para acceder al panel privado.</p>
          </div>
        } />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="*" element={
          <div className="hero"><h1>404 – No encontrado</h1></div>
        } />
      </Routes>
    </>
  );
}