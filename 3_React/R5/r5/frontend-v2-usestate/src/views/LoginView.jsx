import LoginForm from '../components/LoginForm.jsx';

export default function LoginView({ onNavigate, initialError }) {
  return (
    <LoginForm
      initialError={initialError}
      onSuccess={() => onNavigate('dashboard')}
      footer={<>¿No tenés cuenta? <button className="link-button" onClick={() => onNavigate('register')}>Registrate</button></>}
    />
  );
}
