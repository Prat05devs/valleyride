import { Op, QueryTypes, UniqueConstraintError } from 'sequelize';
import type { CreateVehicleInput, MaintenanceInput, VehicleStatus } from '@valleyride/shared';
import { ACTIVE_STATUSES } from '@valleyride/shared';
import {
  AuditLog, Booking, CustomerDocument, Handover, Location, MaintenanceRecord, Payment, sequelize, User, Vehicle, VehicleDocument, VehicleModel,
} from '../../db';
import { AppError } from '../../utils/AppError';
import { audit, type Actor } from '../../utils/audit';
import { toDocumentDTO } from '../kyc/kyc.service';
import { invalidate } from '../../utils/cache';
import { bookingService } from '../booking/booking.service';


/** Days until a YYYY-MM-DD date (negative when past). */
const daysUntil = (d: string | null) => (d ? Math.ceil((new Date(`${d}T00:00:00+05:30`).getTime() - Date.now()) / 86_400_000) : null);

export const adminService = {
  // ─── Fleet ────────────────────────────────────────────────────────────────────────────────────
  /** The fleet list, or one vehicle when `id` is given, with its live bookings and document alerts. */
  async vehicles(id?: string) {
    const rows = await Vehicle.findAll({
      where: id ? { id } : {},
      include: [
        { model: VehicleModel, as: 'model', attributes: ['id', 'slug', 'name'] },
        { model: Location, as: 'homeLocation', attributes: ['id', 'name'] },
        { model: VehicleDocument, as: 'documents' },
      ],
      order: [['registrationNo', 'ASC']],
    });
    const now = new Date();
    const live = await Booking.findAll({
      where: { status: { [Op.in]: ['CONFIRMED', 'ONGOING'] }, endAt: { [Op.gt]: now }, ...(id ? { vehicleId: id } : {}) },
      attributes: ['id', 'code', 'vehicleId', 'status', 'startAt', 'endAt'], order: [['startAt', 'ASC']],
    });
    return rows.map((v) => {
      const r = v as Vehicle & { model: VehicleModel; homeLocation: Location; documents: VehicleDocument[] };
      const mine = live.filter((b) => b.vehicleId === v.id);
      const out = mine.find((b) => b.status === 'ONGOING');
      const docs = r.documents.map((d) => ({ id: d.id, type: d.type, number: d.number, expiresOn: d.expiresOn, daysLeft: daysUntil(d.expiresOn) }));
      return {
        id: v.id, registrationNo: v.registrationNo, status: v.status, odometerKm: v.odometerKm, purchasedOn: v.purchasedOn,
        model: { id: r.model.id, slug: r.model.slug, name: r.model.name }, home: { id: r.homeLocation.id, name: r.homeLocation.name },
        onRide: out ? { bookingId: out.id, code: out.code, endAt: out.endAt.toISOString() } : null,
        next: mine.find((b) => b.status === 'CONFIRMED') ? (({ id, code, startAt }) => ({ bookingId: id, code, startAt: startAt.toISOString() }))(mine.find((b) => b.status === 'CONFIRMED')!) : null,
        documents: docs,
        docAlert: docs.some((d) => d.daysLeft !== null && d.daysLeft <= 30),
      };
    });
  },

  async vehicle(id: string) {
    const [v] = await this.vehicles(id);
    if (!v) throw new AppError(404, 'NOT_FOUND', 'Vehicle not found');
    const [maintenance, bookings] = await Promise.all([
      MaintenanceRecord.findAll({ where: { vehicleId: id }, order: [['performedOn', 'DESC']], limit: 50 }),
      Booking.findAll({ where: { vehicleId: id, status: { [Op.notIn]: ['EXPIRED'] } }, order: [['startAt', 'DESC']], limit: 20,
        include: [{ model: User, as: 'customer', attributes: ['fullName', 'phone'] }] }),
    ]);
    return {
      ...v,
      maintenance: maintenance.map((m) => ({ id: m.id, type: m.type, odometerKm: m.odometerKm, costPaise: Number(m.costPaise), performedOn: m.performedOn, notes: m.notes })),
      bookings: bookings.map((b) => ({ ...b.toDTO(), customer: (b as Booking & { customer: User }).customer?.fullName ?? null })),
    };
  },

  async createVehicle(a: Actor, input: CreateVehicleInput) {
    try {
      const v = await Vehicle.create({ ...input, registrationNo: input.registrationNo.replace(/\s+/g, ' '), purchasedOn: input.purchasedOn ?? null });
      await audit(a, { action: 'vehicle.create', entity: 'vehicle', entityId: v.id, diff: input });
      await invalidate('fleet:');
      return v;
    } catch (e) {
      if (e instanceof UniqueConstraintError) throw new AppError(409, 'DUPLICATE', 'A vehicle with this registration already exists.');
      throw e;
    }
  },

  /** MAINT or RETIRED leaves existing bookings in place and reports them so staff can move riders to another unit. */
  async setStatus(a: Actor, id: string, status: VehicleStatus, reason?: string) {
    const v = await Vehicle.findByPk(id);
    if (!v) throw new AppError(404, 'NOT_FOUND', 'Vehicle not found');
    const before = v.status;
    await v.update({ status });
    await audit(a, { action: 'vehicle.status', entity: 'vehicle', entityId: id, diff: { status: [before, status], reason: reason ?? null } });
    await invalidate('fleet:');
    const affected = status === 'ACTIVE' ? [] : await Booking.findAll({
      where: { vehicleId: id, status: { [Op.in]: ACTIVE_STATUSES as string[] }, endAt: { [Op.gt]: new Date() } }, attributes: ['id', 'code', 'startAt'],
    });
    return { status, affectedBookings: affected.map((b) => ({ id: b.id, code: b.code, startAt: b.startAt.toISOString() })) };
  },

  async logMaintenance(a: Actor, id: string, input: MaintenanceInput) {
    const v = await Vehicle.findByPk(id);
    if (!v) throw new AppError(404, 'NOT_FOUND', 'Vehicle not found');
    const m = await MaintenanceRecord.create({ vehicleId: id, ...input, notes: input.notes ?? null });
    const scheduled = input.performedOn > new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
    if (!scheduled && input.odometerKm > v.odometerKm) await v.update({ odometerKm: input.odometerKm }); // a future date is a scheduled service
    await audit(a, { action: 'vehicle.maintenance', entity: 'vehicle', entityId: id, diff: { type: input.type, costPaise: input.costPaise } });
    return m;
  },

  async addVehicleDocument(a: Actor, id: string, input: { type: 'RC' | 'INSURANCE' | 'PERMIT' | 'PUC'; number: string; expiresOn?: string }) {
    if (!(await Vehicle.findByPk(id))) throw new AppError(404, 'NOT_FOUND', 'Vehicle not found');
    return sequelize.transaction(async (t) => {
      await VehicleDocument.destroy({ where: { vehicleId: id, type: input.type }, transaction: t }); // one current document per type
      const d = await VehicleDocument.create({ vehicleId: id, type: input.type, number: input.number, expiresOn: input.expiresOn ?? null, fileKey: null }, { transaction: t });
      await audit(a, { action: 'vehicle.document', entity: 'vehicle', entityId: id, diff: input }, t);
      return d;
    });
  },

  // ─── Bookings ─────────────────────────────────────────────────────────────────────────────────
  /** Pickup and return calendar: every non-expired booking overlapping [from, to). */
  async calendar(from: Date, to: Date) {
    const rows = await Booking.findAll({
      where: { status: { [Op.notIn]: ['EXPIRED'] }, startAt: { [Op.lt]: to }, endAt: { [Op.gt]: from } },
      include: [
        { model: User, as: 'customer', attributes: ['fullName', 'phone'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'registrationNo'] },
        { model: VehicleModel, as: 'model', attributes: ['slug', 'name'] },
      ],
      order: [['startAt', 'ASC']],
    });
    const docs = await CustomerDocument.findAll({ where: { userId: [...new Set(rows.map((b) => b.userId))] }, attributes: ['userId', 'type', 'status'] });
    const docState = (userId: string) => {
      const mine = docs.filter((d) => d.userId === userId);
      const dl = mine.find((d) => d.type === 'DL');
      const id = mine.find((d) => d.type !== 'DL');
      if (dl?.status === 'VERIFIED' && id?.status === 'VERIFIED') return 'verified' as const;
      return !dl || !id ? ('missing' as const) : ('pending' as const);
    };
    return rows.map((b) => {
      const r = b as Booking & { customer: User; vehicle: Vehicle; model: VehicleModel };
      return {
        ...b.toDTO(), customer: { name: r.customer?.fullName ?? null, phone: r.customer?.phone ?? null, docs: docState(b.userId) },
        vehicle: { id: r.vehicle.id, registrationNo: r.vehicle.registrationNo }, model: { slug: r.model.slug, name: r.model.name },
      };
    });
  },

  async booking(id: string) {
    const b = await Booking.findByPk(id, {
      include: [
        { model: User, as: 'customer', attributes: ['id', 'fullName', 'phone', 'email'] },
        { model: Vehicle, as: 'vehicle', attributes: ['id', 'registrationNo', 'odometerKm'] },
        { model: VehicleModel, as: 'model' },
      ],
    });
    if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    const r = b as Booking & { customer: User; vehicle: Vehicle; model: VehicleModel };
    const [docs, payments, handovers, locations] = await Promise.all([
      CustomerDocument.findAll({ where: { userId: b.userId }, order: [['createdAt', 'DESC']] }),
      Payment.findAll({ where: { bookingId: id }, order: [['createdAt', 'ASC']] }),
      Handover.findAll({ where: { bookingId: id } }),
      Location.findAll({ where: { id: [b.pickupLocationId, b.returnLocationId] } }),
    ]);
    const audits = await AuditLog.findAll({
      where: { [Op.or]: [{ entity: 'booking', entityId: id }, { entity: 'customer_document', entityId: docs.map((d) => d.id) }] },
      include: [{ model: User, as: 'actor', attributes: ['fullName', 'role'] }], order: [['createdAt', 'DESC']], limit: 50,
    });
    const AUDIT_TEXT: Record<string, string> = {
      'handover.pickup': 'Pickup recorded at the desk', 'handover.return': 'Return inspected', 'booking.cancelled': 'Booking cancelled', 'payment.captured': 'Payment captured', 'payment.refund': 'Refund sent', 'payment.refund_failed': 'Refund failed, retry it in Razorpay', 'booking.extend': 'Trip extended',
      'kyc.verified': 'Document verified', 'kyc.rejected': 'Document rejected',
    };
    const activity = [
      { text: `Hold created on ${r.vehicle.registrationNo} for 15 minutes`, by: 'Customer', at: (b.get('createdAt') as Date).toISOString() },
      ...handovers.filter((h) => h.signedAt).map((h) => ({ text: 'Rider signed the agreement, ride started', by: 'Customer', at: h.signedAt!.toISOString() })),
      ...audits.map((a) => {
        const d = (a.diff as { note?: string; reason?: string; amountPaise?: number } | null) ?? {};
        const actor = (a as AuditLog & { actor?: User }).actor;
        const money = a.action.startsWith('payment.') && d.amountPaise ? ` · ₹${(d.amountPaise / 100).toFixed(2)}` : '';
        const note = d.note ?? d.reason;
        return { text: `${AUDIT_TEXT[a.action] ?? a.action}${money}${note ? `: ${note}` : ''}`, by: actor?.fullName ?? (a.actorId ? 'Staff' : 'System'), at: (a.get('createdAt') as Date).toISOString() };
      }),
    ].sort((x, y) => y.at.localeCompare(x.at));
    return {
      ...b.toDTO(),
      customer: { id: r.customer.id, name: r.customer.fullName, phone: r.customer.phone, email: r.customer.email },
      vehicle: { id: r.vehicle.id, registrationNo: r.vehicle.registrationNo, odometerKm: r.vehicle.odometerKm },
      model: { slug: r.model.slug, name: r.model.name, extraKmPaise: r.model.extraKmPaise, pricePerDayPaise: r.model.priceDayPaise },
      pickupLocation: locations.find((l) => l.id === b.pickupLocationId)?.name ?? null,
      returnLocation: locations.find((l) => l.id === b.returnLocationId)?.name ?? null,
      documents: docs.map(toDocumentDTO),
      payments: payments.map((p) => ({ id: p.id, kind: p.kind, status: p.status, amountPaise: Number(p.amountPaise), providerOrderId: p.providerOrderId, providerPaymentId: p.providerPaymentId, at: (p.get('createdAt') as Date).toISOString() })),
      activity,
      handovers: handovers.map((h) => ({ type: h.type, odometerKm: h.odometerKm, fuelLevel: h.fuelLevel, photos: h.photos.length, damageNotes: h.damageNotes, signedAt: h.signedAt?.toISOString() ?? null, charges: h.charges, emergencyContact: h.emergencyContact, at: h.createdAt.toISOString() })),
    };
  },

  async cancel(a: Actor, id: string, reason?: string) {
    const b = await Booking.findByPk(id, { attributes: ['userId'] });
    if (!b) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
    return bookingService.cancel(b.userId, id, reason ? `staff: ${reason}` : 'staff', a);
  },

  // ─── Dashboard ────────────────────────────────────────────────────────────────────────────────
  /** Today in IST: pickups, returns, fleet status, KYC queue and this month's revenue so far. */
  async dashboard() {
    const [today] = await sequelize.query<{ start: Date; end: Date; month: Date }>(
      `SELECT date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata' AS start,
              (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') + interval '1 day') AT TIME ZONE 'Asia/Kolkata' AS end,
              date_trunc('month', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata' AS month`, { type: QueryTypes.SELECT });
    const window = await this.calendar(today!.start, today!.end);
    const pickups = window.filter((b) => new Date(b.startAt) >= today!.start && b.status !== 'CANCELLED');
    const returns = window.filter((b) => new Date(b.endAt) < today!.end && new Date(b.endAt) >= today!.start && ['ONGOING', 'CONFIRMED'].includes(b.status));
    const [fleet, kyc, revenue, overdue] = await Promise.all([
      sequelize.query<{ status: string; n: number }>(`SELECT status, COUNT(*)::int AS n FROM vehicles GROUP BY status`, { type: QueryTypes.SELECT }),
      CustomerDocument.count({ where: { status: 'PENDING' } }),
      sequelize.query<{ rental: number }>(
        `SELECT COALESCE(SUM(rental_paise - discount_paise), 0)::bigint AS rental FROM bookings
         WHERE status IN ('CONFIRMED','ONGOING','COMPLETED','DEPOSIT_SETTLED') AND start_at >= :m`, { replacements: { m: today!.month }, type: QueryTypes.SELECT }),
      Booking.count({ where: { status: 'ONGOING', endAt: { [Op.lt]: new Date() } } }),
    ]);
    const onRide = await Booking.count({ where: { status: 'ONGOING' } });
    const total = fleet.reduce((s, f) => s + f.n, 0);
    const [held] = await sequelize.query<{ paise: number; n: number }>(
      `SELECT COALESCE(SUM(deposit_paise), 0)::bigint AS paise, COUNT(*)::int AS n FROM bookings WHERE status IN ('CONFIRMED','ONGOING','COMPLETED')`, { type: QueryTypes.SELECT });
    const docAlerts = (await VehicleDocument.findAll({
      where: { expiresOn: { [Op.lte]: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10) } },
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'registrationNo'] }], order: [['expiresOn', 'ASC']], limit: 10,
    })).map((d) => ({ vehicleId: d.vehicleId, registrationNo: (d as VehicleDocument & { vehicle?: Vehicle }).vehicle?.registrationNo ?? '', type: d.type, expiresOn: d.expiresOn }));
    const servicesDue = (await MaintenanceRecord.findAll({
      where: { performedOn: { [Op.between]: [new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10), new Date(Date.now() + (7 * 24 + 5.5) * 3_600_000).toISOString().slice(0, 10)] } },
      include: [{ model: Vehicle, as: 'vehicle', attributes: ['id', 'registrationNo'] }], order: [['performedOn', 'ASC']],
    })).map((m) => ({ vehicleId: m.vehicleId, registrationNo: (m as MaintenanceRecord & { vehicle?: Vehicle }).vehicle?.registrationNo ?? '', type: m.type, on: m.performedOn, notes: m.notes }));
    return {
      pickups, returns, kycPending: kyc, overdueReturns: overdue, docAlerts, servicesDue,
      depositsHeld: { paise: Number(held?.paise ?? 0), bookings: held?.n ?? 0 },
      monthStart: today!.month.toISOString(),
      fleet: { total, onRide, byStatus: Object.fromEntries(fleet.map((f) => [f.status, f.n])) },
      monthRentalPaise: Number(revenue[0]?.rental ?? 0),
    };
  },
};
