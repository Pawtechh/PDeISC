import { Request, Response, NextFunction } from 'express';
import { agencyService } from './agency.service';

export const checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const operatorId = (req as any).user.id;
    const result = await agencyService.checkIn(req.body, operatorId);
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
    const operatorId = (req as any).user.id;
    const result = await agencyService.checkOut(req.body, operatorId);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getDailySchedule = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const schedule = await agencyService.getDailySchedule();
    res.status(200).json({
      status: 'success',
      data: schedule,
    });
  } catch (err) {
    next(err);
  }
};

export const getAgencyMetrics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const metrics = await agencyService.getAgencyMetrics();
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
    const operator = (req as any).user?.email || 'operador_web';
    const result = await agencyService.updateAgencyCommission(req.body, operator);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

