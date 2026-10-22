/**
 * @openapi
 * tags:
 *   name: Payments
 *   description: Integración con MercadoPago (Checkout Pro, Pre-autorización de daños, Webhook IPN)
 */

/**
 * @openapi
 * /api/payments/preference:
 *   post:
 *     summary: Crear preferencia de pago en MercadoPago para un alquiler
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentalId]
 *             properties:
 *               rentalId:
 *                 type: string
 *                 format: uuid
 *               installments:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Preferencia creada con URLs de checkout (init_point)
 *       404:
 *         description: Alquiler no encontrado
 */

/**
 * @openapi
 * /api/payments/pre-auth:
 *   post:
 *     summary: Generar pre-autorización de garantía de daño con token de tarjeta
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentalId, cardToken]
 *             properties:
 *               rentalId:
 *                 type: string
 *                 format: uuid
 *               cardToken:
 *                 type: string
 *               montoGarantia:
 *                 type: number
 *     responses:
 *       201:
 *         description: Pre-autorización registrada
 */

/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     summary: Webhook IPN para notificaciones automáticas de MercadoPago
 *     tags: [Payments]
 *     parameters:
 *       - in: header
 *         name: x-signature
 *         schema:
 *           type: string
 *       - in: header
 *         name: x-request-id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notificación procesada con idempotencia
 */
