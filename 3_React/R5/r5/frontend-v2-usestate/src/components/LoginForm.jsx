import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout from './AuthLayout.jsx';
import BotonesLoginSocial from './BotonesLoginSocial.jsx';

export default function LoginForm({ onSuccess, footer, initialError = '' }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const [serverError, setServerError] = useState(initialError);
  const [show, setShow] = useState(false);

  const onSubmit = async ({ email, password }) => {
    setServerError('');
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setServerError(err.response?.data?.message || 'No se pudo conectar con el servidor.');
    }
  };

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Elegí cómo querés entrar." footer={footer}>
      {serverError && <div className="form-error" role="alert">{serverError}</div>}

      <BotonesLoginSocial verbo="Continuar" />
      <div className="divider"><span>o con tu email</span></div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" placeholder="vos@ejemplo.com"
            {...register('email', { required: 'Ingresá tu email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Email inválido' } })} />
          {errors.email && <div className="error">{errors.email.message}</div>}
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña</label>
          <div className="pw">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password"
              {...register('password', { required: 'Ingresá tu contraseña' })} />
            <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)}>{show ? 'Ocultar' : 'Mostrar'}</button>
          </div>
          {errors.password && <div className="error">{errors.password.message}</div>}
        </div>

        <button className="btn btn-primary btn-block" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  );
}
