import express, { Application, Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger';
import { errorHandler } from './middlewares/errorHandler';
import { sanitizeInputs } from './middlewares/sanitize';
import { validateUploadedFiles } from './middlewares/fileValidator';
import { logger } from './utils/logger';

import authRoutes from './modules/auth/auth.routes';
import boardsRoutes from './modules/boards/boards.routes';
import rentalsRoutes from './modules/rentals/rentals.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import agencyRoutes from './modules/agency/agency.routes';
import ownerRoutes from './modules/owner/owner.routes';
import claimsRoutes from './modules/claims/claims.routes';
import loyaltyRoutes from './modules/loyalty/loyalty.routes';
import legalRoutes from './modules/legal/legal.routes';
import usersRoutes from './modules/users/users.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';
import weatherRoutes from './modules/weather/weather.routes';

export const createApp = (): Application => {
  const app = express();

  // 1. Cabeceras de Seguridad HTTP con Helmet (Punto 18)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permitir SPA React Native Web assets
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. CORS y Cabeceras de Túnel
  app.use(cors());
  app.use((_req: Request, res: Response, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    // Prevenir MIME type sniffing y clickjacking
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
  });

  // 3. Rate Limiter Global para la API (Punto 11)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000, // Máximo 1000 peticiones por ventana de 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes desde esta IP, por favor intente nuevamente en unos minutos.',
      timestamp: new Date().toISOString(),
    },
  });
  app.use('/api/', apiLimiter);

  // 4. Body Parsers con límite estricto de payload
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 5. Sanitización contra XSS y Validación de Archivos (Puntos 15 y 16)
  app.use(sanitizeInputs);
  app.use(validateUploadedFiles);

  // 6. Request logger
  app.use((req: Request, _res: Response, next) => {
    logger.debug(`${req.method} ${req.url}`);
    next();
  });

  // 7. Swagger Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // 8. Archivos estáticos y aplicación web de producción
  const publicPath = path.resolve(__dirname, '../public');
  const mobileDistPath = path.resolve(__dirname, '../../mobile/dist');

  // Recursos del backend: imágenes de tablas, manual operativo y portal de desarrollo
  app.use('/images', express.static(path.join(publicPath, 'images')));
  app.use('/manual', express.static(path.join(publicPath, 'manual')));
  app.get('/portal', (_req: Request, res: Response) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // Aplicación React Native Web compilada (SPA)
  app.use(express.static(mobileDistPath));
  app.use(express.static(publicPath));

  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(mobileDistPath, 'index.html'));
  });

  // Puente de Callback para Autenticación OAuth (Expo Web / Mobile Web)
  app.get(['/auth/callback', '/auth/callback/'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Completando autenticación — Surf Rental MDP</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #090C10;
      color: #F1F5F9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .box {
      text-align: center;
      padding: 32px 28px;
      background: #121824;
      border: 1px solid rgba(212, 175, 55, 0.25);
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(0,0,0,0.6);
      max-width: 400px;
      width: 100%;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(212, 175, 55, 0.2);
      border-top-color: #00E5FF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
    p { font-size: 13px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <h2>Completando inicio de sesión...</h2>
    <p>Esta ventana se cerrará automáticamente.</p>
  </div>
  <script>
    (function() {
      var currentUrl = window.location.href;
      var handleKey = 'ExpoWebBrowserRedirectHandle';
      var handle = null;
      try {
        handle = window.localStorage.getItem(handleKey);
        if (handle) {
          window.localStorage.setItem('ExpoWebBrowser_OriginUrl_' + handle, currentUrl);
        }
      } catch (e) {
        console.warn('localStorage access failed:', e);
      }

      var parentWin = window.opener || window.parent;
      if (parentWin && parentWin !== window) {
        try {
          parentWin.postMessage({ url: currentUrl, expoSender: handle }, '*');
        } catch (e) {}
        try {
          parentWin.postMessage({ type: 'expo-auth-session', url: currentUrl }, '*');
        } catch (e) {}
      }

      setTimeout(function() {
        try {
          window.close();
        } catch (e) {}
      }, 350);
    })();
  </script>
</body>
</html>`);
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'surf-rental-backend',
    });
  });

  // Módulos de la API
  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardsRoutes);
  app.use('/api/rentals', rentalsRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/agency', agencyRoutes);
  app.use('/api/owner', ownerRoutes);
  app.use('/api/claims', claimsRoutes);
  app.use('/api/loyalty', loyaltyRoutes);
  app.use('/api/legal', legalRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/weather', weatherRoutes);

  // Wildcard fallback para React Native Web SPA (previene 404 en refresh de rutas cliente)
  app.get('*', (req: Request, res: Response, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/images') ||
      req.path.startsWith('/manual') ||
      req.path.startsWith('/api-docs')
    ) {
      return next();
    }
    res.sendFile(path.join(mobileDistPath, 'index.html'));
  });

  // Middleware global de errores
  app.use(errorHandler);

  return app;
};
