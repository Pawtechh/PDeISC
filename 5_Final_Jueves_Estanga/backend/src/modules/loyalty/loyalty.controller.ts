import { Request, Response, NextFunction } from 'express';
import { loyaltyService } from './loyalty.service';

export const getLoyalty = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const loyalty = await loyaltyService.getConsumerLoyalty(userId);
    res.status(200).json({
      status: 'success',
      data: loyalty,
    });
  } catch (err) {
    next(err);
  }
};

export const calculateDiscount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const result = await loyaltyService.calculatePointsDiscount(userId, req.body.puntos);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const result = await loyaltyService.createVerifiedReview(userId, req.body);
    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getBoardReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await loyaltyService.getBoardReviews(req.params.boardId as string);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const result = await loyaltyService.getPendingReviews(userId);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
