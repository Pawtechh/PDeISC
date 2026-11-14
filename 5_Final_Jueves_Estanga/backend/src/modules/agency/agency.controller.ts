import { Request, Response, NextFunction } from 'express';
import { agencyService } from './agency.service';

export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const operatorId = user.id;
    const result = await agencyService.checkIn(req.body, operatorId, {
      role: user?.role,
      agencyId: user?.agencyId ?? null,
    });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const operatorId = user.id;
    const result = await agencyService.checkOut(req.body, operatorId, {
      role: user?.role,
      agencyId: user?.agencyId ?? null,
    });
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getDailySchedule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const agencyId = user?.role === 'SUPER_ADMIN' ? null : (user?.agencyId ?? null);
    const schedule = await agencyService.getDailySchedule(agencyId);
    res.status(200).json({
      status: 'success',
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};

export const getAgencyMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const agencyId = user?.role === 'SUPER_ADMIN' ? null : (user?.agencyId ?? null);
    const metrics = await agencyService.getAgencyMetrics(agencyId);
    res.status(200).json({
      status: 'success',
      data: metrics,
    });
  } catch (err) {
    next(err);
  }
};

export const getCommission = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = agencyService.getAgencyCommission();
    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const updateCommission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const operator = user?.email || 'operador_web';
    const agencyId = user?.role === 'SUPER_ADMIN' ? null : (user?.agencyId ?? null);
    const result = await agencyService.updateAgencyCommission(req.body, operator, agencyId);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getVendorRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const agencyId = user?.role === 'SUPER_ADMIN' ? null : (user?.agencyId ?? null);
    const requests = await agencyService.getVendorRequests(agencyId);
    res.status(200).json({
      status: 'success',
      data: requests,
    });
  } catch (err) {
    next(err);
  }
};

export const resolveVendorRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const operatorId = user?.id || 'operator-agency';
    const operatorEmail = user?.email || 'mostrador@surf.com';
    const operatorAgencyId = user?.role === 'SUPER_ADMIN' ? null : (user?.agencyId ?? null);
    const requestId = String(req.params.id || '');
    const result = await agencyService.resolveVendorRequest(
      requestId,
      req.body,
      operatorId,
      operatorEmail,
      operatorAgencyId
    );
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
