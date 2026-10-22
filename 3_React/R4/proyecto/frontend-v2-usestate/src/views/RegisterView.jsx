// views/RegisterView.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

export default function RegisterView({ onNavigate }) {
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (formData) => {
    setServerError('');
    setSubmitting(true);
    try {
      await registerUser(formData);
      onNavigate('dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al registrar el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <label>Nombre</label>
          <input type="text" {...register('name', { required: 'El nombre es obligatorio.' })} />
          {errors.name && <span className="error">{errors.name.message}</span>}
        </div>

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

        <div className="form-group">
          <label>Confirmar contraseña</label>
          <input
            type="password"
            {...register('confirmPassword', {
              required: 'Confirma tu contraseña.',
              validate: (value) => value === password || 'Las contraseñas no coinciden.',
            })}
          />
          {errors.confirmPassword && (
            <span className="error">{errors.confirmPassword.message}</span>
          )}
        </div>

        {serverError && <p className="error server-error">{serverError}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>

      <p>
        ¿Ya tienes cuenta?{' '}
        <button className="link-button" onClick={() => onNavigate('login')}>
          Inicia sesión
        </button>
      </p>
    </div>
  );
}
