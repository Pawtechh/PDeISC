/**
 * @openapi
 * tags:
 *   name: Boards
 *   description: Catálogo y administración de tablas de surf (CRUD, filtros, disponibilidad)
 */

/**
 * @openapi
 * /boards:
 *   get:
 *     summary: Catálogo público de tablas disponibles con filtros y paginación
 *     tags: [Boards]
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Tipo de tabla (Shortboard, Longboard, Funboard, Fish, etc.)
 *       - in: query
 *         name: precioMin
 *         schema:
 *           type: number
 *       - in: query
 *         name: precioMax
 *         schema:
 *           type: number
 *       - in: query
 *         name: orden
 *         schema:
 *           type: string
 *           enum: [precio_asc, precio_desc, recientes]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista paginada de tablas
 */

/**
 * @openapi
 * /boards/{id}:
 *   get:
 *     summary: Obtiene el detalle de una tabla con sus reseñas y calificación
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalle de la tabla
 *       404:
 *         description: Tabla no encontrada
 */

/**
 * @openapi
 * /boards/{id}/availability:
 *   get:
 *     summary: Disponibilidad de franjas horarias de los próximos 7 días
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Franjas horarias disponibles
 */

/**
 * @openapi
 * /boards:
 *   post:
 *     summary: Publica una nueva tabla (Solo rol OWNER o AGENCIA)
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [titulo, marca, modelo, medidas, tipoTabla, precioHora, valorTasadoUsd, fotos]
 *             properties:
 *               titulo:
 *                 type: string
 *                 example: Classic Nose Rider 9'2
 *               marca:
 *                 type: string
 *                 example: UVA
 *               modelo:
 *                 type: string
 *                 example: Classic Nose Rider
 *               medidas:
 *                 type: string
 *                 example: 9'2 x 23 x 3
 *               tipoTabla:
 *                 type: string
 *                 enum: [Shortboard, Longboard, Funboard, Fish, Bodyboard, SUP]
 *               precioHora:
 *                 type: number
 *                 example: 4500
 *               valorTasadoUsd:
 *                 type: number
 *                 example: 450
 *               fotos:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Tabla creada exitosamente
 *       409:
 *         description: Tabla duplicada (mismo owner, marca, modelo y medidas)
 */

/**
 * @openapi
 * /boards/{id}:
 *   patch:
 *     summary: Modifica una tabla existente (Solo owner dueño o agencia)
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tabla actualizada
 *       403:
 *         description: No autorizado
 */

/**
 * @openapi
 * /boards/{id}:
 *   delete:
 *     summary: Elimina una tabla (Solo owner dueño o agencia)
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tabla eliminada
 *       403:
 *         description: No autorizado
 */
export const boardsSwagger = {};
