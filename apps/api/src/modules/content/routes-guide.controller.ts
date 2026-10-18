import type { Request, Response } from 'express';
import { pricingService } from '../pricing/pricing.service';
import { routeGuideService } from './routes-guide.service';

export const list = async (_req: Request, res: Response) => { res.json({ data: await routeGuideService.list() }); };
export const bySlug = async (req: Request, res: Response) => { res.json({ data: await routeGuideService.bySlug(String(req.params.slug)) }); };
export const pricing = async (_req: Request, res: Response) => { res.json({ data: await pricingService.table() }); };
