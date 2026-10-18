import { z } from 'zod';
import { MIN_HOURS } from '../pricing';

export const uuid = z.string().uuid();

/** Adds the rental-window rule to an object with startAt/endAt, so quote() never sees a window shorter than MIN_HOURS. */
export function withRentalWindow<T extends z.ZodType<{ startAt: Date; endAt: Date }, z.ZodTypeDef, unknown>>(schema: T): z.ZodEffects<T> {
  return schema
    .refine((w) => w.endAt.getTime() - w.startAt.getTime() >= MIN_HOURS * 3_600_000, {
      message: `Rentals are at least ${MIN_HOURS} hours`,
      path: ['endAt'],
    })
    // As in the prototype: a pickup more than 30 minutes in the past is a mistake, not a booking.
    .refine((w) => w.startAt.getTime() >= Date.now() - 30 * 60_000, {
      message: 'The pickup time is in the past',
      path: ['startAt'],
    }) as unknown as z.ZodEffects<T>;
}
