// El backend redirige acá con #token=... tras un login social exitoso.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function OAuthCallback() {
  const { loginConToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const ran = useRef(false); // StrictMode ejecuta los efectos dos veces en desarrollo

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
    window.history.replaceState(null, '', window.location.pathname); // saca el token de la URL
    if (!token) {
      setError('No se recibió un token válido del proveedor.');
      return;
    }
    loginConToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => setError('No se pudo validar la sesión. Intentá de nuevo.'));
  }, [loginConToken, navigate]);

  if (error) {
    return (
      <div className="center-page">
        <div className="form-error">{error}</div>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Volver al login</button>
      </div>
    );
  }
  return <p className="loading">Completando inicio de sesión…</p>;
}
