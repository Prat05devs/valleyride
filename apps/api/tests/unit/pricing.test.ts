import { describe, expect, it } from 'vitest';
import { quote, ONE_WAY_FEE_PAISE } from '@valleyride/shared';

const activa = { pricePerDayPaise: 64_900, depositPaise: 200_000, kmPerDay: 120 };
const hunter = { pricePerDayPaise: 119_900, depositPaise: 500_000, kmPerDay: 200 };
const at = (h: number) => new Date(Date.UTC(2026, 9, 20, 3, 30) + h * 3_600_000);

describe('quote()', () => {
  it('prices a 2-day Activa rental with 18% GST and the deposit on top', () => {
    const q = quote(activa, at(0), at(48));
    expect(q).toMatchObject({
      days: 2, tierPct: 0, kmIncluded: 240, rentalPaise: 129_800, discountPaise: 0, feesPaise: 0,
      taxPaise: 23_364, totalPaise: 153_164, depositPaise: 200_000, payNowPaise: 353_164,
    });
  });

  it('bills any started day as a full day', () => {
    expect(quote(activa, at(0), at(25)).days).toBe(2);
    expect(quote(activa, at(0), at(24)).days).toBe(1);
    expect(quote(activa, at(0), at(5)).days).toBe(1);
  });

  it('rejects rentals shorter than 4 hours', () => {
    expect(() => quote(activa, at(0), at(3.9))).toThrow('MIN_DURATION');
  });

  it('applies the 3-day tier (10%)', () => {
    const q = quote(hunter, at(0), at(72));
    expect(q.tierPct).toBe(10);
    expect(q.discountPaise).toBe(35_970);
    expect(q.taxPaise).toBe(58_271);
    expect(q.totalPaise).toBe(382_001);
  });

  it('applies the coupon after the duration tier', () => {
    const q = quote(activa, at(0), at(7 * 24), { couponPct: 10 });
    expect(q.tierPct).toBe(20);
    expect(q.discountPaise).toBe(90_860 + 36_344);
    expect(q.taxPaise).toBe(58_877);
  });

  it('uses the longest matching tier', () => {
    expect(quote(activa, at(0), at(28 * 24)).tierPct).toBe(35);
    expect(quote(activa, at(0), at(27 * 24)).tierPct).toBe(20);
  });

  it('adds the one-way fee before GST', () => {
    const roundTrip = quote(activa, at(0), at(24));
    const oneWay = quote(activa, at(0), at(24), { oneWay: true });
    expect(oneWay.feesPaise).toBe(ONE_WAY_FEE_PAISE);
    expect(oneWay.totalPaise - roundTrip.totalPaise).toBe(Math.round(ONE_WAY_FEE_PAISE * 1.18));
  });
});
