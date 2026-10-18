export interface PricingModel {
  pricePerDayPaise: number; depositPaise: number; kmPerDay: number;
}
export interface Tier { minDays: number; pct: number }
/** `tiers` comes from the pricing_rules table (longest first); without it the launch tiers below apply. */
export interface QuoteOptions { oneWay?: boolean; couponPct?: number; tiers?: readonly Tier[] }

export const DURATION_TIERS = [            // longest tier first
  { minDays: 28, pct: 35 },
  { minDays: 7,  pct: 20 },
  { minDays: 3,  pct: 10 },
] as const;
export const ONE_WAY_FEE_PAISE = 40_000;   // ₹400
export const GST_PCT = 18;                 // confirm the rate with the CA before launch
export const MIN_HOURS = 4;

export function quote(m: PricingModel, startAt: Date, endAt: Date, o: QuoteOptions = {}) {
  const hours = (endAt.getTime() - startAt.getTime()) / 3_600_000;
  if (hours < MIN_HOURS) throw new Error('MIN_DURATION');
  const days = Math.max(1, Math.ceil(hours / 24 - 1e-9));

  const rentalPaise   = m.pricePerDayPaise * days;
  const tierPct       = (o.tiers ?? DURATION_TIERS).find(t => days >= t.minDays)?.pct ?? 0;
  const tierOff       = Math.round(rentalPaise * tierPct / 100);
  const couponOff     = Math.round((rentalPaise - tierOff) * (o.couponPct ?? 0) / 100);
  const discountPaise = tierOff + couponOff;
  const feesPaise     = o.oneWay ? ONE_WAY_FEE_PAISE : 0;
  const taxable       = rentalPaise - discountPaise + feesPaise;
  const taxPaise      = Math.round(taxable * GST_PCT / 100);

  return {
    days, tierPct, kmIncluded: m.kmPerDay * days,
    rentalPaise, discountPaise, feesPaise, taxPaise,
    depositPaise: m.depositPaise,
    totalPaise: taxable + taxPaise,                     // non-refundable charges
    payNowPaise: taxable + taxPaise + m.depositPaise,   // charged at checkout
  };
}

export type Quote = ReturnType<typeof quote>;
