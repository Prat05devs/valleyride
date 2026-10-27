import { describe, expect, it } from 'vitest';
import { quote, ONE_WAY_FEE_PAISE } from '@valleyride/shared';

const activa = { pricePerDayPaise: 64_900, depositPaise: 200_000, kmPerDay: 120 };
const hunter = { pricePerDayPaise: 119_900, depositPaise: 500_000, kmPerDay: 200 };
const at = (h: number) => new Date(Date.UTC(2026, 9, 20, 3, 30) + h * 3_600_000);

describe('quote()', () => {
  it('keeps a listed one-day Activa rate at ₹649 including GST', () => {
    expect(quote(activa, at(0), at(24))).toMatchObject({ rentalPaise: 55_000, taxPaise: 9_900, totalPaise: 64_900, payNowPaise: 264_900, rentalInclGstPaise: 64_900 });
  });

  it('extracts included GST from a 2-day rental and adds only the refundable deposit', () => {
    const q = quote(activa, at(0), at(48));
    expect(q).toMatchObject({
      days: 2, tierPct: 0, kmIncluded: 240, rentalPaise: 110_000, discountPaise: 0, feesPaise: 0,
      taxPaise: 19_800, totalPaise: 129_800, depositPaise: 200_000, payNowPaise: 329_800,
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
    expect(q.discountInclGstPaise).toBe(35_970);
    expect(q.totalPaise).toBe(323_730);
    expect(q.rentalPaise - q.discountPaise + q.taxPaise).toBe(q.totalPaise);
  });

  it('applies the coupon after the duration tier', () => {
    const q = quote(activa, at(0), at(7 * 24), { couponPct: 10 });
    expect(q.tierPct).toBe(20);
    expect(q.discountInclGstPaise).toBe(90_860 + 36_344);
    expect(q.totalPaise).toBe(327_096);
  });

  it('uses the longest matching tier', () => {
    expect(quote(activa, at(0), at(28 * 24)).tierPct).toBe(35);
    expect(quote(activa, at(0), at(27 * 24)).tierPct).toBe(20);
  });

  it('keeps the ₹400 one-way fee GST-inclusive too', () => {
    const roundTrip = quote(activa, at(0), at(24));
    const oneWay = quote(activa, at(0), at(24), { oneWay: true });
    expect(oneWay.feesInclGstPaise).toBe(ONE_WAY_FEE_PAISE);
    expect(oneWay.totalPaise - roundTrip.totalPaise).toBe(ONE_WAY_FEE_PAISE);
  });

  it('balances GST, discounts, fees and deposits to the paise for every published rate and duration', () => {
    for (const rate of [64_900, 119_900, 179_900, 219_900]) {
      for (const days of [1, 2, 3, 6, 7, 27, 28, 45]) {
        for (const couponPct of [0, 10, 25, 50]) {
          const q = quote({ ...activa, pricePerDayPaise: rate }, at(0), at(days * 24), { couponPct, oneWay: true });
          expect(q.totalPaise).toBe(q.rentalInclGstPaise - q.discountInclGstPaise + q.feesInclGstPaise);
          expect(q.rentalPaise - q.discountPaise + q.feesPaise + q.taxPaise).toBe(q.totalPaise);
          expect(q.payNowPaise).toBe(q.totalPaise + q.depositPaise);
          expect(q.taxPaise).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });
});
