import { z } from 'zod';
import type { BookingDTO } from './booking';

/** Public checkout settings only. API and webhook secrets never leave the backend. */
export const paymentConfigSchema = z.object({
  keyId: z.string().nullable(),
  enabled: z.boolean(),
  mode: z.enum(['mock', 'test', 'live', 'unconfigured']),
  currency: z.literal('INR'),
});
export type PaymentConfig = z.infer<typeof paymentConfigSchema>;

/**
 * POST /payments/verify (and the dev simulate route): the booking after the payment, and whether that payment was
 * refunded because it arrived after the hold ended or the extension no longer fitted (the bike was booked meanwhile).
 */
export type PaymentResultDTO = BookingDTO & { paymentRefunded: boolean };
