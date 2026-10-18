import type { ReviewInput } from '@valleyride/shared';
import { Booking, Review } from '../../db';
import { AppError } from '../../utils/AppError';

/** One review per booking, after the bike is returned. */
export const reviewService = {
  async get(userId: string, bookingId: string) {
    const r = await Review.findOne({ where: { bookingId, userId } });
    return r ? { rating: r.rating, tags: r.tags, comment: r.comment, createdAt: r.createdAt.toISOString() } : null;
  },

  async put(userId: string, bookingId: string, input: ReviewInput) {
    const booking = await Booking.findOne({ where: { id: bookingId, userId } });
    if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    if (!['COMPLETED', 'DEPOSIT_SETTLED'].includes(booking.status)) throw new AppError(409, 'NOT_RETURNED', 'You can review a ride after returning the bike.');
    const [r] = await Review.upsert({ bookingId, userId, rating: input.rating, tags: input.tags, comment: input.comment ?? null }, { conflictFields: ['booking_id'] as never });
    return { rating: r.rating, tags: r.tags, comment: r.comment };
  },
};
