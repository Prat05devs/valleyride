import { randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * Passwords are stored as scrypt hashes: "scrypt$N$r$p$salt$hash" (base64), so the cost can be raised later and old
 * hashes still verify. N=2^15 uses 32 MB per hash, which keeps four parallel logins inside the API's memory cap.
 */
const COST = { N: 2 ** 15, r: 8, p: 1 };
const KEY_LENGTH = 32;

function derive(password: string, salt: Buffer, o: { N: number; r: number; p: number }): Promise<Buffer> {
  const options: ScryptOptions = { ...o, maxmem: 128 * o.N * o.r * 2 };
  return new Promise((resolve, reject) => scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, options, (err, key) => (err ? reject(err) : resolve(key))));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST);
  return ['scrypt', COST.N, COST.r, COST.p, salt.toString('base64'), key.toString('base64')].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, N, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await derive(password, Buffer.from(salt, 'base64'), { N: Number(N), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Checked against when a phone has no account, so a wrong number takes as long as a wrong password. */
let dummy: Promise<string> | undefined;
export const dummyHash = () => (dummy ??= hashPassword('not-a-real-password'));

/** No 0/O, 1/I/l: staff read these out over the phone or WhatsApp. */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

/** A one-time password staff give a rider who forgot theirs; the rider changes it in their profile. */
export function temporaryPassword(): string {
  let s = '';
  for (let i = 0; i < 10; i++) s += CHARS[randomInt(CHARS.length)];
  return s;
}
