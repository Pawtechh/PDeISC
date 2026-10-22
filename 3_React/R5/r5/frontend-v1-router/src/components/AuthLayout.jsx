export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#4f46e5" />
      <path d="M16 7l7 3v5.500c0 4.300-2.800 7.500-7 9.500-4.200-2-7-5.200-7-9.500V10l7-3z" fill="#fff" fillOpacity=".95" />
      <path d="M12.800 15.800l2.400 2.400 4.200-4.600" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const POINTS = [
  'Contraseñas cifradas con bcrypt',
  'Sesión con token JWT que se mantiene al recargar',
  'Ingreso social, sin crear otra contraseña',
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <aside className="auth-brand">
        <Logo size={40} />
        <h1>Tu cuenta, protegida y lista en segundos.</h1>
        <ul>{POINTS.map((p) => <li key={p}>{p}</li>)}</ul>
      </aside>
      <main className="auth-card">
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
        {footer && <p className="form-footer">{footer}</p>}
      </main>
    </div>
  );
}
