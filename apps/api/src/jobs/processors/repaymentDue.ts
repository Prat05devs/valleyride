import type { Job } from 'bullmq';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../db';
import { notifyOps, notifyUser } from '../../modules/notification/notify';
import { formatPaise } from '../../utils/money';

/**
 * Daily 09:00 IST: tells investors about instalments due in 3 days, and marks unpaid instalments past their due
 * date LATE with an alert to the owner (payments themselves are made by bank transfer and reconciled in admin).
 */
export async function repaymentDue(_job: Job) {
  const today = `(now() AT TIME ZONE 'Asia/Kolkata')::date`;
  const soon = await sequelize.query<{ user_id: string; installment_no: number; due_date: string; amount: number }>(`
    SELECT i.user_id, r.installment_no, r.due_date::text, (r.principal_paise + r.interest_paise) AS amount
    FROM repayment_schedules r JOIN investments inv ON inv.id = r.investment_id JOIN investors i ON i.id = inv.investor_id
    WHERE r.status = 'DUE' AND r.due_date = ${today} + 3`, { type: QueryTypes.SELECT });
  for (const r of soon) {
    await notifyUser(r.user_id, { title: 'Repayment coming up', text: `Valley Ride Capital: instalment ${r.installment_no} of ${formatPaise(Number(r.amount))} is due on ${r.due_date}.` });
  }
  const late = await sequelize.query<{ id: string; installment_no: number; due_date: string }>(`
    UPDATE repayment_schedules SET status = 'LATE', updated_at = now()
    WHERE status = 'DUE' AND due_date < ${today} RETURNING id, installment_no, due_date::text`, { type: QueryTypes.SELECT });
  if (late.length) await notifyOps(`Investor repayments overdue: ${late.length}`, late.map((l) => `Instalment ${l.installment_no} was due ${l.due_date}`).join('\n'));
  return { reminded: soon.length, late: late.length };
}
