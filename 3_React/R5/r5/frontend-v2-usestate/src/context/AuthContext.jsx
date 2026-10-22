import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión desde localStorage al cargar la página
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  // El interceptor de axios avisa cuando el token deja de ser válido
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const startSession = ({ token, user: u }) => {
    localStorage.setItem('token', token);
    setUser(u);
    return u;
  };

  const login = async (email, password) => startSession((await api.post('/auth/login', { email, password })).data);
  const register = async (name, email, password) =>
    startSession((await api.post('/auth/register', { name, email, password })).data);

  // Login social: el backend devuelve un JWT; se valida pidiendo el perfil
  const loginConToken = useCallback(async (token) => {
    localStorage.setItem('token', token);
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch (err) {
      localStorage.removeItem('token');
      throw err;
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginConToken, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
