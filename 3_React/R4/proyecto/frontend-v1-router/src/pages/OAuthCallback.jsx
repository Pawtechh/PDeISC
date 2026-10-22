// pages/OAuthCallback.jsx
// El backend redirige acá con ?token=... tras un login social exitoso.
// Esta página solo guarda el token y navega al dashboard.
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { loginConToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No se recibió un token válido del proveedor.');
      return;
    }

    loginConToken(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => setError('No se pudo validar la sesión social.'));
  }, [searchParams, loginConToken, navigate]);

  if (error) {
    return (
      <div className="auth-container">
        <p className="error">{error}</p>
      </div>
    );
  }

  return <div className="loading-screen">Completando inicio de sesión...</div>;
}
