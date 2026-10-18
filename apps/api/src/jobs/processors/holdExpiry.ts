import type { Job } from 'bullmq';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../db';
import { logger } from '../../utils/logger';

/**
 * Expires unpaid holds. Runs per booking (a delayed job queued when the hold is created) and as a
 * once-a-minute sweep, which uses the (status, hold_expires_at) index and catches any hold whose
 * delayed job was never queued.
 */
export async function holdExpiry(job: Job<{ bookingId?: string }>) {
  const rows = await sequelize.query<{ id: string }>(
    `UPDATE bookings SET status = 'EXPIRED', updated_at = now()
     WHERE status = 'PENDING_PAYMENT' AND hold_expires_at <= now()
       ${job.data.bookingId ? 'AND id = :bookingId' : ''}
     RETURNING id`,
    { replacements: { bookingId: job.data.bookingId }, type: QueryTypes.SELECT },
  );
  if (rows.length) logger.info({ expired: rows.map((r) => r.id) }, 'holds expired');
  return { expired: rows.length };
}
