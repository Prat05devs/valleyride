export type DateSelection = { start: number; end: number | null; picking: 'start' | 'end' };

/** A pickup tap starts a new range; the next tap completes it, including same-day rentals. */
export function selectDay(state: DateSelection, day: number): DateSelection {
  if (state.picking === 'start' || day < state.start) {
    return { start: day, end: null, picking: 'end' };
  }
  return { ...state, end: day, picking: 'start' };
}

/** Keep the chosen pickup and use the offer's minimum number of full rental days. */
export function offerWindow(startAt: Date, days: number, now = new Date()) {
  const start = startAt <= now ? defaultRentalWindow(now).startAt : new Date(startAt);
  const end = new Date(start.getTime() + days * 86_400_000);
  return { startAt: start, endAt: end };
}
import { defaultRentalWindow } from '@valleyride/shared';
