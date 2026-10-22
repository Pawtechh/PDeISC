import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import LoginForm from '../components/LoginForm.jsx';
import { oauthErrorMessage } from '../utils/oauthErrors.js';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return (
    <LoginForm
      initialError={oauthErrorMessage(params.get('error'))}
      onSuccess={() => navigate('/dashboard')}
      footer={<>¿No tenés cuenta? <Link to="/register">Registrate</Link></>}
    />
  );
}
