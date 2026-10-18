import type { BookingStatus } from '@valleyride/shared';
import { AppError } from '../../utils/AppError';

/**
 * PENDING_PAYMENT → CONFIRMED → ONGOING → COMPLETED → DEPOSIT_SETTLED, with side exits EXPIRED and CANCELLED.
 * Any transition not listed here is a 409 INVALID_TRANSITION.
 */
export const TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  PENDING_PAYMENT: ['CONFIRMED', 'EXPIRED', 'CANCELLED'],
  CONFIRMED: ['ONGOING', 'CANCELLED'],
  ONGOING: ['COMPLETED'],
  COMPLETED: ['DEPOSIT_SETTLED'],
  DEPOSIT_SETTLED: [],
  CANCELLED: [],
  EXPIRED: [],
};

/**
 * EXTENDED is an action, not a stored status: the booking keeps its status and gets a new end_at,
 * which the bookings_no_overlap exclusion constraint re-checks.
 */
export const EXTENDABLE: readonly BookingStatus[] = ['CONFIRMED', 'ONGOING'];

export const canTransition = (from: BookingStatus, to: BookingStatus) => TRANSITIONS[from].includes(to);

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(409, 'INVALID_TRANSITION', `A booking cannot move from ${from} to ${to}.`);
  }
}
