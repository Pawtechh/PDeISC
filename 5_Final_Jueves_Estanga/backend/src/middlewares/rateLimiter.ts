import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5;

export const loginRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = (req.body?.email as string)?.toLowerCase() || '';
  const key = `${ip}:${email}`;
  const now = Date.now();
  const timestamp = new Date().toISOString();

  const record = loginAttempts.get(key);

  if (record) {
    if (now > record.resetAt) {
      loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return next();
    }

    if (record.count >= MAX_ATTEMPTS) {
      const waitSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.status(429).json({
        code: 'RATE_LIMITED',
        message: `Demasiados intentos fallidos. Por favor esperá ${Math.ceil(waitSeconds / 60)} minutos antes de volver a intentar.`,
        details: { retryAfterSeconds: waitSeconds },
        timestamp,
      });
      return;
    }

    record.count += 1;
  } else {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  }

  next();
};

export const resetLoginAttempts = (req: Request): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const email = (req.body?.email as string)?.toLowerCase() || '';
  const key = `${ip}:${email}`;
  loginAttempts.delete(key);
};
