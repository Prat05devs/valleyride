import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { env } from '../config/env';

/** Job names, grouped by the queue that carries them. */
export const QUEUES = {
  bookings: ['holdExpiry', 'returnReminder'],
  documents: ['invoicePdf'],
  alerts: ['docExpiry', 'repaymentDue'],
} as const;

export type QueueName = keyof typeof QUEUES;
export type JobName = (typeof QUEUES)[QueueName][number];

let redis: IORedis | undefined;
const queues = new Map<QueueName, Queue>();

/** One shared connection, created on first use so importing this file never opens a socket. */
export function getRedis(): IORedis {
  // BullMQ requires maxRetriesPerRequest: null on connections it blocks on.
  redis ??= new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  return redis;
}

export function getQueue(name: QueueName): Queue {
  let q = queues.get(name);
  if (!q) {
    q = new Queue(name, {
      connection: getRedis(),
      defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5_000 }, removeOnComplete: 1000, removeOnFail: 5000 },
    });
    queues.set(name, q);
  }
  return q;
}

export async function closeQueues(): Promise<void> {
  await Promise.all([...queues.values()].map((q) => q.close()));
  queues.clear();
  if (redis) await redis.quit();
  redis = undefined;
}
