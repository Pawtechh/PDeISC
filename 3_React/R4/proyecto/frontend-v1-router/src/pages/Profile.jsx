// pages/Profile.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Mi Perfil</h2>
        <nav>
          <Link to="/dashboard">Volver al dashboard</Link>
          <button onClick={logout}>Cerrar sesión</button>
        </nav>
      </header>

      <div className="profile-card">
        <p><strong>Nombre:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Rol:</strong> {user?.role}</p>
        <p><strong>Miembro desde:</strong> {new Date(user?.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
