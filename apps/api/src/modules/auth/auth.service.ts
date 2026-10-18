import type { Role } from '@valleyride/shared';
import { User } from '../../db';
import { AppError } from '../../utils/AppError';
import { sendOtp } from '../notification/sms';
import { checkOtp, createOtp } from './otp';
import { issueRefreshToken, rotateRefreshToken, signAccessToken } from './tokens';
import type { OtpRequestInput, OtpVerifyInput } from './auth.schema';

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

export const authService = {
  async requestOtp({ phone, channel }: OtpRequestInput) {
    const code = await createOtp(phone);
    await sendOtp(phone, code, channel);
  },

  /** Verifies the OTP, creating the customer account on first login. */
  async verifyOtp({ phone, code }: OtpVerifyInput): Promise<Session> {
    const result = await checkOtp(phone, code);
    if (result === 'expired') throw new AppError(400, 'OTP_EXPIRED', 'This code has expired. Request a new one.');
    if (result === 'locked') throw new AppError(429, 'OTP_LOCKED', 'Too many wrong codes. Request a new one.');
    if (result === 'invalid') throw new AppError(400, 'OTP_INVALID', 'That code is not right.');

    const [user] = await User.findOrCreate({ where: { phone }, defaults: { phone } });
    if (user.status === 'BLOCKED') throw new AppError(403, 'ACCOUNT_BLOCKED', 'This account is blocked. Contact support.');
    if (!user.phoneVerifiedAt) await user.update({ phoneVerifiedAt: new Date() });
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
