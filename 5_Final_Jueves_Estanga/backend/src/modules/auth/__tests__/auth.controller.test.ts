import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../app';
import { prisma } from '../../../config/prisma';
import { Role } from '@prisma/client';
import { JWT_CONFIG } from '../../../config/jwt';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe('Auth Controller & Middlewares HTTP Tests', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation & Errors', () => {
    it('should return 400 VALIDATION_ERROR with details when payload is incomplete', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'bad-email' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body).toHaveProperty('details');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should return 401 UNAUTHORIZED on GET /api/auth/me without authorization header', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('should return 200 with user profile on GET /api/auth/me with valid Bearer token', async () => {
      const token = jwt.sign(
        { id: 'user-id-1', email: 'lucas@surf.com', role: Role.CONSUMER },
        JWT_CONFIG.accessSecret
      );

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id-1',
        email: 'lucas@surf.com',
        role: Role.CONSUMER,
        nombre: 'Lucas',
        activo: true,
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('lucas@surf.com');
      expect(res.body.data.user.role).toBe('CONSUMER');
    });

    it('should return 429 RATE_LIMITED after 5 failed login attempts within 15min', async () => {
      const ipApp = createApp();
      const failPayload = { email: 'rate-limit-test@surf.com', password: 'Wrong' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(ipApp).post('/api/auth/login').send(failPayload);
      }

      // 6th attempt should be blocked
      const blockedRes = await request(ipApp).post('/api/auth/login').send(failPayload);

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.code).toBe('RATE_LIMITED');
      expect(blockedRes.body.message).toContain('Demasiados intentos fallidos');
    });
  });
});
