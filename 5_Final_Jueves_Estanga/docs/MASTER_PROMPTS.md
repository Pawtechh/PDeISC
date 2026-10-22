# MASTER PROMPTS — Surf Rental Mar del Plata

Guía de ejecución para los 12 Master Prompts del proyecto, asociados a sus agentes especialistas, skills y MCPs.

---

## 🎯 MP1 — Setup inicial
**Agentes**: `ui-designer` + `db-architect`  
**Skills**: `surf-design-system`, `surf-rn-patterns`

```text
PROYECTO: Surf Rental Mar del Plata (app de alquiler de tablas).

STACK: React Native + Expo + Redux Toolkit + React Navigation + NativeWind + Moti + Tamagui.
Backend: Node + Express + Prisma + MySQL.

TAREA:
1. Inicializar monorepo /surf-rental-mdp con backend/, mobile/, docs/, legal/, .antigravity/
2. Backend: npm init + express + prisma + zod + jwt + bcrypt + mercadopago + cloudinary + swagger
3. Mobile: npx create-expo-app + instalar todo el stack
4. Configurar .env.example en ambos
5. Configurar tsconfig estricto
6. Configurar eslint + prettier
7. Crear theme/ con tokens del design-system.md
8. Crear primitives: Screen, Stack, Row, Text, Button, Input, Card, Badge, Avatar, Divider
9. Configurar navegación con AuthStack + MainNavigator (por rol)
10. Configurar Redux Toolkit + persistencia con SecureStore

REGLAS:
- Leer design-system.md y surf-design-system/SKILL.md antes
- Consultar context7 para docs de cada librería
- Screenshot de cada primitivo al terminar
- Reportar: archivos, decisiones, pendientes

ENTREGABLE:
- Estructura completa del monorepo
- Primitives funcionando con story
- Navegación por rol funcionando
- Screenshot de la app corriendo
```

---

## 🎯 MP2 — Auth local + JWT
**Agente**: `api-builder`  
**Skills**: `surf-api-contract`, `surf-business-rules`, `surf-rn-patterns`

```text
MÓDULO: Autenticación local

BACKEND (Express + Prisma + MySQL):
1. Endpoint POST /auth/register → crea user con rol CONSUMER por default
2. Endpoint POST /auth/login → devuelve accessToken (15min) + refreshToken (7d)
3. Endpoint POST /auth/refresh → rota refresh token
4. Endpoint POST /auth/logout → invalida refresh en DB
5. Endpoint GET /auth/me → devuelve user con su rol
6. Endpoint POST /auth/forgot-password + reset-password
7. Middleware requireAuth (valida JWT, agrega req.user)
8. Middleware requireRole(...roles)
9. Middleware requireOwnership
10. Rate limit login: 5 intentos / 15min
11. Hash bcrypt 12 rounds

MOBILE (React Native):
1. Pantalla LoginScreen (email + password + links a OAuth)
2. Pantalla RegisterScreen (email + password + DNI + nombre + teléfono + foto DNI)
3. Pantalla ForgotPasswordScreen
4. Slice authSlice (user, tokens, isAuthenticated)
5. RTK Query authApi (login, register, refresh)
6. baseQueryWithAuth (refresca automático en 401)
7. Persistencia con SecureStore

REGLAS:
- Leer surf-api-contract y surf-business-rules
- Zod para validación en back y front
- React Hook Form en mobile
- Errores estandarizados
- Tests: service + controller + componente

ENTREGABLE:
- Backend con 6 endpoints + 3 middlewares + tests
- Mobile con 3 pantallas + slice + persistencia
- Swagger actualizado
- Screenshots de login/register
```

---

## 🎯 MP3 — OAuth social
**Agentes**: `api-builder` + `ui-designer`  
**Skills**: `surf-api-contract`, `surf-rn-patterns`

```text
MÓDULO: OAuth con Google, Facebook, Apple

BACKEND:
1. Estrategia OAuth para cada proveedor
2. Endpoint GET /auth/oauth/:provider → redirige
3. Endpoint GET /auth/oauth/:provider/callback → crea o vincula user, devuelve JWT
4. Campo proveedorOAuth en User (LOCAL|GOOGLE|FACEBOOK|APPLE)
5. Campo oauthId
6. Lógica de merge: si email existe → vincula; si no → crea

MOBILE:
1. Instalar expo-auth-session
2. Configurar client IDs en app.json
3. Botones "Continuar con Google/Facebook/Apple" en Login y Register
4. Hook useOAuth(provider) → maneja el flujo
5. Deep linking para callback

CONFIGURACIÓN:
- Google: Cloud Console, OAuth consent
- Facebook: Meta Developers
- Apple: Apple Developer, Sign in with Apple

REGLAS:
- Consultar context7 para docs de expo-auth-session
- Tests: mockear proveedores
- Un solo flujo para los 3 proveedores

ENTREGABLE:
- Backend con 3 proveedores funcionando
- Mobile con 3 botones + flujo completo
- Screenshots de cada login social
- Documentación de setup de cada proveedor
```

---

## 🎯 MP4 — Boards CRUD + catálogo
**Agentes**: `api-builder` + `ui-designer`  
**Skills**: `surf-api-contract`, `surf-business-rules`, `surf-design-system`

```text
MÓDULO: Tablas (Boards)

BACKEND:
1. CRUD completo de Board (solo OWNER dueño)
2. GET /boards público con filtros (tipo, precio, marca, disponible, orden)
3. GET /boards/:id con reseñas + rating + disponibilidad 7 días
4. Regla: tablas duplicadas (mismo owner + marca + modelo + medidas) → elimina la segunda
5. Regla: owner sin suscripción activa → tablas PRIVADA (no aparecen público)
6. Regla: valor tasado en USD definido por agencia
7. Cron: mantenimiento cada 45 días

MOBILE:
1. CatálogoScreen: grid con filtros en bottom sheet + búsqueda
2. BoardDetailScreen: galería horizontal + specs + reseñas + CTA reservar
3. MyBoardsScreen (owner): lista + FAB crear
4. CreateBoardScreen: formulario con fotos, medidas, precio, valor tasado
5. BoardCard component (reusar en catálogo e historial)

REGLAS:
- Leer design-system.md (colores, spacing)
- Leer surf-business-rules
- FlashList para el catálogo
- Expo Image + blurhash para fotos

ENTREGABLE:
- Backend con 5 endpoints + reglas duplicado/privada
- Mobile con 4 pantallas + BoardCard
- Screenshots catálogo + detalle + create
- Tests de reglas (duplicado, privada)
```

---

## 🎯 MP5 — Rentals + cálculo de precios
**Agente**: `business-logic`  
**Skills**: `surf-business-rules`, `surf-api-contract`

```text
MÓDULO: Alquileres

BACKEND:
1. POST /rentals → crea reserva PENDIENTE + preferencia MP
2. Cálculo de precio (función pura testeada):
   - base = horas × precioHora
   - si día completo → base × 0.75
   - descuento anticipado 10% si +7 días
   - descuento por puntos según tabla
   - + precio seguro
3. POST /rentals/:id/cancel → aplica política escalonada
4. GET /rentals/mine (consumer)
5. GET /rentals/:id (según rol, filtra datos sensibles)
6. POST /rentals/:id/extend → extiende con precio dinámico (+20% hora pico)

MOBILE:
1. ReserveScreen: calendario + horas + seguro + resumen desglosado
2. CheckoutScreen: WebView MercadoPago
3. ConfirmationScreen: QR + resumen
4. MyRentalsScreen: historial con estados
5. RentalDetailScreen: fotos + contrato + seguro + reseña

REGLAS:
- Leer surf-business-rules COMPLETO
- Tests exhaustivos del cálculo de precio (todos los descuentos combinados)
- Cancelación: tests por cada franja (72h, 24h, 6h, -6h)

ENTREGABLE:
- Backend con 6 endpoints + cálculo testeado
- Mobile con 5 pantallas
- Tests de pricing con 20+ casos
- Screenshots del flujo de reserva
```

---

## 🎯 MP6 — MercadoPago
**Agente**: `api-builder`  
**Skills**: `surf-api-contract`, `surf-business-rules`

```text
MÓDULO: Pagos con MercadoPago

BACKEND:
1. POST /payments/preference → crea preferencia Checkout Pro
2. POST /payments/webhook → recibe notificación MP, valida y actualiza Rental
3. Pre-autorización al reservar (retención 30% valor tabla)
4. Débito de daños (después de claim aprobado)
5. Manejo de fallos: reintentos, estados FALLIDO, DERIVADO_LEGAL
6. Guardar transacciones en DB (id, monto, estado, mp_payment_id)

MOBILE:
1. Integración con expo-web-browser para abrir Checkout Pro
2. Deep linking para volver a la app tras pago
3. Pantalla de resultado (éxito / fallo / pendiente)

CONFIGURACIÓN:
- SDK de MercadoPago Node
- Credenciales sandbox en .env
- Webhook público (usar ngrok en dev)

REGLAS:
- Consultar context7 para docs actuales de MP
- Validar firma del webhook
- Idempotencia: no procesar dos veces el mismo pago

ENTREGABLE:
- Backend con 2 endpoints + pre-auth + débito
- Mobile con flujo completo
- Documentación del setup de MP (sandbox y prod)
- Test de webhook con firma simulada
```

---

## 🎯 MP7 — Panel Agencia
**Agentes**: `ui-designer` + `api-builder`  
**Skills**: `surf-design-system`, `surf-api-contract`, `surf-business-rules`

```text
MÓDULO: Operación de la agencia

BACKEND:
1. GET /agency/dashboard → métricas: ingresos, activos, reclamos
2. GET /agency/solicitudes → todas las reservas con filtros
3. POST /rentals/:id/retiro → sube fotos + DNI + firma del consumer
4. POST /rentals/:id/devolucion → sube fotos + registra hora + valida lavado
5. GET /agency/liquidaciones → por owner, monto a pagar
6. GET /agency/top-tablas → ranking por horas + ingresos

MOBILE (tabs):
1. DashboardScreen: cards con métricas + gráfico
2. SolicitudesScreen: lista con filtros (estado, fecha, owner)
3. EntregasScreen: rentals pendientes de retiro
4. DevolucionesScreen: rentals en curso
5. LiquidacionesScreen: por owner con botón "marcar pagado"

FLUJO DE ENTREGA (pantalla):
- Galería de fotos de la tabla (placeholder)
- Botón "Subir fotos" (mínimo 4)
- Input DNI + nombre
- Canvas de firma (react-native-signature-canvas)
- Botón "Confirmar retiro"

FLUJO DE DEVOLUCIÓN:
- Galería de fotos
- Checkbox "Verifiqué que está lavada"
- Si no → aplicar multa $10.000
- Botón "Enviar a revisión del owner"

REGLAS:
- Leer design-system.md
- Screenshot de cada pantalla
- Charts con react-native-svg-charts o victory-native

ENTREGABLE:
- Backend con 6 endpoints + subida de fotos
- Mobile con 5 pantallas + firma digital
- Screenshots de cada pantalla
- Tests de flujos de entrega/devolución
```

---

## 🎯 MP8 — Panel Owner
**Agentes**: `ui-designer` + `api-builder`  
**Skills**: `surf-design-system`, `surf-api-contract`, `surf-business-rules`

```text
MÓDULO: Owner (seguros, revisiones, mantenimiento)

BACKEND:
1. GET /owner/boards → solo sus tablas
2. GET /owner/rentals → historial con horas + ganancia estimada (sin DNI ni datos sensibles)
3. GET /owner/revisions → rentals PENDIENTE_REVISION
4. POST /rentals/:id/evaluacion → { evaluacion: SIN_DANOS | CON_DANOS, observaciones }
5. POST /claims → crear reclamo con fotos + cotización
6. GET /owner/earnings → ganancias mensuales + liquidaciones
7. POST /owner/maintenance/:boardId → marcar mantenimiento hecho + fotos
8. Cron: notificar mantenimiento cada 45 días
9. Cron: notificar suscripción por vencer (5 días antes)
10. Regla: suscripción vencida → tablas PRIVADA

MOBILE (tabs):
1. MyBoardsScreen: lista + estado suscripción + próxima mantención
2. RevisionsScreen: rentals pendientes con PhotoComparator (slider)
3. RevisionDetailScreen: fotos entrega vs devolución + botones Sin daños / Reportar
4. ClaimsScreen: lista de reclamos abiertos
5. EarningsScreen: gráfico mensual + liquidaciones pendientes
6. ProfileScreen: datos + configurar póliza por tabla

FLUJO DE REVISIÓN:
- Comparador visual (slider entrega/devolución)
- Botones: "Sin daños" / "Reportar daños"
- Si reporta: formulario con descripción + fotos + costo estimado + cotización PDF

REGLAS:
- El owner NUNCA ve datos personales del consumer
- FotoComparator con gestos (reanimated)

ENTREGABLE:
- Backend con 7 endpoints + 2 crons + regla suscripción
- Mobile con 6 pantallas + PhotoComparator
- Screenshots de comparador
- Tests de crons y reglas
```

---

## 🎯 MP9 — Claims + cobros + disputas
**Agente**: `business-logic`  
**Skills**: `surf-business-rules`, `surf-api-contract`

```text
MÓDULO: Reclamos por daños

BACKEND:
1. Máquina de estados del InsuranceClaim
2. POST /claims/:id/dispute (consumer)
3. PATCH /claims/:id/resolve (agencia) → favor owner o consumer
4. POST /claims/:id/charge (sistema, cron) → intenta cobro
5. Orden de cobro: PreAuth → tarjeta → seguro → transferencia → DERIVADO_LEGAL
6. Notificaciones (email + push) en cada cambio de estado
7. Plazo de 24h para disputa → silencio = aceptación
8. Cron: cada hora revisa claims con plazo vencido

MOBILE:
1. ConsumerClaimsScreen: reclamos donde es parte
2. ClaimDetailScreen: fotos + monto + botones Aceptar / Disputar
3. DisputeScreen: formulario + evidencia + enviar
4. AgencyMediationScreen: ver evidencia de ambas partes + resolver

REGLAS:
- Leer surf-business-rules (estados + transiciones)
- Trazabilidad total: cada acción con timestamp + actor
- Cobro con idempotencia (nunca doble débito)

ENTREGABLE:
- Backend con máquina de estados + 4 endpoints + 2 crons
- Mobile con 4 pantallas
- Tests: transiciones válidas e inválidas, silencio, cobro
- Documentación del flujo completo
```

---

## 🎯 MP10 — Consumer (puntos, reseñas, perfil)
**Agente**: `ui-designer`  
**Skills**: `surf-design-system`, `surf-rn-patterns`, `surf-business-rules`

```text
MÓDULO: Consumer

BACKEND:
1. Sistema de puntos (acumulación, canje, vencimiento)
2. GET /consumer/points → saldo + historial + descuentos disponibles
3. POST /reviews → crear reseña (solo quien alquiló)
4. Moderación de reseñas (malas palabras → revisión)
5. GET /consumer/profile → datos + tarjeta + declaración jurada
6. Aplicación de puntos en checkout (descuento automático)

MOBILE (tabs):
1. HomeScreen: catálogo destacado + mis puntos + alquileres recientes
2. PointsScreen: saldo + progreso a próximo descuento + historial
3. MyRentalsScreen: historial con estados + reseñar si aplica
4. ProfileScreen: datos + foto DNI + tarjeta + declaración jurada + notificaciones

RESEÑAS:
- Rating 1-5 con estrellas táctiles
- Comentario con contador de caracteres
- Solo quien alquiló y devolvió puede reseñar
- Una reseña por rental

PUNTOS:
- 10 por hora
- Progreso visual hacia 100/250/500
- Vencimiento 12 meses
- Se pierden si hay daño no pagado

REGLAS:
- Leer design-system
- Ilustración Lottie para empty state de reseñas
- Animación al ganar puntos

ENTREGABLE:
- Backend con 4 endpoints + sistema de puntos
- Mobile con 4 pantallas
- Screenshots de progreso de puntos y reseñas
- Tests de acumulación y canje
```

---

## 🎯 MP11 — Legal + firma digital + notificaciones
**Agente**: `legal-docs`  
**Skills**: `surf-legal`, `surf-api-contract`

```text
MÓDULO: Legal y notificaciones fehacientes

BACKEND:
1. POST /contracts/accept → guarda versionTC + hash + IP + timestamp
2. POST /contracts/:rentalId/sign → guarda firma digital (base64) + metadatos
3. GET /contracts/:rentalId/pdf → genera PDF con pdfkit o puppeteer
4. Sistema de notificaciones (email con Resend + push con Expo + WhatsApp con Meta API)
5. Tabla Notification con trazabilidad (envio, acuse, IP, hash)
6. Guardar PDF de contrato en Cloudinary

MOBILE:
1. Modal de aceptación de T&C (scroll + checkbox + link)
2. Pantalla de firma digital (para el consumer al retirar)
3. Pantalla de contrato PDF (visor)

DOCUMENTOS LEGALES (redactar en /legal/):
1. Términos y condiciones
2. Contrato agencia-owner
3. Contrato de alquiler template
4. Política de daños
5. Política de seguros
6. Política de cancelación
7. Política de privacidad
8. Política de puntos
9. Política de multas
10. Reglamento del owner
11. Consentimiento informado
12. Autorización de débito
13. Acuerdo de confidencialidad

REGLAS:
- Leer surf-legal/SKILL.md COMPLETO
- Marcar [REVISAR ABOGADO] en cláusulas sensibles
- Cada documento con versión + fecha
- T&C de Mar del Plata, Argentina

ENTREGABLE:
- Backend con 4 endpoints + sistema de notificaciones
- Mobile con 3 pantallas
- 13 documentos legales redactados
- Tests de hash y firma
```

---

## 🎯 MP12 — Testing + APK + Docs
**Agentes**: `test-writer` + `docs-agent` + `qa-agent`  
**Skills**: `surf-business-rules`, `surf-api-contract`, `surf-legal`

```text
MÓDULO: Cierre y entrega

BACKEND:
1. Configurar Jest + Supertest + cobertura mínima 70%
2. Tests unitarios de todos los services
3. Tests de integración de todos los endpoints
4. Mocks de MercadoPago, Cloudinary, Resend
5. Reporte de cobertura

MOBILE:
1. Configurar Jest + React Native Testing Library
2. Tests de componentes (Button, Input, Card)
3. Tests de pantallas principales (render)
4. Tests de hooks (useAuth, useRental)
5. Tests de slices Redux

E2E (opcional):
- Detox o Maestro para flujos críticos

APK:
1. Configurar eas.json
2. eas build -p android --profile preview
3. Firmar APK con keystore
4. Subir a GitHub Releases

DOCUMENTACIÓN:
1. README.md raíz con quickstart + badges
2. backend/README.md con instalación + .env + migraciones
3. mobile/README.md con expo + eas build
4. docs/API.md con todos los endpoints
5. docs/MANUAL_USUARIO.md por rol con capturas
6. docs/GUIA_INSTALACION.md con troubleshooting
7. docs/CHANGELOG.md
8. docs/VIDEO_DEMO.md con guion
9. Swagger accesible en /api-docs

REGLAS:
- Todo comando testeado antes de documentarlo
- Capturas actualizadas
- Sin TODOs en docs finales
- Cobertura reportada

ENTREGABLE:
- APK firmado y descargable
- Documentación completa
- Tests pasando
- Video demo grabado
- Checklist del TP 100% completo
```
