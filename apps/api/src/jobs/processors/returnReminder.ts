import type { Job } from 'bullmq';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../db';
import { notifyUser } from '../../modules/notification/notify';
import { returnReminderMessage } from '../../modules/notification/templates';

/**
 * Evening sweep (18:00 IST): riders whose bike is due back before tomorrow evening get a WhatsApp + push reminder.
 * Running once a day means each booking is reminded once.
 */
export async function returnReminder(_job: Job) {
  const rows = await sequelize.query<{ id: string; user_id: string; code: string; end_at: Date; place: string }>(`
    SELECT b.id, b.user_id, b.code, b.end_at, l.name AS place
    FROM bookings b JOIN locations l ON l.id = b.return_location_id
    WHERE b.status = 'ONGOING' AND b.end_at > now() AND b.end_at <= now() + interval '24 hours'`, { type: QueryTypes.SELECT });
  for (const b of rows) {
    await notifyUser(b.user_id, { title: 'Return due tomorrow', text: returnReminderMessage({ code: b.code, endAt: b.end_at, place: b.place }), data: { bookingId: b.id } });
  }
  return { reminded: rows.length };
}
