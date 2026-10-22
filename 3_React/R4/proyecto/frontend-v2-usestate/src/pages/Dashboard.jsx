import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  return (
    <div className="page dashboard">
      <h2>Panel privado</h2>
      <p>Bienvenido, <strong>{user?.name}</strong>.</p>
      <ul className="user-info">
        <li><strong>ID</strong><span>{user?.id}</span></li>
        <li><strong>Email</strong><span>{user?.email}</span></li>
        <li><strong>Creado</strong><span>{user?.createdAt}</span></li>
      </ul>
    </div>
  );
}