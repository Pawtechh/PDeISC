# 🌊 Prácticas de Desarrollo e Ingeniería de Software (PDeISC)

> **Repositorio Académico Oficial**  
> **Estudiante:** Luis Hernán Peralta  
> **Cátedra:** Programación y Desarrollo (Prof. Estanga)  
> **Versión del Repositorio:** `v1.0.0` (Ciclo Completo: Trabajos Prácticos y Proyecto Final)

---

## 📁 Estructura del Repositorio

El repositorio se encuentra estructurado en módulos pedagógicos progresivos que abarcan desde desarrollo backend en Node.js, frontend web con JavaScript y React, hasta desarrollo mobile multiplataforma con React Native y el Proyecto Final integrador:

```text
PDeISC/
├── 1_NodeJS/                 # Servidores HTTP nativos, sistema de archivos, módulos y Node básico
├── 2_JS/                     # Ejercicios y proyectos de JavaScript (JS_0 a JS_5, DOM, Puntos 1 al 14)
├── 3_React/                  # Aplicaciones Frontend SPA con React (Hooks, Componentes y Estado)
├── 4_ReactNative/            # Aplicaciones Mobile con Expo (RN1, RN2, RN3: Sensores, Biometría, Cámara)
├── 5_Final_Jueves_Estanga/   # 🏄 PROYECTO FINAL: Surf Rental Mar del Plata (Monorepo Fullstack)
│   ├── backend/              # Node.js + Express + Prisma ORM + MySQL + JWT + MercadoPago
│   ├── mobile/               # React Native + Expo Go + Biometría + Escáner QR en vivo
│   ├── docs/                 # Documentación técnica, 12 Master Prompts y matriz legal
│   └── docker-compose.yml    # Configuración de despliegue en contenedores para VPS
├── Juego Estanga/            # Proyecto interactivo y lúdico de la cátedra
└── Recuperatori_primer/      # Evaluaciones y entregas de recuperación
```

---

## 🏄 Proyecto Final: Surf Rental Mar del Plata (`5_Final_Jueves_Estanga`)

Sistema integral full-stack para alquiler de tablas de surf en la costa atlántica (Sede Central Playa Grande, Mar del Plata).

### Aspectos Destacados
* **Arquitectura Monorepo**: Backend en Node.js / Express con arquitectura modular por capas, tipado estricto con Zod y base de datos relacional MySQL gestionada con Prisma ORM.
* **Aplicación Mobile Multiplataforma**: Desarrollada en React Native con Expo SDK, adaptada responsive para Mobile, Tablet y Escritorio (PC).
* **Gestión Dinámica de Comisión de Sede**: Panel web para configurar en tiempo real el porcentaje que cobra la agencia (requiere confirmación por contraseña especial de seguridad), recalculando al instante todos los splits, cotizaciones y registros contables de la plataforma.
* **Firma Biométrica Digital (Ley 25.506 / 25.326)**: Sustitución de firma manuscrita por autenticación biométrica (Huella Digital / FaceID) en contratos de alquiler y recepción en mostrador, generando certificados criptográficos SHA-256 inmutables.
* **Escáner e Inspección QR en Vivo**: Generación de matrices QR ISO estándar para cada tabla y pase de retiro, decodificación por cámara en tiempo real mediante `jsQR` en mostrador de agencia.
* **Seguridad de Producción**: 20 directivas de endurecimiento aplicadas (Rate limiting, Helmet, validación Zod anti-mass assignment, JWT con rotación de refresh tokens, cookies seguras y sanitización).
* **Despliegue y Hosting en Vivo**: Servidor activo expuesto mediante túnel seguro HTTPS con base de datos en segundo plano y documentación Swagger disponible en `/api-docs`.

---

## 🚀 Tecnologías Principales

* **Lenguajes:** TypeScript, JavaScript (ES6+), SQL, HTML5, CSS3.
* **Backend:** Node.js, Express.js, Prisma ORM, MySQL, JWT, bcryptjs, Helmet, Zod.
* **Mobile & Frontend:** React Native, Expo Go, React Native Reanimated, Redux Toolkit Query, Playwright.
* **DevOps & Infra:** Docker, Docker Compose, Nginx Reverse Proxy, PM2.
