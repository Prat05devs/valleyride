import type { Job } from 'bullmq';
import { QueryTypes } from 'sequelize';
import { sequelize } from '../../db';
import { notifyOps } from '../../modules/notification/notify';

const LABEL: Record<string, string> = { RC: 'Registration', INSURANCE: 'Insurance', PERMIT: 'Rental permit', PUC: 'PUC' };

/** Daily 09:00 IST scan of vehicle_documents.expires_on: alerts at 30, 7 and 1 days before, and once expired. */
export async function docExpiry(_job: Job) {
  const rows = await sequelize.query<{ registration_no: string; type: string; expires_on: string; days: number }>(`
    SELECT v.registration_no, d.type, d.expires_on::text, (d.expires_on - (now() AT TIME ZONE 'Asia/Kolkata')::date) AS days
    FROM vehicle_documents d JOIN vehicles v ON v.id = d.vehicle_id
    WHERE v.status <> 'RETIRED' AND d.expires_on IS NOT NULL
      AND (d.expires_on - (now() AT TIME ZONE 'Asia/Kolkata')::date) IN (30, 7, 1, 0, -1)
    ORDER BY d.expires_on`, { type: QueryTypes.SELECT });
  if (!rows.length) return { alerts: 0 };
  const lines = rows.map((r) => `${r.registration_no} · ${LABEL[r.type] ?? r.type} ${r.days < 0 ? 'expired' : r.days === 0 ? 'expires today' : `expires in ${r.days} ${r.days === 1 ? 'day' : 'days'}`} (${r.expires_on})`);
  await notifyOps(`Vehicle documents to renew: ${rows.length}`, lines.join('\n'));
  return { alerts: rows.length };
}
