// views/LoginView.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import BotonesLoginSocial from '../components/BotonesLoginSocial';

// `onNavigate` recibe el nombre de la vista destino ('register' | 'dashboard')
export default function LoginView({ onNavigate }) {
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (formData) => {
    setServerError('');
    setSubmitting(true);
    try {
      await login(formData);
      onNavigate('dashboard'); // Navegación por estado, no por URL
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            {...register('email', {
              required: 'El email es obligatorio.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido.' },
            })}
          />
          {errors.email && <span className="error">{errors.email.message}</span>}
        </div>

        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            {...register('password', {
              required: 'La contraseña es obligatoria.',
              minLength: { value: 6, message: 'Mínimo 6 caracteres.' },
            })}
          />
          {errors.password && <span className="error">{errors.password.message}</span>}
        </div>

        {serverError && <p className="error server-error">{serverError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <div className="separador">o continúa con</div>
      <BotonesLoginSocial />

      <p>
        ¿No tienes cuenta?{' '}
        <button className="link-button" onClick={() => onNavigate('register')}>
          Regístrate
        </button>
      </p>
    </div>
  );
}
