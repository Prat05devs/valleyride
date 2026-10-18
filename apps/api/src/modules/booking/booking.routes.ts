import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requireIdempotencyKey } from '../../middleware/idempotency';
import { createBookingSchema, availabilityQuerySchema, cancelBookingSchema, extendBookingSchema, quoteRequestSchema, uuid } from '@valleyride/shared';
import * as ctrl from './booking.controller';

export const bookingRouter = Router();
const idParams = z.object({ id: uuid });

bookingRouter.get('/availability', validate({ query: availabilityQuerySchema }), ctrl.availability);
bookingRouter.post('/quotes', validate({ body: quoteRequestSchema }), ctrl.quote);
bookingRouter.post('/bookings', authenticate, authorize('customer'), requireIdempotencyKey,
  validate({ body: createBookingSchema }), ctrl.create);
bookingRouter.get('/bookings', authenticate, ctrl.listMine);
bookingRouter.get('/bookings/:id', authenticate, validate({ params: idParams }), ctrl.getOne);
bookingRouter.post('/bookings/:id/coupon', authenticate, authorize('customer'), requireIdempotencyKey,
  validate({ params: idParams, body: z.object({ code: z.string().trim().toUpperCase().max(32).nullable() }) }), ctrl.applyCoupon);
bookingRouter.get('/bookings/:id/cancel', authenticate, validate({ params: idParams }), ctrl.cancelPreview);
bookingRouter.post('/bookings/:id/cancel', authenticate, requireIdempotencyKey, validate({ params: idParams, body: cancelBookingSchema }), ctrl.cancel);
bookingRouter.get('/bookings/:id/extend', authenticate, validate({ params: idParams, query: extendBookingSchema }), ctrl.extendPreview);
bookingRouter.post('/bookings/:id/extend', authenticate, authorize('customer'), requireIdempotencyKey,
  validate({ params: idParams, body: extendBookingSchema }), ctrl.extend);


bookingRouter.get('/me/payments', authenticate, ctrl.myPayments);
bookingRouter.get('/me/notifications', authenticate, ctrl.myNotifications);
