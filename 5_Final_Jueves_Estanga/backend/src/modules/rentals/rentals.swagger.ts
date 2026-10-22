/**
 * @openapi
 * tags:
 *   name: Rentals
 *   description: Cotización, reserva, consulta y cancelación escalonada de alquileres de tablas
 */

/**
 * @openapi
 * /api/rentals/quote:
 *   post:
 *     summary: Cotizar alquiler con descuentos (25% día completo, 10% anticipada, puntos)
 *     tags: [Rentals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [boardId, horas, fechaInicio]
 *             properties:
 *               boardId:
 *                 type: string
 *                 format: uuid
 *               horas:
 *                 type: integer
 *                 example: 8
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *               puntosUsados:
 *                 type: integer
 *                 example: 100
 *               incluyeSeguro:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Cotización calculada exitosamente
 *       400:
 *         description: Parámetros inválidos o fuera de horario operativo (06:00 a 21:00)
 */

/**
 * @openapi
 * /api/rentals:
 *   post:
 *     summary: Crear reserva de alquiler de tabla
 *     tags: [Rentals]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [boardId, horas, fechaInicio]
 *             properties:
 *               boardId:
 *                 type: string
 *                 format: uuid
 *               horas:
 *                 type: integer
 *                 example: 4
 *               fechaInicio:
 *                 type: string
 *                 format: date-time
 *               puntosUsados:
 *                 type: integer
 *                 default: 0
 *               incluyeSeguro:
 *                 type: boolean
 *                 default: false
 *               versionTerminos:
 *                 type: string
 *                 default: "1.0"
 *     responses:
 *       201:
 *         description: Alquiler creado exitosamente
 *       409:
 *         description: Conflicto de horario con otra reserva
 */

/**
 * @openapi
 * /api/rentals/my:
 *   get:
 *     summary: Listar alquileres del usuario autenticado
 *     tags: [Rentals]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alquileres
 */

/**
 * @openapi
 * /api/rentals/{id}/cancel:
 *   post:
 *     summary: Cancelar alquiler aplicando política de reembolso escalonada
 *     tags: [Rentals]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [motivo]
 *             properties:
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alquiler cancelado con desglose del reembolso aplicado
 */
