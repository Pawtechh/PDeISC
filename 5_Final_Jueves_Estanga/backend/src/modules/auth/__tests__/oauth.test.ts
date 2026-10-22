import request from 'supertest';
import { createApp } from '../../../app';
import { OAuthService } from '../oauth.service';
import { prisma } from '../../../config/prisma';
import { Role, AuthProvider } from '@prisma/client';

jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  },
}));

describe('OAuth Service & Controllers Tests', () => {
  let oauthService: OAuthService;
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
    oauthService = new OAuthService();
  });

  describe('Authorization URLs Generation', () => {
    it('should generate valid Google auth URL with openid and email scopes', () => {
      const url = oauthService.getAuthorizationUrl('google');
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=');
      expect(url).toContain('response_type=code');
    });

    it('should generate valid Facebook auth URL', () => {
      const url = oauthService.getAuthorizationUrl('facebook');
      expect(url).toContain('https://www.facebook.com/v18.0/dialog/oauth');
    });

    it('should generate valid Apple auth URL', () => {
      const url = oauthService.getAuthorizationUrl('apple');
      expect(url).toContain('https://appleid.apple.com/auth/authorize');
    });
  });

  describe('handleOAuthUser Logic (Merge & Creation)', () => {
    const mockProfile = {
      id: 'google-sub-998877',
      email: 'rider.mdp@surf.com',
      name: 'Rider MDP',
      avatarUrl: 'https://avatar.url',
    };

    it('should create new user with CONSUMER role if neither oauthId nor email exists', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const createdUser = {
        id: 'new-user-1',
        email: 'rider.mdp@surf.com',
        nombre: 'Rider MDP',
        role: Role.CONSUMER,
        authProvider: AuthProvider.GOOGLE,
        oauthId: 'google-sub-998877',
      };
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await oauthService.handleOAuthUser('google', mockProfile);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'rider.mdp@surf.com',
            role: Role.CONSUMER,
            authProvider: AuthProvider.GOOGLE,
            oauthId: 'google-sub-998877',
          }),
        })
      );
      expect(result.isNew).toBe(true);
      expect(result.tokens).toHaveProperty('accessToken');
    });

    it('should MERGE and link account if user with same email already exists', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null); // not found by oauthId

      const existingLocalUser = {
        id: 'existing-user-1',
        email: 'rider.mdp@surf.com',
        nombre: 'Rider Registrado Local',
        role: Role.CONSUMER,
        authProvider: AuthProvider.LOCAL,
        activo: true,
      };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingLocalUser);

      const updatedUser = {
        ...existingLocalUser,
        oauthId: 'google-sub-998877',
        authProvider: AuthProvider.GOOGLE,
      };
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await oauthService.handleOAuthUser('google', mockProfile);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'existing-user-1' },
        data: {
          oauthId: 'google-sub-998877',
          authProvider: AuthProvider.GOOGLE,
        },
      });
      expect(result.merged).toBe(true);
      expect(result.isNew).toBe(false);
    });

    it('should return existing user without re-creating if oauthId matches', async () => {
      const existingOAuthUser = {
        id: 'user-already-linked',
        email: 'rider.mdp@surf.com',
        nombre: 'Rider',
        role: Role.CONSUMER,
        authProvider: AuthProvider.GOOGLE,
        oauthId: 'google-sub-998877',
        activo: true,
      };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(existingOAuthUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await oauthService.handleOAuthUser('google', mockProfile);

      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(result.isNew).toBe(false);
      expect(result.merged).toBe(false);
    });
  });

  describe('HTTP Endpoints /api/auth/oauth', () => {
    it('should return 400 on unsupported provider', async () => {
      const res = await request(app).get('/api/auth/oauth/twitter');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_PROVIDER');
    });

    it('should return JSON authUrl on GET /api/auth/oauth/google with Accept application/json', async () => {
      const res = await request(app)
        .get('/api/auth/oauth/google')
        .set('Accept', 'application/json');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('authUrl');
      expect(res.body.data.provider).toBe('google');
    });

    it('should authenticate user and return tokens on POST /api/auth/oauth/google/token', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const createdUser = {
        id: 'oauth-user-1',
        email: 'surfista.google@surfrental.mdp',
        nombre: 'Surfista GOOGLE',
        role: Role.CONSUMER,
        authProvider: AuthProvider.GOOGLE,
        oauthId: 'oauth-google-123456',
        activo: true,
      };
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .post('/api/auth/oauth/google/token')
        .send({ token: 'mock-token' });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
    });

    it('should serve OAuth popup bridge HTML on GET /auth/callback without 404', async () => {
      const res = await request(app).get('/auth/callback?code=mock-test-code');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('ExpoWebBrowserRedirectHandle');
      expect(res.text).toContain('postMessage');
    });

    it('should render authentic Google Sign-In panel on GET /api/auth/oauth/google/consent', async () => {
      const res = await request(app).get('/api/auth/oauth/google/consent?redirectUri=http://localhost:3000/auth/callback');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Acceder con Google');
      expect(res.text).toContain('Surf Rental Mar del Plata');
    });

    it('should render authentic GitHub Authorize panel on GET /api/auth/oauth/github/consent', async () => {
      const res = await request(app).get('/api/auth/oauth/github/consent?redirectUri=http://localhost:3000/auth/callback');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('Authorize Surf Rental MDP');
      expect(res.text).toContain('Authorize surf-rental-mdp');
    });
  });
});
