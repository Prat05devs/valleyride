import type { RequestHandler } from 'express';
import { getRedis } from '../jobs/queue';
import { AppError } from '../utils/AppError';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { idempotencyKey?: string }
  }
}

const TTL_SECONDS = 24 * 3600;

/**
 * Every write that moves money must carry an Idempotency-Key header. The first successful response is kept in Redis
 * for 24 h and replayed for a repeat of the same key (same user, method and path), so a retried request never charges
 * or refunds twice. A repeat while the first is still running gets 409; a failed attempt frees the key for a retry.
 */
export const requireIdempotencyKey: RequestHandler = async (req, res, next) => {
  const key = req.get('idempotency-key');
  if (!key || !/^[\w:-]{8,100}$/.test(key)) {
    throw new AppError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Send an Idempotency-Key header (8–100 letters, digits, -, _ or :).');
  }
  req.idempotencyKey = key;
  const slot = `idem:${req.user?.id ?? req.ip}:${req.method}:${req.baseUrl}${req.path}:${key}`;
  const redis = getRedis();
  const fresh = await redis.set(slot, 'pending', 'EX', TTL_SECONDS, 'NX');
  if (!fresh) {
    const saved = await redis.get(slot);
    if (!saved || saved === 'pending') throw new AppError(409, 'IDEMPOTENCY_IN_PROGRESS', 'This request is already being processed.');
    const { status, body } = JSON.parse(saved) as { status: number; body: unknown };
    res.set('Idempotent-Replayed', 'true').status(status).json(body);
    return;
  }
  const json = res.json.bind(res);
  res.json = (body: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 300) void redis.set(slot, JSON.stringify({ status: res.statusCode, body }), 'EX', TTL_SECONDS);
    else void redis.del(slot);
    return json(body);
  };
  res.on('close', () => { if (!res.writableEnded) void redis.del(slot); });
  next();
};
