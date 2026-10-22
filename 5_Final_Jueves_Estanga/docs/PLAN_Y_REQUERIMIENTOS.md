# REQUERIMIENTOS Y PLAN POR FASES — Surf Rental Mar del Plata

## 1. Requerimientos Consolidados

### 1.1 Requisitos Académicos del Trabajo Práctico
| # | Requisito | Estado / Detalle |
|---|-----------|------------------|
| 1 | Registro + login | Local con JWT + bcrypt + validación Zod |
| 2 | 3 OAuth (Google, Facebook, Apple) | expo-auth-session + backend callback |
| 3 | 3 roles con permisos distintos | CONSUMER, OWNER, AGENCIA |
| 4 | UI responsiva y navegable | React Native + Expo + NativeWind |
| 5 | API REST con CRUD/ABML | Express + Prisma + MySQL |
| 6 | Manejo de errores front + back | Errores unificados `{ code, message, details, timestamp }` |
| 7 | React Navigation | Native Stack + Bottom Tabs + Drawer (v7) |
| 8 | Redux Toolkit | RTK Query con auto refresh token |
| 9 | Persistencia de sesión | Expo SecureStore para tokens JWT |
| 10 | Componentes responsivos | Tokens del Design System, sin estilos hardcodeados |
| 11 | Node.js + Express | Arquitectura routes → controllers → services → Prisma |
| 12 | JWT access + refresh | Access (15m) + Refresh (7d rotativo en DB) |
| 13 | MySQL | Base relacional con Prisma ORM |
| 14 | Roles y protección de endpoints | Middlewares `requireAuth`, `requireRole`, `requireOwnership` |
| 15 | Documentación API | Swagger en `/api-docs` y Markdown en `/docs/API.md` |
| 16 | Código limpio + estructura | TypeScript estricto, Zod, Winston |
| 17 | Git + GitHub + commits claros | Monorepo estructurado |
| 18 | README de instalación | Quickstart raíz, backend y mobile |
| 19 | Manual de usuario | Guía paso a paso por cada rol |
| 20 | Guía de instalación | Setup paso a paso y troubleshooting |
| 21 | APK funcional | Generado vía EAS Build preview |
| 22 | Video demo (opcional) | Guión de 3-5 minutos |

### 1.2 Reglas de Negocio (Surf Rental MDP)
| # | Regla | Especificación |
|---|-------|----------------|
| 1 | Comisión agencia / owner | 5% agencia / 95% owner |
| 2 | Suscripción owner | $1000 ARS/mes (primeros 3 meses gratis) |
| 3 | Multa no lavar tabla | $10.000 ARS |
| 4 | Cancelación escalonada | +72h: 100%, 24-72h: 70%, 6-24h: 40%, -6h: 0% |
| 5 | Seguro de tabla | Obligatorio para owner; si no, la agencia asigna seguro |
| 6 | Póliza consumer | Cobertura adicional opcional en checkout |
| 7 | Edad mínima | 18 años requeridos para CONSUMER |
| 8 | Horario de atención | 6:00 AM a 21:00 PM (hora local) |
| 9 | Ubicación física | 1 sola sede fija en Mar del Plata. Sin delivery. |
| 10 | Mantenimiento preventivo | Cada 45 días obligatorio para owners |
| 11 | Tablas duplicadas | Se detecta y elimina automáticamente la segunda |
| 12 | Límite de tablas | Sin límite de tablas por owner |
| 13 | Sistema de multas | Escalonado por faltas (1 a 10 puntos de sanción) |
| 14 | Puntos de fidelidad | 10 pts/hora; canjeables por descuentos escalonados |
| 15 | Plazo de disputa de daños | 24 horas; silencio del consumer = aceptación |
| 16 | Jurisdicción legal | Tribunales ordinarios de Mar del Plata, Argentina |

---

## 2. Plan por Fases (12 Semanas)

| Semana | Fase | Entregables Principales |
|:------:|:----:|-------------------------|
| 1 | **Setup** | Monorepo, Antigravity, DB Prisma, design tokens, primitives UI |
| 2 | **Auth** | Registro, login local, JWT access/refresh, roles, persistencia SecureStore |
| 3 | **Auth Social** | Google, Facebook y Apple OAuth (backend + mobile) |
| 4 | **Boards** | CRUD de tablas, catálogo público, detalle, filtros, reglas duplicado/suscripción |
| 5 | **Rentals** | Reserva, motor de cálculo de precios, políticas de cancelación, QR |
| 6 | **Payments** | MercadoPago Checkout Pro, pre-auth, webhooks idempotentes, débito de daños |
| 7 | **Agency** | Panel entregas/devoluciones, fotos, verificación de lavado, firma digital |
| 8 | **Owner** | Panel de revisiones, PhotoComparator (slider), reclamos, ganancias, mantenimiento |
| 9 | **Claims** | Flujo completo de daños, disputa, mediación agencia, orden de cobro |
| 10 | **Consumer** | Programa de puntos, sistema de reseñas verificadas, historial, perfil |
| 11 | **Legal + Docs** | 13 contratos y políticas redactadas, firma digital, manuales de usuario y API |
| 12 | **QA + APK** | Suite de tests (≥70%), corrección de bugs, APK preview firmado, video demo |

---

## 3. Checklist Final de Entrega

- [ ] Repositorio GitHub con estructura monorepo
- [ ] Backend preparado para deploy (ej. Railway)
- [ ] Base de datos MySQL con migraciones Prisma
- [ ] Mobile configurado con EAS Build
- [ ] APK firmado y descargable
- [ ] 3 proveedores OAuth funcionando (Google, Facebook, Apple)
- [ ] 3 roles con permisos diferenciados (CONSUMER, OWNER, AGENCIA)
- [ ] CRUD completo en todas las entidades
- [ ] JWT access + refresh con rotación
- [ ] Documentación Swagger en `/api-docs`
- [ ] Cobertura de tests ≥ 70% en backend y lógica de negocio ≥ 95%
- [ ] 13 documentos legales completos en `/legal/`
- [ ] `README.md` en raíz, `backend/README.md` y `mobile/README.md`
- [ ] Manual de usuario con capturas por rol
- [ ] Guía de instalación y troubleshooting
- [ ] Especificación de API (`docs/API.md`)
- [ ] Registro de cambios (`docs/CHANGELOG.md`)
- [ ] Guión de Video Demo (3-5 min)
- [ ] Textos de interfaz y mensajes en español (es-AR), código en inglés
