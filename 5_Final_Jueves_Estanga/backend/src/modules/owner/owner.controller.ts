import { Request, Response, NextFunction } from 'express';
import { ownerService } from './owner.service';

export const getMyBoards = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = (req as any).user.id;
    const boards = await ownerService.getMyBoards(ownerId);
    res.status(200).json({
      status: 'success',
      data: boards,
    });
  } catch (err) {
    next(err);
  }
};

export const getEarnings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = (req as any).user.id;
    const earnings = await ownerService.getEarnings(ownerId);
    res.status(200).json({
      status: 'success',
      data: earnings,
    });
  } catch (err) {
    next(err);
  }
};

export const requestPayout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = (req as any).user.id;
    const payout = await ownerService.requestPayout(ownerId, req.body);
    res.status(200).json({
      status: 'success',
      data: payout,
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingRevisions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = (req as any).user.id;
    const revisions = await ownerService.getPendingRevisions(ownerId);
    res.status(200).json({
      status: 'success',
      data: revisions,
    });
  } catch (err) {
    next(err);
  }
};

export const getRentalInspection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = (req as any).user.id;
    const inspection = await ownerService.getRentalInspection(ownerId, req.params.rentalId as string);
    res.status(200).json({
      status: 'success',
      data: inspection,
    });
  } catch (err) {
    next(err);
  }
};

export const completeMaintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = (req as any).user.id;
    const result = await ownerService.completeMaintenance(
      ownerId,
      req.params.boardId as string,
      req.body
    );
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const reportDamageClaim = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = (req as any).user.id;
    const claim = await ownerService.reportDamageClaim(ownerId, req.body);
    res.status(201).json({
      status: 'success',
      data: claim,
    });
  } catch (err) {
    next(err);
  }
};

export const approveRevision = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const ownerId = (req as any).user.id;
    const result = await ownerService.approveRevision(ownerId, req.params.rentalId as string);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const triggerMaintenanceCheck = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await ownerService.checkMaintenanceCycleJob();
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};


