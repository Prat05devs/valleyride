import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { QueryTypes, Transaction } from 'sequelize';
import type { Role } from '@valleyride/shared';
import { env } from '../../config/env';
import { sequelize } from '../../db';

export const ACCESS_COOKIE = 'vr_access';
export const REFRESH_COOKIE = 'vr_refresh';
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_DAYS = 30;

export interface AccessClaims { sub: string; role: Role }

export function signAccessToken(user: { id: string; role: Role }): string {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: user.id, expiresIn: ACCESS_TTL_SECONDS, algorithm: 'HS256', issuer: 'valleyride',
  });
}

export function verifyAccessToken(token: string): AccessClaims {
  const c = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'], issuer: 'valleyride' }) as jwt.JwtPayload;
  return { sub: c.sub as string, role: c.role as Role };
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

/** Refresh tokens are random, stored only as a SHA-256 hash, and single-use. */
export async function issueRefreshToken(userId: string, t?: Transaction): Promise<string> {
  const token = randomBytes(48).toString('base64url');
  await sequelize.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (:userId, :hash, now() + make_interval(days => :days))`,
    { replacements: { userId, hash: sha256(token), days: REFRESH_TTL_DAYS }, transaction: t },
  );
  return token;
}

/**
 * Revokes the presented token and issues a new one. Presenting a token that was already revoked
 * means it leaked, so every token for that user is revoked.
 */
export async function rotateRefreshToken(token: string): Promise<{ userId: string; refreshToken: string } | null> {
  return sequelize.transaction(async (t) => {
    const [row] = await sequelize.query<{ id: string; user_id: string; revoked_at: Date | null; expires_at: Date }>(
      `SELECT id, user_id, revoked_at, expires_at FROM refresh_tokens WHERE token_hash = :hash FOR UPDATE`,
      { replacements: { hash: sha256(token) }, type: QueryTypes.SELECT, transaction: t },
    );
    if (!row) return null;
    if (row.revoked_at) {
      await sequelize.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = :userId AND revoked_at IS NULL`,
        { replacements: { userId: row.user_id }, transaction: t });
      return null;
    }
    if (row.expires_at <= new Date()) return null;
    await sequelize.query(`UPDATE refresh_tokens SET revoked_at = now(), updated_at = now() WHERE id = :id`,
      { replacements: { id: row.id }, transaction: t });
    return { userId: row.user_id, refreshToken: await issueRefreshToken(row.user_id, t) };
  });
}

/** After a password change or reset: every device has to log in again. */
export async function revokeAllRefreshTokens(userId: string) {
  await sequelize.query(`UPDATE refresh_tokens SET revoked_at = now(), updated_at = now() WHERE user_id = :userId AND revoked_at IS NULL`,
    { replacements: { userId } });
}

/** Logout: revokes one refresh token. Unknown or already revoked tokens are ignored. */
export async function revokeRefreshToken(token: string) {
  await sequelize.query(`UPDATE refresh_tokens SET revoked_at = now(), updated_at = now() WHERE token_hash = :hash AND revoked_at IS NULL`,
    { replacements: { hash: sha256(token) } });
}
