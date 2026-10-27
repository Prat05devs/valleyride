'use client';

import type { BookingDTO } from '@valleyride/shared';
import { api, ApiError } from './api-client';
import { istInputToIso } from './when';

export const newIdempotencyKey = () => `w-${crypto.randomUUID()}`;

/**
 * Holds a bike for 15 minutes (POST /bookings) and returns the booking id for /checkout/[bookingId].
 * Not logged in → sends the rider to /login and back to the same page afterwards.
 */
export async function holdBike(o: { modelId: string; pickup: string; returnTo: string; from: string; to: string; expectedPayNowPaise?: number }) {
  const body = { vehicleModelId: o.modelId, pickupLocationId: o.pickup, returnLocationId: o.returnTo || o.pickup, startAt: istInputToIso(o.from), endAt: istInputToIso(o.to), expectedPayNowPaise: o.expectedPayNowPaise };
  const fingerprint = JSON.stringify(body);
  const slot = 'valleyride:booking-attempt';
  let attempt: { fingerprint: string; key: string } | null = null;
  try { attempt = JSON.parse(sessionStorage.getItem(slot) ?? 'null'); } catch { /* private browser storage may be unavailable */ }
  if (!attempt || attempt.fingerprint !== fingerprint) attempt = { fingerprint, key: newIdempotencyKey() };
  try { sessionStorage.setItem(slot, JSON.stringify(attempt)); } catch { /* in-memory attempt still works */ }
  try {
    const res = await api.post<{ booking: BookingDTO; razorpayOrderId: string }>('/bookings', body, { idempotencyKey: attempt.key });
    return res.booking.id;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      const next = new URL(window.location.href);
      next.searchParams.set('pickup', o.pickup);
      next.searchParams.set('return', o.returnTo || o.pickup);
      next.searchParams.set('from', o.from); next.searchParams.set('to', o.to);
      window.location.href = `/login?next=${encodeURIComponent(next.pathname + next.search)}`;
      return null;
    }
    if (e instanceof ApiError && ['QUOTE_CHANGED', 'HOLD_EXPIRED'].includes(e.code)) { try { sessionStorage.removeItem(slot); } catch { /* unavailable storage */ } }
    throw e;
  }
}
