import { formatIST } from '../../../utils/dates';
import { formatPaise } from '../../../utils/money';

export const bookingConfirmedMessage = (b: { code: string; startAt: Date; totalPaise: number }) =>
  `Your Valley Ride booking ${b.code} is confirmed for ${formatIST(b.startAt)}. Paid: ${formatPaise(b.totalPaise)}.`;

export const agreementSignedMessage = (code: string) =>
  `Your Valley Ride agreement for ${code} is signed. Ride safe! The signed copy is in the app under Trips.`;

export const returnReminderMessage = (b: { code: string; endAt: Date; place: string }) =>
  `Reminder: return booking ${b.code} at ${b.place} by ${formatIST(b.endAt)}. Running late? Extend from the app so the bike isn't booked for someone else.`;

export const refundMessage = (b: { code: string; amountPaise: number; deposit: boolean }) =>
  `${b.deposit ? 'Your deposit' : 'A refund'} of ${formatPaise(b.amountPaise)} for ${b.code} is on its way to the card or UPI you paid with.`;

export const documentReviewedMessage = (d: { label: string; verified: boolean; note?: string | null }) =>
  d.verified ? `Your ${d.label} is verified. You're all set for pickup.` : `We couldn't accept your ${d.label}${d.note ? ` (${d.note})` : ''}. Please upload a clearer photo in the app before pickup.`;

export const extensionMessage = (b: { code: string; endAt: Date }) =>
  `Booking ${b.code} is extended. New return: ${formatIST(b.endAt)}.`;
