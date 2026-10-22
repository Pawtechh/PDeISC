export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#4f46e5" />
      <path d="M16 7l7 3v5.500c0 4.300-2.800 7.500-7 9.500-4.200-2-7-5.200-7-9.500V10l7-3z" fill="#fff" fillOpacity=".95" />
      <path d="M12.800 15.800l2.400 2.400 4.200-4.600" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth">
      <main className="auth-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Logo size={34} />
          <h2 style={{ margin: 0 }}>{title}</h2>
        </div>
        {subtitle && <p className="muted">{subtitle}</p>}
        {children}
        {footer && <p className="form-footer">{footer}</p>}
      </main>
    </div>
  );
}
