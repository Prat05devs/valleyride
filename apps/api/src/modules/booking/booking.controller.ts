import type { Request, Response } from 'express';
import { bookingService } from './booking.service';
import { pricingService } from '../pricing/pricing.service';
import { accountService } from './account.service';

export async function create(req: Request, res: Response) {
  const { booking, order } = await bookingService.create(req.user!.id, req.body, req.idempotencyKey!);
  res.status(201).json({ data: { booking: booking.toDTO(), razorpayOrderId: order.id } });
}
export async function availability(req: Request, res: Response) {
  const { startAt, endAt, pickup, return: ret } = req.query as unknown as { startAt: Date; endAt: Date; pickup?: string; return?: string };
  res.json({ data: await bookingService.availabilityWithQuotes(startAt, endAt, pickup, ret) });
}
export async function listMine(req: Request, res: Response) {
  const bookings = await bookingService.listMine(req.user!.id);
  res.json({ data: bookings.map((b) => b.toDTO()) });
}
export async function getOne(req: Request, res: Response) {
  const booking = await bookingService.getOne(req.user!.id, String(req.params.id));
  const pendingOrderId = booking.status === 'PENDING_PAYMENT' ? await bookingService.pendingOrderId(booking.id) : null;
  res.json({ data: { ...booking.toDTO(), pendingOrderId } });
}
export async function cancel(req: Request, res: Response) {
  const { booking, refund } = await bookingService.cancel(req.user!.id, String(req.params.id), req.body?.reason);
  res.json({ data: { booking: booking.toDTO(), refund } });
}
export async function cancelPreview(req: Request, res: Response) {
  res.json({ data: await bookingService.cancelPreview(req.user!.id, String(req.params.id)) });
}
export async function extendPreview(req: Request, res: Response) {
  const { endAt } = req.query as unknown as { endAt: Date };
  const p = await bookingService.extendPreview(req.user!.id, String(req.params.id), endAt);
  res.json({ data: { available: p.available, quote: p.quote, payPaise: p.payPaise } });
}
export async function extend(req: Request, res: Response) {
  const r = await bookingService.extend(req.user!.id, String(req.params.id), req.body.endAt, req.idempotencyKey!);
  res.status(201).json({ data: { booking: r.booking.toDTO(), razorpayOrderId: r.razorpayOrderId, payPaise: r.payPaise } });
}
export async function quote(req: Request, res: Response) {
  res.json({ data: await pricingService.quoteFor(req.body) });
}
// (Express 5 forwards rejected promises to the error middleware, so no try/catch is needed.)
export async function applyCoupon(req: Request, res: Response) {
  const r = await bookingService.applyCoupon(req.user!.id, String(req.params.id), req.body.code ?? null);
  res.json({ data: { booking: { ...r.booking.toDTO(), pendingOrderId: r.razorpayOrderId }, razorpayOrderId: r.razorpayOrderId } });
}
export async function myPayments(req: Request, res: Response) { res.json({ data: await accountService.payments(req.user!.id) }); }
export async function myNotifications(req: Request, res: Response) { res.json({ data: await accountService.notifications(req.user!.id) }); }
