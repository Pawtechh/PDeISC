// api/axiosClient.js
// Instancia de Axios centralizada con interceptores de request/response.

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Interceptor de REQUEST: adjunta el token a cada petición saliente ---
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Interceptor de RESPONSE: si el token expiró/es inválido, limpia sesión ---
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Evita romper la app si el 401 ocurre en la propia pantalla de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

/* =========================================================
   EJEMPLO EQUIVALENTE USANDO fetch() NATIVO (sin Axios)
   Útil si se quiere evitar la dependencia externa.
   =========================================================

export async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Sesión expirada.');
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error en la petición.');
  }
  return data;
}
============================================================ */
