import { getQueue } from '../../jobs/queue';

export const bookingJobs = {
  /** Expires the hold if it is still unpaid. A few seconds of slack so hold_expires_at has passed when it runs. */
  async scheduleHoldExpiry(bookingId: string, minutes: number) {
    await getQueue('bookings').add('holdExpiry', { bookingId }, { delay: minutes * 60_000 + 5_000, jobId: `hold-${bookingId}` });
  },
};
