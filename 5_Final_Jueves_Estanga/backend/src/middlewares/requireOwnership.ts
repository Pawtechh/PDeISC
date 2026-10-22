import { Request, Response, NextFunction } from 'express';

export const requireOwnership = (paramName = 'id') => {
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

    // La agencia tiene permisos de administración sobre recursos
    if (req.user.role === 'AGENCIA') {
      return next();
    }

    const resourceOwnerId = req.params[paramName];

    if (!resourceOwnerId || resourceOwnerId !== req.user.id) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'No tenés permisos para acceder o modificar este recurso',
        timestamp,
      });
      return;
    }

    next();
  };
};
