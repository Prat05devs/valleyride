import { Router } from 'express';
import { z } from 'zod';
import { pickupHandoverSchema, reportMarkSchema, returnHandoverSchema, reviewSchema, startRideSchema, uuid } from '@valleyride/shared';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requireIdempotencyKey } from '../../middleware/idempotency';
import * as ctrl from './handover.controller';

/** Pickup and return handovers, invoices and reviews. Staff run the desk; the rider signs in the app. */
export const handoverRouter = Router();
const idParams = z.object({ id: uuid });

handoverRouter.post('/admin/bookings/:id/photos/presign', authenticate, authorize('staff'), validate({ params: idParams, body: ctrl.photoPresignSchema }), ctrl.presignPhoto);
handoverRouter.post('/admin/bookings/:id/handover', authenticate, authorize('staff'), validate({ params: idParams, body: pickupHandoverSchema }), ctrl.recordPickup);
handoverRouter.post('/admin/bookings/:id/return', authenticate, authorize('staff'), requireIdempotencyKey, validate({ params: idParams, body: returnHandoverSchema }), ctrl.recordReturn);

handoverRouter.get('/bookings/:id/handover', authenticate, validate({ params: idParams }), ctrl.show);
handoverRouter.post('/bookings/:id/handover/report', authenticate, authorize('customer', 'admin'), validate({ params: idParams, body: reportMarkSchema }), ctrl.reportMark);
handoverRouter.post('/bookings/:id/start', authenticate, authorize('customer', 'admin'), validate({ params: idParams, body: startRideSchema }), ctrl.startRide);
handoverRouter.get('/bookings/:id/invoice', authenticate, validate({ params: idParams }), ctrl.invoice);
handoverRouter.get('/bookings/:id/invoice.pdf', authenticate, validate({ params: idParams }), ctrl.invoicePdfDownload);
handoverRouter.get('/bookings/:id/agreement', authenticate, validate({ params: idParams }), ctrl.agreement);
handoverRouter.get('/bookings/:id/review', authenticate, validate({ params: idParams }), ctrl.getReview);
handoverRouter.put('/bookings/:id/review', authenticate, authorize('customer', 'admin'), validate({ params: idParams, body: reviewSchema }), ctrl.putReview);
