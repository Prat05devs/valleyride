import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { getRedis } from '../../jobs/queue';
import { env } from '../../config/env';
import { DEMO_OTP, isDemoLogin } from './demo';

const TTL_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;

const key = (phone: string) => `otp:${phone}`;
const hash = (phone: string, code: string) => createHash('sha256').update(`${phone}:${code}`).digest();

/** Creates a 6-digit code valid for 5 minutes. Only its hash is kept in Redis. */
export async function createOtp(phone: string): Promise<string> {
  const code = isDemoLogin(phone) ? DEMO_OTP : String(randomInt(0, 1_000_000)).padStart(6, '0');
  await getRedis().multi()
    .hset(key(phone), { hash: hash(phone, code).toString('hex'), attempts: 0 })
    .expire(key(phone), TTL_SECONDS)
    .exec();
  // Outside production only: a plain copy for automated end-to-end tests (e2e/ reads it). Never written in production.
  if (env.NODE_ENV !== 'production') await getRedis().set(`otp:dev:${phone}`, code, 'EX', TTL_SECONDS);
  return code;
}

export type OtpResult = 'ok' | 'invalid' | 'expired' | 'locked';

/** Checks a code. The OTP is deleted on success or after MAX_ATTEMPTS wrong tries. */
export async function checkOtp(phone: string, code: string): Promise<OtpResult> {
  const redis = getRedis();
  const stored = await redis.hgetall(key(phone));
  if (!stored.hash) return 'expired';

  const attempts = await redis.hincrby(key(phone), 'attempts', 1);
  if (attempts > MAX_ATTEMPTS) {
    await redis.del(key(phone));
    return 'locked';
  }
  if (!timingSafeEqual(Buffer.from(stored.hash, 'hex'), hash(phone, code))) return 'invalid';
  await redis.del(key(phone));
  return 'ok';
}
