import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await signup(values.name, values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al registrarse.');
    }
  };

  return (
    <div className="page">
      <h2>Crear cuenta</h2>
      {serverError && <div className="form-error">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label>Nombre</label>
          <input {...register('name', { required: 'Nombre obligatorio' })} />
          {errors.name && <div className="error">{errors.name.message}</div>}
        </div>

        <div className="field">
          <label>Email</label>
          <input type="email" {...register('email', { required: 'Email obligatorio' })} />
          {errors.email && <div className="error">{errors.email.message}</div>}
        </div>

        <div className="field">
          <label>Contraseña</label>
          <input
            type="password"
            {...register('password', {
              required: 'Contraseña obligatoria',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' },
            })}
          />
          {errors.password && <div className="error">{errors.password.message}</div>}
        </div>

        <button className="btn btn-primary btn-block" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creando…' : 'Registrarse'}
        </button>
      </form>

      <p className="form-footer">
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
    </div>
  );
}