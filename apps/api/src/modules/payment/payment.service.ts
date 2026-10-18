import { Booking, Coupon, Payment, sequelize } from '../../db';
import { getQueue } from '../../jobs/queue';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { audit } from '../../utils/audit';
import { notifyUser } from '../notification/notify';
import { extensionMessage, refundMessage } from '../notification/templates';
import { assertTransition } from '../booking/booking.state';
import { getRazorpay, verifyCheckoutSignature } from './razorpay.client';
import type { Transaction } from 'sequelize';

/** Amounts for the whole booking after an extension, from quote() over the new window. */
export interface PendingExtension {
  endAt: string; billableDays: number; kmIncluded: number;
  rentalPaise: number; discountPaise: number; feesPaise: number; taxPaise: number; totalPaise: number; tierPct?: number;
}

/** Moves end_at; the bookings_no_overlap constraint rejects it if the bike was booked meanwhile. */
export async function applyExtension(bookingId: string, x: PendingExtension, t: Transaction) {
  const booking = await Booking.findByPk(bookingId, { lock: t.LOCK.UPDATE, transaction: t });
  if (!booking || !['CONFIRMED', 'ONGOING'].includes(booking.status)) {
    logger.error({ bookingId, status: booking?.status }, 'extension paid for a booking that can no longer be extended; needs a refund');
    return;
  }
  try {
    const before = booking.endAt.toISOString();
    await sequelize.transaction({ transaction: t }, (sp) => booking.update({ ...x, endAt: new Date(x.endAt) }, { transaction: sp }));
    await audit(null, 'booking.extend', 'booking', bookingId, { endAt: [before, x.endAt], totalPaise: x.totalPaise }, null, t);
    t.afterCommit(() => notifyUser(booking.userId, { title: 'Trip extended', text: extensionMessage({ code: booking.code, endAt: new Date(x.endAt) }), data: { bookingId } }));
  } catch (err) {
    logger.error({ err, bookingId }, 'extension clashes with another booking; needs a refund');
  }
}

interface RazorpayPaymentEntity { id: string; order_id: string; amount: number; status: string }

export const paymentService = {
  /** Order for an extension: the difference between the new and the old total. The new end time waits in `raw`. */
  async createExtensionOrder(booking: Booking, amountPaise: number, extension: PendingExtension, idempotencyKey: string) {
    const payment = await Payment.create({
      bookingId: booking.id, kind: 'EXTRA', amountPaise, idempotencyKey,
      providerOrderId: null, providerPaymentId: null, raw: { extension },
    });
    let order;
    try {
      order = await getRazorpay().orders.create({
        amount: amountPaise, currency: 'INR', receipt: `${booking.code}-X`,
        notes: { bookingId: booking.id, extendTo: extension.endAt },
      });
    } catch (err) {
      logger.error({ err, bookingId: booking.id }, 'razorpay extension order failed');
      await payment.update({ status: 'FAILED' });
      throw new AppError(502, 'PAYMENT_PROVIDER', 'Could not start the payment. Please try again.');
    }
    await payment.update({ providerOrderId: order.id });
    return order;
  },

  /**
   * Refunds `amountPaise` across the booking's captured payments, newest first, after the cancellation has committed.
   * Each refund is written as a REFUND row first, so a provider failure leaves a CREATED row for staff to retry.
   */
  async refund(bookingId: string, amountPaise: number, reason: string): Promise<{ allProcessed: boolean }> {
    let allProcessed = true;
    const captured = await Payment.findAll({ where: { bookingId, status: 'CAPTURED' }, order: [['createdAt', 'DESC']] });
    let left = amountPaise;
    for (const p of captured) {
      if (left <= 0) break;
      const amount = Math.min(left, Number(p.amountPaise));
      left -= amount;
      const row = await Payment.create({
        bookingId, kind: 'REFUND', amountPaise: amount, idempotencyKey: null,
        providerOrderId: p.providerOrderId, providerPaymentId: null, raw: { sourcePaymentId: p.id, reason },
      });
      try {
        const r = await getRazorpay().payments.refund(p.providerPaymentId!, { amount, notes: { bookingId, reason } });
        await row.update({ providerPaymentId: r.id, status: r.status === 'processed' ? 'REFUNDED' : 'CREATED', raw: { sourcePaymentId: p.id, reason, refund: r } });
        if (r.status !== 'processed') allProcessed = false;
        await audit(null, 'payment.refund', 'booking', bookingId, { refundId: r.id, amountPaise: amount, sourcePaymentId: p.id, reason, status: r.status });
      } catch (err) {
        allProcessed = false;
        logger.error({ err, bookingId, paymentId: p.id, amount }, 'razorpay refund failed; needs a manual retry');
        await audit(null, 'payment.refund_failed', 'booking', bookingId, { amountPaise: amount, sourcePaymentId: p.id, reason });
      }
    }
    if (left > 0) { allProcessed = false; logger.error({ bookingId, left }, 'refund exceeds captured payments'); }
    const booking = await Booking.findByPk(bookingId, { attributes: ['userId', 'code'] });
    if (booking && amountPaise > 0) {
      await notifyUser(booking.userId, { title: reason === 'deposit' ? 'Deposit refund sent' : 'Refund sent', text: refundMessage({ code: booking.code, amountPaise, deposit: reason === 'deposit' }), data: { bookingId } });
    }
    return { allProcessed };
  },

  /** refund.processed: marks the REFUND row and settles a returned booking once none of its refunds are pending. */
  async handleRefundProcessed(entity: { id: string; payment_id: string; amount: number }, raw: unknown) {
    const row = await Payment.findOne({ where: { kind: 'REFUND', providerPaymentId: entity.id } });
    if (!row || row.status === 'REFUNDED') return;
    await row.update({ status: 'REFUNDED', raw: { ...(row.raw as object), processed: raw } });
    await settleDepositIfRefunded(row.bookingId);
  },

  /**
   * One Razorpay order covers rental + deposit (booking.totalPaise). The payment row is written first,
   * so a repeated Idempotency-Key hits UNIQUE(idempotency_key) and returns 409 instead of a second order.
   */
  async createOrder(booking: Booking, idempotencyKey: string) {
    const payment = await Payment.create({
      bookingId: booking.id, kind: 'RENTAL', amountPaise: booking.totalPaise, idempotencyKey,
      providerOrderId: null, providerPaymentId: null, raw: null,
    });
    let order;
    try {
      order = await getRazorpay().orders.create({
        amount: booking.totalPaise,
        currency: 'INR',
        receipt: booking.code,
        notes: { bookingId: booking.id, depositPaise: String(booking.depositPaise) },
      });
    } catch (err) {
      logger.error({ err, bookingId: booking.id }, 'razorpay order failed');
      throw new AppError(502, 'PAYMENT_PROVIDER', 'Could not start the payment. Please try again.');
    }
    await payment.update({ providerOrderId: order.id });
    return order;
  },

  /** payment.captured: record the capture and confirm the booking. Safe to call twice. */
  async handleCaptured(entity: RazorpayPaymentEntity, raw: unknown) {
    const bookingId = await sequelize.transaction(async (t) => {
      const payment = await Payment.findOne({ where: { providerOrderId: entity.order_id }, lock: t.LOCK.UPDATE, transaction: t });
      if (!payment) {
        logger.warn({ orderId: entity.order_id }, 'captured payment for unknown order');
        return null;
      }
      if (payment.status === 'CAPTURED') return null;
      if (entity.amount !== payment.amountPaise) {
        logger.error({ orderId: entity.order_id, expected: payment.amountPaise, got: entity.amount }, 'captured amount mismatch');
      }
      const pending = (payment.raw as { extension?: PendingExtension } | null)?.extension;
      await payment.update({ status: 'CAPTURED', providerPaymentId: entity.id, raw: pending ? { extension: pending, capture: raw } : raw }, { transaction: t });
      await audit(null, 'payment.captured', 'booking', payment.bookingId, { paymentId: payment.id, kind: payment.kind, amountPaise: entity.amount, providerPaymentId: entity.id }, null, t);

      if (payment.kind === 'EXTRA' && pending) {
        await applyExtension(payment.bookingId, pending, t);
        return null;
      }

      const booking = await Booking.findByPk(payment.bookingId, { lock: t.LOCK.UPDATE, transaction: t });
      if (!booking) return null;
      if (booking.status !== 'PENDING_PAYMENT') {
        // e.g. the hold expired just before the customer paid. Needs a refund or a manual rebooking by staff.
        logger.error({ bookingId: booking.id, status: booking.status }, 'payment captured for a booking that is no longer pending');
        return null;
      }
      assertTransition(booking.status, 'CONFIRMED');
      await booking.update({ status: 'CONFIRMED', holdExpiresAt: null }, { transaction: t });
      if (booking.couponCode) await Coupon.increment('used', { by: 1, where: { code: booking.couponCode }, transaction: t });
      return booking.id;
    });

    // After commit: confirmation and invoice run in the worker.
    if (bookingId) await getQueue('documents').add('invoicePdf', { bookingId }, { jobId: `invoice-${bookingId}` });
  },

  /**
   * Checkout success callback (web and app): the signed result is verified, then the payment is fetched from Razorpay
   * and, if captured (or captured here when the account captures manually), confirmed through the same handleCaptured
   * the webhook uses. Either can arrive first; the second is a no-op. Bookings therefore confirm even where the webhook
   * cannot reach the API (local development), and the webhook still catches payments whose callback never returns.
   */
  async verifyCheckout(userId: string, input: { orderId: string; paymentId: string; signature: string }) {
    const payment = await Payment.findOne({ where: { providerOrderId: input.orderId } });
    const booking = payment && (await Booking.findOne({ where: { id: payment.bookingId, userId } }));
    if (!payment || !booking) throw new AppError(404, 'NOT_FOUND', 'Order not found');
    if (!verifyCheckoutSignature(input.orderId, input.paymentId, input.signature)) throw new AppError(400, 'BAD_SIGNATURE', 'Payment signature does not match');
    let p = await getRazorpay().payments.fetch(input.paymentId) as unknown as RazorpayPaymentEntity;
    if (p.order_id !== input.orderId) throw new AppError(400, 'BAD_SIGNATURE', 'Payment is for another order');
    if (p.status === 'authorized') p = await getRazorpay().payments.capture(input.paymentId, Number(payment.amountPaise), 'INR') as unknown as RazorpayPaymentEntity;
    if (p.status === 'captured') await this.handleCaptured(p, { source: 'checkout', payment: p });
    await booking.reload();
    return booking.toDTO();
  },

  /** Development only (mock orders): runs the same capture/failure code the webhook would, for the rider's own order. */
  async simulate(userId: string, orderId: string, outcome: 'captured' | 'failed') {
    const payment = await Payment.findOne({ where: { providerOrderId: orderId } });
    const booking = payment && (await Booking.findOne({ where: { id: payment.bookingId, userId } }));
    if (!payment || !booking) throw new AppError(404, 'NOT_FOUND', 'Order not found');
    const entity = { id: `pay_mock_${Date.now().toString(36)}`, order_id: orderId, amount: Number(payment.amountPaise), status: outcome };
    const raw = { mock: true, event: `payment.${outcome}` };
    if (outcome === 'captured') await this.handleCaptured(entity, raw); else await this.handleFailed(entity, raw);
    await booking.reload();
    return booking.toDTO();
  },

  /** payment.failed: the hold stays until it expires, so the customer can retry. */
  async handleFailed(entity: RazorpayPaymentEntity, raw: unknown) {
    await Payment.update(
      { status: 'FAILED', providerPaymentId: entity.id, raw },
      { where: { providerOrderId: entity.order_id, status: 'CREATED' } },
    );
  },
};

/** COMPLETED → DEPOSIT_SETTLED once every deposit refund has been processed. */
export async function settleDepositIfRefunded(bookingId: string) {
  const pending = await Payment.count({ where: { bookingId, kind: 'REFUND', status: 'CREATED' } });
  if (pending) return false;
  const [n] = await Booking.update({ status: 'DEPOSIT_SETTLED' }, { where: { id: bookingId, status: 'COMPLETED' } });
  return n > 0;
}
