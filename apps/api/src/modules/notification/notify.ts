import { User } from '../../db';
import { logger } from '../../utils/logger';
import { sendEmail } from './email';
import { sendPush } from './push';
import { sendWhatsApp } from './whatsapp';
import { env } from '../../config/env';

/**
 * One call per event: WhatsApp to the rider's phone and a push to their app. A delivery failure is logged and never
 * fails the business action that triggered it (the booking is already confirmed, the refund already sent).
 */
export async function notifyUser(userId: string, msg: { title: string; text: string; data?: Record<string, string>; document?: { url: string; filename: string } }) {
  const user = await User.findByPk(userId, { attributes: ['phone', 'email'] }).catch((err) => { logger.error({ err, userId }, 'notification lookup failed'); return null; });
  if (!user) return;
  const results = await Promise.allSettled([
    sendWhatsApp(user.phone, msg.text, msg.document),
    sendPush(userId, msg.title, msg.text, msg.data),
  ]);
  for (const r of results) if (r.status === 'rejected') logger.error({ err: r.reason, userId, title: msg.title }, 'notification failed');
}

/** Staff alerts (document expiry, late repayments) to OPS_EMAIL and the admins' WhatsApp. */
export async function notifyOps(subject: string, text: string) {
  const admins = await User.findAll({ where: { role: 'admin', status: 'ACTIVE' }, attributes: ['phone'] });
  const results = await Promise.allSettled([
    ...(env.OPS_EMAIL ? [sendEmail(env.OPS_EMAIL, subject, text)] : []),
    ...admins.map((a) => sendWhatsApp(a.phone, `${subject}\n${text}`)),
  ]);
  for (const r of results) if (r.status === 'rejected') logger.error({ err: r.reason, subject }, 'ops alert failed');
}
