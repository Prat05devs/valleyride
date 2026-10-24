import type { Role } from '@valleyride/shared';
import { User } from '../../db';
import { AppError } from '../../utils/AppError';
import { audit, type Actor } from '../../utils/audit';
import { isDemoLogin } from './demo';
import { dummyHash, hashPassword, temporaryPassword, verifyPassword } from './password';
import { issueRefreshToken, revokeAllRefreshTokens, rotateRefreshToken, signAccessToken } from './tokens';
import type { ChangePasswordInput, LoginInput, RegisterInput } from './auth.schema';

export interface Session {
  user: { id: string; role: Role; fullName: string | null; phone: string };
  accessToken: string;
  refreshToken: string;
}

async function sessionFor(user: User): Promise<Session> {
  return {
    user: { id: user.id, role: user.role, fullName: user.fullName, phone: user.phone },
    accessToken: signAccessToken(user),
    refreshToken: await issueRefreshToken(user.id),
  };
}

const WRONG = () => new AppError(401, 'LOGIN_FAILED', 'That phone number and password don\'t match.');

export const authService = {
  /** New customer account. The name and documents are added in the next steps. */
  async register({ phone, password }: RegisterInput): Promise<Session> {
    if (await User.findOne({ where: { phone }, attributes: ['id'] })) {
      throw new AppError(409, 'ALREADY_REGISTERED', 'This number already has an account. Log in instead.');
    }
    const user = await User.create({ phone, fullName: null, email: null, phoneVerifiedAt: null, passwordHash: await hashPassword(password) });
    return sessionFor(user);
  },

  async login({ phone, password }: LoginInput): Promise<Session> {
    const user = await User.findOne({ where: { phone } });
    if (!user) { await verifyPassword(password, await dummyHash()); throw WRONG(); } // same timing as a wrong password
    const ok = isDemoLogin(phone, password) || (user.passwordHash ? await verifyPassword(password, user.passwordHash) : false);
    if (!ok) {
      if (!user.passwordHash) throw new AppError(401, 'NO_PASSWORD', 'This account has no password yet. Ask support to set one for you.');
      throw WRONG();
    }
    if (user.status === 'BLOCKED') throw new AppError(403, 'ACCOUNT_BLOCKED', 'This account is blocked. Contact support.');
    return sessionFor(user);
  },

  async refresh(refreshToken: string): Promise<Session> {
    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) throw new AppError(401, 'REFRESH_INVALID', 'Please log in again.');
    const user = await User.findByPk(rotated.userId);
    if (!user || user.status === 'BLOCKED') throw new AppError(401, 'REFRESH_INVALID', 'Please log in again.');
    return {
      user: { id: user.id, role: user.role, fullName: user.fullName, phone: user.phone },
      accessToken: signAccessToken(user),
      refreshToken: rotated.refreshToken,
    };
  },

  /** Signs every other device out and returns a fresh session for this one. */
  async changePassword(userId: string, { currentPassword, newPassword }: ChangePasswordInput): Promise<Session> {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    if (!user.passwordHash || !(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new AppError(400, 'WRONG_PASSWORD', 'Your current password is not right.');
    }
    await user.update({ passwordHash: await hashPassword(newPassword) });
    await revokeAllRefreshTokens(user.id);
    return sessionFor(user);
  },

  /**
   * Staff give a rider who forgot their password a temporary one (read out or sent on WhatsApp); every device is
   * signed out. Staff can reset customers only; admins can reset anyone.
   */
  async resetPassword(actor: Actor & { role: Role }, phone: string) {
    const user = await User.findOne({ where: { phone } });
    if (!user) throw new AppError(404, 'NOT_FOUND', 'No account uses this number.');
    if (actor.role !== 'admin' && user.role !== 'customer') throw new AppError(403, 'FORBIDDEN', 'Only an admin can reset a staff, admin or investor password.');
    const password = temporaryPassword();
    await user.update({ passwordHash: await hashPassword(password) });
    await revokeAllRefreshTokens(user.id);
    await audit(actor, { action: 'user.password_reset', entity: 'user', entityId: user.id, diff: { phone } });
    return { name: user.fullName, phone: user.phone, temporaryPassword: password };
  },

  async me(userId: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    return { id: user.id, role: user.role, fullName: user.fullName, phone: user.phone, email: user.email };
  },

  async updateMe(userId: string, patch: { fullName?: string; email?: string | null }) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
    await user.update(patch);
    return { id: user.id, role: user.role, fullName: user.fullName, phone: user.phone, email: user.email };
  },
};
