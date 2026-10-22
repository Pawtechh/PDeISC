import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import { Prisma } from '@prisma/client';
import { errorHandler, AppError } from '../errorHandler';

// Mock logger para no llenar la consola de tests con logs
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('errorHandler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  const nextMock = jest.fn();

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockReq = {
      method: 'POST',
      url: '/api/auth/login',
    };
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  it('debe mapear Prisma P1001 a 503 DB_UNAVAILABLE sin filtrar stack trace ni rutas', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      "Can't reach database server at localhost:3306\nInvalid prisma.user.findUnique() invocation in C:\\Users\\Luish\\auth.service.ts:40",
      {
        code: 'P1001',
        clientVersion: '5.20.0',
      }
    );

    errorHandler(prismaError, mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(503);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'DB_UNAVAILABLE',
        message: 'Servicio no disponible. Reintentá en unos minutos.',
        timestamp: expect.any(String),
      })
    );
    // Verificar que no expone stack trace ni detalles internos
    const payload = jsonMock.mock.calls[0][0];
    expect(payload).not.toHaveProperty('stack');
    expect(JSON.stringify(payload)).not.toContain('invocation');
    expect(JSON.stringify(payload)).not.toContain('C:\\Users');
  });

  it('debe mapear Prisma P2002 a 409 CONFLICT', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`email`)',
      {
        code: 'P2002',
        clientVersion: '5.20.0',
      }
    );

    errorHandler(prismaError, mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'CONFLICT',
        message: 'Ya existe un registro con esos datos.',
        timestamp: expect.any(String),
      })
    );
  });

  it('debe mapear Prisma P2025 a 404 NOT_FOUND', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Record to update not found.',
      {
        code: 'P2025',
        clientVersion: '5.20.0',
      }
    );

    errorHandler(prismaError, mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'NOT_FOUND',
        message: 'El recurso no existe.',
        timestamp: expect.any(String),
      })
    );
  });

  it('debe mapear PrismaClientInitializationError a 503 DB_UNAVAILABLE', () => {
    const initError = new Prisma.PrismaClientInitializationError(
      "Can't reach database server at `localhost:3306`",
      '5.20.0'
    );

    errorHandler(initError, mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(503);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'DB_UNAVAILABLE',
        message: 'Servicio no disponible. Reintentá en unos minutos.',
        timestamp: expect.any(String),
      })
    );
  });

  it('debe manejar ZodError con 400 VALIDATION_ERROR y detalles de campos', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    try {
      schema.parse({ email: 'invalido', password: '123' });
    } catch (zodErr) {
      errorHandler(zodErr as ZodError, mockReq as Request, mockRes as Response, nextMock);
    }

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados son inválidos',
        details: expect.any(Object),
        timestamp: expect.any(String),
      })
    );
  });

  it('debe responder con AppError controlado para códigos < 500', () => {
    const appError = new AppError('AUTH_INVALID_CREDENTIALS', 'Credenciales inválidas', 401);

    errorHandler(appError, mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Credenciales inválidas',
        timestamp: expect.any(String),
      })
    );
  });

  it('debe ofuscar mensajes de AppError si contienen palabras sensibles de stack/prisma', () => {
    const sensitiveError = new AppError(
      'DATABASE_QUERY_ERROR',
      'Invalid prisma.user.findFirst() invocation in C:\\Users\\Luish\\src\\auth.ts',
      500
    );

    errorHandler(sensitiveError, mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SERVER_ERROR',
        message: 'Error interno del servidor.',
      })
    );
    const payload = jsonMock.mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toContain('invocation');
    expect(JSON.stringify(payload)).not.toContain('C:\\Users');
  });

  it('debe responder 500 SERVER_ERROR ante errores inesperados no controlados', () => {
    const error = new Error('Unexpected Null Pointer Exception at Object.<anonymous> (server.ts:88)');

    errorHandler(error, mockReq as Request, mockRes as Response, nextMock);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SERVER_ERROR',
        message: 'Error interno del servidor.',
        timestamp: expect.any(String),
      })
    );
    const payload = jsonMock.mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toContain('Null Pointer');
    expect(JSON.stringify(payload)).not.toContain('server.ts');
  });
});
