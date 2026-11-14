import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);
const CONNECT_BEFORE_EXEC_CODES = new Set(['P1001', 'P1002']);
const READ_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isTransientDbError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { code?: unknown; name?: unknown; message?: unknown };
  if (typeof anyErr.code === 'string' && TRANSIENT_PRISMA_CODES.has(anyErr.code)) {
    return true;
  }
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    anyErr.name === 'PrismaClientInitializationError'
  ) {
    return true;
  }
  const msg = typeof anyErr.message === 'string' ? anyErr.message : '';
  return /server has closed the connection|can't reach database server|connection.*(closed|terminated|reset)|econnreset|etimedout|epipe|socket hang up/i.test(
    msg
  );
};

const isRetryableConnectError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as { code?: unknown; name?: unknown };
  if (typeof anyErr.code === 'string' && CONNECT_BEFORE_EXEC_CODES.has(anyErr.code)) {
    return true;
  }
  return (
    err instanceof Prisma.PrismaClientInitializationError ||
    anyErr.name === 'PrismaClientInitializationError'
  );
};

const basePrisma = new PrismaClient();

const extendedPrisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        const maxRetries = READ_OPERATIONS.has(operation) ? 2 : 1;
        let attempt = 0;

        while (true) {
          try {
            return await query(args);
          } catch (err) {
            const canRetry = READ_OPERATIONS.has(operation)
              ? isTransientDbError(err)
              : isRetryableConnectError(err);

            if (!canRetry || attempt >= maxRetries) {
              throw err;
            }

            attempt += 1;
            const backoffMs = attempt === 1 ? 300 : 800;
            logger.warn(
              `Transient DB error in Prisma.${operation}, retrying (${attempt}/${maxRetries}) in ${backoffMs}ms`
            );
            await sleep(backoffMs);
          }
        }
      },
    },
  },
});

export const prisma: PrismaClient = extendedPrisma as unknown as PrismaClient;

/**
 * Calienta el pool de conexiones hacia TiDB Cloud al iniciar el servidor
 */
export const warmUpDatabase = async (): Promise<void> => {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await basePrisma.$queryRaw`SELECT 1`;
      logger.info('TiDB Cloud connection pool ready');
      return;
    } catch (err) {
      logger.warn(`DB warmup attempt ${attempt}/3 failed: ${(err as Error)?.message || err}`);
      if (attempt < 3) {
        await sleep(attempt * 600);
      }
    }
  }
};
