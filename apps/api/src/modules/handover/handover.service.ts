import type { HandoverDTO, PickupHandoverInput, ReturnHandoverInput, StartRideInput } from '@valleyride/shared';
import { returnCharges } from '@valleyride/shared';
import { Booking, Handover, sequelize, User, Vehicle, VehicleModel } from '../../db';
import { logger } from '../../utils/logger';
import { notifyUser } from '../notification/notify';
import { agreementSignedMessage } from '../notification/templates';
import { agreementPdf } from './agreement-pdf';
import { AppError } from '../../utils/AppError';
import { audit } from '../../utils/audit';
import { assertTransition } from '../booking/booking.state';
import { paymentService, settleDepositIfRefunded } from '../payment/payment.service';
import { presignGet, putObject } from '../kyc/s3-presign';

async function toDTO(h: Handover, origin: string): Promise<HandoverDTO> {
  return {
    type: h.type, at: h.createdAt.toISOString(), odometerKm: h.odometerKm, fuelLevel: h.fuelLevel,
    photos: await Promise.all((h.photos ?? []).map(async (p) => ({ label: p.label, url: await presignGet(p.key, origin) }))),
    damageNotes: h.damageNotes, signedAt: h.signedAt ? h.signedAt.toISOString() : null,
    charges: h.charges, checklist: h.checklist,
  };
}

async function bookingFor(id: string, userId?: string) {
  const booking = await Booking.findOne({ where: userId ? { id, userId } : { id } });
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  return booking;
}

export const handoverService = {
  /** Staff record the condition at the desk. It can be redone until the customer signs. */
  async recordPickup(staffId: string, bookingId: string, input: PickupHandoverInput, ip: string | null) {
    return sequelize.transaction(async (t) => {
      const booking = await Booking.findByPk(bookingId, { lock: t.LOCK.UPDATE, transaction: t });
      if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
      if (booking.status !== 'CONFIRMED') throw new AppError(409, 'INVALID_TRANSITION', 'Only confirmed bookings can be handed over.');
      const existing = await Handover.findOne({ where: { bookingId, type: 'PICKUP' }, transaction: t });
      if (existing?.signedAt) throw new AppError(409, 'ALREADY_SIGNED', 'The rider has already signed for this bike.');
      const values = {
        odometerKm: input.odometerKm, fuelLevel: input.fuelLevel ?? null, photos: input.photos,
        damageNotes: input.damageNotes ?? null, staffId,
      };
      const h = existing ? await existing.update(values, { transaction: t })
        : await Handover.create({ bookingId, type: 'PICKUP', agreementFileKey: null, signedAt: null, emergencyContact: null, checklist: null, charges: null, ...values }, { transaction: t });
      await audit({ id: staffId, ip }, { action: 'handover.pickup', entity: 'booking', entityId: bookingId, diff: { odometerKm: input.odometerKm, photos: input.photos.length } }, t);
      return h;
    });
  },

  async forBooking(bookingId: string, origin: string, userId?: string) {
    const booking = await bookingFor(bookingId, userId);
    const [vehicle, rows] = await Promise.all([
      Vehicle.findByPk(booking.vehicleId, { attributes: ['registrationNo'] }),
      Handover.findAll({ where: { bookingId } }),
    ]);
    const pickup = rows.find((h) => h.type === 'PICKUP');
    const ret = rows.find((h) => h.type === 'RETURN');
    return {
      registrationNo: vehicle?.registrationNo ?? null,
      pickup: pickup ? await toDTO(pickup, origin) : null,
      return: ret ? await toDTO(ret, origin) : null,
      emergencyContact: pickup?.emergencyContact ?? null,
    };
  },

  /** The rider reports a mark the checklist missed; it is added to the pickup notes before they sign. */
  async reportMark(userId: string, bookingId: string, note: string) {
    await bookingFor(bookingId, userId);
    const h = await Handover.findOne({ where: { bookingId, type: 'PICKUP' } });
    if (!h) throw new AppError(409, 'NO_HANDOVER', 'Staff have not recorded the bike yet.');
    if (h.signedAt) throw new AppError(409, 'ALREADY_SIGNED', 'This ride has already started.');
    await h.update({ damageNotes: [h.damageNotes, `Rider: ${note}`].filter(Boolean).join('\n') });
  },

  /** Sign, confirm the condition and leave an emergency contact: CONFIRMED → ONGOING, then the signed agreement PDF. */
  async startRide(userId: string, bookingId: string, input: StartRideInput) {
    await bookingFor(bookingId, userId); // before anything is written to storage
    const signature = Buffer.from(input.signaturePng.split(',')[1]!, 'base64');
    const sigKey = `agreements/${bookingId}/signature-${Date.now()}.png`;
    await putObject(sigKey, signature, 'image/png');
    const { booking, handover } = await sequelize.transaction(async (t) => {
      const booking = await Booking.findOne({ where: { id: bookingId, userId }, lock: t.LOCK.UPDATE, transaction: t });
      if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
      assertTransition(booking.status, 'ONGOING');
      const h = await Handover.findOne({ where: { bookingId, type: 'PICKUP' }, lock: t.LOCK.UPDATE, transaction: t });
      if (!h) throw new AppError(409, 'NO_HANDOVER', 'Staff need to record the bike at the desk first.');
      await h.update({ agreementFileKey: sigKey, signedAt: new Date(), emergencyContact: input.emergencyContact }, { transaction: t });
      return { booking: await booking.update({ status: 'ONGOING' }, { transaction: t }), handover: h };
    });

    // After commit: the PDF must not hold the booking lock, and a rendering failure must not undo the signature.
    try {
      const [user, vehicle, model] = await Promise.all([
        User.findByPk(userId, { attributes: ['fullName', 'phone'] }),
        Vehicle.findByPk(booking.vehicleId, { attributes: ['registrationNo'] }),
        VehicleModel.findByPk(booking.vehicleModelId, { rejectOnEmpty: true }),
      ]);
      const pdf = await agreementPdf({
        bookingCode: booking.code, rider: user?.fullName ?? '', phone: user?.phone ?? '', bike: model.name, registrationNo: vehicle?.registrationNo ?? '',
        startAt: booking.startAt, endAt: booking.endAt, kmIncluded: booking.kmIncluded, extraKmPaise: model.extraKmPaise,
        pricePerDayPaise: model.priceDayPaise, depositPaise: Number(booking.depositPaise), odometerKm: handover.odometerKm,
        damageNotes: handover.damageNotes, emergencyContact: input.emergencyContact, signedAt: handover.signedAt!, signaturePng: signature,
      });
      const key = `agreements/${bookingId}/agreement.pdf`;
      await putObject(key, pdf, 'application/pdf');
      await handover.update({ agreementFileKey: key });
      await notifyUser(userId, { title: 'Agreement signed', text: agreementSignedMessage(booking.code), data: { bookingId } });
    } catch (err) {
      logger.error({ err, bookingId }, 'agreement PDF failed; the signature is stored');
    }
    return booking;
  },

  /** 5-minute link to the signed agreement PDF (or the signature image if the PDF is not ready). */
  async agreementLink(bookingId: string, origin: string, userId?: string) {
    await bookingFor(bookingId, userId);
    const h = await Handover.findOne({ where: { bookingId, type: 'PICKUP' } });
    if (!h?.agreementFileKey) throw new AppError(404, 'NO_AGREEMENT', 'The agreement has not been signed yet.');
    return presignGet(h.agreementFileKey, origin);
  },

  /** Staff inspect the bike: charges come out of the deposit, ONGOING → COMPLETED, then the refund → DEPOSIT_SETTLED. */
  async recordReturn(staffId: string, bookingId: string, input: ReturnHandoverInput, ip: string | null) {
    const { booking, charges } = await sequelize.transaction(async (t) => {
      const booking = await Booking.findByPk(bookingId, { lock: t.LOCK.UPDATE, transaction: t });
      if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
      assertTransition(booking.status, 'COMPLETED');
      const pickup = await Handover.findOne({ where: { bookingId, type: 'PICKUP' }, transaction: t });
      if (!pickup) throw new AppError(409, 'NO_HANDOVER', 'There is no pickup record for this booking.');
      if (input.odometerKm < pickup.odometerKm) throw new AppError(422, 'VALIDATION', 'The odometer reading is below the pickup reading.');
      const model = await VehicleModel.findByPk(booking.vehicleModelId, { rejectOnEmpty: true, transaction: t });
      const returnedAt = input.returnedAt ?? new Date();
      const charges = returnCharges(
        { kmIncluded: booking.kmIncluded, endAt: booking.endAt, depositPaise: Number(booking.depositPaise) },
        { extraKmPaise: model.extraKmPaise, pricePerDayPaise: model.priceDayPaise },
        { odometerStartKm: pickup.odometerKm, odometerEndKm: input.odometerKm, returnedAt, damagePaise: input.damagePaise },
      );
      await Handover.create({
        bookingId, type: 'RETURN', odometerKm: input.odometerKm, fuelLevel: input.fuelLevel ?? null, photos: input.photos,
        damageNotes: input.damageNotes ?? null, agreementFileKey: null, staffId, signedAt: null, emergencyContact: null,
        checklist: input.checklist, charges,
      }, { transaction: t });
      await Vehicle.update({ odometerKm: input.odometerKm, currentLocationId: booking.returnLocationId }, { where: { id: booking.vehicleId }, transaction: t });
      await booking.update({ status: 'COMPLETED' }, { transaction: t });
      await audit({ id: staffId, ip }, { action: 'handover.return', entity: 'booking', entityId: bookingId, diff: { charges } }, t);
      return { booking, charges };
    });

    if (charges.refundPaise > 0) await paymentService.refund(booking.id, charges.refundPaise, 'deposit');
    await settleDepositIfRefunded(booking.id);
    return { booking: await booking.reload(), charges };
  },
};
