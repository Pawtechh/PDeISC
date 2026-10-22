import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(code: string, message: string, statusCode: number = 500, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  void _next;
  const timestamp = new Date().toISOString();

  // Log completo solo del lado servidor (Winston)
  logger.error(`Error on ${req.method} ${req.url}: ${err?.message || err}`, {
    name: err?.name,
    code: err?.code,
    stack: err?.stack,
    details: err?.details,
  });

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    logger.warn(`Validation error on ${req.method} ${req.url}: ${JSON.stringify(err.errors)}`);
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Los datos enviados son inválidos',
      details: err.flatten().fieldErrors,
      timestamp,
    });
    return;
  }

  // 2. Errores Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P1000':
      case 'P1001':
      case 'P1002':
      case 'P1003':
      case 'P1017':
        res.status(503).json({
          code: 'DB_UNAVAILABLE',
          message: 'Servicio no disponible. Reintentá en unos minutos.',
          timestamp,
        });
        return;
      case 'P2002':
        res.status(409).json({
          code: 'CONFLICT',
          message: 'Ya existe un registro con esos datos.',
          timestamp,
        });
        return;
      case 'P2003':
        res.status(409).json({
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Violación de clave foránea en la operación.',
          timestamp,
        });
        return;
      case 'P2025':
        res.status(404).json({
          code: 'NOT_FOUND',
          message: 'El recurso no existe.',
          timestamp,
        });
        return;
      default:
        res.status(500).json({
          code: 'SERVER_ERROR',
          message: 'Error interno del servidor.',
          timestamp,
        });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      code: 'DB_UNAVAILABLE',
      message: 'Servicio no disponible. Reintentá en unos minutos.',
      timestamp,
    });
    return;
  }

  if (
    err instanceof Prisma.PrismaClientRustPanicError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientUnknownRequestError
  ) {
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Error interno del servidor.',
      timestamp,
    });
    return;
  }

  // Manejo de código de Prisma en caso de error wrapping o mock
  if (typeof err?.code === 'string' && err.code.startsWith('P')) {
    if (['P1000', 'P1001', 'P1002', 'P1003', 'P1017'].includes(err.code)) {
      res.status(503).json({
        code: 'DB_UNAVAILABLE',
        message: 'Servicio no disponible. Reintentá en unos minutos.',
        timestamp,
      });
      return;
    }
    if (err.code === 'P2002') {
      res.status(409).json({
        code: 'CONFLICT',
        message: 'Ya existe un registro con esos datos.',
        timestamp,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'El recurso no existe.',
        timestamp,
      });
      return;
    }
  }

  // 3. AppError conocido o error controlado con statusCode
  if (err instanceof AppError || (typeof err?.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 500)) {
    const statusCode = err.statusCode || 500;
    const isSensitive =
      statusCode >= 500 ||
      /invocation|prisma|at\s+|[\\/](src|node_modules|dist)[\\/]|query_engine/i.test(err.message);

    const code = isSensitive ? 'SERVER_ERROR' : (err.code || 'APP_ERROR');
    const message = isSensitive ? 'Error interno del servidor.' : err.message;

    res.status(statusCode).json({
      code,
      message,
      ...(err.details && !isSensitive ? { details: err.details } : {}),
      timestamp,
    });
    return;
  }

  // 4. Errores no controlados (500)
  res.status(500).json({
    code: 'SERVER_ERROR',
    message: 'Error interno del servidor.',
    timestamp,
  });
};
