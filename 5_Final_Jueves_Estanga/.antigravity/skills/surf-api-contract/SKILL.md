---
name: surf-api-contract
description: Contrato de la API REST. Se activa al crear o consumir endpoints.
---

# API Contract

## Base
- Base URL: `/api`
- Auth: `Authorization: Bearer <accessToken>`
- Content-Type: `application/json`
- Versionado: header `X-API-Version: 1`

## Formato de respuesta

### Success
```json
{
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 47 }
}
```

### Error
```json
{
  "code": "RENTAL_NOT_FOUND",
  "message": "El alquiler no existe",
  "details": { "id": "abc" },
  "timestamp": "2026-10-09T12:00:00Z"
}
```

## Códigos de error

| Código | HTTP | Cuándo |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Body inválido |
| `UNAUTHORIZED` | 401 | Sin token o expirado |
| `FORBIDDEN` | 403 | Rol sin permiso |
| `NOT_FOUND` | 404 | Recurso inexistente |
| `CONFLICT` | 409 | Tabla duplicada, etc |
| `BUSINESS_ERROR` | 422 | Regla de negocio violada |
| `RATE_LIMITED` | 429 | Muchos requests |
| `SERVER_ERROR` | 500 | Error interno |

## Endpoints por módulo

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`
- `GET /auth/oauth/:provider` (google|facebook|apple)
- `GET /auth/oauth/:provider/callback`

### Boards
- `GET /boards` (público, filtros)
- `GET /boards/:id` (público)
- `GET /boards/:id/availability`
- `POST /boards` (OWNER)
- `PATCH /boards/:id` (OWNER dueño)
- `DELETE /boards/:id` (OWNER dueño)

### Rentals
- `POST /rentals` (CONSUMER)
- `GET /rentals/mine` (CONSUMER)
- `GET /rentals/:id` (según rol)
- `POST /rentals/:id/cancel` (CONSUMER)
- `POST /rentals/:id/retiro` (AGENCIA)
- `POST /rentals/:id/devolucion` (AGENCIA)
- `POST /rentals/:id/evaluacion` (OWNER)
- `POST /rentals/:id/extend` (CONSUMER)

### Claims
- `POST /claims` (OWNER)
- `GET /claims/:id` (según rol)
- `POST /claims/:id/dispute` (CONSUMER)
- `PATCH /claims/:id/resolve` (AGENCIA)
- `POST /claims/:id/charge` (sistema)

### Payments
- `POST /payments/preference` (crea preferencia MP)
- `POST /payments/webhook` (webhook MP)
- `GET /payments/mine` (CONSUMER)

### Contracts
- `POST /contracts/accept` (CONSUMER acepta T&C)
- `POST /contracts/:rentalId/sign` (firma digital)
- `GET /contracts/:rentalId/pdf`

### Reviews
- `POST /reviews` (CONSUMER)
- `GET /boards/:id/reviews`

### Notifications
- `GET /notifications/mine`
- `PATCH /notifications/:id/read`

### Admin/Agency
- `GET /agency/dashboard`
- `GET /agency/liquidaciones`
- `GET /agency/solicitudes`
- `GET /agency/top-tablas`

### Owner
- `GET /owner/boards`
- `GET /owner/rentals`
- `GET /owner/revisions`
- `GET /owner/earnings`
- `POST /owner/maintenance/:boardId`

### Consumer
- `GET /consumer/points`
- `GET /consumer/profile`
- `GET /consumer/rentals`

## Middlewares por endpoint
Todo endpoint especifica:
- `requireAuth`: sí/no
- `requireRole`: `[...]`
- `requireOwnership`: sí/no
- `validateBody`: schema Zod
- `rateLimit`: sí/no
