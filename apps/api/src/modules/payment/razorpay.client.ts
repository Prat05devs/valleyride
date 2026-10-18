import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../../config/env';

let client: Razorpay | undefined;

/**
 * Local development without Razorpay keys (the `.env.example` placeholders end in "xxx"): orders are faked as
 * `order_mock_*`, and POST /dev/payments/simulate runs the same capture code the webhook would. Never in production.
 */
export const paymentsMocked = env.NODE_ENV === 'development' && (!env.RAZORPAY_KEY_ID || /x{3}$/.test(env.RAZORPAY_KEY_ID));

const mockClient = {
  orders: {
    create: async (o: { amount: number }) => ({ id: `order_mock_${randomBytes(7).toString('hex')}`, amount: o.amount, currency: 'INR', status: 'created' }),
  },
  payments: {
    refund: async (paymentId: string, o: { amount: number }) => ({ id: `rfnd_mock_${randomBytes(7).toString('hex')}`, payment_id: paymentId, amount: o.amount, status: 'processed' }),
  },
} as unknown as Razorpay;

export function getRazorpay(): Razorpay {
  client ??= paymentsMocked ? mockClient : new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return client;
}

/** Checkout's handler response: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Razorpay signs the raw webhook body with HMAC-SHA256 using the webhook secret. */
export function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
