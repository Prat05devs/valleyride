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
 * Password guessing: 10 wrong tries per phone per 15 minutes (however many IPs try), and 50 per IP (however many phones
 * it tries). Successful logins don't count. Both fail closed if Redis is down.
 */
const loginPerPhone = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('login-phone'),
  keyGenerator: (req) => String(req.body?.phone ?? ''),
  handler: limited('Too many wrong passwords for this number. Try again in 15 minutes, or ask support to reset it.'),
});

const loginPerIp = rateLimit({
  windowMs: 15 * 60_000,
  limit: env.NODE_ENV === 'production' ? 50 : 10_000,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('login-ip'),
  handler: limited('Too many login attempts. Try again in 15 minutes.'),
});

export const loginLimiter = [loginPerIp, loginPerPhone];

/** New accounts: 10 per IP per hour, so nobody can mass-register numbers. */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: env.NODE_ENV === 'production' ? 10 : 10_000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('register'),
  handler: limited('Too many new accounts from this network. Try again later.'),
});
