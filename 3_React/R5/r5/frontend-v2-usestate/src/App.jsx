import { useEffect, useRef, useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Logo } from './components/AuthLayout.jsx';
import Home from './components/Home.jsx';
import LoginView from './views/LoginView.jsx';
import RegisterView from './views/RegisterView.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { oauthErrorMessage } from './utils/oauthErrors.js';

// Sin router: qué pantalla se ve depende de un estado (`view`).
export default function App() {
  const { user, loading, loginConToken, logout } = useAuth();
  // La vista actual se guarda en localStorage para que sobreviva a una recarga (no hay URL que la recuerde).
  const [view, setView] = useState(() => {
    const saved = localStorage.getItem('view');
    return ['home', 'login', 'register', 'dashboard'].includes(saved) ? saved : 'home';
  });
  useEffect(() => { localStorage.setItem('view', view); }, [view]);
  const [oauthError, setOauthError] = useState('');
  const [finishing, setFinishing] = useState(() => window.location.pathname === '/oauth/callback');
  const handled = useRef(false); // StrictMode ejecuta los efectos dos veces en desarrollo

  // Vuelta del login social: el backend redirige a /oauth/callback#token=... o /login?error=...
  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    const { pathname, hash, search } = window.location;
    const clean = () => window.history.replaceState(null, '', '/');

    if (pathname === '/oauth/callback') {
      const token = new URLSearchParams(hash.slice(1)).get('token');
      clean();
      if (!token) {
        setOauthError('No se recibió un token válido del proveedor.');
        setView('login');
        setFinishing(false);
        return;
      }
      loginConToken(token)
        .then(() => setView('dashboard'))
        .catch(() => { setOauthError('No se pudo validar la sesión. Intentá de nuevo.'); setView('login'); })
        .finally(() => setFinishing(false));
    } else if (pathname === '/login' && search.includes('error=')) {
      setOauthError(oauthErrorMessage(new URLSearchParams(search).get('error')));
      clean();
      setView('login');
    }
  }, [loginConToken]);

  // Guardas de navegación (equivalente a <ProtectedRoute> y a los <Navigate> del router)
  useEffect(() => {
    if (loading || finishing) return;
    if (user && (view === 'login' || view === 'register')) setView('dashboard');
    if (!user && view === 'dashboard') setView('login');
  }, [user, loading, finishing, view]);

  const go = (next) => {
    setOauthError('');
    setView(next === 'dashboard' && !user ? 'login' : next);
  };

  const handleLogout = () => { logout(); setView('login'); };

  if (loading || finishing) return <p className="loading">Cargando…</p>;

  const link = (id, label) => (
    <button className={'nav-link' + (view === id ? ' active' : '')} onClick={() => go(id)}>{label}</button>
  );

  return (
    <>
      <nav className="nav">
        <button className="brand brand-btn" onClick={() => go('home')}><Logo /> <span>AuthApp</span></button>
        {link('home', 'Inicio')}
        {!user && link('login', 'Login')}
        {!user && link('register', 'Registro')}
        {user && link('dashboard', 'Mi panel')}
        {user && <button className="btn btn-secondary nav-logout" onClick={handleLogout}>Cerrar sesión</button>}
      </nav>

      {view === 'home' && <Home user={user} variant="Versión useState" go={go} />}
      {view === 'login' && <LoginView onNavigate={go} initialError={oauthError} />}
      {view === 'register' && <RegisterView onNavigate={go} />}
      {view === 'dashboard' && user && <Dashboard />}
    </>
  );
}
