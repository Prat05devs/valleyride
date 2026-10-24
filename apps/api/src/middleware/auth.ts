import type { RequestHandler } from 'express';
import type { Role } from '@valleyride/shared';
import { User } from '../db';
import { AppError } from '../utils/AppError';
import { ACCESS_COOKIE, verifyAccessToken } from '../modules/auth/tokens';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: { id: string; role: Role } }
  }
}

/** Verifies the cookie/Bearer token, then uses the account's current permissions rather than its JWT snapshot. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.[ACCESS_COOKIE];
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Please log in.');
  let userId: string;
  try {
    userId = verifyAccessToken(token).sub;
  } catch {
    throw new AppError(401, 'TOKEN_INVALID', 'Your session has expired. Please log in again.');
  }
  // A role can change while the 15-minute token is still valid (for example, first-admin setup).
  // Checking the database also makes demotions, blocked accounts and deletions effective immediately.
  const user = await User.findByPk(userId, { attributes: ['id', 'role', 'status'] });
  if (!user) throw new AppError(401, 'TOKEN_INVALID', 'Your session has expired. Please log in again.');
  if (user.status === 'BLOCKED') throw new AppError(403, 'ACCOUNT_BLOCKED', 'This account is blocked. Contact support.');
  req.user = { id: user.id, role: user.role };
  next();
};

/** Admins can do everything staff can. */
const GRANTS: Record<Role, Role[]> = {
  customer: ['customer'],
  staff: ['staff', 'admin'],
  admin: ['admin'],
  investor: ['investor'],
};

export function authorize(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    const role = req.user?.role;
    if (!role) throw new AppError(401, 'UNAUTHENTICATED', 'Please log in.');
    if (!roles.some((r) => GRANTS[r].includes(role))) throw new AppError(403, 'FORBIDDEN', 'You do not have access to this.');
    next();
  };
}
