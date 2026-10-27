import { GST_PCT, ONE_WAY_FEE_PAISE, type ReturnCharges } from '@valleyride/shared';
import { Booking, Handover, User, VehicleModel } from '../../db';
import { AppError } from '../../utils/AppError';

export interface InvoiceLine { label: string; amountPaise: number }

/**
 * Tax invoice data for a booking: the rental at checkout plus extra km and late fees from the return inspection.
 * The refundable deposit and damage recovery are not part of it. GSTIN, SAC and the business address are
 * owner-supplied; missing registration fields are omitted from the receipt.
 */
export async function invoiceFor(userId: string | null, bookingId: string) {
  const booking = await Booking.findOne({ where: userId ? { id: bookingId, userId } : { id: bookingId } });
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Booking not found');
  if (['PENDING_PAYMENT', 'EXPIRED'].includes(booking.status)) throw new AppError(409, 'NOT_PAID', 'This booking has no invoice.');
  const [model, user, ret] = await Promise.all([
    VehicleModel.findByPk(booking.vehicleModelId, { rejectOnEmpty: true }),
    User.findByPk(booking.userId, { attributes: ['fullName', 'phone'] }),
    Handover.findOne({ where: { bookingId, type: 'RETURN' } }),
  ]);
  const c: ReturnCharges | null = ret?.charges ?? null;
  const short = model.name.replace(/^Royal Enfield |^Honda /, '');
  const lines: InvoiceLine[] = [
    { label: `${short} rental · ${booking.billableDays} ${booking.billableDays === 1 ? 'day' : 'days'} (taxable component)`, amountPaise: Number(booking.rentalPaise) },
  ];
  if (Number(booking.discountPaise) > 0) lines.push({ label: booking.couponCode ? `Discounts incl. coupon ${booking.couponCode}` : 'Long-rental discount', amountPaise: -Number(booking.discountPaise) });
  if (Number(booking.feesPaise) > 0) lines.push({ label: 'One-way fee', amountPaise: Math.min(Number(booking.feesPaise), ONE_WAY_FEE_PAISE) });
  if (c?.extraKmPaise) lines.push({ label: `Extra km · ${c.extraKm} (taxable component)`, amountPaise: c.extraKmPaise });
  if (c?.lateFeePaise) lines.push({ label: `Late return · ${c.lateHours} h`, amountPaise: c.lateFeePaise });

  const taxablePaise = lines.reduce((s, l) => s + l.amountPaise, 0);
  const taxPaise = Number(booking.taxPaise) + (c?.taxPaise ?? 0);
  const cgstPaise = Math.ceil(taxPaise / 2);
  const issuedAt = ret?.createdAt ?? (booking.get('updatedAt') as Date);
  const yymm = `${String(issuedAt.getFullYear()).slice(2)}${String(issuedAt.getMonth() + 1).padStart(2, '0')}`;
  return {
    number: `VR-INV-${yymm}-${booking.code.slice(3)}`,
    issuedAt: issuedAt.toISOString(),
    final: !!ret,
    seller: { name: 'WT IT Solutions · Valley Ride', gstin: process.env.BUSINESS_GSTIN ?? null, sac: process.env.BUSINESS_SAC ?? null, address: 'Near IT Park, Sahastradhara Road, Dehradun, India', email: 'admin@wtsolutions.cc' },
    billedTo: { name: user?.fullName ?? null, phone: user?.phone ?? null },
    bookingCode: booking.code,
    lines, taxablePaise, gstPct: GST_PCT,
    cgstPaise, sgstPaise: taxPaise - cgstPaise, totalPaise: taxablePaise + taxPaise,
    depositPaise: Number(booking.depositPaise),
  };
}
