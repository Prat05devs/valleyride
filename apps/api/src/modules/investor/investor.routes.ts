import { Router, type RequestHandler } from 'express';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { z } from 'zod';
import { createInvestmentSchema, createInvestorSchema, investorCalculateSchema, markPaidSchema, monthQuerySchema, uuid } from '@valleyride/shared';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requireIdempotencyKey } from '../../middleware/idempotency';
import * as ctrl from './investor.controller';

export const investorRouter = Router();

/**
 * Phase 4 safeguard from the architecture doc: until a lawyer and a CA sign off, the portal stays read-only
 * (calculator, schedules, statements). Writes that take on or record an investment answer 403 CAPITAL_CLOSED.
 */
const capitalOpen: RequestHandler = (_req, _res, next) => {
  if (!env.CAPITAL_PORTAL_ENABLED) throw new AppError(403, 'CAPITAL_CLOSED', 'Valley Ride Capital is not open for investment yet. It opens only after legal and tax review.');
  next();
};
const idParams = z.object({ id: uuid });

// Phase 1: read-only calculator.
investorRouter.post('/investor/calculate', validate({ body: investorCalculateSchema }), ctrl.calculate);

// Phase 4, only after legal and CA sign-off.
const profileSchema = z.object({
  pan: z.string().trim().toUpperCase().regex(/^[A-Z]{5}\d{4}[A-Z]$/, 'PAN looks like ABCDE1234F').optional(),
  bank: z.object({
    holder: z.string().trim().min(2).max(80),
    ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'IFSC looks like SBIN0001234'),
    accountNumber: z.string().regex(/^\d{9,18}$/, '9 to 18 digits'),
  }).optional(),
}).refine((v) => v.pan || v.bank, 'Nothing to update');

investorRouter.get('/investor/profile', authenticate, authorize('investor'), ctrl.myProfile);
investorRouter.patch('/investor/profile', authenticate, authorize('investor'), capitalOpen, validate({ body: profileSchema }), ctrl.updateProfile);
investorRouter.get('/investor/investments/:id/agreement', authenticate, authorize('investor', 'admin'), validate({ params: idParams }), ctrl.agreement);
investorRouter.post('/admin/investments/agreement/presign', authenticate, authorize('admin'), capitalOpen, ctrl.presignAgreement);
investorRouter.get('/investor/investments', authenticate, authorize('investor'), ctrl.myInvestments);
investorRouter.get('/investor/investments/:id/schedule', authenticate, authorize('investor'), validate({ params: idParams }), ctrl.mySchedule);
investorRouter.get('/investor/statements/:id.pdf', authenticate, authorize('investor'), validate({ params: idParams }), ctrl.statement);

investorRouter.get('/admin/investors', authenticate, authorize('admin'), ctrl.listInvestors);
investorRouter.post('/admin/investors', authenticate, authorize('admin'), capitalOpen, validate({ body: createInvestorSchema }), ctrl.createInvestor);
investorRouter.get('/admin/investments', authenticate, authorize('admin'), ctrl.allInvestments);
investorRouter.post('/admin/investments', authenticate, authorize('admin'), capitalOpen, requireIdempotencyKey, validate({ body: createInvestmentSchema }), ctrl.createInvestment);
investorRouter.get('/admin/repayments', authenticate, authorize('admin'), validate({ query: monthQuerySchema }), ctrl.dues);
investorRouter.post('/admin/repayments/:id/mark-paid', authenticate, authorize('admin'), requireIdempotencyKey, validate({ params: idParams, body: markPaidSchema }), ctrl.markPaid);
