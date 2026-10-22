import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt';
import { JwtPayload } from '../types/auth';
import { prisma } from '../config/prisma';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const timestamp = new Date().toISOString();

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Token de acceso no proporcionado o formato inválido',
      timestamp,
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Token de acceso faltante',
      timestamp,
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.accessSecret) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, nombre: true, activo: true },
    });

    if (!user || !user.activo) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Usuario no encontrado o inactivo',
        timestamp,
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      nombre: user.nombre,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        code: 'TOKEN_EXPIRED',
        message: 'El token de acceso ha expirado',
        timestamp,
      });
      return;
    }

    res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Token de acceso inválido',
      timestamp,
    });
  }
};
