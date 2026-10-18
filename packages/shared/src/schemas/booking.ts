import { z } from 'zod';
import { uuid, withRentalWindow } from './common';
import type { BookingStatus } from '../constants';

export const availabilityQuerySchema = withRentalWindow(
  z.object({ startAt: z.coerce.date(), endAt: z.coerce.date(), pickup: uuid.optional(), return: uuid.optional() }),
);
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export const quoteRequestSchema = withRentalWindow(
  z.object({
    vehicleModelId: uuid,
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    pickupLocationId: uuid,
    returnLocationId: uuid,
    couponCode: z.string().trim().toUpperCase().max(32).optional(),
  }),
);
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const createBookingSchema = quoteRequestSchema;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

export const extendBookingSchema = z.object({ endAt: z.coerce.date() });
export type ExtendBookingInput = z.infer<typeof extendBookingSchema>;

export interface BookingDTO {
  id: string;
  code: string;
  status: BookingStatus;
  vehicleModelId: string;
  pickupLocationId: string;
  returnLocationId: string;
  startAt: string;
  endAt: string;
  holdExpiresAt: string | null;
  billableDays: number;
  kmIncluded: number;
  rentalPaise: number;
  discountPaise: number;
  feesPaise: number;
  taxPaise: number;
  depositPaise: number;
  totalPaise: number;
  couponCode: string | null;
  /** Duration discount applied at booking time (the coupon is the rest of discountPaise). */
  tierPct: number;
  /** GET /bookings/:id only: the unpaid Razorpay order while the hold lasts, so the app can resume paying. */
  pendingOrderId?: string | null;
}
