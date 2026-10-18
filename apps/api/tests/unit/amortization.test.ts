import { describe, expect, it } from 'vitest';
import { buildSchedule } from '../../src/modules/investor/amortization';

const base = { principalPaise: 250_000_00, annualRatePct: 21, months: 18, startDate: new Date(Date.UTC(2026, 9, 1)) };

describe('buildSchedule()', () => {
  it('gives an EMI of ₹16,311 for ₹2,50,000 at 21% over 18 months', () => {
    const rows = buildSchedule({ ...base, structure: 'amortizing' });
    expect(rows).toHaveLength(18);
    expect(Math.round(rows[0].paymentPaise / 100)).toBe(16_311);
  });

  it('repays exactly the principal, with the last row absorbing rounding', () => {
    const rows = buildSchedule({ ...base, structure: 'amortizing' });
    expect(rows.reduce((s, r) => s + r.principalPaise, 0)).toBe(base.principalPaise);
    expect(rows.at(-1)!.closingPaise).toBe(0);
    rows.slice(1).forEach((r, i) => expect(r.openingPaise).toBe(rows[i].closingPaise));
  });

  it('pays only interest until maturity for interest_only', () => {
    const rows = buildSchedule({ ...base, structure: 'interest_only' });
    const monthlyInterest = Math.round(base.principalPaise * 0.21 / 12);
    rows.slice(0, -1).forEach((r) => {
      expect(r.principalPaise).toBe(0);
      expect(r.interestPaise).toBe(monthlyInterest);
    });
    expect(rows.at(-1)!.principalPaise).toBe(base.principalPaise);
  });

  it('handles a zero rate', () => {
    const rows = buildSchedule({ ...base, annualRatePct: 0, months: 4, structure: 'amortizing' });
    expect(rows.map((r) => r.interestPaise)).toEqual([0, 0, 0, 0]);
    expect(rows.reduce((s, r) => s + r.principalPaise, 0)).toBe(base.principalPaise);
  });
});
