import RegisterForm from '../components/RegisterForm.jsx';

export default function RegisterView({ onNavigate }) {
  return (
    <RegisterForm
      onSuccess={() => onNavigate('dashboard')}
      footer={<>¿Ya tenés cuenta? <button className="link-button" onClick={() => onNavigate('login')}>Iniciá sesión</button></>}
    />
  );
}
