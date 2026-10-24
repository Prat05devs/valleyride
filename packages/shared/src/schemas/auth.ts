import { z } from 'zod';

/** Indian mobile number in E.164 form, e.g. +919876543210. */
export const phoneSchema = z.string().regex(/^\+91[6-9]\d{9}$/, 'Enter a valid Indian mobile number');

/** Length is what makes a password strong (NIST SP 800-63B): at least 8 characters, no other rules. */
export const passwordSchema = z.string().min(8, 'Use at least 8 characters').max(128, 'Use at most 128 characters');

export const loginSchema = z.object({ phone: phoneSchema, password: z.string().min(1).max(128) });
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({ phone: phoneSchema, password: passwordSchema });
export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Staff: give a rider who forgot their password a temporary one. */
export const passwordResetSchema = z.object({ phone: phoneSchema });
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
