'use client';

import type { BookingDTO } from '@valleyride/shared';
import { api, ApiError } from './api-client';
import { istInputToIso } from './when';

export const newIdempotencyKey = () => `w-${crypto.randomUUID()}`;

/**
 * Holds a bike for 15 minutes (POST /bookings) and returns the booking id for /checkout/[bookingId].
 * Not logged in → sends the rider to /login and back to the same page afterwards.
 */
export async function holdBike(o: { modelId: string; pickup: string; returnTo: string; from: string; to: string }) {
  try {
    const res = await api.post<{ booking: BookingDTO; razorpayOrderId: string }>('/bookings', {
      vehicleModelId: o.modelId, pickupLocationId: o.pickup, returnLocationId: o.returnTo || o.pickup,
      startAt: istInputToIso(o.from), endAt: istInputToIso(o.to),
    }, { idempotencyKey: newIdempotencyKey() });
    return res.booking.id;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return null;
    }
    throw e;
  }
}
