import IORedis from 'ioredis';
import { Queue } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../utils/logger';

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

/**
 * The shared connection for request paths (idempotency, rate limits, cache) and queue producers. Created on first
 * use so importing this file never opens a socket. Commands fail after two reconnect attempts instead of waiting forever,
 * so a Redis outage returns errors (or falls back, in the cache) rather than hanging requests.
 */
export function getRedis(): IORedis {
  if (!redis) {
    redis = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: 2, connectTimeout: 5_000 });
    redis.on('error', (err) => logger.warn({ err: err.message }, 'redis connection error'));
  }
  return redis;
}

/** BullMQ workers block on Redis and need their own connection with maxRetriesPerRequest: null. */
export function workerConnection(): IORedis {
  const conn = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  conn.on('error', (err) => logger.warn({ err: err.message }, 'redis connection error'));
  return conn;
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
