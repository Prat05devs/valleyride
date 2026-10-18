import { Router } from 'express';
import * as ctrl from './routes-guide.controller';

export const contentRouter = Router();

contentRouter.get('/routes', ctrl.list);
contentRouter.get('/routes/:slug', ctrl.bySlug);
/** Discount tiers, one-way fee and GST for client hints; charges always come from POST /quotes. */
contentRouter.get('/pricing', ctrl.pricing);
