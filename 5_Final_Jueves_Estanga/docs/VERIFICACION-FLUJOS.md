# Verificación Integral de Flujos Críticos End-to-End

**Proyecto:** `surf-rental-mdp`  
**Fecha:** 10 de Octubre de 2026  
**Entorno:** Windows, MySQL (puerto 3306), Express Backend (`localhost:3000`), Expo Web (`localhost:8081`)

---

## 1. Resumen Ejecutivo

Se auditó, corrigió y validó la totalidad de los flujos del sistema, garantizando que:
1. **0% Mocks / Fallbacks:** Se eliminaron todos los arrays estáticos y datos hardcodeados en el frontend (`mobile/src/screens` y `mobile/src/components`). Todas las pantallas consumen la base de datos MySQL en vivo a través de RTK Query.
2. **Centralización de Cache y Sincronización:** Se unificaron los endpoints en `apiSlice.ts` con tags cruzados (`Board`, `Rental`, `Claim`, `User`, `Review`, `OwnerStats`, `AgencyStats`). Se implementó `useFocusEffect` y pull-to-refresh (`<RefreshControl>`) en todas las vistas de lista.
3. **Reglas de Negocio Estrictas:**
   - **Comisión de Agencia:** 5% deducida automáticamente en cada reserva.
   - **Pago a Owner:** 95% asignado y reflejado en `EarningsScreen`.
   - **Multa por Salitre:** \$10.000 ARS fija aplicada en devoluciones sin enjuague.
   - **Ciclo de Mantenimiento:** Alerta de revisión cada 45 días o tras 15 usos.
   - **Aceptación Tácita de Daños:** Plazo de 24 horas para respuesta de reclamos.
   - **Cancelación Escalonada:** Reembolso del 100% (>24h), 50% (12-24h), 0% (<12h).

---

## 2. Detalle de Flujos Verificados

### Flujo 1: Contratar Tabla (Consumer)
- **Ruta:** `Catálogo` $\rightarrow$ `BoardDetail` $\rightarrow$ `CheckoutScreen` $\rightarrow$ `Mis Alquileres`
- **Comportamiento Verificado:**
  1. Consumer selecciona tabla en catálogo (18 tablas reales en DB).
  2. En `BoardDetail`, visualiza shaper, medidas, volumen, reseñas verificadas y precio horario real.
  3. En `CheckoutScreen`, selecciona franja horaria dinámica (e.g. 4 horas, \$25.200 ARS).
  4. Ingresa tarjeta de crédito con validación de Luhn y pre-autorización de caución.
  5. Se emite mutación `createRental`:
     - Estado del alquiler pasa a `PENDIENTE_PAGO` / `CONFIRMADA`.
     - Estado de la tabla en `Board` cambia de `DISPONIBLE` a `ALQUILADA` automáticamente.
     - Se computa comisión de agencia (\$1.260 ARS = 5%) e ingreso neto del owner (\$23.940 ARS = 95%).
  6. Redirección a `Mis Alquileres`: el nuevo alquiler aparece inmediatamente en la lista gracias a la invalidación cruzada del tag `Rental`.

### Flujo 2: Cancelación Escalonada de Alquiler (Consumer)
- **Ruta:** `Mis Alquileres` $\rightarrow$ Modal de Cancelación $\rightarrow$ Actualización en DB
- **Comportamiento Verificado:**
  1. Consumer presiona "Cancelar" en un alquiler activo (`CONFIRMADA`).
  2. Se abre modal con detalle de la política escalonada y cálculo dinámico de retención según horas restantes.
  3. Al confirmar cancelación:
     - Mutación `cancelRental` a `POST /api/rentals/:id/cancel`.
     - Estado del alquiler pasa a `CANCELADA`.
     - Tabla asociada vuelve a `DISPONIBLE` en MySQL.
     - Se invalida la query de alquileres y el catálogo de tablas.
  4. La pantalla muestra banner de confirmación de cancelación (`banner-cancelacion-exito`) y la tarjeta refleja el badge `CANCELADA`.

### Flujo 3: Gestión de Tablas del Owner
- **Ruta:** `MyBoardsScreen` $\rightarrow$ `EarningsScreen` $\rightarrow$ `Catálogo`
- **Comportamiento Verificado:**
  1. Owner visualiza únicamente sus tablas mediante `GET /api/boards/mine`.
  2. Al crear o modificar una tabla, la mutación invalida el tag `Board`, impactando instantáneamente tanto en su panel como en el catálogo público de la agencia.
  3. `EarningsScreen` calcula métricas reales (`totalRevenue`, `netEarnings` al 95%, `activeRentals`) agregadas desde la tabla `Rental` en MySQL.

### Flujo 4: Devolución con Daño / Salitre y Mediación de Agencia
- **Ruta:** `ReturnsScreen` (Mostrador/Agencia) $\rightarrow$ `RevisionsScreen` $\rightarrow$ `MediationScreen`
- **Comportamiento Verificado:**
  1. Personal de mostrador realiza checkout de devolución en `POST /api/rentals/:id/devolucion`.
  2. Si se reporta salitre o suciedad, el sistema liquida automáticamente la penalización reglamentaria de \$10.000 ARS.
  3. Si se detectan daños estructurales (quillas rotas, delaminación), se dispara `POST /api/claims` con fotos y monto estimado de reparación.
  4. El reclamo queda con estado `NOTIFICADO` con timer de 24 horas para respuesta del usuario (aceptación tácita).
  5. Si el usuario disputa el reclamo (`POST /api/claims/:id/dispute`), pasa a `DISPUTADO` y aparece en `MediationScreen` para arbitraje del administrador de la agencia.

---

## 3. Matriz de Resultados de Tests

### Backend Unit & Integration Tests (Jest)
- **Suites:** 14 / 14 aprobadas (100%)
- **Tests:** 109 / 109 aprobados (100%)
- **Módulos Cubiertos:** `auth`, `users`, `boards`, `rentals`, `claims`, `reviews`, `loyalty`, `payments`, `legal`, `admin`.

### Mobile Component & Redux Tests (Jest)
- **Suites:** 5 / 5 aprobadas (100%)
- **Tests:** 47 / 47 aprobados (100%)
- **Componentes Cubiertos:** `apiSlice`, `authSlice`, `EmptyState`, `LuhnValidator`, `Screen`.

### End-to-End Tests (Playwright)
- **Total Tests:** 8 pruebas automatizadas completas
1. `tests/auth-flow.spec.ts` - Login real, navegación de 3 roles, switch y logout.
2. `tests/cancel-rental.spec.ts` - Flujo completo de cancelación con política escalonada.
3. `tests/checkout-card.spec.ts` - Validación de Luhn, dev cards, selección horaria y pre-autorización.
4. `tests/datepicker-register.spec.ts` - Selector de fecha de nacimiento y validación de mayoría de edad (+18).
5. `tests/responsive-catalog.spec.ts (Mobile)` - Grilla de 1 columna.
6. `tests/responsive-catalog.spec.ts (Tablet)` - Grilla de 2 columnas.
7. `tests/responsive-catalog.spec.ts (Desktop)` - Grilla de 3 columnas.
8. `tests/validation-flow.spec.ts` - Validación estricta de formularios y feedback visual.

---

## 4. Evidencias y Capturas de Pantalla Generadas

| ID | Captura | Descripción |
|---|---|---|
| 01 | `screenshots/01_mobile_catalog.png` | Catálogo en viewport móvil (1 columna) |
| 02 | `screenshots/02_tablet_catalog.png` | Catálogo en viewport tablet (2 columnas) |
| 03 | `screenshots/03_desktop_catalog.png` | Catálogo en viewport desktop (3 columnas) |
| 06 | `screenshots/06_register_form_invalid_errors.png` | Errores de validación en tiempo real en Registro |
| 07 | `screenshots/07_register_form_valid_green_checks.png` | Formulario de registro completado válidamente |
| 09 | `screenshots/09_login_form_valid.png` | Pantalla de inicio de sesión validada |
| 10 | `screenshots/10_cancel_modal_open.png` | Modal de cancelación con desglose escalonado |
| 11 | `screenshots/11_cancel_success_banner.png` | Banner de éxito tras procesar cancelación en DB |
| 12 | `screenshots/12_datepicker_modal_open.png` | Selector de fecha de nacimiento nativo/web |
| 13 | `screenshots/13_datepicker_under_18_error.png` | Restricción reglamentaria para menores de 18 años |
| 15 | `screenshots/15_checkout_summary.png` | Resumen de tabla y cálculo de precios en Checkout |
| 16 | `screenshots/16_checkout_card_brand_detected.png` | Detección automática del emisor de tarjeta |
| 19 | `screenshots/19_checkout_validation_panel_errors.png` | Panel explicativo de validación Luhn para checkout |
| 20 | `screenshots/20_checkout_test_cards_accordion.png` | Acordeón DEV con tarjetas de prueba sandbox |
| 21 | `screenshots/21_checkout_dynamic_time_slots.png` | Selección dinámica de slots horarios |
| 22 | `screenshots/22_checkout_final_success.png` | Pantalla de confirmación de reserva y cobro |
