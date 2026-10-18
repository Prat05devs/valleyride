import type { Request, Response } from 'express';
import { presignGet, presignPut, newFileKey } from './s3-presign';
import { kycService } from './kyc.service';

export const originOf = (req: Request) => `${req.protocol}://${req.get('host')}`;

export async function presign(req: Request, res: Response) {
  const key = newFileKey(`kyc/${req.user!.id}/${String(req.body.type).toLowerCase()}`, req.body.contentType);
  res.json({ data: await presignPut(key, req.body.contentType, originOf(req)) });
}
export async function listMine(req: Request, res: Response) {
  res.json({ data: await kycService.listMine(req.user!.id) });
}
export async function submit(req: Request, res: Response) {
  res.status(201).json({ data: await kycService.submit(req.user!.id, req.body) });
}
export async function queue(req: Request, res: Response) {
  const status = (req.query.status as 'PENDING' | 'VERIFIED' | 'REJECTED' | undefined) ?? 'PENDING';
  res.json({ data: await kycService.queue(status) });
}
export async function fileLink(req: Request, res: Response) {
  const doc = await kycService.byId(String(req.params.docId));
  res.json({ data: { url: await presignGet(doc.fileKey, originOf(req)), expiresInSeconds: 300 } });
}
export async function review(req: Request, res: Response) {
  res.json({ data: await kycService.review(req.user!.id, String(req.params.docId), req.body, req.ip ?? null) });
}
