import { Request, Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';

export const createPreference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consumerId = (req as any).user.id;
    const { rentalId, installments } = req.body;
    const result = await paymentsService.createPreference(rentalId, consumerId, installments);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const createPreAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const consumerId = (req as any).user.id;
    const result = await paymentsService.createPreAuthHold(req.body, consumerId);
    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const signatureHeader = req.headers['x-signature'] as string | undefined;
    const requestId = req.headers['x-request-id'] as string | undefined;
    const result = await paymentsService.handleWebhook(req.body, signatureHeader, requestId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const simulatePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await paymentsService.simulatePayment(req.body);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getPaymentByRental = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = (req as any).user;
    const payments = await paymentsService.getPaymentByRental(req.params.rentalId as string, user.id, user.role);
    res.status(200).json({
      status: 'success',
      data: payments,
    });
  } catch (err) {
    next(err);
  }
};
