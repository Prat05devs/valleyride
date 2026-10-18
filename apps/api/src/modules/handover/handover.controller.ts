import type { Request, Response } from 'express';
import { z } from 'zod';
import { invoiceFor } from '../booking/booking.invoice';
import { invoicePdf } from '../booking/invoice-pdf';
import { originOf } from '../kyc/kyc.controller';
import { newFileKey, presignPut } from '../kyc/s3-presign';
import { handoverService } from './handover.service';
import { reviewService } from './review.service';

const id = (req: Request) => String(req.params.id);
const isStaff = (req: Request) => req.user!.role === 'staff' || req.user!.role === 'admin';

export async function presignPhoto(req: Request, res: Response) {
  const { contentType } = req.body as { contentType: string };
  res.json({ data: await presignPut(newFileKey(`handovers/${id(req)}`, contentType), contentType, originOf(req)) });
}
export async function recordPickup(req: Request, res: Response) {
  await handoverService.recordPickup(req.user!.id, id(req), req.body, req.ip ?? null);
  res.status(201).json({ data: await handoverService.forBooking(id(req), originOf(req)) });
}
export async function recordReturn(req: Request, res: Response) {
  const { booking, charges } = await handoverService.recordReturn(req.user!.id, id(req), req.body, req.ip ?? null);
  res.status(201).json({ data: { booking: booking.toDTO(), charges } });
}
export async function show(req: Request, res: Response) {
  res.json({ data: await handoverService.forBooking(id(req), originOf(req), isStaff(req) ? undefined : req.user!.id) });
}
export async function reportMark(req: Request, res: Response) {
  await handoverService.reportMark(req.user!.id, id(req), req.body.note);
  res.json({ data: await handoverService.forBooking(id(req), originOf(req), req.user!.id) });
}
export async function startRide(req: Request, res: Response) {
  res.json({ data: (await handoverService.startRide(req.user!.id, id(req), req.body)).toDTO() });
}
export async function invoice(req: Request, res: Response) {
  res.json({ data: await invoiceFor(isStaff(req) ? null : req.user!.id, id(req)) });
}

export async function getReview(req: Request, res: Response) {
  res.json({ data: await reviewService.get(req.user!.id, id(req)) });
}
export async function putReview(req: Request, res: Response) {
  res.json({ data: await reviewService.put(req.user!.id, id(req), req.body) });
}

export const photoPresignSchema = z.object({ contentType: z.enum(['image/jpeg', 'image/png', 'image/heic']) });

export async function agreement(req: Request, res: Response) {
  res.json({ data: { url: await handoverService.agreementLink(id(req), originOf(req), isStaff(req) ? undefined : req.user!.id), expiresInSeconds: 300 } });
}
export async function invoicePdfDownload(req: Request, res: Response) {
  const inv = await invoiceFor(isStaff(req) ? null : req.user!.id, id(req));
  res.type('application/pdf').set('Content-Disposition', `attachment; filename="${inv.number}.pdf"`).send(await invoicePdf(inv));
}
