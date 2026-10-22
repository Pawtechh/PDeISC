import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al iniciar sesión.');
    }
  };

  return (
    <div className="page">
      <h2>Iniciar sesión</h2>
      {serverError && <div className="form-error">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label>Email</label>
          <input type="email" {...register('email', { required: 'Email obligatorio' })} />
          {errors.email && <div className="error">{errors.email.message}</div>}
        </div>

        <div className="field">
          <label>Contraseña</label>
          <input type="password" {...register('password', { required: 'Contraseña obligatoria' })} />
          {errors.password && <div className="error">{errors.password.message}</div>}
        </div>

        <button className="btn btn-primary btn-block" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="form-footer">
        ¿No tenés cuenta? <Link to="/register">Registrate</Link>
      </p>
    </div>
  );
}