import type { RequestHandler } from 'express';
import { getRedis } from '../jobs/queue';
import { AppError } from '../utils/AppError';
import { createHash } from 'node:crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { idempotencyKey?: string }
  }
}

const TTL_SECONDS = 24 * 3600;
const canonical = (value: unknown): unknown => value instanceof Date ? value.toISOString() : Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)])) : value;

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
  const fingerprint = createHash('sha256').update(JSON.stringify(canonical(req.body ?? {}))).digest('hex');
  const fresh = await redis.set(slot, JSON.stringify({ pending: true, fingerprint }), 'EX', 120, 'NX');
  if (!fresh) {
    const saved = await redis.get(slot);
    if (!saved || saved === 'pending') throw new AppError(409, 'IDEMPOTENCY_IN_PROGRESS', 'This request is already being processed.');
    const replay = JSON.parse(saved) as { status?: number; body?: unknown; fingerprint?: string; pending?: boolean };
    if (replay.fingerprint && replay.fingerprint !== fingerprint) throw new AppError(409, 'IDEMPOTENCY_MISMATCH', 'Use a new attempt for a different request.');
    if (replay.pending) throw new AppError(409, 'IDEMPOTENCY_IN_PROGRESS', 'This request is already being processed.');
    const { status, body } = replay;
    res.set('Idempotent-Replayed', 'true').status(status ?? 200).json(body);
    return;
  }
  const json = res.json.bind(res);
  res.json = (body: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 300) void redis.set(slot, JSON.stringify({ status: res.statusCode, body, fingerprint }), 'EX', TTL_SECONDS);
    else void redis.del(slot);
    return json(body);
  };
  // A disconnected client does not cancel a committed booking/payment. Keep the lock until the
  // handler records its outcome; a crashed process times out, with booking-level deduplication as a backstop.
  next();
};
