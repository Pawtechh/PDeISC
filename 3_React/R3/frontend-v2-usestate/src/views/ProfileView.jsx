// views/ProfileView.jsx
import { useAuth } from '../context/AuthContext';

export default function ProfileView({ onNavigate }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h2>Mi Perfil</h2>
        <nav>
          <button className="link-button" onClick={() => onNavigate('dashboard')}>
            Volver al dashboard
          </button>
          <button onClick={handleLogout}>Cerrar sesión</button>
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
