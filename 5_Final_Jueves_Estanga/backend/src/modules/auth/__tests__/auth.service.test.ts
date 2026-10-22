import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service';
import { prisma } from '../../../config/prisma';
import { Role } from '@prisma/client';
import { JWT_CONFIG } from '../../../config/jwt';

// Mock de prisma
jest.mock('../../../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe('AuthService Unit Tests', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('register', () => {
    const registerInput = {
      email: 'nuevo@surf.com',
      password: 'Password123!',
      nombre: 'Nuevo Surfista',
      dni: '38123456',
    };

    it('should register a new user with CONSUMER role and return tokens', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null) // email not taken
        .mockResolvedValueOnce(null); // dni not taken

      const mockCreatedUser = {
        id: 'user-uuid-1',
        email: 'nuevo@surf.com',
        nombre: 'Nuevo Surfista',
        role: Role.CONSUMER,
        dni: '38123456',
        puntos: 0,
        createdAt: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.register(registerInput);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'nuevo@surf.com' } });
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'nuevo@surf.com',
            role: Role.CONSUMER,
          }),
        })
      );
      expect(result.user.role).toBe(Role.CONSUMER);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should format nombreCompleto with nombre and apellido', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const mockCreatedUser = {
        id: 'user-uuid-2',
        email: 'lucas.p@surf.com',
        nombre: 'Lucas Peralta',
        role: Role.CONSUMER,
        dni: '38123457',
        puntos: 0,
        createdAt: new Date(),
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      await authService.register({
        email: 'lucas.p@surf.com',
        password: 'Password123!',
        nombre: 'Lucas',
        apellido: 'Peralta',
        dni: '38123457',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            nombre: 'Lucas Peralta',
          }),
        })
      );
    });

    it('should throw 409 EMAIL_ALREADY_EXISTS if email is taken', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'existing-id' });

      await expect(authService.register(registerInput)).rejects.toMatchObject({
        statusCode: 409,
        code: 'EMAIL_ALREADY_EXISTS',
      });
    });

    it('should throw 409 DNI_ALREADY_EXISTS if DNI is taken', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'existing-dni-id' });

      await expect(authService.register(registerInput)).rejects.toMatchObject({
        statusCode: 409,
        code: 'DNI_ALREADY_EXISTS',
      });
    });
  });

  describe('login', () => {
    it('should login and return user with tokens on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const mockUser = {
        id: 'user-uuid-1',
        email: 'surfista@surf.com',
        passwordHash: hashedPassword,
        nombre: 'Surfista',
        role: Role.CONSUMER,
        dni: '38123456',
        puntos: 50,
        activo: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.login({
        email: 'surfista@surf.com',
        password: 'Password123!',
      });

      expect(result.user.email).toBe('surfista@surf.com');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw 401 INVALID_CREDENTIALS on wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPassword!', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'surfista@surf.com',
        passwordHash: hashedPassword,
        activo: true,
      });

      await expect(
        authService.login({ email: 'surfista@surf.com', password: 'WrongPassword!' })
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });
    });

    it('should throw 403 ACCOUNT_DISABLED if user is inactive', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'surfista@surf.com',
        passwordHash: 'hash',
        activo: false,
      });

      await expect(
        authService.login({ email: 'surfista@surf.com', password: 'Password123!' })
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'ACCOUNT_DISABLED',
      });
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token and issue new pair', async () => {
      const validToken = jwt.sign(
        { id: 'user-uuid-1', email: 'test@surf.com', role: Role.CONSUMER },
        JWT_CONFIG.refreshSecret
      );

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'token-id-1',
        token: validToken,
        revoked: false,
        expiresAt: new Date(Date.now() + 1000000),
      });

      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@surf.com',
        role: Role.CONSUMER,
        activo: true,
      });
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.refresh(validToken);

      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-id-1' },
        data: { revoked: true },
      });
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should reject already revoked refresh token with 401', async () => {
      const validToken = jwt.sign(
        { id: 'user-uuid-1', email: 'test@surf.com', role: Role.CONSUMER },
        JWT_CONFIG.refreshSecret
      );

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'token-id-1',
        token: validToken,
        revoked: true, // ya revocado
        expiresAt: new Date(Date.now() + 1000000),
      });

      await expect(authService.refresh(validToken)).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
      });
    });
  });
});
