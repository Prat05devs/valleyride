import rateLimit, { type Options } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { env } from '../config/env';
import { getRedis } from '../jobs/queue';

/** Counters live in Redis so limits hold across API instances. Tests use the in-memory store. */
function store(prefix: string): Options['store'] | undefined {
  if (env.NODE_ENV === 'test') return undefined;
  const s = new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (command: string, ...args: string[]) => getRedis().call(command, ...args) as Promise<RedisReply>,
  });
  // The store loads its Lua scripts here but awaits them only on use (and reloads them if that failed). Without a
  // handler, Redis being down at boot is an unhandled rejection that stops the process.
  s.incrementScriptSha.catch(() => {});
  s.getScriptSha.catch(() => {});
  return s;
}

const limited = (message: string): Options['handler'] => (_req, res) => {
  res.status(429).json({ error: { code: 'RATE_LIMITED', message } });
};

export const rateLimiter = rateLimit({
  windowMs: 60_000,
  limit: env.NODE_ENV === 'production' ? 120 : 10_000, // test and e2e runs make far more than 120 calls from one IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('api'),
  passOnStoreError: true, // a Redis outage should not take the whole API down with it
  handler: limited('Too many requests. Please slow down.'),
});

/**
 * OTP SMS cost money and invite SMS-pumping fraud, so there are two separate limits: 5 per phone per 15 minutes
 * (however many IPs ask) and 20 per IP per hour (however many phones it tries). Both fail closed if Redis is down.
 */
const otpPerPhone = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('otp-phone'),
  keyGenerator: (req) => String(req.body?.phone ?? ''),
  handler: limited('Too many codes for this number. Try again in 15 minutes.'),
});

const otpPerIp = rateLimit({
  windowMs: 60 * 60_000,
  limit: env.NODE_ENV === 'production' ? 20 : 10_000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('otp-ip'),
  handler: limited('Too many code requests. Try again later.'),
});

export const otpLimiter = [otpPerIp, otpPerPhone];
