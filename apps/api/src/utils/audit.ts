import type { Transaction } from 'sequelize';
import { AuditLog } from '../db';

/** audit_logs row for fleet, money and KYC actions. actorId null = the system (webhook, worker). */
export function audit(actorId: string | null, action: string, entity: string, entityId: string, diff: unknown, ip: string | null = null, transaction?: Transaction) {
  return AuditLog.create({ actorId, action, entity, entityId, diff: diff ?? null, ip }, { transaction });
}
