import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { JWT_CONFIG } from '../../config/jwt';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.schemas';
import { JwtPayload } from '../../types/auth';
import { AppError } from '../../middlewares/errorHandler';

export class AuthService {
  /**
   * Genera par de tokens JWT (Access 15m + Refresh 7d) y persiste el refresh en DB
   */
  private async generateTokens(user: { id: string; email: string; role: Role }) {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_CONFIG.accessSecret, {
      expiresIn: JWT_CONFIG.accessExpiresIn,
    });

    const refreshToken = jwt.sign({ ...payload, jti: randomUUID() }, JWT_CONFIG.refreshSecret, {
      expiresIn: JWT_CONFIG.refreshExpiresIn,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + JWT_CONFIG.refreshDays);

    // Guardar refresh token en la base de datos para trazabilidad y revocación
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_CONFIG.accessExpiresIn,
    };
  }

  /**
   * Registra un nuevo usuario con rol CONSUMER por defecto
   */
  async register(data: RegisterInput) {
    // Validar si el email ya está en uso
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingEmail) {
      throw new AppError('EMAIL_ALREADY_EXISTS', 'El email ya se encuentra registrado', 409);
    }

    // Validar si el DNI ya está en uso
    const existingDni = await prisma.user.findUnique({
      where: { dni: data.dni },
    });

    if (existingDni) {
      throw new AppError('DNI_ALREADY_EXISTS', 'El DNI ya se encuentra registrado', 409);
    }

    // Hash de contraseña con 12 rounds
    const passwordHash = await bcrypt.hash(data.password, JWT_CONFIG.bcryptRounds);

    const nombreCompleto = data.apellido
      ? `${data.nombre.trim()} ${data.apellido.trim()}`
      : data.nombre.trim();

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        nombre: nombreCompleto,
        telefono: data.telefono,
        dni: data.dni,
        dniFotoUrl: data.dniFotoUrl,
        role: Role.CONSUMER,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        dni: true,
        puntos: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      user,
      tokens,
    };
  }

  /**
   * Inicio de sesión local con verificación de contraseña bcrypt
   */
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas. Verificá tu email y contraseña.', 401);
    }

    if (!user.activo) {
      throw new AppError('ACCOUNT_DISABLED', 'Tu cuenta se encuentra inactiva o suspendida', 403);
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);

    if (!isMatch) {
      throw new AppError('INVALID_CREDENTIALS', 'Credenciales inválidas. Verificá tu email y contraseña.', 401);
    }

    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role,
        dni: user.dni,
        puntos: user.puntos,
      },
      tokens,
    };
  }

  /**
   * Rotación de refresh token
   */
  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.refreshSecret) as JwtPayload;

      // Buscar el token en DB
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
        const error: any = new Error('El token de refresco es inválido o ha sido revocado');
        error.statusCode = 401;
        error.code = 'INVALID_REFRESH_TOKEN';
        throw error;
      }

      // Invalidar el token anterior (rotación estricta)
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revoked: true },
      });

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.activo) {
        const error: any = new Error('Usuario no válido');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
      }

      // Generar nuevo par de tokens
      return await this.generateTokens(user);
    } catch (err: any) {
      if (err.statusCode) throw err;
      const error: any = new Error('Token de refresco inválido');
      error.statusCode = 401;
      error.code = 'INVALID_REFRESH_TOKEN';
      throw error;
    }
  }

  /**
   * Cierre de sesión e invalidación del refresh token
   */
  async logout(refreshToken: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revoked: true },
      });
    }
    return { success: true };
  }

  /**
   * Obtiene la información del usuario autenticado
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        dni: true,
        role: true,
        puntos: true,
        puntosSancion: true,
        authProvider: true,
        createdAt: true,
      },
    });

    if (!user) {
      const error: any = new Error('Usuario no encontrado');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    return user;
  }

  /**
   * Solicitud de recuperación de contraseña
   */
  async forgotPassword(data: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    // Por seguridad, no revelar si el email existe
    if (!user) {
      return {
        message: 'Si el email está registrado, se enviaron las instrucciones de recuperación.',
      };
    }

    const resetToken = jwt.sign(
      { id: user.id, type: 'reset' },
      JWT_CONFIG.accessSecret,
      { expiresIn: '1h' }
    );

    return {
      message: 'Si el email está registrado, se enviaron las instrucciones de recuperación.',
      resetToken, // Retornado en desarrollo para testing
    };
  }

  /**
   * Restablecimiento de contraseña
   */
  async resetPassword(data: ResetPasswordInput) {
    try {
      const decoded = jwt.verify(data.token, JWT_CONFIG.accessSecret) as {
        id: string;
        type: string;
      };

      if (decoded.type !== 'reset') {
        const error: any = new Error('Token inválido');
        error.statusCode = 400;
        error.code = 'INVALID_RESET_TOKEN';
        throw error;
      }

      const passwordHash = await bcrypt.hash(data.newPassword, JWT_CONFIG.bcryptRounds);

      await prisma.user.update({
        where: { id: decoded.id },
        data: { passwordHash },
      });

      return { message: 'Contraseña restablecida exitosamente' };
    } catch (err: any) {
      if (err.statusCode) throw err;
      const error: any = new Error('El token de restablecimiento es inválido o expiró');
      error.statusCode = 400;
      error.code = 'INVALID_RESET_TOKEN';
      throw error;
    }
  }
}

export const authService = new AuthService();
