import { Router } from 'express';
import * as authController from './auth.controller';
import { validateBody } from '../../middlewares/validateBody';
import { requireAuth } from '../../middlewares/requireAuth';
import { loginRateLimiter } from '../../middlewares/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schemas';

import * as oauthController from './oauth.controller';

const router = Router();

// Rutas locales
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', loginRateLimiter, validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

// Rutas OAuth (Google, GitHub, Facebook, Apple)
router.get('/oauth/:provider/consent', oauthController.renderConsentScreen);
router.get('/oauth/:provider', oauthController.initiateOAuth);
router.get('/oauth/:provider/callback', oauthController.handleCallback);
router.post('/oauth/:provider/callback', oauthController.handleCallback);
router.post('/oauth/:provider/token', oauthController.exchangeOAuthToken);

export default router;
