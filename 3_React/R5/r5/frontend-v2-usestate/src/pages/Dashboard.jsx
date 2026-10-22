import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios';

const TABS = [
  ['resumen', 'Resumen'],
  ['tareas', 'Mis tareas'],
  ['cuenta', 'Mi cuenta'],
];

const fecha = (d) => (d ? new Date(d.replace(' ', 'T') + 'Z').toLocaleDateString('es-AR') : '—');

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('resumen');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api.get('/tasks')
      .then(({ data }) => setTasks(data.tasks))
      .catch(() => setLoadError('No se pudieron cargar las tareas.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel">
      <aside className="panel-side">
        <div className="panel-user">
          <Avatar user={user} />
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
        </div>
        {TABS.map(([id, label]) => (
          <button
            key={id}
            className={'panel-tab' + (tab === id ? ' active' : '')}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </aside>

      <section className="panel-main">
        {tab === 'resumen' && <Resumen tasks={tasks} onGo={setTab} />}
        {tab === 'tareas' && (
          <Tareas tasks={tasks} setTasks={setTasks} loading={loading} loadError={loadError} />
        )}
        {tab === 'cuenta' && <Cuenta />}
      </section>
    </div>
  );
}

function Avatar({ user }) {
  if (user?.avatarUrl) return <img className="avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />;
  return <div className="avatar">{user?.name?.[0]?.toUpperCase() || '?'}</div>;
}

function Resumen({ tasks, onGo }) {
  const { user } = useAuth();
  const hechas = tasks.filter((t) => t.done).length;
  return (
    <>
      <h2>Hola, {user?.name} 👋</h2>
      <p className="muted">Este es tu panel. Desde acá podés gestionar tus tareas y tu cuenta.</p>
      <div className="stats">
        <div className="stat"><b>{tasks.length}</b><span>Tareas</span></div>
        <div className="stat"><b>{tasks.length - hechas}</b><span>Pendientes</span></div>
        <div className="stat"><b>{hechas}</b><span>Completadas</span></div>
      </div>
      <p className="muted">Miembro desde {fecha(user?.createdAt)}</p>
      <button className="btn btn-primary" onClick={() => onGo('tareas')}>Ir a mis tareas</button>
    </>
  );
}

function Tareas({ tasks, setTasks, loading, loadError }) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const fail = (err, fallback) => setError(err.response?.data?.message || fallback);

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const { data } = await api.post('/tasks', { title });
      setTasks((l) => [data.task, ...l]);
      setTitle('');
      setError('');
    } catch (err) { fail(err, 'No se pudo crear la tarea.'); }
  };

  const toggle = async (t) => {
    try {
      const { data } = await api.patch(`/tasks/${t.id}`, { done: !t.done });
      setTasks((l) => l.map((x) => (x.id === t.id ? data.task : x)));
    } catch (err) { fail(err, 'No se pudo actualizar.'); }
  };

  const remove = async (t) => {
    try {
      await api.delete(`/tasks/${t.id}`);
      setTasks((l) => l.filter((x) => x.id !== t.id));
    } catch (err) { fail(err, 'No se pudo eliminar.'); }
  };

  return (
    <>
      <h2>Mis tareas</h2>
      <form className="task-form" onSubmit={add}>
        <input
          value={title}
          maxLength={200}
          placeholder="Nueva tarea…"
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">Agregar</button>
      </form>
      {(error || loadError) && <div className="form-error">{error || loadError}</div>}
      {loading ? <p className="muted">Cargando…</p> : tasks.length === 0 ? (
        <p className="muted">Todavía no tenés tareas. ¡Agregá la primera!</p>
      ) : (
        <ul className="tasks">
          {tasks.map((t) => (
            <li key={t.id} className={t.done ? 'done' : ''}>
              <label>
                <input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
                <span>{t.title}</span>
              </label>
              <button className="task-del" onClick={() => remove(t)} aria-label="Eliminar">✕</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Cuenta() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [nameMsg, setNameMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);

  const saveName = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/users/me', { name });
      updateUser((u) => ({ ...u, name: data.user.name }));
      setNameMsg({ ok: true, text: 'Nombre actualizado.' });
    } catch (err) {
      setNameMsg({ ok: false, text: err.response?.data?.message || 'Error al guardar.' });
    }
  };

  const savePw = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/me/password', pw);
      setPw({ currentPassword: '', newPassword: '' });
      updateUser((u) => ({ ...u, hasPassword: true }));
      setPwMsg({ ok: true, text: user?.hasPassword ? 'Contraseña actualizada.' : 'Contraseña creada. Ya podés entrar también con tu email.' });
    } catch (err) {
      setPwMsg({ ok: false, text: err.response?.data?.message || 'Error al cambiar la contraseña.' });
    }
  };

  const Msg = ({ m }) => m && <div className={m.ok ? 'form-ok' : 'form-error'}>{m.text}</div>;

  return (
    <>
      <h2>Mi cuenta</h2>
      {user?.providers?.length > 0 && (
        <div className="card-form">
          <h3>Cuentas vinculadas</h3>
          <div className="badges">
            {user.providers.map((p) => <span key={p} className="badge">{p}</span>)}
          </div>
        </div>
      )}

      <form className="card-form" onSubmit={saveName}>
        <h3>Datos personales</h3>
        <div className="field"><label>Email</label><input value={user?.email || ''} disabled /></div>
        <div className="field">
          <label>Nombre</label>
          <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
        </div>
        <Msg m={nameMsg} />
        <button className="btn btn-primary" type="submit">Guardar</button>
      </form>

      <form className="card-form" onSubmit={savePw}>
        <h3>{user?.hasPassword ? 'Cambiar contraseña' : 'Crear contraseña'}</h3>
        {!user?.hasPassword && (
          <p className="muted">Entraste con un proveedor social. Si creás una contraseña, también podrás entrar con tu email.</p>
        )}
        {user?.hasPassword && (
          <div className="field">
            <label>Contraseña actual</label>
            <input type="password" autoComplete="current-password" value={pw.currentPassword}
              onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
          </div>
        )}
        <div className="field">
          <label>Nueva contraseña</label>
          <input type="password" autoComplete="new-password" value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
        </div>
        <Msg m={pwMsg} />
        <button className="btn btn-primary" type="submit">{user?.hasPassword ? 'Actualizar contraseña' : 'Crear contraseña'}</button>
      </form>
    </>
  );
}
