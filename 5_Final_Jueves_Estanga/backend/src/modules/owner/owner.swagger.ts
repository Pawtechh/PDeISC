/**
 * @openapi
 * tags:
 *   name: Owner
 *   description: Panel de Propietario de Tablas (Métricas al 95%, Suscripción $1000/mes, Ciclo 45 días, Comparador de Fotos)
 */

/**
 * @openapi
 * /api/owner/boards:
 *   get:
 *     summary: Obtener tablas del owner con cálculo de ciclo de mantenimiento de 45 días
 *     tags: [Owner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tablas con estado de mantenimiento y métricas de alquiler
 *       403:
 *         description: Requiere rol OWNER
 */

/**
 * @openapi
 * /api/owner/earnings:
 *   get:
 *     summary: Obtener desglose de ganancias (95% owner / 5% agencia) y estado de suscripción
 *     tags: [Owner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen financiero, liquidaciones acumuladas y meses bonificados
 *       403:
 *         description: Requiere rol OWNER
 */

/**
 * @openapi
 * /api/owner/payout:
 *   post:
 *     summary: Solicitar liquidación o extracción de saldo a CBU / Alias
 *     tags: [Owner]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [monto, cbuAlias]
 *             properties:
 *               monto:
 *                 type: number
 *                 minimum: 1000
 *                 example: 50000
 *               cbuAlias:
 *                 type: string
 *                 example: "SURF.MDP.BANCO"
 *     responses:
 *       200:
 *         description: Transferencia en proceso con código de seguimiento
 *       400:
 *         description: Saldo insuficiente o monto inválido
 */

/**
 * @openapi
 * /api/owner/rentals/pending-revisions:
 *   get:
 *     summary: Obtener alquileres devueltos pendientes de ratificación de estado (cuenta regresiva 24h)
 *     tags: [Owner]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Alquileres devueltos con horas restantes antes de aceptación tácita
 */

/**
 * @openapi
 * /api/owner/rentals/{rentalId}/inspection:
 *   get:
 *     summary: Obtener detalle comparativo de fotos (fotosRetiro vs fotosDevolucion) para inspección
 *     tags: [Owner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rentalId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Fotos de entrega y devolución para el slider de comparación
 */

/**
 * @openapi
 * /api/owner/boards/{boardId}/maintenance:
 *   post:
 *     summary: Registrar mantenimiento preventivo de 45 días completado
 *     tags: [Owner]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notas:
 *                 type: string
 *               piezasReemplazadas:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Ciclo renovado por 45 días y tabla habilitada
 */
