import type { Request, Response } from 'express';
import { fleetService } from './fleet.service';

export async function locations(_req: Request, res: Response) {
  res.json({ data: await fleetService.locations() });
}
export async function models(_req: Request, res: Response) {
  res.json({ data: await fleetService.models() });
}
export async function modelBySlug(req: Request, res: Response) {
  res.json({ data: await fleetService.modelBySlug(String(req.params.slug)) });
}
