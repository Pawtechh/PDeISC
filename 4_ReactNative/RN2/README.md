# Trabajo Práctico N° 2 - Acceso de Usuarios con React Native, Expo y Backend

**Ubicación:** `4_ReactNative/RN2`  
**Tecnologías:** React Native, Expo (SDK 58), TypeScript, Expo Router, Node.js, Express, MySQL (XAMPP), PHP (alternativa).

---

## 📁 Estructura del Proyecto

```text
RN2/
├── backend/                  # Servidor API REST y Base de Datos
│   ├── database.sql          # Script SQL para importar en phpMyAdmin (XAMPP)
│   ├── login.php             # Script PHP alternativo para htdocs
│   ├── server.js             # API REST en Node.js + Express + MySQL
│   ├── package.json          # Dependencias de Express, cors, mysql2
│   └── .env                  # Variables de entorno (puerto y credenciales de BD)
└── frontend/                 # Aplicación móvil React Native con TypeScript
    ├── src/
    │   ├── app/
    │   │   ├── _layout.tsx   # Configuración de navegación Stack
    │   │   ├── index.tsx     # Punto 1: Pantalla principal con Formulario Validado
    │   │   └── bienvenida.tsx# Punto 2: Pantalla de Bienvenida (recibe datos por Props)
    │   ├── components/
    │   │   └── BienvenidaCard.tsx # Componente que recibe y renderiza los Props del usuario
    │   ├── services/
    │   │   └── api.ts        # Cliente HTTP fetch para conectar con la API
    │   └── types/
    │       └── auth.ts       # Interfaces estrictas de TypeScript (User, Props, API)
    ├── package.json
    └── app.json
```

---

## 🎯 Cumplimiento de la Consigna

| Requerimiento | Implementación |
| :--- | :--- |
| **1. Formulario de ingreso y paginación a pantalla de bienvenida** | Pantalla de login (`src/app/index.tsx`) con **validación completa en tiempo real** (campos requeridos, formato email regex, longitud de contraseña mín. 6 chars, feedback visual con bordes de color e íconos). Si las credenciales son correctas, navega a `src/app/bienvenida.tsx` usando navegación nativa Stack. |
| **2. Pasar datos por medio de Props** | `src/app/bienvenida.tsx` recibe los parámetros de la sesión y los pasa de forma explícita y tipada mediante **Props de TypeScript** al componente `<BienvenidaCard id={...} nombre={...} email={...} rol={...} horaIngreso={...} />`. |
| **3. API Backend que busque el usuario en MySQL** | API REST completa en `RN2/backend/server.js` conectada a MySQL en XAMPP (`db_usuarios`) mediante `mysql2`. Retorna un objeto JSON con el estado y los datos del usuario. Cuenta con **modo de contingencia en memoria**, lo que permite probar la app incluso si MySQL no está encendido. |

---

## 👥 Usuarios de Prueba

Puedes ingresar con cualquiera de estos usuarios ya registrados en la base de datos (o usar los chips de relleno rápido dentro de la app):

| Correo Electrónico | Contraseña | Rol Asignado |
| :--- | :--- | :--- |
| `admin@test.com` | `123456` | Administrador |
| `juan@test.com` | `secreto123` | Desarrollador |
| `maria@test.com` | `maria2026` | Diseñadora UX/UI |
| `profe@ifts.edu.ar` | `reactnative` | Docente |

---

## 🚀 Guía de Ejecución Paso a Paso

### Paso 1: Configurar la Base de Datos en MySQL (XAMPP)
1. Abrí el panel de **XAMPP** e iniciá **Apache** y **MySQL**.
2. Entrá a **phpMyAdmin** en tu navegador: `http://localhost/phpmyadmin`.
3. Andá a la pestaña **Importar** y seleccioná el archivo:
   `4_ReactNative/RN2/backend/database.sql`
4. Hacé clic en **Importar**. Se creará la base `db_usuarios` con la tabla `usuarios` y los registros de prueba.

### Paso 2: Iniciar la API Backend (Node.js)
Abrí una terminal en la carpeta del backend:
```powershell
cd C:\Users\G15\Documents\GitHub\PDeISC\4_ReactNative\RN2\backend
npm start
```
Verás el mensaje indicando que el servidor está escuchando en el puerto `3000` y listo para recibir peticiones desde Expo Go.

*(Alternativa PHP: Si tu profesor exige probar directamente con PHP en Apache, podés copiar el archivo `backend/login.php` dentro de `C:\xampp\htdocs\api\login.php`)*.

### Paso 3: Iniciar la Aplicación en Expo Go
Abrí otra terminal en la carpeta del frontend:
```powershell
cd C:\Users\G15\Documents\GitHub\PDeISC\4_ReactNative\RN2\frontend
npx expo start
```
1. Asegurate de que tu celular esté conectado a la **misma red Wi-Fi** que la PC.
2. Escaneá el **código QR** con la app **Expo Go** en tu celular.
3. ¡Listo! Podés probar el formulario validado, presionar los botones de usuarios de prueba e ingresar al panel de bienvenida.
