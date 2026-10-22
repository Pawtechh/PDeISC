import { Request, Response, NextFunction } from 'express';
import { weatherService } from './weather.service';

export const getMarineForecast = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const forecast = await weatherService.getMarineForecast();
    res.json({
      success: true,
      data: forecast,
    });
  } catch (err) {
    next(err);
  }
};
