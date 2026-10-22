import { Request, Response, NextFunction } from 'express';
import { claimsService } from './claims.service';

export const createClaim = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reporterId = (req as any).user.id;
    const claim = await claimsService.createClaim(reporterId, req.body);
    res.status(201).json({
      status: 'success',
      data: claim,
    });
  } catch (err) {
    next(err);
  }
};

export const getClaims = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: userId, role } = (req as any).user;
    const claims = await claimsService.getClaims(userId, role);
    res.status(200).json({
      status: 'success',
      data: claims,
    });
  } catch (err) {
    next(err);
  }
};

export const getClaimById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id: userId, role } = (req as any).user;
    const claim = await claimsService.getClaimById(req.params.id as string, userId, role);
    res.status(200).json({
      status: 'success',
      data: claim,
    });
  } catch (err) {
    next(err);
  }
};

export const consumerRespond = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const consumerId = (req as any).user.id;
    const result = await claimsService.consumerRespond(
      req.params.id as string,
      consumerId,
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

export const agencyMediate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const operatorId = (req as any).user.id;
    const result = await claimsService.agencyMediate(
      req.params.id as string,
      operatorId,
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

export const processExpired = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await claimsService.processExpired24hClaims();
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const executeCharge = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const actorId = (req as any).user.id;
    const result = await claimsService.executeClaimCharge(req.params.id as string, actorId);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
