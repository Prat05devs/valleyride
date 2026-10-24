import { Op } from 'sequelize';
import type { CustomerDocumentDTO, ReviewDocumentInput, SubmitDocumentInput } from '@valleyride/shared';
import { AuditLog, Booking, CustomerDocument, sequelize, User } from '../../db';
import { AppError } from '../../utils/AppError';
import { audit } from '../../utils/audit';
import { DOCUMENT_LABEL } from '@valleyride/shared';
import { notifyUser } from '../notification/notify';
import { documentReviewedMessage } from '../notification/templates';

/** Only the last 4 characters of any document number are kept (DPDP Act; Aadhaar is never stored in full). */
export const maskNumber = (n: string) => `••••${n.slice(-4)}`;

export const toDocumentDTO = (d: CustomerDocument): CustomerDocumentDTO => ({
  id: d.id, type: d.type, numberMasked: d.numberMasked, status: d.status,
  verifiedAt: d.verifiedAt ? d.verifiedAt.toISOString() : null,
  createdAt: (d.get('createdAt') as Date).toISOString(),
});

export const kycService = {
  /** Rejected documents carry the staff reason from the audit log, so the rider knows what to fix. */
  async listMine(userId: string) {
    const docs = await CustomerDocument.findAll({ where: { userId }, order: [['createdAt', 'DESC']] });
    const rejected = docs.filter((d) => d.status === 'REJECTED').map((d) => d.id);
    const notes = rejected.length ? await AuditLog.findAll({ where: { entity: 'customer_document', entityId: rejected, action: 'kyc.rejected' }, order: [['createdAt', 'DESC']] }) : [];
    return docs.map((d) => ({ ...toDocumentDTO(d), note: (notes.find((n) => n.entityId === d.id)?.diff as { note?: string } | undefined)?.note ?? null }));
  },

  /** A new upload replaces any pending or rejected document of the same type; verified ones stay until staff review the new one. */
  async submit(userId: string, input: SubmitDocumentInput) {
    if (!input.fileKey.startsWith(`kyc/${userId}/`)) throw new AppError(422, 'VALIDATION', 'Upload the file first');
    return sequelize.transaction(async (t) => {
      await CustomerDocument.destroy({ where: { userId, type: input.type, status: { [Op.in]: ['PENDING', 'REJECTED'] } }, transaction: t });
      const doc = await CustomerDocument.create({
        userId, type: input.type, numberMasked: maskNumber(input.number), fileKey: input.fileKey,
        verifiedBy: null, verifiedAt: null,
      }, { transaction: t });
      return toDocumentDTO(doc);
    });
  },

  async queue(status: 'PENDING' | 'VERIFIED' | 'REJECTED' = 'PENDING') {
    const docs = await CustomerDocument.findAll({
      where: { status }, order: [['createdAt', 'ASC']], limit: 100,
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'phone'] }],
    });
    const next = await Booking.findAll({
      where: { userId: [...new Set(docs.map((d) => d.userId))], status: { [Op.in]: ['PENDING_PAYMENT', 'CONFIRMED'] }, startAt: { [Op.gt]: new Date() } },
      attributes: ['userId', 'startAt', 'id', 'code'], order: [['startAt', 'ASC']],
    });
    return docs.map((d) => {
      const n = next.find((b) => b.userId === d.userId);
      return { ...toDocumentDTO(d), user: (d as unknown as { user: Pick<User, 'id' | 'fullName' | 'phone'> }).user, nextPickup: n ? { bookingId: n.id, code: n.code, startAt: n.startAt.toISOString() } : null };
    });
  },

  async byId(id: string) {
    const doc = await CustomerDocument.findByPk(id);
    if (!doc) throw new AppError(404, 'NOT_FOUND', 'Document not found');
    return doc;
  },

  async review(staffId: string, id: string, input: ReviewDocumentInput, ip: string | null) {
    return sequelize.transaction(async (t) => {
      const doc = await CustomerDocument.findByPk(id, { lock: t.LOCK.UPDATE, transaction: t });
      if (!doc) throw new AppError(404, 'NOT_FOUND', 'Document not found');
      const before = doc.status;
      await doc.update({ status: input.status, verifiedBy: staffId, verifiedAt: new Date() }, { transaction: t });
      if (input.status === 'VERIFIED') {
        // The newest verified document of a type replaces older ones.
        await CustomerDocument.destroy({ where: { userId: doc.userId, type: doc.type, id: { [Op.ne]: doc.id }, status: 'VERIFIED' }, transaction: t });
      }
      await audit({ id: staffId, ip }, {
        action: `kyc.${input.status.toLowerCase()}`, entity: 'customer_document', entityId: doc.id,
        diff: { status: [before, input.status], note: input.note ?? null },
      }, t);
      t.afterCommit(() => notifyUser(doc.userId, {
        title: input.status === 'VERIFIED' ? 'Document verified' : 'New photo needed',
        text: documentReviewedMessage({ label: DOCUMENT_LABEL[doc.type].toLowerCase(), verified: input.status === 'VERIFIED', note: input.note }),
      }));
      return toDocumentDTO(doc);
    });
  },
};
