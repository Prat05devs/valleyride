import { z } from 'zod';

/** Indian mobile number in E.164 form, e.g. +919876543210. */
export const phoneSchema = z.string().regex(/^\+91[6-9]\d{9}$/, 'Enter a valid Indian mobile number');

export const otpRequestSchema = z.object({
  phone: phoneSchema,
  channel: z.enum(['sms', 'whatsapp']).default('sms'),
});
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/),
});
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
