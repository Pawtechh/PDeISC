/**
 * @openapi
 * tags:
 *   name: Loyalty
 *   description: Programa de fidelización de puntos (10 pts/hora, 12 meses vigencia, canje de descuentos) y reseñas 100% verificadas
 */

/**
 * @openapi
 * /api/loyalty/balance:
 *   get:
 *     summary: Obtener saldo de puntos, nivel de rider, vencimiento y puntos de sanción
 *     tags: [Loyalty]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Saldo de puntos, nivel, equivalencia en pesos e historial
 */

/**
 * @openapi
 * /api/loyalty/redeem:
 *   post:
 *     summary: Calcular y validar descuento en pesos ARS por canje de puntos
 *     tags: [Loyalty]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [puntos]
 *             properties:
 *               puntos:
 *                 type: integer
 *                 minimum: 50
 *                 example: 100
 *     responses:
 *       200:
 *         description: Descuento aplicable en ARS y saldo remanente
 */

/**
 * @openapi
 * /api/loyalty/reviews:
 *   post:
 *     summary: Emitir reseña verificada para un alquiler completado (otorga +20 pts bonus)
 *     tags: [Loyalty]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentalId, calificacion, comentario]
 *             properties:
 *               rentalId:
 *                 type: string
 *                 format: uuid
 *               calificacion:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comentario:
 *                 type: string
 *                 example: "Excelente tabla para olas de Playa Grande. Rápida y en perfecto estado."
 *     responses:
 *       201:
 *         description: Reseña verificada creada y puntos bonus acreditados
 *       400:
 *         description: El alquiler no está completado
 *       409:
 *         description: Ya existe una reseña para este alquiler
 */

/**
 * @openapi
 * /api/loyalty/reviews/board/{boardId}:
 *   get:
 *     summary: Obtener todas las reseñas verificadas de una tabla con promedio y distribución
 *     tags: [Loyalty]
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Promedio de estrellas, desglose y listado de reseñas
 */
