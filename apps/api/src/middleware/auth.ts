import type { RequestHandler } from 'express';
import type { Role } from '@valleyride/shared';
import { AppError } from '../utils/AppError';
import { ACCESS_COOKIE, verifyAccessToken } from '../modules/auth/tokens';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request { user?: { id: string; role: Role } }
  }
}

/** Accepts the access JWT from the httpOnly cookie (web) or an Authorization: Bearer header (mobile). */
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.[ACCESS_COOKIE];
  if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Please log in.');
  try {
    const claims = verifyAccessToken(token);
    req.user = { id: claims.sub, role: claims.role };
  } catch {
    throw new AppError(401, 'TOKEN_INVALID', 'Your session has expired. Please log in again.');
  }
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
