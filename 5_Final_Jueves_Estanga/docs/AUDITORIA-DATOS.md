# Auditoría Integral de Datos, Sincronización y Persistencia

**Proyecto**: `surf-rental-mdp`  
**Fecha**: 10 de octubre de 2026  
**Objetivo**: Diagnóstico exhaustivo de datos estáticos/mocks, desacople de cache en RTK Query, falta de invalidación de tags, ausencia de refetch on focus, endpoints faltantes y vacíos de base de datos.

---

## 1. Resumen Ejecutivo del Diagnóstico

1. **Datos Hardcodeados / Mocks en el Frontend**:  
   Casi todas las pantallas del frontend poseen arrays de `FALLBACK_*` o `MOCK_*`. Cuando el backend responde con un array vacío `[]` (por ejemplo, porque la base de datos no tiene alquileres creados o el owner no tiene tablas), la interfaz aplica la condición `data?.data && data.data.length > 0 ? data.data : FALLBACK_*`, reemplazando la respuesta real por datos demo ficticios (e.g. `#rent-dem-1`, `UVA Classic`). Esto produce el síntoma de que "las tablas o alquileres eliminados siguen apareciendo" o "la app parece estática".

2. **Aislamiento Arquitectónico de RTK Query (9 `createApi` independientes)**:  
   El frontend tiene 9 instancias separadas de `createApi` (`authApi`, `boardsApi`, `rentalsApi`, `paymentsApi`, `agencyApi`, `ownerApi`, `claimsApi`, `loyaltyApi`, `legalApi`). En RTK Query, **los tags de invalidación solo tienen efecto dentro de la misma instancia de API**.  
   - Cuando un owner crea una tabla con `boardsApi.createBoard`, **NO se invalida** `ownerApi.getOwnerBoards` ni `OwnerBoards`.
   - Cuando un consumer alquila una tabla con `rentalsApi.createRental`, **NO se invalida** `boardsApi.getBoards` (la tabla no pasa a ALQUILADA en catálogo), ni `agencyApi.getSchedule`, ni `ownerApi.getOwnerEarnings`.
   - Cuando se cancela un alquiler con `rentalsApi.cancelRental`, **NO se invalida** `boardsApi.getBoards` (la tabla no vuelve a DISPONIBLE).

3. **Ausencia Total de `useFocusEffect` y Pull-to-Refresh**:  
   Ninguna de las pantallas del monorepo implementa `useFocusEffect(useCallback(() => { refetch(); }, [refetch]))` ni `RefreshControl`. Al cambiar de pestaña (e.g. de Catálogo a Mis Alquileres o Mis Tablas), React Navigation mantiene el componente montado sin refrescar los datos.

4. **Transiciones Incompletas en el Backend**:  
   - En `RentalsService.createRental`, se crea el registro de alquiler pero **no se actualiza** el estado de la tabla (`Board.estado = ALQUILADA`) en la base de datos.
   - En `RentalsService.cancelRental`, se cancela el alquiler pero **no se restaura** el estado de la tabla (`Board.estado = DISPONIBLE`) en la base de datos.

5. **Base de Datos Sin Datos de Prueba Realistas**:  
   La base de datos MySQL `surf_rental` cuenta únicamente con 6 usuarios y 3 tablas. Tiene **0 alquileres, 0 reclamos, 0 reseñas, 0 pagos y 0 notificaciones**. Al no haber alquileres en la DB, las pantallas caen obligatoriamente en los fallbacks mockeados.

6. **Endpoints Requeridos No Disponibles o con Rutas Desalineadas**:  
   El backend carece de alias estándar solicitados como `/api/boards/mine`, `/api/rentals/mine`, `/api/rentals/:id/retiro`, `/api/rentals/:id/devolucion`, `/api/rentals/:id/evaluacion`, `/api/claims/mine`, `/api/users/me` y `/api/boards/:id/reviews`.

---

## 2. Matriz de Auditoría Archivo por Archivo

| Archivo | Problema Detectado | Tipo de Defecto | Fix Requerido |
|---|---|---|---|
| `mobile/src/screens/consumer/CatalogScreen.tsx` | Contiene `FALLBACK_BOARDS` (12-68). Si la DB devuelve `[]`, renderiza 3 tablas mock en lugar del empty state real. | Mock hardcodeado / Falta refetch | Eliminar `FALLBACK_BOARDS`. Usar datos directos de `data?.data`. Agregar `useFocusEffect` con `refetch()` y `RefreshControl`. Componente `EmptyState` si la lista está vacía. |
| `mobile/src/screens/consumer/BoardDetailScreen.tsx` | Objeto `board` demo hardcodeado por fallback (16-34). Reseñas escritas fijas en JSX (120-132) sin llamar al endpoint de reviews. | Mock hardcodeado / Falta query real | Consumir `useGetBoardQuery(id)` y `useGetBoardReviewsQuery(id)`. Renderizar reseñas reales de la DB. Eliminar objeto demo. |
| `mobile/src/screens/consumer/CheckoutScreen.tsx` | `DEFAULT_BOARD` fallback hardcodeado. Mock id `00000000-0000-0000-0000-000000000001` para fallback. | Mock hardcodeado / Fallback débil | Consumir board real verificado. Conectar creación a la mutación real con invalidación global de boards y rentals. |
| `mobile/src/screens/consumer/MyRentalsScreen.tsx` | Contiene `FALLBACK_RENTALS` (11-68) con IDs `#rent-dem-1` y `#rent-dem-2`. Renderiza mocks si la DB tiene 0 alquileres. | Mock hardcodeado / Falta refetch | Eliminar `FALLBACK_RENTALS`. Consumir `useGetMyRentalsQuery()`. Agregar `useFocusEffect` con `refetch()` y `RefreshControl`. Mostrar `EmptyState` si no hay alquileres. |
| `mobile/src/screens/consumer/ClaimDetailScreen.tsx` | Contiene `MOCK_FALLBACK_CLAIM` (20-56). Si la DB no encuentra el reclamo, muestra datos inventados. | Mock hardcodeado / Falta query real | Consumir `useGetClaimByIdQuery(id)`. Manejar error 404 real si no existe. Eliminar `MOCK_FALLBACK_CLAIM`. |
| `mobile/src/screens/consumer/PointsScreen.tsx` | No refresca los puntos tras alquilar o dejar reseña si la pantalla ya estaba abierta. | Falta refetch on focus | Agregar `useFocusEffect` con `refetchLoyalty()` y `refetchPending()`. Agregar pull-to-refresh. |
| `mobile/src/screens/consumer/ProfileScreen.tsx` | Muestra datos del usuario exclusivamente desde el estado Redux local. Si cambian puntos o perfil en backend, no se actualiza. | Falta query real / Falta refetch | Agregar query `useGetMeQuery()` o `useGetProfileQuery()`. Agregar `useFocusEffect` para sincronizar datos del usuario logueado. |
| `mobile/src/screens/owner/MyBoardsScreen.tsx` | Contiene `OWNER_FALLBACK_BOARDS` (14-75). `deleteBoard` usa `boardsApi`, mientras que la lista usa `ownerApi` (desincronizado). | Mock hardcodeado / Desconexión tags / Falta refetch | Eliminar `OWNER_FALLBACK_BOARDS`. Unificar invalidación para que `deleteBoard` invalide la lista de tablas del owner. Agregar `useFocusEffect` con `refetch()` y `RefreshControl`. |
| `mobile/src/screens/owner/CreateBoardScreen.tsx` | `createBoard` pertenece a `boardsApi`, que no invalida `OwnerBoards` en `ownerApi`. La tabla creada no aparece en "Mis Tablas". | Falta invalidation cruzada | Configurar tag `MyBoards` / `OwnerBoards` en la mutación `createBoard` para que refresque inmediatamente `MyBoardsScreen`. |
| `mobile/src/screens/owner/EarningsScreen.tsx` | Contiene `MOCK_FALLBACK_EARNINGS` (19-68). Si el owner no tiene alquileres devueltos, muestra ganancias mock. | Mock hardcodeado / Falta refetch | Eliminar `MOCK_FALLBACK_EARNINGS`. Renderizar métricas reales basadas en alquileres reales de la DB (o estado $0 si no hay alquileres). Agregar `useFocusEffect`. |
| `mobile/src/screens/owner/RevisionsScreen.tsx` | Contiene `MOCK_FALLBACK_REVISIONS` (21-62). Muestra revisiones demo si no hay alquileres devueltos pendientes. | Mock hardcodeado / Falta refetch | Eliminar `MOCK_FALLBACK_REVISIONS`. Consumir `useGetPendingRevisionsQuery()`. Agregar `useFocusEffect` y `RefreshControl`. |
| `mobile/src/screens/agency/DeliveriesScreen.tsx` | Contiene `FALLBACK_DELIVERIES` (8-63) con firma y URLs mockeados. | Mock hardcodeado / Falta refetch | Eliminar `FALLBACK_DELIVERIES`. Consumir alquileres reales `PENDIENTE` / `ACTIVA` de la DB. Agregar `useFocusEffect` y `RefreshControl`. |
| `mobile/src/screens/agency/ReturnsScreen.tsx` | Contiene `FALLBACK_RETURNS` (8-63). Muestra alquileres en agua ficticios. | Mock hardcodeado / Falta refetch | Eliminar `FALLBACK_RETURNS`. Consumir alquileres reales `EN_CURSO`. Agregar `useFocusEffect` y `RefreshControl`. |
| `mobile/src/screens/agency/MediationScreen.tsx` | Contiene `MOCK_FALLBACK_MEDIATIONS` (20-61). Muestra reclamos ficticios. | Mock hardcodeado / Falta refetch | Eliminar `MOCK_FALLBACK_MEDIATIONS`. Consumir `useGetClaimsQuery()`. Agregar `useFocusEffect` y `RefreshControl`. |
| `mobile/src/screens/agency/AgencyDashboardScreen.tsx` | Objeto `metrics` de fallback hardcodeado (11-19) con multas y cantidades fijas. | Mock hardcodeado / Falta refetch | Eliminar objeto hardcodeado. Consumir `useGetMetricsQuery()` y `useGetScheduleQuery()`. Agregar `useFocusEffect`. |
| `mobile/src/api/boardsApi.ts` | Solo define tag `Board`. `createBoard` y `deleteBoard` solo invalidan `Board` en `boardsApi`. No existe `updateBoard`. | Falta invalidation cruzada / Endpoint faltante | Agregar tag `MyBoards`. Agregar endpoint `updateBoard`. Unificar tags o cruzar invalidación hacia `ownerApi`. |
| `mobile/src/api/rentalsApi.ts` | `createRental` y `cancelRental` solo invalidan `Rental` en `rentalsApi`. No invalidan `Board` (estado disponible/alquilada) ni `AgencyRental`. | Falta invalidation cruzada | Invalidar tags `Board`, `MyRentals`, `AgencyRental` y `OwnerRevisions` al crear o cancelar alquileres. |
| `mobile/src/api/ownerApi.ts` | `ownerApi` está aislado de `boardsApi` y `rentalsApi`. `approveRevision` no invalida `rentalsApi`. | Falta invalidation cruzada | Unificar arquitectura de tags para que aprobación o reclamos sincronicen `Rental` y `Board`. |
| `mobile/src/api/agencyApi.ts` | `checkIn` y `checkOut` solo invalidan `AgencyRental` y `AgencyMetrics`. No invalidan `rentalsApi` ni `boardsApi`. | Falta invalidation cruzada | Invalidar `Rental`, `MyRentals`, `Board` y `OwnerRevisions` al registrar check-in o check-out. |
| `mobile/src/api/claimsApi.ts` | `consumerRespond` y `agencyMediate` solo invalidan `['Claim']` (la lista), pero NO invalidan `{ type: 'Claim', id }`. | Falta invalidation por ID | Configurar `invalidatesTags: (_res, _err, arg) => [{ type: 'Claim', id: arg.claimId }, 'Claim']`. |
| `mobile/src/api/loyaltyApi.ts` | `createReview` no invalida la entidad `Board` en `boardsApi` (el promedio de calificación del catálogo queda desactualizado). | Falta invalidation cruzada | Invalidar `Board` y `BoardDetail` al publicar una reseña. |
| `mobile/src/store/index.ts` | 9 instancias separadas de `createApi` sin bus común de invalidación de tags. | Arquitectura fragmentada | Unificar en un `baseApi` central con `tagTypes` consolidados (`Board`, `MyBoards`, `Rental`, `MyRentals`, `Claim`, `User`, `Review`, `Points`, `AgencyRental`, `OwnerEarnings`, etc.) o implementar middleware de invalidación cruzada. |
| `mobile/src/screens/auth/LoginScreen.tsx` | Botones de desarrollo rápido (`handleDevLogin`) inyectan tokens ficticios (`dev-access-token`), causando 401 y logout automático en mutations reales. | Token mock / Sesión inválida | `handleDevLogin` debe ejecutar login real o generar sesión con tokens válidos del backend. Ejecutar `resetAllApis(dispatch)`. |
| `backend/src/modules/rentals/rentals.service.ts` | `createRental` no actualiza `Board.estado = ALQUILADA`. `cancelRental` no restaura `Board.estado = DISPONIBLE`. | Falta transición de estado en DB | Agregar `await prisma.board.update({ where: { id: board.id }, data: { estado: 'ALQUILADA' } })` al reservar y `estado: 'DISPONIBLE'` al cancelar. |
| `backend/src/modules/boards/boards.routes.ts` | Falta endpoint `GET /api/boards/mine`. | Endpoint faltante | Implementar `router.get('/mine', requireAuth, requireRole('OWNER'), boardsController.getMyBoards)`. |
| `backend/src/modules/rentals/rentals.routes.ts` | Faltan endpoints `GET /api/rentals/mine`, `POST /api/rentals/:id/retiro`, `POST /api/rentals/:id/devolucion`, `POST /api/rentals/:id/evaluacion`. | Endpoints faltantes / Desalineados | Crear rutas y controladores alias para conectar las acciones del contrato de negocio. |
| `backend/src/modules/claims/claims.routes.ts` | Falta `GET /api/claims/mine`, `POST /api/claims/:id/dispute`, `PATCH /api/claims/:id/resolve`. | Endpoints con rutas desalineadas | Crear endpoints con las rutas exactas solicitadas en el contrato de negocio. |
| `backend/src/app.ts` | Faltan montajes para `/api/users` y `/api/reviews`. | Rutas base no montadas | Montar `users.routes.ts` (`/api/users`) y `reviews.routes.ts` (`/api/reviews`) o exponerlos en sus controladores correspondientes. |
| `backend/prisma/seed.ts` | Solo crea 3 usuarios y 3 tablas. No crea alquileres en estados `PENDIENTE`, `EN_CURSO`, `DEVUELTA`, `CANCELADA`, ni claims, ni reviews. | Seed incompleto | Expandir seed con 1 Agencia, 3 Owners (5-8 tablas c/u), 5 Consumers, 10+ Rentals en diversos estados, 3 Claims y 20 Reseñas. |

---

## 3. Plan de Acción por Bloques

### Bloque 1 — Backend: Datos 100% Reales y Endpoints Completos
1. Implementar endpoints y alias faltantes:
   - `GET /api/boards/mine` (boards del owner autenticado).
   - `GET /api/rentals/mine` (alquileres del consumer autenticado).
   - `POST /api/rentals/:id/retiro` (check-in de agencia).
   - `POST /api/rentals/:id/devolucion` (check-out de agencia).
   - `POST /api/rentals/:id/evaluacion` (revisión de daños por owner).
   - `POST /api/claims`, `GET /api/claims/mine`, `POST /api/claims/:id/dispute`, `PATCH /api/claims/:id/resolve`.
   - `GET /api/users/me`, `PATCH /api/users/me`.
   - `POST /api/reviews`, `GET /api/boards/:id/reviews`.
2. Completar transiciones de estado en `rentals.service.ts`:
   - Al reservar: `board.estado = ALQUILADA`.
   - Al cancelar: `board.estado = DISPONIBLE`.
3. Desarrollar y ejecutar el seed realista (`prisma/seed.ts`):
   - 1 AGENCIA (`mostrador@surf.com`).
   - 3 OWNERs (`owner@surf.com`, `owner2@surf.com`, `owner3@surf.com`) con 5 a 8 tablas cada uno.
   - 5 CONSUMERs (`consumer@surf.com`, etc.).
   - 12+ Alquileres en estados `PENDIENTE`, `EN_CURSO`, `DEVUELTA`, `CANCELADA`, `PENDIENTE_REVISION`.
   - 3 Reclamos de seguro en estados `NOTIFICADO`, `DISPUTADO`, `RESUELTO_OWNER`.
   - 20 Reseñas verificadas.
4. Verificar con consultas SQL en MySQL (MCP) que los recuentos coincidan y correr tests backend.

### Bloque 2 — Frontend: RTK Query Unificado y Tags Cruzados
1. Unificar o consolidar la arquitectura de tags de RTK Query:
   - Declarar los `tagTypes` obligatorios:
     ```ts
     tagTypes: [
       'Board', 'BoardDetail', 'MyBoards',
       'Rental', 'MyRentals', 'RentalDetail',
       'Claim', 'MyClaims',
       'User', 'Me',
       'Review', 'BoardReviews',
       'Notification',
       'Points',
       'AgencyRental', 'AgencyMetrics',
       'OwnerEarnings', 'OwnerRevisions'
     ]
     ```
2. Asegurar que cada mutación invalide todos los tags correspondientes:
   - `createBoard` / `deleteBoard` / `updateBoard` $\rightarrow$ invalidan `Board`, `MyBoards`.
   - `createRental` $\rightarrow$ invalida `Rental`, `MyRentals`, `Board`, `AgencyRental`, `AgencyMetrics`, `Points`.
   - `cancelRental` $\rightarrow$ invalida `Rental`, `MyRentals`, `Board`, `AgencyRental`.
   - `checkIn` / `checkOut` $\rightarrow$ invalidan `Rental`, `MyRentals`, `Board`, `AgencyRental`, `AgencyMetrics`, `OwnerRevisions`.
   - `approveRevision` $\rightarrow$ invalida `OwnerRevisions`, `OwnerEarnings`, `Rental`, `Board`.
   - `createReview` $\rightarrow$ invalida `Review`, `BoardReviews`, `Board`, `Points`.
3. Configurar en la API:
   - `refetchOnReconnect: true`
   - `refetchOnMountOrArgChange: 30`
4. Optimistic updates en eliminaciones críticas (`deleteBoard`).

### Bloque 3 — Frontend: Eliminación de Mocks y Sincronización entre Pantallas
1. **Eliminar el 100% de los arrays y objetos mock**:
   - `FALLBACK_BOARDS` en `CatalogScreen.tsx`.
   - `FALLBACK_RENTALS` en `MyRentalsScreen.tsx`.
   - `OWNER_FALLBACK_BOARDS` en `MyBoardsScreen.tsx`.
   - `FALLBACK_DELIVERIES` en `DeliveriesScreen.tsx`.
   - `FALLBACK_RETURNS` en `ReturnsScreen.tsx`.
   - `MOCK_FALLBACK_MEDIATIONS` en `MediationScreen.tsx`.
   - `MOCK_FALLBACK_REVISIONS` en `RevisionsScreen.tsx`.
   - `MOCK_FALLBACK_EARNINGS` en `EarningsScreen.tsx`.
   - `MOCK_FALLBACK_CLAIM` en `ClaimDetailScreen.tsx`.
   - `DEFAULT_BOARD` y reseñas hardcodeadas en `BoardDetailScreen.tsx`.
2. Agregar en cada pantalla:
   - `useFocusEffect(useCallback(() => { refetch(); }, [refetch]))`
   - Pull-to-refresh con `<RefreshControl refreshing={isLoading} onRefresh={refetch} />`.
   - Estados visuales adecuados: `LoadingSkeleton`, `EmptyState` profesional cuando la lista esté vacía, y manejo de errores con botón de reintento.
3. Sincronización al cambiar rol y al hacer logout:
   - Llamar a `resetAllApis(dispatch)` tanto al cerrar sesión como al cambiar de rol en modo desarrollo.
   - En `LoginScreen`, vincular los botones dev a cuentas con tokens válidos del backend.

### Bloque 4 — Flujos Críticos End-to-End
1. **Contratar**: Selección de tabla $\rightarrow$ Checkout con validación $\rightarrow$ Creación en DB $\rightarrow$ Tabla pasa a ALQUILADA $\rightarrow$ Aparece inmediatamente en Mis Alquileres y en Entregas de Agencia.
2. **Cancelar**: Mis Alquileres $\rightarrow$ Cancelar con modal de reembolso $\rightarrow$ Estado pasa a CANCELADA en DB $\rightarrow$ Tabla vuelve a DISPONIBLE $\rightarrow$ Desaparece de Entregas.
3. **Aprobar/Rechazar Daño**: Devolución con daño $\rightarrow$ Owner revisa fotos $\rightarrow$ Aprobación o Disputa $\rightarrow$ Actualización financiera y de estado en DB.

### Bloque 5 — Verificación E2E con Tests y Capturas Playwright
1. Test de integración de extremo a extremo en backend (`backend/src/modules/rentals/__tests__/flow.test.ts`).
2. Test Playwright en Expo Web verificando creación de tabla, visualización cruzada en catálogo, contratación, actualización de estado en Mis Alquileres y cancelación con liberación de tabla.
3. Generación del reporte final `/docs/VERIFICACION-FLUJOS.md`.
