export interface PricingModel {
  /** Customer-facing day rate, including GST. */
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
export const GST_PCT = 18;                 // included in the owner-supplied rates
export const MIN_HOURS = 4;

/** Reverse GST out of a listed amount; never add tax to an inclusive customer-facing rate. */
export function splitInclusiveGst(grossPaise: number) {
  const netPaise = Math.round(grossPaise * 100 / (100 + GST_PCT));
  return { netPaise, taxPaise: grossPaise - netPaise };
}

export function quote(m: PricingModel, startAt: Date, endAt: Date, o: QuoteOptions = {}) {
  const hours = (endAt.getTime() - startAt.getTime()) / 3_600_000;
  if (!Number.isFinite(hours) || hours < MIN_HOURS) throw new Error('MIN_DURATION');
  const days = Math.max(1, Math.ceil(hours / 24 - 1e-9));

  const rentalInclGstPaise = m.pricePerDayPaise * days;
  const tierPct       = (o.tiers ?? DURATION_TIERS).find(t => days >= t.minDays)?.pct ?? 0;
  const tierDiscountInclGstPaise = Math.round(rentalInclGstPaise * tierPct / 100);
  const couponDiscountInclGstPaise = Math.round((rentalInclGstPaise - tierDiscountInclGstPaise) * (o.couponPct ?? 0) / 100);
  const discountInclGstPaise = tierDiscountInclGstPaise + couponDiscountInclGstPaise;
  const feesInclGstPaise = o.oneWay ? ONE_WAY_FEE_PAISE : 0;
  const discountedRental = splitInclusiveGst(rentalInclGstPaise - discountInclGstPaise);
  // Retain the existing tax-exclusive accounting fields for stored bookings and invoices.
  const rentalPaise = splitInclusiveGst(rentalInclGstPaise).netPaise;
  const discountPaise = rentalPaise - discountedRental.netPaise;
  const fees = splitInclusiveGst(feesInclGstPaise);
  const feesPaise = fees.netPaise;
  const taxPaise = discountedRental.taxPaise + fees.taxPaise;
  const totalPaise = rentalInclGstPaise - discountInclGstPaise + feesInclGstPaise;

  return {
    days, tierPct, kmIncluded: m.kmPerDay * days,
    rentalPaise, discountPaise, feesPaise, taxPaise,
    depositPaise: m.depositPaise,
    totalPaise,                                       // GST already included
    payNowPaise: totalPaise + m.depositPaise,           // deposit carries no added GST
    pricesIncludeGst: true as const,
    pricePerDayInclGstPaise: m.pricePerDayPaise,
    rentalInclGstPaise, discountInclGstPaise, feesInclGstPaise,
    tierDiscountInclGstPaise, couponDiscountInclGstPaise,
    durationTiers: [...(o.tiers ?? DURATION_TIERS)],
  };
}

export type Quote = ReturnType<typeof quote>;
