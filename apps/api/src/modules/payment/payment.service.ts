import type { Transaction } from 'sequelize';
import type { PaymentResultDTO } from '@valleyride/shared';
import { Booking, Coupon, Payment, sequelize } from '../../db';
import { getQueue } from '../../jobs/queue';
import { AppError } from '../../utils/AppError';
import { logger } from '../../utils/logger';
import { audit } from '../../utils/audit';
import { notifyOps, notifyUser } from '../notification/notify';
import { extensionMessage, refundMessage } from '../notification/templates';
import { assertTransition } from '../booking/booking.state';
import { isOverlap } from '../booking/booking.utils';
import { getRazorpay, verifyCheckoutSignature } from './razorpay.client';

/** Amounts for the whole booking after an extension, from quote() over the new window. */
export interface PendingExtension {
  endAt: string; billableDays: number; kmIncluded: number;
  rentalPaise: number; discountPaise: number; feesPaise: number; taxPaise: number; totalPaise: number; tierPct?: number;
}

/**
 * Moves end_at, inside a savepoint so a clash with a booking made meanwhile rolls back only the extension.
 * Returns false when the booking can no longer be extended or the bike is taken; the caller then refunds.
 */
export async function applyExtension(bookingId: string, x: PendingExtension, t: Transaction): Promise<boolean> {
  const booking = await Booking.findByPk(bookingId, { lock: t.LOCK.UPDATE, transaction: t });
  if (!booking || !['CONFIRMED', 'ONGOING'].includes(booking.status)) return false;
  const before = booking.endAt.toISOString();
  try {
    await sequelize.transaction({ transaction: t }, (sp) => booking.update({ ...x, endAt: new Date(x.endAt) }, { transaction: sp }));
  } catch (err) {
    if (isOverlap(err)) return false;
    throw err;
  }
  await audit(null, { action: 'booking.extend', entity: 'booking', entityId: bookingId, diff: { endAt: [before, x.endAt], totalPaise: x.totalPaise } }, t);
  t.afterCommit(() => notifyUser(booking.userId, { title: 'Trip extended', text: extensionMessage({ code: booking.code, endAt: new Date(x.endAt) }), data: { bookingId } }));
  return true;
}

interface RazorpayPaymentEntity { id: string; order_id: string; amount: number; status: string; currency?: string }

function assertPaymentAmount(entity: RazorpayPaymentEntity, amount: number) {
  if (entity.amount !== amount || (entity.currency !== undefined && entity.currency !== 'INR')) {
    throw new AppError(400, 'PAYMENT_AMOUNT_MISMATCH', 'The payment amount or currency does not match this order.');
  }
}

/**
 * The payment row is written before the Razorpay order, so a repeated Idempotency-Key hits UNIQUE(idempotency_key)
 * and returns 409 instead of opening a second order.
 */
async function openOrder(booking: Booking, values: { kind: 'RENTAL' | 'EXTRA'; amountPaise: number; idempotencyKey: string; raw: object | null },
  receipt: string, notes: Record<string, string>) {
  const razorpay = getRazorpay(); // 503 PAYMENTS_UNAVAILABLE before anything is written
  const payment = await Payment.create({ bookingId: booking.id, ...values, providerOrderId: null, providerPaymentId: null });
  try {
    const order = await razorpay.orders.create({ amount: values.amountPaise, currency: 'INR', receipt, notes });
    await payment.update({ providerOrderId: order.id });
    return order;
  } catch (err) {
    logger.error({ err, bookingId: booking.id, kind: values.kind }, 'razorpay order failed');
    await payment.update({ status: 'FAILED' });
    throw new AppError(502, 'PAYMENT_PROVIDER', 'Could not start the payment. Please try again.');
  }
}

/** Refunds `amountPaise` of one captured payment. A REFUND row is written first, so a provider failure leaves a CREATED row for staff to retry. */
async function refundPayment(p: Payment, amountPaise: number, reason: string): Promise<'processed' | 'pending' | 'failed'> {
  const row = await Payment.create({
    bookingId: p.bookingId, kind: 'REFUND', amountPaise, idempotencyKey: null,
    providerOrderId: p.providerOrderId, providerPaymentId: null, raw: { sourcePaymentId: p.id, reason },
  });
  try {
    const r = await getRazorpay().payments.refund(p.providerPaymentId!, { amount: amountPaise, notes: { bookingId: p.bookingId, reason } });
    await row.update({ providerPaymentId: r.id, status: r.status === 'processed' ? 'REFUNDED' : 'CREATED', raw: { sourcePaymentId: p.id, reason, refund: r } });
    await audit(null, { action: 'payment.refund', entity: 'booking', entityId: p.bookingId, diff: { refundId: r.id, amountPaise, sourcePaymentId: p.id, reason, status: r.status } });
    return r.status === 'processed' ? 'processed' : 'pending';
  } catch (err) {
    logger.error({ err, bookingId: p.bookingId, paymentId: p.id, amountPaise }, 'razorpay refund failed; needs a manual retry');
    await audit(null, { action: 'payment.refund_failed', entity: 'booking', entityId: p.bookingId, diff: { amountPaise, sourcePaymentId: p.id, reason } });
    return 'failed';
  }
}

/** The booking after a payment, and whether that payment has been refunded (see handleCaptured). */
async function paymentResult(booking: Booking, paymentId: string): Promise<PaymentResultDTO> {
  await booking.reload();
  const refunds = await Payment.count({ where: { bookingId: booking.id, kind: 'REFUND', raw: { sourcePaymentId: paymentId } } });
  return { ...booking.toDTO(), paymentRefunded: refunds > 0 };
}

async function notifyRefund(bookingId: string, amountPaise: number, reason: string) {
  const booking = await Booking.findByPk(bookingId, { attributes: ['userId', 'code'] });
  if (!booking) return;
  const deposit = reason === 'deposit';
  await notifyUser(booking.userId, { title: deposit ? 'Deposit refund sent' : 'Refund sent', text: refundMessage({ code: booking.code, amountPaise, deposit }), data: { bookingId } });
}

export const paymentService = {
  /** One Razorpay order covers rental + deposit (booking.totalPaise). */
  createOrder(booking: Booking, idempotencyKey: string) {
    return openOrder(booking, { kind: 'RENTAL', amountPaise: booking.totalPaise, idempotencyKey, raw: null },
      booking.code, { bookingId: booking.id, depositPaise: String(booking.depositPaise) });
  },

  /** Order for an extension: the difference between the new and the old total. The new end time waits in `raw`. */
  createExtensionOrder(booking: Booking, amountPaise: number, extension: PendingExtension, idempotencyKey: string) {
    return openOrder(booking, { kind: 'EXTRA', amountPaise, idempotencyKey, raw: { extension } },
      `${booking.code}-X`, { bookingId: booking.id, extendTo: extension.endAt });
  },

  /** Refunds `amountPaise` across the booking's captured payments, newest first, after the cancellation has committed. */
  async refund(bookingId: string, amountPaise: number, reason: string): Promise<{ allProcessed: boolean }> {
    const captured = await Payment.findAll({ where: { bookingId, status: 'CAPTURED' }, order: [['createdAt', 'DESC']] });
    let left = amountPaise;
    let sentPaise = 0;
    let allProcessed = true;
    for (const p of captured) {
      if (left <= 0) break;
      const amount = Math.min(left, Number(p.amountPaise));
      left -= amount;
      const result = await refundPayment(p, amount, reason);
      if (result !== 'failed') sentPaise += amount;
      if (result !== 'processed') allProcessed = false;
    }
    if (left > 0) { allProcessed = false; logger.error({ bookingId, left }, 'refund exceeds captured payments'); }
    if (sentPaise > 0) await notifyRefund(bookingId, sentPaise, reason);
    return { allProcessed };
  },

  /** refund.processed: marks the REFUND row and settles a returned booking once none of its refunds are pending. */
  async handleRefundProcessed(entity: { id: string }, raw: unknown) {
    const row = await Payment.findOne({ where: { kind: 'REFUND', providerPaymentId: entity.id } });
    if (!row || row.status === 'REFUNDED') return;
    await row.update({ status: 'REFUNDED', raw: { ...(row.raw as object), processed: raw } });
    await settleDepositIfRefunded(row.bookingId);
  },

  /** refund.failed: Razorpay could not return the money. The row stays open (the deposit is not settled) and staff are told. */
  async handleRefundFailed(entity: { id: string; amount: number }, raw: unknown) {
    const row = await Payment.findOne({ where: { kind: 'REFUND', providerPaymentId: entity.id } });
    if (!row || row.status === 'FAILED') return;
    await row.update({ status: 'FAILED', raw: { ...(row.raw as object), failed: raw } });
    await audit(null, { action: 'payment.refund_failed', entity: 'booking', entityId: row.bookingId, diff: { refundId: entity.id, amountPaise: entity.amount } });
    await notifyOps('Refund failed', `Razorpay refund ${entity.id} (booking ${row.bookingId}) failed. Retry it from the Razorpay dashboard.`);
  },

  /**
   * payment.captured: record the capture and confirm the booking. Safe to call twice. Money that arrives for a hold
   * that has already ended, or for an extension that no longer fits, is refunded rather than kept without a booking.
   */
  async handleCaptured(entity: RazorpayPaymentEntity, raw: unknown) {
    const outcome = await sequelize.transaction(async (t): Promise<{ confirmed?: string; refund?: Payment } | null> => {
      const payment = await Payment.findOne({ where: { providerOrderId: entity.order_id }, lock: t.LOCK.UPDATE, transaction: t });
      if (!payment) {
        logger.warn({ orderId: entity.order_id }, 'captured payment for unknown order');
        return null;
      }
      if (payment.status === 'CAPTURED') return null;
      assertPaymentAmount(entity, Number(payment.amountPaise));
      const pending = (payment.raw as { extension?: PendingExtension } | null)?.extension;
      await payment.update({ status: 'CAPTURED', providerPaymentId: entity.id, raw: pending ? { extension: pending, capture: raw } : raw }, { transaction: t });
      await audit(null, { action: 'payment.captured', entity: 'booking', entityId: payment.bookingId,
        diff: { paymentId: payment.id, kind: payment.kind, amountPaise: entity.amount, providerPaymentId: entity.id } }, t);

      if (payment.kind === 'EXTRA' && pending) {
        return (await applyExtension(payment.bookingId, pending, t)) ? null : { refund: payment };
      }

      const booking = await Booking.findByPk(payment.bookingId, { lock: t.LOCK.UPDATE, transaction: t });
      if (!booking) return null;
      if (booking.status !== 'PENDING_PAYMENT') {
        logger.warn({ bookingId: booking.id, status: booking.status }, 'payment captured for a booking that is no longer pending; refunding');
        return { refund: payment };
      }
      assertTransition(booking.status, 'CONFIRMED');
      await booking.update({ status: 'CONFIRMED', holdExpiresAt: null }, { transaction: t });
      if (booking.couponCode) await Coupon.increment('used', { by: 1, where: { code: booking.couponCode }, transaction: t });
      return { confirmed: booking.id };
    });

    // After commit: the confirmation and invoice run in the worker; refunds call Razorpay outside the transaction.
    if (outcome?.confirmed) await getQueue('documents').add('invoicePdf', { bookingId: outcome.confirmed }, { jobId: `invoice-${outcome.confirmed}` });
    if (outcome?.refund) {
      const p = outcome.refund;
      const reason = p.kind === 'EXTRA' ? 'extension not possible' : 'paid after the hold ended';
      if ((await refundPayment(p, Number(p.amountPaise), reason)) !== 'failed') await notifyRefund(p.bookingId, Number(p.amountPaise), reason);
    }
  },

  /**
   * Checkout success callback (web and app): the signed result is verified, then the payment is fetched from Razorpay
   * and, if captured (or captured here when the account captures manually), confirmed through the same handleCaptured
   * the webhook uses. Either can arrive first; the second is a no-op. Bookings therefore confirm even where the webhook
   * cannot reach the API (local development), and the webhook still catches payments whose callback never returns.
   */
  async verifyCheckout(userId: string, input: { orderId: string; paymentId: string; signature: string }) {
    if (!verifyCheckoutSignature(input.orderId, input.paymentId, input.signature)) throw new AppError(400, 'BAD_SIGNATURE', 'Payment signature does not match');
    const payment = await Payment.findOne({ where: { providerOrderId: input.orderId } });
    const booking = payment && (await Booking.findOne({ where: { id: payment.bookingId, userId } }));
    if (!payment || !booking) throw new AppError(404, 'NOT_FOUND', 'Order not found');
    let p = await getRazorpay().payments.fetch(input.paymentId) as unknown as RazorpayPaymentEntity;
    if (p.order_id !== input.orderId) throw new AppError(400, 'BAD_SIGNATURE', 'Payment is for another order');
    assertPaymentAmount(p, Number(payment.amountPaise));
    if (p.status === 'authorized') p = await getRazorpay().payments.capture(input.paymentId, Number(payment.amountPaise), 'INR') as unknown as RazorpayPaymentEntity;
    if (p.status === 'captured') await this.handleCaptured(p, { source: 'checkout', payment: p });
    return paymentResult(booking, payment.id);
  },

  /** Development only (mock orders): runs the same capture/failure code the webhook would, for the rider's own order. */
  async simulate(userId: string, orderId: string, outcome: 'captured' | 'failed') {
    const payment = await Payment.findOne({ where: { providerOrderId: orderId } });
    const booking = payment && (await Booking.findOne({ where: { id: payment.bookingId, userId } }));
    if (!payment || !booking) throw new AppError(404, 'NOT_FOUND', 'Order not found');
    const entity = { id: `pay_mock_${Date.now().toString(36)}`, order_id: orderId, amount: Number(payment.amountPaise), status: outcome };
    const raw = { mock: true, event: `payment.${outcome}` };
    if (outcome === 'captured') await this.handleCaptured(entity, raw); else await this.handleFailed(entity, raw);
    return paymentResult(booking, payment.id);
  },

  /** payment.failed: the hold stays until it expires, so the customer can retry. */
  async handleFailed(entity: RazorpayPaymentEntity, raw: unknown) {
    await Payment.update(
      { status: 'FAILED', providerPaymentId: entity.id, raw },
      { where: { providerOrderId: entity.order_id, status: 'CREATED' } },
    );
  },
};

/** COMPLETED → DEPOSIT_SETTLED once every deposit refund has gone through (none still pending or failed). */
export async function settleDepositIfRefunded(bookingId: string) {
  const open = await Payment.count({ where: { bookingId, kind: 'REFUND', status: ['CREATED', 'FAILED'] } });
  if (open) return false;
  const [n] = await Booking.update({ status: 'DEPOSIT_SETTLED' }, { where: { id: bookingId, status: 'COMPLETED' } });
  return n > 0;
}
