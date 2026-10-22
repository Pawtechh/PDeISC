import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timestamp = new Date().toISOString();

    if (!req.user) {
      res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Usuario no autenticado',
        timestamp,
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: `Acceso denegado: se requiere uno de los siguientes roles: [${roles.join(', ')}]`,
        timestamp,
      });
      return;
    }

    next();
  };
};
