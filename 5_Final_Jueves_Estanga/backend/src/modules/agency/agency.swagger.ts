/**
 * @openapi
 * tags:
 *   name: Agency
 *   description: Panel operativo del mostrador de la Sede Central Playa Grande (Check-in, Check-out, Multa por Salitre)
 */

/**
 * @openapi
 * /api/agency/checkin:
 *   post:
 *     summary: Procesar entrega física de tabla en sede (inspección de retiro y firma digital)
 *     tags: [Agency]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentalId, fotosRetiro, firmaRetiroUrl, dniVerificado]
 *             properties:
 *               rentalId:
 *                 type: string
 *                 format: uuid
 *               fotosRetiro:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               firmaRetiroUrl:
 *                 type: string
 *               dniVerificado:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Entrega completada y tabla marcada EN_CURSO
 *       403:
 *         description: Requiere rol AGENCIA
 */

/**
 * @openapi
 * /api/agency/checkout:
 *   post:
 *     summary: Procesar devolución física en sede (control de salitre con multa de $10.000 y revisión de daño)
 *     tags: [Agency]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentalId, fotosDevolucion, lavada]
 *             properties:
 *               rentalId:
 *                 type: string
 *                 format: uuid
 *               fotosDevolucion:
 *                 type: array
 *                 items:
 *                   type: string
 *               lavada:
 *                 type: boolean
 *                 description: true si fue lavada con agua dulce; false aplica multa de $10.000 ARS
 *               tieneDanio:
 *                 type: boolean
 *               descripcionDanio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Devolución procesada
 */

/**
 * @openapi
 * /api/agency/schedule:
 *   get:
 *     summary: Obtener grilla operativa del día en Sede Central Playa Grande
 *     tags: [Agency]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alquileres programados para hoy
 */

/**
 * @openapi
 * /api/agency/metrics:
 *   get:
 *     summary: Métricas del mostrador de la agencia (tablas en agua, multas por salitre, recaudación)
 *     tags: [Agency]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Métricas operativas
 */
