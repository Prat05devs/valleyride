import rateLimit, { type Options } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { env } from '../config/env';
import { getRedis } from '../jobs/queue';

/** Counters live in Redis so limits hold across API instances. Tests use the in-memory store. */
function store(prefix: string): Options['store'] | undefined {
  if (env.NODE_ENV === 'test') return undefined;
  return new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (command: string, ...args: string[]) => getRedis().call(command, ...args) as Promise<RedisReply>,
  });
}

export const rateLimiter = rateLimit({
  windowMs: 60_000,
  limit: env.NODE_ENV === 'production' ? 120 : 10_000, // test and e2e runs make far more than 120 calls from one IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('api'),
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } }),
});

/** OTP requests cost money and invite abuse: 5 per phone/IP per 15 minutes. */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('otp'),
  keyGenerator: (req) => `${req.ip}:${req.body?.phone ?? ''}`,
  handler: (_req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many OTP requests. Try again in 15 minutes.' } }),
});
