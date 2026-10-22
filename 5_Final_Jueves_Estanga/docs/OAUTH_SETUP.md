# GUÍA DE CONFIGURACIÓN OAUTH (Google, Facebook, Apple) — Surf Rental MDP

Este documento detalla los pasos de configuración para los tres proveedores de autenticación social requeridos en el Trabajo Práctico Final de carrera.

---

## 1. 🌐 Google OAuth 2.0

### Pasos en Google Cloud Console
1. Ingresar a [Google Cloud Console](https://console.cloud.google.com/).
2. Crear un nuevo proyecto: `surf-rental-mdp`.
3. Navegar a **APIs & Services** → **OAuth consent screen**:
   - Tipo de usuario: **External**.
   - Nombre de la app: **Surf Rental Mar del Plata**.
   - Email de soporte y desarrollador.
   - Scopes obligatorios: `openid`, `.../auth/userinfo.profile`, `.../auth/userinfo.email`.
4. Navegar a **Credentials** → **Create Credentials** → **OAuth client ID**:
   - **Aplicación Web** (para backend y Expo Web):
     - URIs de redireccionamiento autorizados:
       - `http://localhost:3000/api/auth/oauth/google/callback`
       - `https://auth.expo.io/@tu-usuario/surf-rental-mdp`
   - **Android / iOS** (para Expo nativo):
     - Package name: `com.surfrental.mdp`
     - Bundle identifier: `com.surfrental.mdp`
5. Guardar en `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID="TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="TU_GOOGLE_CLIENT_SECRET"
   ```

---

## 2. 📘 Facebook Login (Meta Developers)

### Pasos en Meta Developers
1. Ingresar a [Meta for Developers](https://developers.facebook.com/).
2. Crear una nueva aplicación de tipo **Consumidor** o **Autenticar y solicitar datos**.
3. Añadir el producto **Inicio de sesión con Facebook**:
   - En **Configuración del inicio de sesión con Facebook**:
     - URIs de redireccionamiento de OAuth válidos:
       - `http://localhost:3000/api/auth/oauth/facebook/callback`
       - `https://auth.expo.io/@tu-usuario/surf-rental-mdp`
       - `surfrental://auth/callback`
4. En **Configuración básica** de la app:
   - Copiar el **Identificador de la app (App ID)** y la **Clave secreta (App Secret)**.
5. Guardar en `backend/.env`:
   ```env
   FACEBOOK_APP_ID="TU_FACEBOOK_APP_ID"
   FACEBOOK_APP_SECRET="TU_FACEBOOK_APP_SECRET"
   ```

---

## 3. 🍏 Sign in with Apple

### Pasos en Apple Developer Portal
1. Ingresar a [Apple Developer Account](https://developer.apple.com/account/).
2. En **Certificates, Identifiers & Profiles**:
   - En **App IDs**: habilitar la capacidad **Sign In with Apple** para `com.surfrental.mdp`.
   - En **Services IDs**: crear un identificador web (ej. `com.surfrental.mdp.web`):
     - Configurar Domains y Return URLs:
       - `http://localhost:3000/api/auth/oauth/apple/callback`
   - En **Keys**: generar una nueva clave privada (.p8) con Sign in with Apple habilitado.
3. Guardar en `backend/.env`:
   ```env
   APPLE_CLIENT_ID="com.surfrental.mdp.web"
   APPLE_TEAM_ID="TU_TEAM_ID_10_CHARS"
   APPLE_KEY_ID="TU_KEY_ID_10_CHARS"
   APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

---

## 4. 📲 Deep Linking en Mobile (React Native + Expo)

- Esquema registrado en `mobile/app.json`:
  ```json
  "scheme": "surfrental"
  ```
- URI de callback recibida en dispositivo:
  `surfrental://auth/callback?access=<JWT_ACCESS>&refresh=<JWT_REFRESH>`

---

## 5. 🔀 Lógica de Unificación de Cuentas (Account Merging)

Implementada en `backend/src/modules/auth/oauth.service.ts`:
1. **Mismo OAuth ID**: Si el usuario ya inició sesión previamente con el proveedor, se devuelven nuevos tokens JWT de inmediato.
2. **Mismo Email**: Si un usuario se registró localmente con su email y luego presiona "Continuar con Google", el sistema **vincula** su cuenta existente sin duplicar registros, actualizando `oauthId` y conservando su historial, reservas y puntos.
3. **Usuario Nuevo**: Si el email no existe, se crea automáticamente un nuevo usuario con rol `CONSUMER`.
