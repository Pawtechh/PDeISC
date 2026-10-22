/**
 * @openapi
 * tags:
 *   name: Legal
 *   description: Arquitectura legal, catálogo de 13 documentos, validación de hashes SHA-256 y firma digital con auditoría (Ley 25.506)
 */

/**
 * @openapi
 * /api/legal/documents:
 *   get:
 *     summary: Listar los 13 documentos legales con metadatos y hashes criptográficos SHA-256
 *     tags: [Legal]
 *     responses:
 *       200:
 *         description: Lista completa de documentos legales con títulos, categorías, versiones y hashes
 */

/**
 * @openapi
 * /api/legal/documents/{slug}:
 *   get:
 *     summary: Obtener el contenido íntegro en Markdown y hash SHA-256 de un documento por su slug
 *     tags: [Legal]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: "terminos-y-condiciones"
 *     responses:
 *       200:
 *         description: Documento legal con contenido Markdown, metadatos y hash
 *       404:
 *         description: Documento no encontrado
 */

/**
 * @openapi
 * /api/legal/sign:
 *   post:
 *     summary: Registrar firma digital o electrónica con auditoría bajo Ley Nacional 25.506
 *     tags: [Legal]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentSlug, documentHash]
 *             properties:
 *               documentSlug:
 *                 type: string
 *                 example: "terminos-y-condiciones"
 *               documentHash:
 *                 type: string
 *                 example: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
 *               rentalId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               signatureData:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Firma registrada con certificado y token de auditoría
 *       400:
 *         description: Hash mismatch (integridad vulnerada) o datos inválidos
 */

/**
 * @openapi
 * /api/legal/verify/{auditToken}:
 *   get:
 *     summary: Verificar públicamente la validez, integridad y trazabilidad de una firma por su auditToken
 *     tags: [Legal]
 *     parameters:
 *       - in: path
 *         name: auditToken
 *         required: true
 *         schema:
 *           type: string
 *           example: "SRMDP-AUDIT-A1B2C3D4E5F6"
 *     responses:
 *       200:
 *         description: Estado de verificación, datos del firmante, timestamp e integridad del documento
 *       404:
 *         description: Firma no encontrada
 */

/**
 * @openapi
 * /api/legal/audit/{id}:
 *   get:
 *     summary: Obtener certificado formal de auditoría legal
 *     tags: [Legal]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificado de auditoría para peritajes
 */

/**
 * @openapi
 * /api/legal/rental/{rentalId}/contract:
 *   get:
 *     summary: Generar y descargar contrato individual de locación compilado con datos de reserva y hash
 *     tags: [Legal]
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
 *         description: Contrato generado en Markdown con hash de integridad
 */
