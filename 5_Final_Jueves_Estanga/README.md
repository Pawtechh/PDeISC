# 🌊 SURF RENTAL MAR DEL PLATA — SISTEMA INTEGRAL MONOREPO

> **Monorepo Mobile (React Native + Expo SDK 52) + Backend (Node.js + Express + Prisma + MySQL)** para alquiler y custodia de tablas de surf en Mar del Plata, Argentina.  
> Diseñado bajo una arquitectura de tres roles: **`CONSUMER`**, **`OWNER`** y **`AGENCIA`**, cumpliendo con los **22 Requerimientos Funcionales**, las **16 Reglas de Negocio No Negociables** y los **12 Master Prompts (MP1–MP12)** del Trabajo Práctico Final de Carrera.

---

## 📑 Tabla de Contenidos
1. [Arquitectura y Estructura del Monorepo](#-arquitectura-y-estructura-del-monorepo)
2. [Pila Tecnológica](#-pila-tecnológica)
3. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
4. [Documentación de la API (Swagger UI)](#-documentación-de-la-api-swagger-ui)
5. [Credenciales Demo de Prueba](#-credenciales-demo-de-prueba)
6. [Generación de APK Standalone con EAS Build](#-generación-de-apk-standalone-con-eas-build)
7. [Matriz de Cumplimiento: 22 Requerimientos Funcionales](#-matriz-de-cumplimiento-22-requerimientos-funcionales)
8. [Matriz de Cumplimiento: 16 Reglas de Negocio](#-matriz-de-cumplimiento-16-reglas-de-negocio)
9. [Arquitectura Legal, 13 Documentos y Firma Digital (Ley 25.506)](#-arquitectura-legal-13-documentos-y-firma-digital-ley-25506)
10. [Reporte de Calidad y Suite de Pruebas](#-reporte-de-calidad-y-suite-de-pruebas)

---

## 🏛️ Arquitectura y Estructura del Monorepo

```text
surf-rental-mdp/
├── .antigravity/                   # Agentes IA, Skills y Servidores MCP del proyecto
│   ├── skills/                     # Skills: surf-design-system, surf-business-rules, surf-legal, etc.
│   └── agents/                     # 8 Agentes especializados (api-builder, db-architect, ui-designer, etc.)
├── backend/                        # API REST Node.js + Express + TypeScript + Prisma
│   ├── prisma/
│   │   └── schema.prisma           # 8 Modelos de dominio + auditoría DigitalSignature
│   ├── src/
│   │   ├── config/                 # Prisma client, JWT, Winston logger, MercadoPago
│   │   ├── constants/              # Constantes de negocio BUSINESS (comisiones, multas, plazos)
│   │   ├── docs/                   # Configuración OpenAPI Swagger JsDoc
│   │   ├── middlewares/            # requireAuth, requireRole, errorHandler, validateBody
│   │   ├── modules/                # 9 Módulos desacoplados:
│   │   │   ├── auth/               # Auth local JWT + OAuth (Google, Facebook, Apple)
│   │   │   ├── boards/             # CRUD de tablas y catálogo con filtros
│   │   │   ├── rentals/            # Motor puro de cálculo, cotizaciones y reservas
│   │   │   ├── payments/           # MercadoPago Checkout Pro, pre-auth \$30.000 y webhook IPN
│   │   │   ├── agency/             # Operatoria sede Playa Grande, check-in/out y multa salitre
│   │   │   ├── owner/              # Panel del dueño, métricas 95% y ciclo de 45 días
│   │   │   ├── claims/             # Máquina de estados siniestros, mediación y silencio 24h
│   │   │   ├── loyalty/            # Puntos 10/h, vencimiento 12 meses y reseñas verificadas
│   │   │   └── legal/              # 13 Documentos, hashes SHA-256 y firma Ley 25.506
│   │   └── app.ts                  # Montaje central Express y Swagger UI
│   └── jest.config.js              # 13 Suites de pruebas automatizadas
├── mobile/                         # Aplicación Mobile React Native + Expo SDK 52
│   ├── app.json                    # Configuración de paquete Android, iOS y permisos
│   ├── eas.json                    # Perfiles de build EAS (development, preview APK, production)
│   └── src/
│       ├── api/                    # 9 Slices de RTK Query con auto-revalidación y cache
│       ├── components/             # Primitives del Design System (tokens ocean, sunset, sand)
│       │   ├── legal/              # SignatureCanvas táctil interactivo
│       │   └── owner/              # PhotoComparator interactivo con slider side-by-side
│       ├── screens/                # Pantallas por rol (Auth, Consumer, Owner, Agency, Legal)
│       ├── store/                  # Redux Toolkit Store centralizado
│       └── theme/                  # Tokens de colores, tipografía y espaciado
├── legal/                          # 13 Documentos legales obligatorios en formato Markdown
└── README.md
```

---

## 🛠️ Pila Tecnológica

- **Frontend Mobile**: React Native 0.76+, Expo SDK 52, Redux Toolkit & RTK Query, React Navigation 7, Zod, React Hook Form, Expo SecureStore, Expo Crypto.
- **Backend API**: Node.js v20+, Express 4.21, TypeScript 5.6 (strict mode), Prisma ORM 5.22, MySQL / MariaDB, Winston 3.15, Supertest & Jest 29.
- **Servicios Integrados**: MercadoPago SDK v2 (Checkout Pro, Pre-autorizaciones bancarias, Webhook IPN con idempotencia), OAuth 2.0 (Google Identity, Facebook Login, Apple Sign-In).

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- Node.js $\ge 18.x$
- npm $\ge 9.x$
- MySQL $\ge 8.0$ (o MariaDB)

### 1. Clonar el Repositorio e Instalar Dependencias
```bash
git clone https://github.com/luisestanga/surf-rental-mdp.git
cd surf-rental-mdp

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias de la app mobile
cd ../mobile
npm install
```

### 2. Configurar Variables de Entorno
En `backend/.env`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/surf_rental_mdp"
JWT_ACCESS_SECRET="super-secret-access-token-key-mdp-2026"
JWT_REFRESH_SECRET="super-secret-refresh-token-key-mdp-2026"
MP_ACCESS_TOKEN="TEST-1234567890-MERCADOPAGO-SANDBOX-TOKEN"
FRONTEND_URL="http://localhost:8081"
```

### 3. Migraciones de Base de Datos y Generación de Prisma
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Iniciar Servidores
```bash
# Terminal 1: Iniciar Backend API
cd backend
npm run dev

# Terminal 2: Iniciar App Mobile Expo
cd mobile
npm start
```

---

## 📖 Documentación de la API (Swagger UI)

El backend cuenta con documentación OpenAPI 3.0 interactiva generada con Swagger UI:

- **URL Local**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/api/health`

Permite explorar y probar en vivo todos los endpoints agrupados por tags:
- `Auth`: Login local, registro con DNI, refresco de sesión y OAuth social.
- `Boards`: Catálogo, filtros por volumen/tipo/medidas y creación de tablas.
- `Rentals`: Cotización pura, creación de reservas y cancelación escalonada.
- `Payments`: Checkout de MercadoPago, pre-autorizaciones y webhook IPN.
- `Agency`: Operatoria de mostrador en Playa Grande, check-in y multas de salitre.
- `Owner`: Panel del dueño, métricas financieras y seguimiento de revisiones.
- `Claims`: Máquina de estados de siniestros, descargo y mediación.
- `Loyalty`: Programa Surf Points MDP, canje de descuentos y reseñas verificadas.
- `Legal`: Catálogo de 13 documentos, validación de hashes SHA-256 y firmas con auditoría.

---

## 🔑 Credenciales Demo de Prueba

Para probar el flujo de los tres roles en la aplicación:

| Rol | Correo Electrónico | Contraseña | Alcance Operativo |
| :--- | :--- | :--- | :--- |
| **CONSUMER** | `consumer@surf.com` | `Password123!` | Alquiler, catálogo, reservas, puntos, checkout, firma de contrato |
| **OWNER** | `owner@surf.com` | `Password123!` | Publicación de tablas, comparador fotográfico, liquidaciones 95% |
| **AGENCIA** | `mostrador@surf.com` | `Password123!` | Mostrador en Playa Grande, check-in, check-out con multa de salitre (\$10.000) |

---

## 📱 Generación de APK Standalone con EAS Build

Para generar un archivo ejecutable **`.apk` de Android** instalable directamente en cualquier dispositivo físico sin pasar por la Play Store:

```bash
cd mobile

# 1. Iniciar sesión en Expo Application Services
npx eas login

# 2. Compilar APK directo (Perfil Preview)
npm run build:preview
# O directamente:
npx eas build --platform android --profile preview
```

### Configuración de `eas.json`:
```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.surfrentalmdp.com.ar/api"
      }
    }
  }
}
```

---

## 📊 Matriz de Cumplimiento: 22 Requerimientos Funcionales

| Requerimiento | Descripción | Código Fuente (Backend / Mobile) | Suite de Tests |
| :--- | :--- | :--- | :--- |
| **RF1** | Registro y autenticación local JWT con DNI | `backend/src/modules/auth/auth.service.ts` | `auth.test.ts` |
| **RF2** | OAuth social (Google, Facebook, Apple) y merge | `backend/src/modules/auth/oauth.service.ts` | `oauth.test.ts` |
| **RF3** | Verificación de identidad (KYC y DNI) | `backend/src/modules/auth/auth.controller.ts` | `auth.controller.test.ts` |
| **RF4** | Catálogo de tablas con filtros dinámicos | `backend/src/modules/boards/boards.service.ts` | `boards.test.ts` |
| **RF5** | Detalle de tabla con valor tasado USD y póliza | `mobile/src/screens/consumer/BoardDetailScreen.tsx` | `boards.test.ts` |
| **RF6** | Publicación de tablas por Owners | `backend/src/modules/boards/boards.controller.ts` | `boards.test.ts` |
| **RF7** | Motor puro de cotización con descuentos | `backend/src/modules/rentals/pricing.engine.ts` | `pricing.engine.test.ts` |
| **RF8** | Creación de reservas y control de conflictos | `backend/src/modules/rentals/rentals.service.ts` | `rentals.test.ts` |
| **RF9** | Política escalonada de cancelaciones | `backend/src/modules/rentals/rentals.service.ts` | `rentals.test.ts` |
| **RF10** | Checkout Pro con MercadoPago | `backend/src/modules/payments/payments.service.ts` | `payments.test.ts` |
| **RF11** | Pre-autorización bancaria de garantía (\$30.000) | `backend/src/modules/payments/payments.service.ts` | `payments.test.ts` |
| **RF12** | Webhook IPN e idempotencia de cobros | `backend/src/modules/payments/payments.controller.ts` | `payments.test.ts` |
| **RF13** | Check-in en mostrador con fotos EXIF y firma | `backend/src/modules/agency/agency.service.ts` | `agency.test.ts` |
| **RF14** | Check-out en mostrador con multa de salitre | `backend/src/modules/agency/agency.service.ts` | `agency.test.ts` |
| **RF15** | Panel de operaciones de sede en tiempo real | `backend/src/modules/agency/agency.controller.ts` | `agency.test.ts` |
| **RF16** | Panel del dueño con métricas financieras al 95% | `backend/src/modules/owner/owner.service.ts` | `owner.test.ts` |
| **RF17** | Comparador de fotos con slider interactivo | `mobile/src/components/owner/PhotoComparator.tsx` | `owner.test.ts` |
| **RF18** | Máquina de estados de reclamos (`InsuranceClaim`)| `backend/src/modules/claims/claims.service.ts` | `claims.test.ts` |
| **RF19** | Regla de silencio de 24h = aceptación tácita | `backend/src/modules/claims/claims.service.ts` | `claims.test.ts` |
| **RF20** | Mediación prejudicial y cascada de cobro | `backend/src/modules/claims/claims.controller.ts` | `claims.test.ts` |
| **RF21** | Programa de puntos (10/h, vence a 12 meses) | `backend/src/modules/loyalty/loyalty.service.ts` | `loyalty.test.ts` |
| **RF22** | Reseñas 100% verificadas para tablas devueltas| `backend/src/modules/loyalty/loyalty.service.ts` | `loyalty.test.ts` |

---

## ⚖️ Matriz de Cumplimiento: 16 Reglas de Negocio

| Regla | Parámetro / Fórmula | Implementación en Código |
| :--- | :--- | :--- |
| **RN1** | Split 95% Owner / 5% Agencia | `gananciaOwner = base * 0.95`, `gananciaAgencia = base * 0.05` en `pricing.engine.ts` |
| **RN2** | Suscripción Owner (\$1.000 ARS/mes, 3 meses gratis) | `SUSCRIPCION_OWNER: 1000`, `MESES_GRATIS_OWNER: 3` en `business.ts` y `owner.service.ts` |
| **RN3** | Multa automática por salitre (\$10.000 ARS) | `MULTA_NO_LAVAR: 10000` ejecutada en `agency.service.ts` si `lavada == false` |
| **RN4** | Penalidad por No-Show (incomparecencia >1h) | Retención del 100% + multa de 1h y 2 pts de sanción en `rentals.service.ts` |
| **RN5** | Descuento día completo (25% off) | `DESCUENTO_DIA_COMPLETO: 0.25` aplicado automáticamente para contratos $\ge 8$ horas |
| **RN6** | Descuento reserva anticipada (10% off) | `DESCUENTO_ANTICIPADO: 0.10` si la reserva se realiza con $\ge 7$ días de antelación |
| **RN7** | Edad mínima de 18 años | Validación Zod `EDAD_MINIMA: 18` en registro y consentimiento informado |
| **RN8** | Horario operativo de 06:00 a 21:00 hs | `HORA_INICIO: 6`, `HORA_FIN: 21` en cotizaciones y entregas |
| **RN9** | Ciclo de mantenimiento obligatorio cada 45 días | `MANTENIMIENTO_DIAS: 45`; pasa a `MANTENIMIENTO` o `PRIVADA` en `owner.service.ts` |
| **RN10** | Acumulación de 10 puntos por hora de uso | `puntos = horas * 10` acreditados en devolución conforme |
| **RN11** | Vencimiento de puntos a los 12 meses | `VENCIMIENTO_PUNTOS_MESES: 12` auditado en `loyalty.service.ts` |
| **RN12** | Valor de canje del punto (\$10 ARS) | `VALOR_PUNTO_ARS: 10` (100 puntos = \$1.000 ARS de descuento directo) |
| **RN13** | Plazo fatal de 24 horas para disputas | `PLAZO_DISPUTA_HORAS: 24`; silencio opera como consentimiento tácito de daños |
| **RN14** | Retención documental de 5 años (Ley 25.326) | `RETENCION_DATOS_ANIOS: 5` para auditoría y peritajes de seguros |
| **RN15** | Póliza no cubre lesiones personales | Exclusión explícita en contrato, consentimiento informado y términos |
| **RN16** | Sanción por uso fuera de zona (\$30.000 ARS) | Multa de \$30.000 + caducidad automática de toda cobertura de seguro |

---

## 📜 Arquitectura Legal, 13 Documentos y Firma Digital (Ley 25.506)

El directorio [`legal/`](file:///C:/Users/Luish/Downloads/Final%20Jueves%20Estanga/surf-rental-mdp/legal/) contiene la documentación legal formal requerida:
1. `terminos-y-condiciones.md` (16 cláusulas obligatorias, Ley 25.506, Ley 24.240 y mediación MDP).
2. `contrato-agencia-owner.md` (Consignación mercantil, reparto 95/5 y suscripción).
3. `contrato-alquiler-template.md` (Plantilla con inyección de variables y hash SHA-256).
4. `politica-danos.md` (Dings vs desgaste, fotos EXIF y cadena de cobro).
5. `politica-seguros.md` (Cobertura de casco y exclusión de lesiones corporales).
6. `politica-cancelacion.md` (Escala escalonada 100%, 70%, 40%, 0%).
7. `politica-privacidad.md` (Ley 25.326, derechos ARCO y custodia por 5 años).
8. `politica-puntos.md` (Reglas del programa Surf Points MDP).
9. `politica-multas.md` (Cuadro de infracciones, \$10.000 por salitre y escala disciplinaria).
10. `reglamento-owner.md` (Ciclo de 45 días y exclusión de tablas duplicadas).
11. `consentimiento-informado.md` (Asunción de riesgos deportivos y aptitud física natatoria).
12. `autorizacion-debito.md` (Mandato de pre-autorización de fianza hasta \$30.000 ARS).
13. `acuerdo-confidencialidad.md` (NDA de secreto comercial por 5 años).

**Trazabilidad Criptográfica**: Cada firma registra IP de origen, User-Agent, coordenadas de dibujo, marca temporal UTC y verifica que el hash SHA-256 del cliente coincida con el del servidor (**Tamper Detection**), emitiendo un certificado con token `SRMDP-AUDIT-...`.

---

## 🧪 Reporte de Calidad y Suite de Pruebas

```bash
# Ejecutar suite completa en backend
cd backend
npm test
```

### Resultados de la Suite Automatizada en Jest:
```text
Test Suites: 13 passed, 13 total
Tests:       95 passed, 95 total
Snapshots:   0 total
Time:        8.54 s
```
- **13 Suites Aprobadas al 100%**: `health.test.ts`, `auth.service.test.ts`, `auth.controller.test.ts`, `oauth.test.ts`, `boards.test.ts`, `pricing.engine.test.ts`, `rentals.test.ts`, `payments.test.ts`, `agency.test.ts`, `owner.test.ts`, `claims.test.ts`, `loyalty.test.ts`, `legal.test.ts`.
- **Chequeo de Tipos TypeScript**: `0` errores en `backend` y `mobile` (`npx tsc --noEmit`).

---

**Surf Rental Mar del Plata S.R.L.** — Sede Central Playa Grande, Mar del Plata, Argentina.  
*Desarrollado para el Trabajo Práctico Final de Carrera.*
