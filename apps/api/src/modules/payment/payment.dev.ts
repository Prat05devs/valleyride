import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { paymentService } from './payment.service';

/** Mounted only when `paymentsMocked` is true (development without Razorpay keys). */
export const paymentDevRouter = Router();

const simulateSchema = z.object({ orderId: z.string().startsWith('order_mock_'), outcome: z.enum(['captured', 'failed']) });

paymentDevRouter.post('/dev/payments/simulate', authenticate, validate({ body: simulateSchema }), async (req, res) => {
  const { orderId, outcome } = req.body as z.infer<typeof simulateSchema>;
  res.json({ data: await paymentService.simulate(req.user!.id, orderId, outcome) });
});
