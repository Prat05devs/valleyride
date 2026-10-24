import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { paymentService } from './payment.service';
import { checkoutConfig } from './razorpay.client';

export const paymentRouter = Router();

/** The public key and mode the web and app checkouts need, read at runtime so keys change without a rebuild. */
paymentRouter.get('/payments/config', (_req, res) => {
  res.set('Cache-Control', 'no-store').json({ data: checkoutConfig() });
});

const verifySchema = z.object({ orderId: z.string().min(5).max(64), paymentId: z.string().min(5).max(64), signature: z.string().regex(/^[a-f0-9]{64}$/) });

/** Checkout success callback; the payment.captured webhook stays as the backup. */
paymentRouter.post('/payments/verify', authenticate, validate({ body: verifySchema }), async (req, res) => {
  res.json({ data: await paymentService.verifyCheckout(req.user!.id, req.body) });
});
