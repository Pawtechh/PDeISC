import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/RegisterForm.jsx';

export default function Register() {
  const navigate = useNavigate();
  return (
    <RegisterForm
      onSuccess={() => navigate('/dashboard')}
      footer={<>¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></>}
    />
  );
}
