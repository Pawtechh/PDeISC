# REGLAS GLOBALES — Surf Rental Mar del Plata

## Contexto del proyecto
App mobile (React Native + Expo) + backend (Node + Express + Prisma + MySQL) para alquiler
de tablas de surf en Mar del Plata. 3 roles: AGENCIA, OWNER, CONSUMER.
Trabajo práctico final de carrera. Requiere APK funcional, documentación completa y 3 OAuth.

## Código
- TypeScript estricto en TODO el proyecto. Prohibido `any`.
- Zod para validación en front y back. Un schema por entidad.
- Prisma como único ORM. Nunca SQL crudo (excepto reportes complejos justificados).
- Nombres de archivos en kebab-case, componentes en PascalCase, funciones en camelCase.
- Dominio en español (Tabla, Alquiler), código en inglés.
- Sin comentarios obvios. Solo comentar lógica no evidente.
- Máximo 200 líneas por archivo. Si supera, dividir.

## Diseño (CRÍTICO)
- TODO color, spacing, tipografía sale del design-system. NUNCA hardcodear.
- Todo componente nuevo se construye sobre los primitives existentes.
- Obligatorio screenshot antes de aprobar cualquier UI.
- Iterar hasta que se vea profesional. Nada de "Bootstrap genérico".
- Animaciones SIEMPRE con Moti o Reanimated 3. Nunca Animated legacy.
- Imágenes con Expo Image + blurhash placeholder.
- Listas >20 items SIEMPRE con FlashList.

## Backend
- Arquitectura: routes → controllers → services → repositories (Prisma).
- Middlewares obligatorios: requireAuth, requireRole, requireOwnership, validateBody, errorHandler.
- Errores estandarizados: { code, message, details?, timestamp }.
- Logs con Winston. Nada de console.log en producción.
- Todo endpoint documentado en Swagger antes de implementarlo.
- Toda respuesta paginada: { data, meta: { page, limit, total } }.

## Reglas de negocio (NO NEGOCIABLES)
- Comisión agencia: 5% del alquiler. Owner: 95%.
- Suscripción owner: $1000/mes (gratis primeros 3 meses).
- Multa por no lavar tabla: $10.000.
- Cancelación escalonada: +72h=100%, 24-72h=70%, 6-24h=40%, -6h=0%.
- Edad mínima consumer: 18 años.
- Horario: 6am-9pm. Una sede. Sin delivery.
- Descuento día completo: 25%. Descuento anticipado (+7 días): 10%.
- Mantenimiento owner cada 45 días (notificación automática).
- Tablas duplicadas: se elimina la segunda.
- Póliza del owner obligatoria. Si no la tiene, agencia asigna una (% del valor tasado).
- Silencio del consumer tras 24h notificado = aceptación de daño.

## Testing
- Servicios backend: cobertura mínima 70%.
- Controllers: mínimo 1 test de integración por endpoint.
- Componentes RN: mínimo test de render por pantalla.
- Reglas de negocio (pricing, puntos, multas): tests exhaustivos con casos borde.

## Comportamiento de agentes
- SIEMPRE leer `design-system.md` antes de generar UI.
- SIEMPRE leer skills relacionadas antes de escribir código del dominio.
- SIEMPRE usar context7 MCP para docs de librerías externas.
- NUNCA inventar APIs. Si no sabés, consultar context7.
- Antes de crear un archivo, verificar que no exista algo similar.
- Después de generar UI, pedir screenshot y auto-criticar.

## Idioma
- Comentarios y código: inglés.
- Strings de UI, mensajes de error al usuario: español (es-AR).
- Nombres de dominio en DB: español cuando sea natural (ej: `tabla`, `alquiler` → inglés en código).
