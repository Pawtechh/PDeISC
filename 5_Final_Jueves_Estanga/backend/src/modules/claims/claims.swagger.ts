/**
 * @openapi
 * tags:
 *   name: Claims
 *   description: Máquina de estados de reclamos de seguros de tablas, plazo de 24h (silencio=aceptación), mediación de agencia y cobro sobre pre-autorización
 */

/**
 * @openapi
 * /api/claims:
 *   post:
 *     summary: Crear un nuevo reclamo formal de daño en tabla (Owner o Agencia)
 *     tags: [Claims]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rentalId, descripcion, fotosDano, montoReclamado]
 *             properties:
 *               rentalId:
 *                 type: string
 *                 format: uuid
 *               descripcion:
 *                 type: string
 *                 example: "Fisura longitudinal en el riel izquierdo con filtración de agua salada"
 *               fotosDano:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *               montoReclamado:
 *                 type: number
 *                 example: 18000
 *               presupuestoReparacionUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reclamo creado en estado NOTIFICADO y plazo de 24 horas iniciado
 */

/**
 * @openapi
 * /api/claims:
 *   get:
 *     summary: Listar reclamos según el rol (Consumer sus reclamos, Owner sus tablas, Agencia todos)
 *     tags: [Claims]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de reclamos con horas restantes para disputa
 */

/**
 * @openapi
 * /api/claims/{id}:
 *   get:
 *     summary: Obtener detalle completo de un reclamo por ID
 *     tags: [Claims]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalle del reclamo con fotos de retiro vs devolución y countdown
 */

/**
 * @openapi
 * /api/claims/{id}/respond:
 *   post:
 *     summary: Respuesta del consumidor al reclamo dentro de 24h (Aceptar responsabilidad o Disputar con descargo)
 *     tags: [Claims]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accion]
 *             properties:
 *               accion:
 *                 type: string
 *                 enum: [ACEPTAR, DISPUTAR]
 *               motivoDisputa:
 *                 type: string
 *               fotosDescargo:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Reclamo aceptado (cobra pre-auth) o pasado a EN_MEDIACION
 */

/**
 * @openapi
 * /api/claims/{id}/mediate:
 *   post:
 *     summary: Dictamen de mediación arbitral de la Agencia (RESUELTO_OWNER o RESUELTO_CONSUMER)
 *     tags: [Claims]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [resolucion, resolucionAgencia]
 *             properties:
 *               resolucion:
 *                 type: string
 *                 enum: [RESUELTO_OWNER, RESUELTO_CONSUMER]
 *               resolucionAgencia:
 *                 type: string
 *                 example: "Inspeccionadas fotos de entrega: la fisura no existía en mostrador. Se valida reclamo."
 *               montoAprobado:
 *                 type: number
 *     responses:
 *       200:
 *         description: Laudo arbitral ejecutado con liberación de hold o débito
 */
