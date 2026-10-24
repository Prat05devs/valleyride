import { getRedis } from '../jobs/queue';
import { logger } from './logger';

/**
 * Read-through Redis cache for data that changes rarely (catalogue, locations, guides, pricing rules).
 * Writes call invalidate(prefix). A Redis outage falls back to the database instead of failing the request.
 */
export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  try {
    const hit = await redis.get(`cache:${key}`);
    if (hit) return JSON.parse(hit) as T;
  } catch (err) { logger.warn({ err, key }, 'cache read failed'); }
  const value = await load();
  redis.set(`cache:${key}`, JSON.stringify(value), 'EX', ttlSeconds).catch((err) => logger.warn({ err, key }, 'cache write failed'));
  return value;
}

/** SCAN rather than KEYS, which blocks Redis while it walks every key. */
export async function invalidate(prefix: string) {
  const redis = getRedis();
  for await (const keys of redis.scanStream({ match: `cache:${prefix}*`, count: 100 })) {
    if ((keys as string[]).length) await redis.unlink(...(keys as string[]));
  }
}
