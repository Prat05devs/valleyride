import { QueryTypes, Transaction } from 'sequelize';
import { addMinutes } from 'date-fns';
import { sequelize, Booking, VehicleModel, Coupon, Payment } from '../../db';
import { cancellationRefund, ACTIVE_STATUSES, type CreateBookingInput } from '@valleyride/shared';
import { pricingService } from '../pricing/pricing.service';
import { audit, type Actor } from '../../utils/audit';
import { AppError } from '../../utils/AppError';
import { applyExtension, paymentService, type PendingExtension } from '../payment/payment.service';
import { bookingJobs } from './booking.jobs';
import { isOverlap, newBookingCode } from './booking.utils';
import { assertTransition, EXTENDABLE } from './booking.state';
import { assertPaymentsAvailable } from '../payment/razorpay.client';
import { createHash } from 'node:crypto';
import { INVENTORY_WINDOW } from './inventory-window';
import { assertDeskWindow } from './booking-window';

const HOLD_MINUTES = 15;

export const bookingService = {
  /** Free units per model for a window, as used by GET /availability. */
  async availability(startAt: Date, endAt: Date, pickup?: string, returnTo?: string) {
    if (pickup) await assertDeskWindow(startAt, endAt, pickup, returnTo);
    return sequelize.query<{ model_id: string; free: number }>(`
      SELECT v.vehicle_model_id AS model_id, COUNT(*)::int AS free
      FROM vehicles v
      WHERE ${INVENTORY_WINDOW}
      GROUP BY v.vehicle_model_id`,
      { replacements: { startAt, endAt, pickup: pickup ?? null, returnTo: returnTo ?? pickup ?? null, active: ACTIVE_STATUSES }, type: QueryTypes.SELECT });
  },

  /**
   * GET /availability?startAt&endAt&pickup: units at the requested hub, and, when a pickup
   * point is given, the priced quote, so the results page shows exactly what checkout will charge.
   */
  async availabilityWithQuotes(startAt: Date, endAt: Date, pickup?: string, ret?: string) {
    const free = await this.availability(startAt, endAt, pickup, ret);
    if (!pickup) return free;
    const models = await VehicleModel.findAll();
    return Promise.all(models.map(async (m) => ({
      model_id: m.id,
      free: free.find((f) => f.model_id === m.id)?.free ?? 0,
      quote: await pricingService.quoteModel(m, startAt, endAt, { oneWay: !!ret && ret !== pickup }),
    })));
  },

  /** Holds one vehicle for 15 min and returns a Razorpay order to pay. */
  async create(userId: string, input: CreateBookingInput, idempotencyKey: string) {
    assertPaymentsAvailable();
    const requestHash = createHash('sha256').update(JSON.stringify({
      model: input.vehicleModelId, pickup: input.pickupLocationId, returnTo: input.returnLocationId,
      start: input.startAt.toISOString(), end: input.endAt.toISOString(), coupon: input.couponCode ?? null,
      expected: input.expectedPayNowPaise ?? null,
    })).digest('hex');
    const previous = await Booking.findOne({ where: { userId, clientRequestKey: idempotencyKey } });
    if (previous) {
      if (previous.clientRequestHash !== requestHash) throw new AppError(409, 'IDEMPOTENCY_MISMATCH', 'This attempt belongs to a different booking. Review the trip again.');
      if (['EXPIRED', 'CANCELLED'].includes(previous.status) || (previous.status === 'PENDING_PAYMENT' && (!previous.holdExpiresAt || previous.holdExpiresAt <= new Date()))) {
        throw new AppError(409, 'HOLD_EXPIRED', 'This booking attempt has ended. Check availability and review the trip again.');
      }
      const scopedKey = createHash('sha256').update(`${userId}:rental:${previous.id}:${idempotencyKey}`).digest('hex');
      return { booking: previous, order: await paymentService.createOrder(previous, scopedKey) };
    }
    await assertDeskWindow(input.startAt, input.endAt, input.pickupLocationId, input.returnLocationId);
    const model = await VehicleModel.findByPk(input.vehicleModelId);
    if (!model) throw new AppError(404, 'NOT_FOUND', 'Vehicle model not found');
    const coupon = input.couponCode ? await Coupon.findValid(input.couponCode) : null;
    const q = await pricingService.quoteModel(model, input.startAt, input.endAt, {
      oneWay: input.pickupLocationId !== input.returnLocationId,
      couponPct: coupon?.percentOff ?? 0,
    });
    if (input.expectedPayNowPaise !== undefined && input.expectedPayNowPaise !== q.payNowPaise) {
      throw new AppError(409, 'QUOTE_CHANGED', 'The price changed. Please review the updated total before paying.');
    }

    // A parallel request can commit a booking on the unit this one just read as free; the exclusion constraint then
    // rejects the insert. Picking again finds the next free unit, so a rider only sees "fully booked" when it is true.
    const booking = await retryOnOverlap(() => sequelize.transaction(
      { isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED },
      async (t) => {
        // Pick the least-used free vehicle and lock it. SKIP LOCKED lets parallel requests pick different units.
        const [vehicle] = await sequelize.query<{ id: string }>(`
          SELECT v.id FROM vehicles v
          WHERE v.vehicle_model_id = :modelId AND ${INVENTORY_WINDOW}
          ORDER BY v.odometer_km ASC
          LIMIT 1
          FOR UPDATE OF v SKIP LOCKED`,
          { replacements: { modelId: model.id, startAt: input.startAt, endAt: input.endAt, pickup: input.pickupLocationId, returnTo: input.returnLocationId, active: ACTIVE_STATUSES },
            type: QueryTypes.SELECT, transaction: t });

        if (!vehicle) throw new AppError(409, 'NO_AVAILABILITY', 'This model is fully booked for the selected time.');

        // The DB exclusion constraint is the final guard, so a race surfaces as a 409 rather than a double booking.
        return Booking.create({
          code: newBookingCode(),
          userId,
          vehicleId: vehicle.id,
          vehicleModelId: model.id,
          pickupLocationId: input.pickupLocationId,
          returnLocationId: input.returnLocationId,
          startAt: input.startAt,
          endAt: input.endAt,
          holdExpiresAt: addMinutes(new Date(), HOLD_MINUTES),
          billableDays: q.days,
          kmIncluded: q.kmIncluded,
          rentalPaise: q.rentalPaise,
          discountPaise: q.discountPaise,
          feesPaise: q.feesPaise,
          taxPaise: q.taxPaise,
          depositPaise: q.depositPaise,
          totalPaise: q.payNowPaise,
          couponCode: coupon?.code ?? null,
          tierPct: q.tierPct,
          clientRequestKey: idempotencyKey,
          clientRequestHash: requestHash,
        }, { transaction: t });
      }));

    // Outside the transaction: external calls must never hold DB locks. If Razorpay cannot open the order, the hold is
    // released at once instead of blocking the bike for 15 minutes.
    await bookingJobs.scheduleHoldExpiry(booking.id, HOLD_MINUTES);
    try {
      const scopedKey = createHash('sha256').update(`${userId}:rental:${booking.id}:${idempotencyKey}`).digest('hex');
      return { booking, order: await paymentService.createOrder(booking, scopedKey) };
    } catch (err) {
      await booking.update({ status: 'EXPIRED', holdExpiresAt: null, clientRequestKey: null, clientRequestHash: null });
      throw err;
    }
  },

  async listMine(userId: string) {
    return Booking.findAll({ where: { userId }, order: [['startAt', 'DESC']] });
  },

  /**
   * Adds or removes a coupon on an unpaid hold. The booking is re-priced with the same quote() and the old order is
   * superseded by a new one, so the amount Razorpay charges always matches the booking.
   */
  async applyCoupon(userId: string, id: string, code: string | null) {
    assertPaymentsAvailable();
    const { booking, changed } = await sequelize.transaction(async (t) => {
      const booking = await Booking.findOne({ where: { id, userId }, lock: t.LOCK.UPDATE, transaction: t });
      if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
      if (booking.status !== 'PENDING_PAYMENT' || !booking.holdExpiresAt || booking.holdExpiresAt <= new Date()) {
        throw new AppError(409, 'HOLD_ENDED', 'This hold has ended. Please search again.');
      }
      const coupon = code ? await Coupon.findValid(code) : null;
      if (code && !coupon) throw new AppError(422, 'COUPON_INVALID', "That coupon isn't valid or has expired.");
      if ((coupon?.code ?? null) === booking.couponCode) return { booking, changed: false };
      const model = await VehicleModel.findByPk(booking.vehicleModelId, { rejectOnEmpty: true, transaction: t });
      const q = await pricingService.quoteModel(model, booking.startAt, booking.endAt, {
        oneWay: booking.pickupLocationId !== booking.returnLocationId, couponPct: coupon?.percentOff ?? 0,
      });
      await booking.update({
        couponCode: coupon?.code ?? null, rentalPaise: q.rentalPaise, feesPaise: q.feesPaise, discountPaise: q.discountPaise, taxPaise: q.taxPaise, totalPaise: q.payNowPaise, tierPct: q.tierPct,
      }, { transaction: t });
      await Payment.update({ status: 'FAILED', raw: { superseded: 'coupon' } }, { where: { bookingId: id, kind: 'RENTAL', status: 'CREATED' }, transaction: t });
      return { booking, changed: true };
    });
    const existingOrder = changed ? null : await this.pendingOrderId(id);
    const orderId = existingOrder ?? (await paymentService.createOrder(booking, `${id}:coupon:${Date.now()}`)).id;
    return { booking, razorpayOrderId: orderId };
  },

  async pendingOrderId(bookingId: string) {
    // A failed attempt can be retried against the same Razorpay order. Coupon-superseded orders cannot.
    const payments = await Payment.findAll({ where: { bookingId, kind: 'RENTAL', status: ['CREATED', 'FAILED'] }, order: [['createdAt', 'DESC']] });
    return payments.find((p) => p.providerOrderId && !(p.raw as { superseded?: string } | null)?.superseded)?.providerOrderId ?? null;
  },

  async getOne(userId: string, id: string) {
    const booking = await Booking.findOne({ where: { id, userId } });
    if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    return booking;
  },

  /**
   * Unpaid holds are simply cancelled. Paid bookings follow the cancellation policy in @valleyride/shared;
   * the Razorpay refunds run after the commit, because external calls must never hold DB locks.
   */
  async cancel(userId: string, id: string, reason?: string, actor: Actor = { id: userId, ip: null }) {
    const { booking, refund } = await sequelize.transaction(async (t) => {
      const booking = await Booking.findOne({ where: { id, userId }, lock: t.LOCK.UPDATE, transaction: t });
      if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
      assertTransition(booking.status, 'CANCELLED');
      const refund = booking.status === 'CONFIRMED' ? cancellationRefund(booking.toDTO()) : null;
      const before = booking.status;
      await booking.update({ status: 'CANCELLED', holdExpiresAt: null }, { transaction: t });
      await audit(actor, { action: 'booking.cancelled', entity: 'booking', entityId: booking.id,
        diff: { status: [before, 'CANCELLED'], reason: reason ?? null, refundPaise: refund?.refundPaise ?? 0 } }, t);
      return { booking, refund };
    });
    if (refund && refund.refundPaise > 0) await paymentService.refund(booking.id, refund.refundPaise, reason ? `cancelled: ${reason}` : 'cancelled');
    return { booking, refund };
  },

  async cancelPreview(userId: string, id: string) {
    const booking = await this.getOne(userId, id);
    if (booking.status === 'PENDING_PAYMENT') return { cancellable: true, refund: null };
    if (booking.status !== 'CONFIRMED') return { cancellable: false, refund: null };
    return { cancellable: true, refund: cancellationRefund(booking.toDTO()) };
  },

  /** Re-prices the whole trip for the new end time and checks the same vehicle is free for the added time. */
  async extendPreview(userId: string, id: string, endAt: Date) {
    const booking = await this.getOne(userId, id);
    if (!EXTENDABLE.includes(booking.status)) throw new AppError(409, 'INVALID_TRANSITION', 'This booking can no longer be extended.');
    if (endAt <= booking.endAt) throw new AppError(422, 'VALIDATION', 'The new return time must be after the current one.');
    await assertDeskWindow(booking.startAt, endAt, booking.pickupLocationId, booking.returnLocationId);
    const model = await VehicleModel.findByPk(booking.vehicleModelId, { rejectOnEmpty: true });
    const coupon = booking.couponCode ? await Coupon.findOne({ where: { code: booking.couponCode } }) : null;
    const q = await pricingService.quoteModel(model, booking.startAt, endAt, {
      oneWay: booking.pickupLocationId !== booking.returnLocationId,
      couponPct: coupon?.percentOff ?? 0,
    });
    const [clash] = await sequelize.query<{ id: string }>(`
      SELECT b.id FROM bookings b
      WHERE b.vehicle_id = :vehicleId AND b.id <> :id AND b.status IN (:active)
        AND tstzrange(b.start_at, b.end_at, '[)') && tstzrange(:from, :to, '[)')
      LIMIT 1`,
      { replacements: { vehicleId: booking.vehicleId, id: booking.id, active: ACTIVE_STATUSES, from: booking.endAt, to: endAt }, type: QueryTypes.SELECT });
    const extension: PendingExtension = {
      endAt: endAt.toISOString(), billableDays: q.days, kmIncluded: q.kmIncluded, rentalPaise: q.rentalPaise,
      discountPaise: q.discountPaise, feesPaise: q.feesPaise, taxPaise: q.taxPaise, totalPaise: q.payNowPaise, tierPct: q.tierPct,
    };
    return { booking, available: !clash, quote: q, extension, payPaise: Math.max(0, q.payNowPaise - Number(booking.totalPaise)) };
  },

  /**
   * POST /bookings/:id/extend. Creates an order for the difference; the payment.captured webhook moves end_at.
   * When the longer trip costs no more (a longer duration tier), it is applied straight away with no charge.
   */
  async extend(userId: string, id: string, endAt: Date, idempotencyKey: string) {
    const scopedKey = createHash('sha256').update(`${userId}:extension:${id}:${idempotencyKey}`).digest('hex');
    const previous = await Payment.findOne({ where: { bookingId: id, kind: 'EXTRA', idempotencyKey: scopedKey } });
    if (previous) {
      const booking = await this.getOne(userId, id);
      const extension = (previous.raw as { extension?: PendingExtension } | null)?.extension;
      if (!extension || extension.endAt !== endAt.toISOString()) throw new AppError(409, 'IDEMPOTENCY_MISMATCH', 'This attempt belongs to a different extension.');
      if (booking.endAt >= endAt) return { booking, razorpayOrderId: null, payPaise: 0 };
      if (!EXTENDABLE.includes(booking.status)) throw new AppError(409, 'INVALID_TRANSITION', 'This trip can no longer be extended.');
      const order = await paymentService.createExtensionOrder(booking, Number(previous.amountPaise), extension, scopedKey);
      return { booking, razorpayOrderId: order.id, payPaise: Number(previous.amountPaise) };
    }
    const p = await this.extendPreview(userId, id, endAt);
    if (!p.available) throw new AppError(409, 'NO_AVAILABILITY', 'Your bike is booked by someone else for that time.');
    if (p.payPaise === 0) {
      const applied = await sequelize.transaction((t) => applyExtension(p.booking.id, { ...p.extension, ...pick(p.booking) }, t));
      if (!applied) throw new AppError(409, 'NO_AVAILABILITY', 'Your bike is booked by someone else for that time.');
      return { booking: await p.booking.reload(), razorpayOrderId: null, payPaise: 0 };
    }
    const order = await paymentService.createExtensionOrder(p.booking, p.payPaise, p.extension, scopedKey);
    return { booking: p.booking, razorpayOrderId: order.id as string, payPaise: p.payPaise };
  },
};

/** Keeps the amounts already paid when a longer trip comes out cheaper; the difference is not refunded. */
function pick(b: Booking) {
  return {
    rentalPaise: Number(b.rentalPaise), discountPaise: Number(b.discountPaise), feesPaise: Number(b.feesPaise),
    taxPaise: Number(b.taxPaise), totalPaise: Number(b.totalPaise), tierPct: Number(b.tierPct),
  };
}

async function retryOnOverlap<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try { return await run(); } catch (e) { if (!isOverlap(e) || i >= attempts) throw e; }
  }
}
