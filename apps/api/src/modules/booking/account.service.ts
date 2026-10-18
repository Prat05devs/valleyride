import { Op } from 'sequelize';
import { Booking, CustomerDocument, Payment, Review, VehicleModel } from '../../db';

const short = (name: string) => name.replace(/^Royal Enfield |^Honda /, '');

export interface PaymentLine { id: string; kind: 'PAID' | 'REFUND'; bookingId: string; bookingCode: string; amountPaise: number; at: string; note: string; pending: boolean }
export interface FeedItem {
  id: string; kind: 'doc' | 'confirmed' | 'return' | 'review' | 'deposit' | 'refund'; at: string;
  bookingId?: string; bookingCode?: string; bike?: string; when?: string; amountPaise?: number; docType?: string;
}

async function context(userId: string) {
  const bookings = await Booking.findAll({ where: { userId } });
  const models = await VehicleModel.findAll({ attributes: ['id', 'name'] });
  const name = (b: Booking) => short(models.find((m) => m.id === b.vehicleModelId)?.name ?? 'bike');
  return { bookings, name, byId: new Map(bookings.map((b) => [b.id, b])) };
}

export const accountService = {
  /** Captured payments and refunds across the rider's bookings, newest first. */
  async payments(userId: string) {
    const { bookings, name, byId } = await context(userId);
    const rows = await Payment.findAll({
      where: { bookingId: { [Op.in]: bookings.map((b) => b.id) }, [Op.or]: [{ status: 'CAPTURED' }, { kind: 'REFUND' }] },
      order: [['createdAt', 'DESC']],
    });
    const lines: PaymentLine[] = rows.map((p) => {
      const b = byId.get(p.bookingId)!;
      const at = (p.get('createdAt') as Date).toISOString();
      if (p.kind === 'REFUND') {
        const reason = (p.raw as { reason?: string } | null)?.reason ?? '';
        return { id: p.id, kind: 'REFUND', bookingId: b.id, bookingCode: b.code, amountPaise: Number(p.amountPaise), at, pending: p.status !== 'REFUNDED',
          note: reason === 'deposit' ? 'Deposit refund' : 'Cancellation refund' };
      }
      return { id: p.id, kind: 'PAID', bookingId: b.id, bookingCode: b.code, amountPaise: Number(p.amountPaise), at, pending: false,
        note: p.kind === 'EXTRA' ? `${name(b)} · extension` : `${name(b)} · ${b.billableDays} ${b.billableDays === 1 ? 'day' : 'days'}, rental + deposit` };
    });
    const held = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'ONGOING' || b.status === 'COMPLETED')
      .map((b) => ({ bookingId: b.id, bookingCode: b.code, bike: name(b), depositPaise: Number(b.depositPaise), status: b.status }));
    return { lines, depositsHeld: held };
  },

  /** A feed derived from current state; the app writes the copy and keeps its own "last read" time. */
  async notifications(userId: string): Promise<FeedItem[]> {
    const { bookings, name } = await context(userId);
    const [docs, refunds, reviews] = await Promise.all([
      CustomerDocument.findAll({ where: { userId, status: 'REJECTED' } }),
      Payment.findAll({ where: { bookingId: { [Op.in]: bookings.map((b) => b.id) }, kind: 'REFUND', status: 'REFUNDED' } }),
      Review.findAll({ where: { userId }, attributes: ['bookingId'] }),
    ]);
    const items: FeedItem[] = docs.map((d) => ({ id: `doc-${d.id}`, kind: 'doc', docType: d.type, at: (d.verifiedAt ?? new Date()).toISOString() }));
    const now = Date.now();
    for (const b of bookings) {
      const base = { bookingId: b.id, bookingCode: b.code, bike: name(b) };
      if (['CONFIRMED', 'ONGOING', 'COMPLETED', 'DEPOSIT_SETTLED'].includes(b.status)) {
        items.push({ id: `confirmed-${b.id}`, kind: 'confirmed', ...base, when: b.startAt.toISOString(), at: (b.get('createdAt') as Date).toISOString() });
      }
      if (b.status === 'ONGOING' && b.endAt.getTime() - now < 86_400_000) {
        items.push({ id: `return-${b.id}`, kind: 'return', ...base, when: b.endAt.toISOString(), at: new Date(Math.min(now, b.endAt.getTime() - 86_400_000)).toISOString() });
      }
      if ((b.status === 'COMPLETED' || b.status === 'DEPOSIT_SETTLED') && !reviews.some((r) => r.bookingId === b.id)) {
        items.push({ id: `review-${b.id}`, kind: 'review', ...base, at: (b.get('updatedAt') as Date).toISOString() });
      }
    }
    for (const r of refunds) {
      const b = bookings.find((x) => x.id === r.bookingId)!;
      items.push({
        id: `refund-${r.id}`, kind: (r.raw as { reason?: string } | null)?.reason === 'deposit' ? 'deposit' : 'refund',
        bookingId: b.id, bookingCode: b.code, bike: name(b), amountPaise: Number(r.amountPaise), at: (r.get('updatedAt') as Date).toISOString(),
      });
    }
    return items.sort((a, b) => b.at.localeCompare(a.at));
  },
};
