// api/authService.js
import axiosClient from './axiosClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const authService = {
  // --- Con Axios ---
  async register({ name, email, password }) {
    const { data } = await axiosClient.post('/auth/register', { name, email, password });
    return data;
  },

  async login({ email, password }) {
    const { data } = await axiosClient.post('/auth/login', { email, password });
    return data;
  },

  async getProfile() {
    const { data } = await axiosClient.get('/users/profile');
    return data;
  },

  async getAllUsers() {
    const { data } = await axiosClient.get('/users');
    return data;
  },

  // --- Ejemplo equivalente usando fetch() nativo ---
  async loginWithFetch({ email, password }) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Error al iniciar sesión.');
    return data;
  },
};
