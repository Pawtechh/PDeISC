// views/DashboardView.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/authService';

export default function DashboardView({ onNavigate }) {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const { users } = await authService.getAllUsers();
        setUsers(users);
      } catch (err) {
        setError('No se pudo cargar la lista de usuarios.');
      }
    }
    loadUsers();
  }, []);

  const handleLogout = () => {
    logout();
    onNavigate('login'); // Vuelve a la vista de login tras cerrar sesión
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Dashboard</h2>
        <nav>
          <button className="link-button" onClick={() => onNavigate('profile')}>
            Mi perfil
          </button>
          <button onClick={handleLogout}>Cerrar sesión</button>
        </nav>
      </header>

      <p>Bienvenido, <strong>{user?.name}</strong> ({user?.role})</p>

      <h3>Usuarios registrados</h3>
      {error && <p className="error">{error}</p>}
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name} — {u.email} ({u.role})
          </li>
        ))}
      </ul>
    </div>
  );
}
