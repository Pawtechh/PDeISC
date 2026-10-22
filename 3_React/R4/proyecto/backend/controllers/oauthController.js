// controllers/oauthController.js
// Al finalizar el flujo de Passport (req.user ya viene poblado por la
// estrategia correspondiente), generamos nuestro propio JWT y redirigimos
// al frontend con el token como query param, igual que un login clásico.
const { generateToken } = require('./authController');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function callbackExitoso(req, res) {
  const token = generateToken(req.user);
  // El frontend debe leer "token" de la URL en la ruta /oauth/callback y guardarlo.
  res.redirect(`${FRONTEND_URL}/oauth/callback?token=${token}`);
}

function callbackFallido(req, res) {
  res.redirect(`${FRONTEND_URL}/login?error=oauth`);
}

module.exports = { callbackExitoso, callbackFallido };
