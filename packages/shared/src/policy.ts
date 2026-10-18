import { GST_PCT } from './pricing';

/**
 * Cancellation policy from the architecture document's booking prototype: full refund of the rental more than
 * 24 h before pickup, 50% within 24 h; the deposit is always refunded. Confirm with the owner before launch.
 */
export const FULL_REFUND_HOURS = 24;
export const LATE_REFUND_PCT = 50;

export function cancellationRefund(b: { totalPaise: number; depositPaise: number; startAt: Date | string }, now = new Date()) {
  const rentalPaidPaise = b.totalPaise - b.depositPaise;
  const hoursToPickup = (new Date(b.startAt).getTime() - now.getTime()) / 3_600_000;
  const pct = hoursToPickup > FULL_REFUND_HOURS ? 100 : LATE_REFUND_PCT;
  const rentalRefundPaise = Math.round((rentalPaidPaise * pct) / 100);
  return { pct, rentalPaidPaise, rentalRefundPaise, depositRefundPaise: b.depositPaise, refundPaise: rentalRefundPaise + b.depositPaise };
}
export type CancellationRefund = ReturnType<typeof cancellationRefund>;

/** Late return fee from the same prototype: one eighth of the day price per started hour. */
export const lateFeePerHourPaise = (pricePerDayPaise: number) => Math.round(pricePerDayPaise / 8);

/** Minutes after end_at before the late fee starts. 0 until the owner sets a grace period. */
export const LATE_GRACE_MINUTES = 0;

/**
 * What comes out of the deposit at return: extra km and late hours (both plus GST) and any damage from the
 * inspection checklist. Anything above the deposit is shown as still owed.
 */
export function returnCharges(
  b: { kmIncluded: number; endAt: Date | string; depositPaise: number },
  m: { extraKmPaise: number; pricePerDayPaise: number },
  r: { odometerStartKm: number; odometerEndKm: number; returnedAt: Date | string; damagePaise?: number },
) {
  const kmRidden = Math.max(0, r.odometerEndKm - r.odometerStartKm);
  const extraKm = Math.max(0, kmRidden - b.kmIncluded);
  const extraKmPaise = extraKm * m.extraKmPaise;
  const lateMinutes = (new Date(r.returnedAt).getTime() - new Date(b.endAt).getTime()) / 60_000 - LATE_GRACE_MINUTES;
  const lateHours = lateMinutes > 0 ? Math.ceil(lateMinutes / 60) : 0;
  const lateFeePaise = lateHours * lateFeePerHourPaise(m.pricePerDayPaise);
  const extraKmTaxPaise = Math.round((extraKmPaise * GST_PCT) / 100);
  const lateFeeTaxPaise = Math.round((lateFeePaise * GST_PCT) / 100);
  const taxPaise = extraKmTaxPaise + lateFeeTaxPaise;
  const damagePaise = r.damagePaise ?? 0;
  const deductionPaise = extraKmPaise + lateFeePaise + taxPaise + damagePaise;
  const refundPaise = Math.max(0, b.depositPaise - deductionPaise);
  return {
    kmRidden, extraKm, extraKmPaise, extraKmTaxPaise, lateHours, lateFeePaise, lateFeeTaxPaise, taxPaise, damagePaise, deductionPaise,
    refundPaise, owedPaise: Math.max(0, deductionPaise - b.depositPaise),
  };
}
export type ReturnCharges = ReturnType<typeof returnCharges>;
