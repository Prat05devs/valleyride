import { QueryTypes } from 'sequelize';
import { sequelize } from '../../db';

const PAID = `('CONFIRMED','ONGOING','COMPLETED','DEPOSIT_SETTLED')`;
const q = <T extends object>(sql: string, replacements: Record<string, unknown>) => sequelize.query<T>(sql, { replacements, type: QueryTypes.SELECT });
const n = (v: unknown) => Number(v ?? 0);

/** [start, end) of a YYYY-MM month in IST. */
function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const start = new Date(Date.UTC(y, m - 1, 1) - 5.5 * 3_600_000);
  const end = new Date(Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1) - 5.5 * 3_600_000);
  return { start, end };
}
export const previousMonth = (month: string) => {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
};

export const reportsService = {
  /** Share of each vehicle's hours in [from, to) taken by paid bookings, rolled up by model. */
  async utilisation(from: Date, to: Date) {
    const rows = await q<{ vehicle_id: string; registration_no: string; status: string; model_id: string; model: string; booked_hours: number }>(`
      SELECT v.id AS vehicle_id, v.registration_no, v.status, m.id AS model_id, m.name AS model,
             COALESCE(SUM(EXTRACT(EPOCH FROM (LEAST(b.end_at, :to) - GREATEST(b.start_at, :from))) / 3600), 0)::float AS booked_hours
      FROM vehicles v
      JOIN vehicle_models m ON m.id = v.vehicle_model_id
      LEFT JOIN bookings b ON b.vehicle_id = v.id AND b.status IN ${PAID} AND b.start_at < :to AND b.end_at > :from
      WHERE v.status <> 'RETIRED'
      GROUP BY v.id, m.id ORDER BY m.price_day_paise, v.registration_no`, { from, to });
    const hours = (to.getTime() - from.getTime()) / 3_600_000;
    const vehicles = rows.map((r) => ({ vehicleId: r.vehicle_id, registrationNo: r.registration_no, status: r.status, modelId: r.model_id, model: r.model, bookedHours: Math.round(r.booked_hours), pct: Math.round((r.booked_hours / hours) * 100) }));
    const models = [...new Map(vehicles.map((v) => [v.modelId, v.model])).entries()].map(([modelId, model]) => {
      const vs = vehicles.filter((v) => v.modelId === modelId);
      return { modelId, model, units: vs.length, pct: Math.round(vs.reduce((s, v) => s + v.pct, 0) / vs.length) };
    });
    return { from: from.toISOString(), to: to.toISOString(), hours, vehicles, models };
  },

  /**
   * Monthly P&L in paise, recognised by pickup month for rentals and by return month for extras.
   * Gateway fees and fixed costs (staff, rent, insurance) are not recorded in the system, so they are null.
   */
  async pnl(month: string) {
    const { start, end } = monthRange(month);
    const r = { start, end };
    const [rental] = await q<{ rental: number; fees: number; tax: number; bookings: number }>(`
      SELECT SUM(rental_paise - discount_paise) AS rental, SUM(fees_paise) AS fees, SUM(tax_paise) AS tax, COUNT(*)::int AS bookings
      FROM bookings WHERE status IN ${PAID} AND start_at >= :start AND start_at < :end`, r);
    const [extras] = await q<{ extra_km: number; late: number; tax: number; damage: number }>(`
      SELECT SUM((charges->>'extraKmPaise')::bigint) AS extra_km, SUM((charges->>'lateFeePaise')::bigint) AS late,
             SUM((charges->>'taxPaise')::bigint) AS tax, SUM((charges->>'damagePaise')::bigint) AS damage
      FROM handovers WHERE type = 'RETURN' AND created_at >= :start AND created_at < :end`, r);
    const [kept] = await q<{ kept: number }>(`
      SELECT SUM(paid - refunded) AS kept FROM (
        SELECT b.id,
          COALESCE(SUM(p.amount_paise) FILTER (WHERE p.kind IN ('RENTAL','EXTRA') AND p.status IN ('CAPTURED','REFUNDED')), 0) AS paid,
          COALESCE(SUM(p.amount_paise) FILTER (WHERE p.kind = 'REFUND'), 0) AS refunded
        FROM bookings b JOIN payments p ON p.booking_id = b.id
        WHERE b.status = 'CANCELLED' AND b.updated_at >= :start AND b.updated_at < :end GROUP BY b.id) x`, r);
    const [maint] = await q<{ cost: number }>(`SELECT SUM(cost_paise) AS cost FROM maintenance_records WHERE performed_on >= (:start AT TIME ZONE 'Asia/Kolkata')::date AND performed_on < (:end AT TIME ZONE 'Asia/Kolkata')::date`, r);
    const [repaid] = await q<{ paid: number }>(`SELECT SUM(principal_paise + interest_paise) AS paid FROM repayment_schedules WHERE status = 'PAID' AND paid_at >= :start AND paid_at < :end`, r);
    const [held] = await q<{ held: number }>(`SELECT SUM(deposit_paise) AS held FROM bookings WHERE status IN ('CONFIRMED','ONGOING','COMPLETED')`, {});
    const byModel = await q<{ model: string; slug: string; rental: number }>(`
      SELECT m.name AS model, m.slug, COALESCE(SUM(b.rental_paise - b.discount_paise), 0) AS rental
      FROM vehicle_models m LEFT JOIN bookings b ON b.vehicle_model_id = m.id AND b.status IN ${PAID} AND b.start_at >= :start AND b.start_at < :end
      GROUP BY m.id ORDER BY m.price_day_paise`, r);

    const rentalPaise = n(rental?.rental);
    const extrasPaise = n(rental?.fees) + n(extras?.extra_km) + n(extras?.late);
    const maintenancePaise = n(maint?.cost);
    const repaymentsPaise = n(repaid?.paid);
    return {
      month,
      bookings: rental?.bookings ?? 0,
      rentalRevenuePaise: rentalPaise,
      extrasPaise,
      cancellationKeptPaise: n(kept?.kept),
      damageRecoveredPaise: n(extras?.damage),
      gstCollectedPaise: n(rental?.tax) + n(extras?.tax),
      depositsHeldPaise: n(held?.held),
      maintenancePaise,
      gatewayFeesPaise: null as number | null,
      fixedCostsPaise: null as number | null,
      investorRepaymentsPaise: repaymentsPaise,
      beforeFixedCostsPaise: rentalPaise + extrasPaise - maintenancePaise - repaymentsPaise,
      byModel: byModel.map((m) => ({ model: m.model, slug: m.slug, rentalPaise: n(m.rental) })),
    };
  },
};

export function pnlCsv(rows: Awaited<ReturnType<typeof reportsService.pnl>>[]) {
  const rupees = (p: number | null) => (p === null ? '' : (p / 100).toFixed(2));
  const lines: [string, (r: (typeof rows)[number]) => number | null][] = [
    ['Rental revenue (after discounts, before GST)', (r) => r.rentalRevenuePaise],
    ['Extra km, late and one-way fees', (r) => r.extrasPaise],
    ['Cancellation charges kept (incl. GST)', (r) => r.cancellationKeptPaise],
    ['Damage recovered from deposits', (r) => r.damageRecoveredPaise],
    ['GST collected', (r) => r.gstCollectedPaise],
    ['Maintenance', (r) => -r.maintenancePaise],
    ['Payment gateway fees', (r) => r.gatewayFeesPaise],
    ['Staff, rent, insurance', (r) => r.fixedCostsPaise],
    ['Investor repayments', (r) => -r.investorRepaymentsPaise],
    ['Before fixed costs', (r) => r.beforeFixedCostsPaise],
    ['Deposits held (liability)', (r) => r.depositsHeldPaise],
  ];
  return [['Line (INR)', ...rows.map((r) => r.month)].join(','), ...lines.map(([label, f]) => [`"${label}"`, ...rows.map((r) => rupees(f(r)))].join(','))].join('\n');
}
