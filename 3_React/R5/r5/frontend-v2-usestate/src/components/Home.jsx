const FEATURES = [
  ['Contraseñas cifradas', 'Se guardan con bcrypt en una base SQL. Nunca en texto plano.'],
  ['Ingreso social', 'Entrá con tu cuenta de Google, GitHub o Discord si el servidor las tiene activas.'],
  ['Tu propio panel', 'Tareas y datos de cuenta que persisten entre sesiones.'],
];

export default function Home({ user, variant, go }) {
  return (
    <section className="home">
      <span className="pill">{variant}</span>
      <h1>{user ? `Hola, ${user.name}` : 'Un sistema de usuarios simple y seguro'}</h1>
      <p>
        {user
          ? 'Tu sesión está activa. Seguí en tu panel.'
          : 'Registrate o iniciá sesión para entrar a tu panel privado.'}
      </p>
      <div className="home-cta">
        {user ? (
          <button className="btn btn-primary btn-lg" onClick={() => go('dashboard')}>Ir a mi panel</button>
        ) : (
          <>
            <button className="btn btn-primary btn-lg" onClick={() => go('register')}>Crear cuenta</button>
            <button className="btn btn-secondary btn-lg" onClick={() => go('login')}>Iniciar sesión</button>
          </>
        )}
      </div>
      <div className="features">
        {FEATURES.map(([t, d]) => (
          <article key={t} className="feature"><h3>{t}</h3><p>{d}</p></article>
        ))}
      </div>
    </section>
  );
}
