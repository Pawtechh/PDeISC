import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../../config/jwt';
import { agenciesService } from './agencies.service';
import { listAgenciesQuerySchema } from './agencies.schemas';

export const listZones = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const zones = await agenciesService.listZones();
    res.status(200).json({ status: 'success', data: zones });
  } catch (err) {
    next(err);
  }
};

export const listAgencies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const filters = listAgenciesQuerySchema.parse(req.query);
    const agencies = await agenciesService.listAgencies(filters);
    res.status(200).json({ status: 'success', data: agencies });
  } catch (err) {
    next(err);
  }
};

export const getAgencyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slugOrId = String(req.params.slugOrId || '');
    const agency = await agenciesService.getAgencyProfile(slugOrId);
    res.status(200).json({ status: 'success', data: agency });
  } catch (err) {
    next(err);
  }
};

export const registerAgency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let authenticatedUserId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.slice(7), JWT_CONFIG.accessSecret) as { id?: string };
        if (decoded?.id) authenticatedUserId = decoded.id;
      } catch {
        // Si el token expiró o no corresponde, el servicio valida email/password si fueron provistos
      }
    }

    const result = await agenciesService.registerAgency(req.body, authenticatedUserId);
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

export const updateMyAgency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;
    const updated = await agenciesService.updateMyAgency(user.role, user.agencyId ?? null, req.body);
    res.status(200).json({ status: 'success', data: updated });
  } catch (err) {
    next(err);
  }
};
