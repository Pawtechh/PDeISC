import { Request, Response, NextFunction } from 'express';
import { weatherService } from './weather.service';

export const getMarineForecast = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const zoneId = typeof req.query.zoneId === 'string' ? req.query.zoneId : undefined;
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lon = req.query.lon ? Number(req.query.lon) : undefined;

    const forecast = await weatherService.getMarineForecast({
      zoneId,
      lat: Number.isFinite(lat) ? lat : undefined,
      lon: Number.isFinite(lon) ? lon : undefined,
    });
    res.json({
      success: true,
      data: forecast,
    });
  } catch (err) {
    next(err);
  }
};
