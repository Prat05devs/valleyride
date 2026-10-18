import { Router } from 'express';
import { z } from 'zod';
import {
  calendarQuerySchema, createCouponSchema, createVehicleSchema, maintenanceSchema, monthQuerySchema, pricingRuleSchema,
  routeGuideInputSchema, uuid, vehicleDocumentSchema, vehicleModelPriceSchema, vehicleSpecsSchema, vehicleStatusSchema,
} from '@valleyride/shared';
import { authenticate, authorize } from '../../middleware/auth';
import { requireIdempotencyKey } from '../../middleware/idempotency';
import { validate } from '../../middleware/validate';
import * as ctrl from './admin.controller';

/** Staff and admin console. Every route is behind authorize('staff') or authorize('admin'). */
export const adminRouter = Router();
const idParams = z.object({ id: uuid });
const staff = [authenticate, authorize('staff')];
const admin = [authenticate, authorize('admin')];

adminRouter.get('/admin/dashboard', ...staff, ctrl.dashboard);

adminRouter.get('/admin/vehicles', ...staff, ctrl.vehicles);
adminRouter.get('/admin/vehicles/:id', ...staff, validate({ params: idParams }), ctrl.vehicle);
adminRouter.post('/admin/vehicles', ...admin, validate({ body: createVehicleSchema }), ctrl.createVehicle);
adminRouter.patch('/admin/vehicles/:id/status', ...staff, validate({ params: idParams, body: vehicleStatusSchema }), ctrl.setVehicleStatus);
adminRouter.post('/admin/vehicles/:id/maintenance', ...staff, validate({ params: idParams, body: maintenanceSchema }), ctrl.logMaintenance);
adminRouter.post('/admin/vehicles/:id/documents', ...staff, validate({ params: idParams, body: vehicleDocumentSchema }), ctrl.addVehicleDocument);

adminRouter.get('/admin/bookings', ...staff, validate({ query: calendarQuerySchema }), ctrl.calendar);
adminRouter.get('/admin/bookings/:id', ...staff, validate({ params: idParams }), ctrl.booking);
adminRouter.post('/admin/bookings/:id/cancel', ...staff, requireIdempotencyKey,
  validate({ params: idParams, body: z.object({ reason: z.string().trim().max(300).optional() }) }), ctrl.cancelBooking);

adminRouter.get('/admin/reports/utilisation', ...admin, validate({ query: calendarQuerySchema }), ctrl.utilisation);
adminRouter.get('/admin/reports/pnl', ...admin, validate({ query: monthQuerySchema }), ctrl.pnl);
adminRouter.get('/admin/reports/pnl.csv', ...admin, validate({ query: monthQuerySchema }), ctrl.pnlCsvExport);

adminRouter.get('/admin/coupons', ...admin, ctrl.coupons);
adminRouter.post('/admin/coupons', ...admin, validate({ body: createCouponSchema }), ctrl.createCoupon);

// Prices change in the database, not in code: vehicle_models and pricing_rules.
adminRouter.get('/admin/pricing-rules', ...admin, ctrl.pricingRules);
adminRouter.post('/admin/pricing-rules', ...admin, validate({ body: pricingRuleSchema }), ctrl.createPricingRule);
adminRouter.patch('/admin/pricing-rules/:id', ...admin, validate({ params: idParams, body: pricingRuleSchema }), ctrl.updatePricingRule);
adminRouter.delete('/admin/pricing-rules/:id', ...admin, validate({ params: idParams }), ctrl.deletePricingRule);
adminRouter.patch('/admin/vehicle-models/:id', ...admin, validate({ params: idParams, body: vehicleModelPriceSchema }), ctrl.updateVehicleModel);
adminRouter.put('/admin/vehicle-models/:id/specs', ...staff, validate({ params: idParams, body: vehicleSpecsSchema }), ctrl.updateVehicleSpecs);

// Ride-discovery CMS.
adminRouter.get('/admin/routes', ...staff, ctrl.routeGuides);
adminRouter.post('/admin/routes', ...staff, validate({ body: routeGuideInputSchema }), ctrl.createRouteGuide);
adminRouter.patch('/admin/routes/:id', ...staff, validate({ params: idParams, body: routeGuideInputSchema }), ctrl.updateRouteGuide);
adminRouter.delete('/admin/routes/:id', ...admin, validate({ params: idParams }), ctrl.deleteRouteGuide);
