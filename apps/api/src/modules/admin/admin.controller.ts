import type { Request, Response } from 'express';
import { adminService } from './admin.service';
import { pnlCsv, previousMonth, reportsService } from './reports.service';
import { couponService } from '../pricing/coupon.service';
import { pricingService } from '../pricing/pricing.service';
import { routeGuideService } from '../content/routes-guide.service';
import { vehicleSpecsService } from '../content/specs.service';

const actor = (req: Request) => ({ id: req.user!.id, ip: req.ip ?? null });
const id = (req: Request) => String(req.params.id);
const range = (req: Request) => req.query as unknown as { from: Date; to: Date };

export const dashboard = async (_req: Request, res: Response) => { res.json({ data: await adminService.dashboard() }); };

export const vehicles = async (_req: Request, res: Response) => { res.json({ data: await adminService.vehicles() }); };
export const vehicle = async (req: Request, res: Response) => { res.json({ data: await adminService.vehicle(id(req)) }); };
export async function createVehicle(req: Request, res: Response) {
  const v = await adminService.createVehicle(actor(req), req.body);
  res.status(201).json({ data: await adminService.vehicle(v.id) });
}
export async function setVehicleStatus(req: Request, res: Response) {
  res.json({ data: await adminService.setStatus(actor(req), id(req), req.body.status, req.body.reason) });
}
export async function logMaintenance(req: Request, res: Response) {
  await adminService.logMaintenance(actor(req), id(req), req.body);
  res.status(201).json({ data: await adminService.vehicle(id(req)) });
}
export async function addVehicleDocument(req: Request, res: Response) {
  await adminService.addVehicleDocument(actor(req), id(req), req.body);
  res.status(201).json({ data: await adminService.vehicle(id(req)) });
}

export const calendar = async (req: Request, res: Response) => { res.json({ data: await adminService.calendar(range(req).from, range(req).to) }); };
export const booking = async (req: Request, res: Response) => { res.json({ data: await adminService.booking(id(req)) }); };
export async function cancelBooking(req: Request, res: Response) {
  const r = await adminService.cancel(actor(req), id(req), req.body.reason);
  res.json({ data: { booking: r.booking.toDTO(), refund: r.refund } });
}

export const utilisation = async (req: Request, res: Response) => { res.json({ data: await reportsService.utilisation(range(req).from, range(req).to) }); };
export async function pnl(req: Request, res: Response) {
  const month = String(req.query.month);
  const [current, previous] = await Promise.all([reportsService.pnl(month), reportsService.pnl(previousMonth(month))]);
  res.json({ data: { current, previous } });
}
export async function pnlCsvExport(req: Request, res: Response) {
  const month = String(req.query.month);
  const rows = await Promise.all([reportsService.pnl(previousMonth(month)), reportsService.pnl(month)]);
  res.type('text/csv').set('Content-Disposition', `attachment; filename="valley-ride-pnl-${month}.csv"`).send(pnlCsv(rows));
}

export const coupons = async (_req: Request, res: Response) => { res.json({ data: await couponService.list() }); };
export const createCoupon = async (req: Request, res: Response) => { res.status(201).json({ data: await couponService.create(actor(req), req.body) }); };

export const pricingRules = async (_req: Request, res: Response) => { res.json({ data: await pricingService.listRules() }); };
export const createPricingRule = async (req: Request, res: Response) => { res.status(201).json({ data: await pricingService.saveRule(actor(req), req.body) }); };
export const updatePricingRule = async (req: Request, res: Response) => { res.json({ data: await pricingService.saveRule(actor(req), { ...req.body, id: id(req) }) }); };
export async function deletePricingRule(req: Request, res: Response) { await pricingService.deleteRule(actor(req), id(req)); res.status(204).end(); }
export const updateVehicleModel = async (req: Request, res: Response) => { res.json({ data: await pricingService.updateModel(actor(req), id(req), req.body) }); };
export const updateVehicleSpecs = async (req: Request, res: Response) => { res.json({ data: await vehicleSpecsService.save(actor(req), id(req), req.body) }); };

export const routeGuides = async (_req: Request, res: Response) => { res.json({ data: await routeGuideService.list() }); };
export const createRouteGuide = async (req: Request, res: Response) => { res.status(201).json({ data: await routeGuideService.save(actor(req), req.body) }); };
export const updateRouteGuide = async (req: Request, res: Response) => { res.json({ data: await routeGuideService.save(actor(req), req.body, id(req)) }); };
export async function deleteRouteGuide(req: Request, res: Response) { await routeGuideService.remove(actor(req), id(req)); res.status(204).end(); }
