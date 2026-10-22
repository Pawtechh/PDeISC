export const JWT_CONFIG = {
  accessSecret: process.env.JWT_ACCESS_SECRET || 'surf-rental-access-secret-default-key-2026',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'surf-rental-refresh-secret-default-key-2026',
  accessExpiresIn: '24h',
  refreshExpiresIn: '30d',
  refreshDays: 30,
  bcryptRounds: 12,
} as const;
