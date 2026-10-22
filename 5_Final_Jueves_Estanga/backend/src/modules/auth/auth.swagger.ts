/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación, sesiones JWT y recuperación de contraseñas
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Registra un nuevo usuario con rol CONSUMER
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, nombre, dni]
 *             properties:
 *               email:
 *                 type: string
 *                 example: surfista@mdp.com
 *               password:
 *                 type: string
 *                 example: ContraseñaSegura123
 *               nombre:
 *                 type: string
 *                 example: Lucas Peralta
 *               dni:
 *                 type: string
 *                 example: "38920194"
 *               telefono:
 *                 type: string
 *                 example: "+542235123456"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente con tokens
 *       400:
 *         description: Error de validación Zod
 *       409:
 *         description: Email o DNI ya existente
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Inicia sesión localmente (Rate limit 5 intentos / 15min)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: surfista@mdp.com
 *               password:
 *                 type: string
 *                 example: ContraseñaSegura123
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve usuario y tokens
 *       401:
 *         description: Credenciales inválidas
 *       429:
 *         description: Demasiados intentos fallidos (Rate limited)
 */

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Rota el refresh token y emite un nuevo accessToken de 15 minutos
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nuevos tokens generados
 *       401:
 *         description: Token inválido, revocado o expirado
 */

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Invalida el refresh token en la base de datos
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Retorna el perfil y rol del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *       401:
 *         description: No autorizado o token expirado
 */

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Solicita restablecimiento de contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Instrucciones enviadas al email
 */

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Establece nueva contraseña con token de recuperación
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *       400:
 *         description: Token inválido o expirado
 */
export const authSwagger = {};
