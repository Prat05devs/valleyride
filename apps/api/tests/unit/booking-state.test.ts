import { describe, expect, it } from 'vitest';
import { BOOKING_STATUSES } from '@valleyride/shared';
import { assertTransition, canTransition, TRANSITIONS } from '../../src/modules/booking/booking.state';
import { AppError } from '../../src/utils/AppError';

describe('booking state machine', () => {
  it('follows the happy path', () => {
    const path = ['PENDING_PAYMENT', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'DEPOSIT_SETTLED'] as const;
    for (let i = 0; i < path.length - 1; i++) expect(canTransition(path[i], path[i + 1])).toBe(true);
  });

  it('allows the side exits', () => {
    expect(canTransition('PENDING_PAYMENT', 'EXPIRED')).toBe(true);
    expect(canTransition('PENDING_PAYMENT', 'CANCELLED')).toBe(true);
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
  });

  it('rejects anything not listed with 409 INVALID_TRANSITION', () => {
    try {
      assertTransition('COMPLETED', 'CONFIRMED');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).status).toBe(409);
      expect((e as AppError).code).toBe('INVALID_TRANSITION');
    }
    expect(canTransition('ONGOING', 'CANCELLED')).toBe(false);
    expect(canTransition('EXPIRED', 'CONFIRMED')).toBe(false);
  });

  it('covers every status and treats terminal states as final', () => {
    expect(Object.keys(TRANSITIONS).sort()).toEqual([...BOOKING_STATUSES].sort());
    expect(TRANSITIONS.DEPOSIT_SETTLED).toEqual([]);
    expect(TRANSITIONS.CANCELLED).toEqual([]);
    expect(TRANSITIONS.EXPIRED).toEqual([]);
  });
});
