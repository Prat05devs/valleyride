import type { Transaction } from 'sequelize';
import { AuditLog } from '../db';

/** The signed-in staff member or customer behind an action, as recorded in audit_logs. */
export type Actor = { id: string; ip: string | null };

interface AuditEntry { action: string; entity: string; entityId: string; diff?: unknown }

/** audit_logs row for fleet, money and KYC actions. A null actor is the system (webhook, worker). */
export function audit(actor: Actor | null, entry: AuditEntry, transaction?: Transaction) {
  return AuditLog.create({ ...entry, diff: entry.diff ?? null, actorId: actor?.id ?? null, ip: actor?.ip ?? null }, { transaction });
}
