import { describe, expect, it } from 'vitest';
import { cancellationRefund, lateFeePerHourPaise, returnCharges } from '@valleyride/shared';

const now = new Date('2026-10-20T03:30:00Z');
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3_600_000);

describe('cancellationRefund', () => {
  const b = { totalPaise: 882_001, depositPaise: 500_000 };
  it('refunds everything more than 24 h before pickup', () => {
    expect(cancellationRefund({ ...b, startAt: hoursFromNow(25) }, now)).toEqual({ pct: 100, rentalPaidPaise: 382_001, rentalRefundPaise: 382_001, depositRefundPaise: 500_000, refundPaise: 882_001 });
  });
  it('refunds half the rental within 24 h, and the whole deposit', () => {
    expect(cancellationRefund({ ...b, startAt: hoursFromNow(24) }, now)).toMatchObject({ pct: 50, rentalRefundPaise: 191_001, refundPaise: 691_001 });
  });
});

describe('returnCharges', () => {
  const booking = { kmIncluded: 600, endAt: hoursFromNow(0), depositPaise: 500_000 };
  const hunter = { extraKmPaise: 600, pricePerDayPaise: 119_900 };
  it('matches the design: 57 km over at ₹6 plus GST comes out of a ₹5,000 deposit', () => {
    const c = returnCharges(booking, hunter, { odometerStartKm: 1055, odometerEndKm: 1712, returnedAt: hoursFromNow(-0.13) });
    expect(c).toMatchObject({ kmRidden: 657, extraKm: 57, extraKmPaise: 34_200, extraKmTaxPaise: 6_156, lateHours: 0, refundPaise: 459_644, owedPaise: 0 });
  });
  it('charges every started late hour at an eighth of the day price', () => {
    expect(lateFeePerHourPaise(119_900)).toBe(14_988);
    const c = returnCharges(booking, hunter, { odometerStartKm: 0, odometerEndKm: 10, returnedAt: hoursFromNow(1.01) });
    expect(c).toMatchObject({ lateHours: 2, lateFeePaise: 29_976, lateFeeTaxPaise: 5_396 });
  });
  it('reports anything above the deposit as owed', () => {
    const c = returnCharges(booking, hunter, { odometerStartKm: 0, odometerEndKm: 600, returnedAt: hoursFromNow(0), damagePaise: 700_000 });
    expect(c).toMatchObject({ refundPaise: 0, owedPaise: 200_000 });
  });
});
