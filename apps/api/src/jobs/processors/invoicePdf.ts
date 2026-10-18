import type { Job } from 'bullmq';
import { Booking } from '../../db';
import { invoiceFor } from '../../modules/booking/booking.invoice';
import { invoicePdf as render } from '../../modules/booking/invoice-pdf';
import { presignGet, putObject } from '../../modules/kyc/s3-presign';
import { notifyUser } from '../../modules/notification/notify';
import { bookingConfirmedMessage } from '../../modules/notification/templates';
import { env } from '../../config/env';

/** After payment.captured: stores the booking invoice PDF and sends the confirmation with the invoice attached. */
export async function invoicePdf(job: Job<{ bookingId: string }>) {
  const booking = await Booking.findByPk(job.data.bookingId);
  if (!booking) return { skipped: 'not found' };
  const inv = await invoiceFor(null, booking.id);
  const key = `invoices/${booking.id}/${inv.number}.pdf`;
  await putObject(key, await render(inv), 'application/pdf');
  const origin = env.NODE_ENV === 'production' ? 'https://api.valleyride.in' : `http://localhost:${env.PORT}`;
  await notifyUser(booking.userId, {
    title: `Booking ${booking.code} confirmed`,
    text: bookingConfirmedMessage({ code: booking.code, startAt: booking.startAt, totalPaise: Number(booking.totalPaise) }),
    data: { bookingId: booking.id },
    document: { url: await presignGet(key, origin), filename: `${inv.number}.pdf` },
  });
  return { invoice: inv.number };
}
