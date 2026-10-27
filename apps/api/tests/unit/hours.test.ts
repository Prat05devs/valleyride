import { describe, expect, it } from 'vitest';
import { defaultRentalWindow, deskOpenAt } from '@valleyride/shared';

describe('India rental desk times', () => {
  it('uses tomorrow in India over UTC and month/year boundaries', () => {
    expect(defaultRentalWindow(new Date('2026-12-31T20:00:00Z')).startAt.toISOString()).toBe('2027-01-02T03:30:00.000Z');
    expect(defaultRentalWindow(new Date('2026-10-31T17:00:00Z')).startAt.toISOString()).toBe('2026-11-01T03:30:00.000Z');
  });
  it('checks desk boundaries in IST independently of the process time zone', () => {
    const hours = { 'mon-sun': '08:00-20:00' };
    expect(deskOpenAt(hours, new Date('2026-10-26T02:29:00Z'))).toBe(false);
    expect(deskOpenAt(hours, new Date('2026-10-26T02:30:00Z'))).toBe(true);
    expect(deskOpenAt(hours, new Date('2026-10-26T14:30:00Z'))).toBe(true);
    expect(deskOpenAt(hours, new Date('2026-10-26T14:31:00Z'))).toBe(false);
    expect(deskOpenAt({ 'mon-fri': '08:00-20:00' }, new Date('2026-10-25T03:30:00Z'))).toBe(false);
  });
});
