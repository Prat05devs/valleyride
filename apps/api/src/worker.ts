import { initSentry, captureError } from './utils/sentry';
initSentry('worker');
import { Worker, type Job } from 'bullmq';
import { sequelize } from './db';
import { closeQueues, getQueue, getRedis, QUEUES, type QueueName } from './jobs/queue';
import { holdExpiry } from './jobs/processors/holdExpiry';
import { returnReminder } from './jobs/processors/returnReminder';
import { invoicePdf } from './jobs/processors/invoicePdf';
import { docExpiry } from './jobs/processors/docExpiry';
import { repaymentDue } from './jobs/processors/repaymentDue';
import { logger } from './utils/logger';

const PROCESSORS: Record<string, (job: Job) => Promise<unknown>> = {
  holdExpiry, returnReminder, invoicePdf, docExpiry, repaymentDue,
};

async function main() {
  await sequelize.authenticate();

  const workers = (Object.keys(QUEUES) as QueueName[]).map((name) => {
    const w = new Worker(name, async (job) => {
      const run = PROCESSORS[job.name];
      if (!run) throw new Error(`No processor for job ${job.name}`);
      return run(job);
    }, { connection: getRedis(), concurrency: 5 });
    w.on('failed', (job, err) => { logger.error({ job: job?.name, id: job?.id, err }, 'job failed'); captureError(err, { job: job?.name }); });
    return w;
  });

  // Repeating jobs. upsertJobScheduler is idempotent, so restarting the worker does not duplicate them.
  await getQueue('bookings').upsertJobScheduler('hold-expiry-sweep', { every: 60_000 }, { name: 'holdExpiry', data: {} });
  await getQueue('alerts').upsertJobScheduler('doc-expiry-daily', { pattern: '0 9 * * *', tz: 'Asia/Kolkata' }, { name: 'docExpiry', data: {} });
  await getQueue('bookings').upsertJobScheduler('return-reminder-evening', { pattern: '0 18 * * *', tz: 'Asia/Kolkata' }, { name: 'returnReminder', data: {} });
  await getQueue('alerts').upsertJobScheduler('repayment-due-daily', { pattern: '0 9 * * *', tz: 'Asia/Kolkata' }, { name: 'repaymentDue', data: {} });

  logger.info({ queues: Object.keys(QUEUES) }, 'worker started');

  const shutdown = async () => {
    await Promise.allSettled(workers.map((w) => w.close()));
    await Promise.allSettled([closeQueues(), sequelize.close()]);
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

main().catch((err) => {
  logger.fatal({ err }, 'worker failed to start');
  process.exit(1);
});
