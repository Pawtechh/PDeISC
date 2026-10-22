# r5 · Sistema de usuarios con SQL, JWT y login social

Backend Node/Express + **SQLite** (SQL) y **dos** frontends React que comparten backend, contexto y componentes.
Solo cambia el paradigma de navegación:

```
r5/
├── backend/                 API REST + SQLite + JWT + OAuth (Google, GitHub, Discord)
├── frontend-v1-router/      SPA con React Router        → http://localhost:5173
└── frontend-v2-usestate/    SPA con useState, sin router → http://localhost:5174
```

## Puesta en marcha

```bash
cd backend && cp .env.example .env   # completá JWT_SECRET y, si querés login social, las credenciales
npm install && npm run dev           # http://localhost:4000

cd frontend-v1-router && cp .env.example .env && npm install && npm run dev
cd frontend-v2-usestate && cp .env.example .env && npm install && npm run dev
```

La base (`backend/data/auth.db`) y sus tablas (`users`, `oauth_accounts`, `tasks`) se crean solas; `sql/schema.sql` es la referencia.

## Login social

El backend solo activa los proveedores que tengan `CLIENT_ID` y `CLIENT_SECRET` en `.env`, y el frontend
(`GET /api/auth/providers`) solo muestra esos botones. Callback a registrar en cada proveedor:
`http://localhost:4000/api/auth/<google|github|discord>/callback`

| Proveedor | Dónde crear la app |
|---|---|
| Google | console.cloud.google.com → Credenciales → ID de cliente OAuth (aplicación web) |
| GitHub | github.com/settings/developers → New OAuth App |
| Discord | discord.com/developers/applications → OAuth2 (el más rápido de configurar) |

**Flujo:** botón → `GET /api/auth/:provider?redirect=<origen>` → proveedor → `/callback` → el backend firma un JWT y
redirige a `<origen>/oauth/callback#token=…` → el frontend lo guarda en `localStorage` y valida con `/api/auth/me`.
El `redirect` viaja en `state`, por eso cada frontend (5173 y 5174) vuelve a sí mismo.
El token va en el fragmento `#` para que no llegue a logs del servidor.

Si el email de un proveedor coincide con una cuenta existente, solo se vinculan si el proveedor lo **verificó**.

## Requisitos de la consigna

| Requisito | Dónde |
|---|---|
| BBDD SQL con usuarios | `backend/config/db.js` (SQLite) |
| useState | formularios, panel, y navegación completa en v2 (`frontend-v2-usestate/src/App.jsx`) |
| useEffect | restaurar sesión, cargar tareas, retorno OAuth |
| useForm | `LoginForm.jsx`, `RegisterForm.jsx` (react-hook-form) |
| localStorage | token JWT (y vista actual en v2) |
| Context | `context/AuthContext.jsx` |
| React Router | v1 (`App.jsx`, `ProtectedRoute.jsx`) |
| API + fetch / Axios | Axios en `api/axios.js`; `fetch` en `BotonesLoginSocial.jsx` |
| Persistencia y protección de datos | bcrypt, JWT con expiración, helmet, rate limit, CORS, consultas SQL parametrizadas, sesión que sobrevive a recargas |

## Nota sobre localStorage
El JWT en `localStorage` es simple para dos SPA en distintos puertos; en producción conviene cookie `httpOnly` + `Secure` + `SameSite`.
