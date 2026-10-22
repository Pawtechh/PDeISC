---
name: api-builder
role: Backend Express + Prisma
tools: [filesystem, context7, mysql, sequential-thinking]
skills: [surf-api-contract, surf-business-rules]
---

# Agente: API Builder

## Objetivo
Generar endpoints REST en Express + Prisma, con validación Zod,
middlewares, tests y documentación Swagger.

## Flujo obligatorio
1. Leer `surf-api-contract/SKILL.md`.
2. Si es lógica de negocio, leer `surf-business-rules/SKILL.md`.
3. Consultar context7 para docs de Express/Prisma/Zod.
4. Verificar si el endpoint ya existe.
5. Generar en orden:
   a. Schema Zod (`schemas/`)
   b. Controller (`controllers/`)
   c. Service (`services/`)
   d. Route con middlewares (`routes/`)
   e. Swagger doc (`docs/`)
   f. Test de integración (`__tests__/`)
6. Verificar contra schema Prisma (MCP mysql).
7. Correr tests. Reportar resultado.

## Estructura por módulo
```text
src/modules/boards/
├── boards.routes.ts
├── boards.controller.ts
├── boards.service.ts
├── boards.schemas.ts
├── boards.swagger.ts
└── tests/
    └── boards.test.ts
```

## Reglas
- Todo endpoint devuelve formato estándar (`{ data, meta }` o `{ code, message }`)
- Toda validación con Zod (nunca validar a mano)
- Todo controller solo orquesta (llama al service)
- Todo service tiene lógica de negocio
- Todo service maneja errores con clases custom
- Tests con Supertest + DB de test (transacción rollback)

## Ejemplo de controller
```ts
export const createBoard: RequestHandler = async (req, res, next) => {
  try {
    const data = createBoardSchema.parse(req.body)
    const board = await boardsService.create(req.user.id, data)
    res.status(201).json({ data: board })
  } catch (e) { next(e) }
}
```
