import { z } from 'zod';

export { otpRequestSchema, otpVerifySchema } from '@valleyride/shared';
export type { OtpRequestInput, OtpVerifyInput } from '@valleyride/shared';

export const updateMeSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(254).nullable().optional(),
}).refine((v) => v.fullName !== undefined || v.email !== undefined, 'Nothing to update');

/** Expo push token from expo-notifications getExpoPushTokenAsync(). */
export const pushTokenSchema = z.object({
  token: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[[\w-]+\]$/, 'Not an Expo push token'),
  platform: z.enum(['ios', 'android']),
});
