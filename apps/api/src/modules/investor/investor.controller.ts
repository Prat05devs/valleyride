import type { Request, Response } from 'express';
import { investorService } from './investor.service';
import { statementPdf } from './statement-pdf';
import { originOf } from '../kyc/kyc.controller';
import { newFileKey, presignGet, presignPut } from '../kyc/s3-presign';

const actor = (req: Request) => ({ id: req.user!.id, ip: req.ip ?? null });

export async function calculate(req: Request, res: Response) {
  res.json({ data: investorService.calculate(req.body) });
}
export async function myInvestments(req: Request, res: Response) {
  res.json({ data: await investorService.myInvestments(req.user!.id) });
}
export async function mySchedule(req: Request, res: Response) {
  res.json({ data: await investorService.myInvestment(req.user!.id, String(req.params.id)) });
}
export async function statement(req: Request, res: Response) {
  const inv = await investorService.myInvestment(req.user!.id, String(req.params.id));
  const pdf = await statementPdf(inv);
  res.type('application/pdf').set('Content-Disposition', `attachment; filename="valley-ride-${inv.ref}.pdf"`).send(pdf);
}

export async function listInvestors(_req: Request, res: Response) { res.json({ data: await investorService.listInvestors() }); }
export async function createInvestor(req: Request, res: Response) { res.status(201).json({ data: await investorService.createInvestor(actor(req), req.body) }); }
export async function allInvestments(_req: Request, res: Response) { res.json({ data: await investorService.allInvestments() }); }
export async function createInvestment(req: Request, res: Response) {
  const id = await investorService.createInvestment(actor(req), req.body);
  res.status(201).json({ data: { id } });
}
export async function dues(req: Request, res: Response) { res.json({ data: await investorService.dues(String(req.query.month)) }); }
export async function markPaid(req: Request, res: Response) {
  res.json({ data: await investorService.markPaid(actor(req), String(req.params.id), req.body.txnRef, req.body.paidAt) });
}

export async function myProfile(req: Request, res: Response) { res.json({ data: await investorService.myProfile(req.user!.id) }); }
export async function updateProfile(req: Request, res: Response) { res.json({ data: await investorService.updateProfile(req.user!.id, req.body) }); }
export async function agreement(req: Request, res: Response) {
  const staff = req.user!.role === 'admin';
  const key = await investorService.agreementKey(staff ? null : req.user!.id, String(req.params.id));
  res.json({ data: { url: await presignGet(key, originOf(req)), expiresInSeconds: 300 } });
}
export async function presignAgreement(req: Request, res: Response) {
  res.json({ data: await presignPut(newFileKey('investments', 'application/pdf'), 'application/pdf', originOf(req)) });
}
