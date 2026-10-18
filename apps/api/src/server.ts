import { initSentry } from './utils/sentry';
initSentry('api');
import { app } from './app';
import { env } from './config/env';
import { sequelize } from './db';
import { closeQueues } from './jobs/queue';
import { logger } from './utils/logger';
import { paymentsMocked } from './modules/payment/razorpay.client';

async function main() {
  await sequelize.authenticate();
  const server = app.listen(env.PORT, () => logger.info(`API listening on :${env.PORT}`));
  if (paymentsMocked) logger.warn('Razorpay keys are placeholders: payments are mocked (POST /api/v1/dev/payments/simulate)');

  let closing = false;
  const shutdown = async (signal: string) => {
    if (closing) return;
    closing = true;
    logger.info({ signal }, 'shutting down');
    server.close(async () => {
      await Promise.allSettled([sequelize.close(), closeQueues()]);
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((err) => {
  logger.fatal({ err }, 'API failed to start');
  process.exit(1);
});
