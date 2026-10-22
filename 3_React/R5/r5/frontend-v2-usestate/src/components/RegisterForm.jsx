import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from './AuthLayout.jsx';
import BotonesLoginSocial from './BotonesLoginSocial.jsx';

export default function RegisterForm({ onSuccess, footer }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const { register: signup } = useAuth();
  const [serverError, setServerError] = useState('');
  const [show, setShow] = useState(false);

  const onSubmit = async ({ name, email, password }) => {
    setServerError('');
    try {
      await signup(name, email, password);
      onSuccess();
    } catch (err) {
      setServerError(err.response?.data?.message || 'No se pudo conectar con el servidor.');
    }
  };

  return (
    <AuthLayout title="Crear cuenta" subtitle="Es gratis y toma menos de un minuto." footer={footer}>
      {serverError && <div className="form-error" role="alert">{serverError}</div>}

      <BotonesLoginSocial verbo="Registrarme" />
      <div className="divider"><span>o con tu email</span></div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label htmlFor="name">Nombre</label>
          <input id="name" autoComplete="name" {...register('name', { required: 'Ingresá tu nombre', maxLength: { value: 80, message: 'Máximo 80 caracteres' } })} />
          {errors.name && <div className="error">{errors.name.message}</div>}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" placeholder="vos@ejemplo.com"
            {...register('email', { required: 'Ingresá tu email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' } })} />
          {errors.email && <div className="error">{errors.email.message}</div>}
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <div className="pw">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="new-password"
              {...register('password', { required: 'Elegí una contraseña', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} />
            <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)}>{show ? 'Ocultar' : 'Mostrar'}</button>
          </div>
          {errors.password && <div className="error">{errors.password.message}</div>}
        </div>

        <div className="field">
          <label htmlFor="confirm">Repetir contraseña</label>
          <input id="confirm" type={show ? 'text' : 'password'} autoComplete="new-password"
            {...register('confirm', { validate: (v) => v === watch('password') || 'Las contraseñas no coinciden' })} />
          {errors.confirm && <div className="error">{errors.confirm.message}</div>}
        </div>

        <button className="btn btn-primary btn-block" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
    </AuthLayout>
  );
}
