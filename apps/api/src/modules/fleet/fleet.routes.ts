import { Router } from 'express';
import * as ctrl from './fleet.controller';

export const fleetRouter = Router();

fleetRouter.get('/locations', ctrl.locations);
fleetRouter.get('/vehicle-models', ctrl.models);
fleetRouter.get('/vehicle-models/:slug', ctrl.modelBySlug);
// Staff endpoints (GET/POST /admin/vehicles, status, maintenance) arrive with the Phase 2 admin dashboard.
