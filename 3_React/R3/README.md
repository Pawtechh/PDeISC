# Sistema de Gestión de Usuarios y Autenticación

Proyecto full-stack con un backend (Node.js + Express + SQL + JWT) y **dos**
implementaciones de frontend en React que comparten toda la lógica de negocio
y solo difieren en el paradigma de navegación.

```
proyecto/
├── backend/                 # API REST + PostgreSQL
├── frontend-v1-router/      # SPA con react-router-dom
└── frontend-v2-usestate/    # SPA monopágina con useState (sin router)
```

## 🚀 Puesta en marcha

### 1. Backend
```bash
cd backend
cp .env.example .env      # edita credenciales de tu BBDD y JWT_SECRET
npm install
# Crea la base de datos y ejecuta el esquema:
psql -U postgres -c "CREATE DATABASE users_auth_db;"
psql -U postgres -d users_auth_db -f sql/schema.sql
npm run dev                # http://localhost:4000
```

### 2. Frontend v1 (React Router)
```bash
cd frontend-v1-router
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### 3. Frontend v2 (useState)
```bash
cd frontend-v2-usestate
cp .env.example .env
npm install
npm run dev                 # http://localhost:5174
```

Ambos frontends pueden correr **simultáneamente** contra el mismo backend.

---

## 🔑 Login social (OAuth)

Se agregó autenticación con **Google, Facebook/Meta, GitHub, X (Twitter), Discord y Twitch**
vía Passport.js, reutilizando el mismo JWT del login local.

**Flujo:** botón social → `GET /api/auth/:provider` → proveedor → `GET /api/auth/:provider/callback`
→ backend genera JWT → redirige a `FRONTEND_URL/oauth/callback?token=...` → el frontend
guarda el token y consulta `/api/users/profile` (idéntico al restore de sesión local).

**Configuración:**
1. Crear una app OAuth en cada proveedor (panel de developers) y obtener `client_id`/`client_secret`.
   - Callback URL a registrar en cada proveedor: `http://localhost:4000/api/auth/<provider>/callback`
2. Completar esas credenciales en `backend/.env` (ver `.env.example`).
3. `npm install` en `backend` (agrega `passport` + una estrategia por proveedor).
4. La tabla `users` ahora acepta `password_hash` nulo y agrega `provider`, `provider_id`, `avatar_url`
   (ver `sql/schema.sql` actualizado). Si la BBDD ya existía, correr las sentencias `ALTER TABLE` equivalentes.

## 🔒 Notas de seguridad implementadas

- Contraseñas hasheadas con `bcryptjs` (10 salt rounds), nunca se guardan en texto plano.
- JWT firmado con secreto de entorno, expiración de 2h.
- `helmet` para cabeceras HTTP seguras y `express-rate-limit` en `/api/auth` para mitigar fuerza bruta.
- Mensajes de error de login genéricos ("Credenciales inválidas") para no filtrar si un email existe.
- El middleware `verifyToken` protege `/api/users/profile` y `/api/users`.
- **`localStorage` vs `httpOnly cookies`:** este proyecto guarda el JWT en `localStorage`
  por simplicidad y porque se piden dos SPA desacopladas del backend (distintos orígenes/puertos).
  La alternativa más segura en producción es usar **cookies `httpOnly` + `Secure` + `SameSite=Strict`**,
  seteadas por el propio backend (`res.cookie('token', jwt, {httpOnly:true,...})`), ya que
  así el JavaScript del cliente nunca tiene acceso directo al token y se mitiga el riesgo de robo
  vía XSS. La contrapartida es que se necesita configurar CORS con `credentials:true` y protección CSRF.

---

## 📊 Paso 5 — React Router vs useState: diferencias, pros y contras

| Aspecto | Versión 1 (React Router) | Versión 2 (useState) |
|---|---|---|
| **URL refleja la vista** | Sí (`/login`, `/dashboard`, etc.) | No, siempre la misma URL |
| **Botón atrás/adelante del navegador** | Funciona de forma nativa | No funciona (no hay historial) |
| **Compartir/recargar una vista concreta** | Funciona (deep-linking) | Se pierde el estado al recargar (vuelve a `login`) |
| **Protección de rutas** | Declarativa vía `<ProtectedRoute>` que envuelve `<Route>` | Imperativa: se valida en `handleNavigate()` antes de cambiar el estado |
| **Escalabilidad** | Mejor para apps con muchas vistas/rutas anidadas, breadcrumbs, lazy loading por ruta | Se vuelve difícil de mantener si crecen las vistas (el `switch` crece mucho) |
| **SEO** | Mejor (cada URL es indexable, en SSR incluso más) | Malo, todo vive bajo una única URL |
| **Curva de aprendizaje / dependencias** | Requiere aprender la API de `react-router-dom` (una dependencia más) | Cero dependencias extra, solo React puro |
| **Casos de uso ideales** | Sitios/apps con múltiples secciones, necesidad de URLs compartibles, SEO | Widgets embebidos, wizards de pocos pasos, apps tipo "kiosco" o dashboards internos simples |

### Conclusión
- **React Router (V1)** es el estándar de facto para aplicaciones React de tamaño mediano/grande:
  ofrece navegación declarativa, code-splitting por ruta, manejo de historial y URLs
  significativas, lo cual mejora la UX y el SEO.
- **useState (V2)** es válido para prototipos rápidos, apps embebidas en un iframe/widget,
  o flujos cortos (ej. un wizard de checkout) donde no se necesita deep-linking. Su principal
  desventaja es que **reinventa manualmente** cosas que el router ya resuelve (guardas de
  navegación, historial, sincronía con la URL), lo que aumenta la complejidad a medida que
  crece el número de vistas.

En ambos casos, la app comparte el **mismo `AuthContext`**, la **misma configuración de Axios**
y el **mismo backend**, demostrando que la lógica de autenticación es independiente del
paradigma de navegación elegido.
