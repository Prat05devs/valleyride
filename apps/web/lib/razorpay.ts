/** Loads Razorpay Checkout on demand and opens it for an order created by POST /bookings. */
import type { PaymentConfig } from '@valleyride/shared';
import { api } from './api-client';

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void; on(event: string, cb: (r: { error?: { description?: string } }) => void): void } }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export function loadCheckout(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Checkout runs in the browser only'));
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Razorpay Checkout'));
    document.body.appendChild(s);
  });
}

export interface CheckoutResult { orderId: string; paymentId: string; signature: string }

/** Local development without Razorpay keys: the API returns order_mock_* and offers POST /dev/payments/simulate. */
export const isMockOrder = (orderId: string) => orderId.startsWith('order_mock_');

export async function openCheckout(o: {
  orderId: string; amountPaise: number; bookingCode: string; phone?: string; name?: string; email?: string;
  onPaid: (r: CheckoutResult) => void; onFailed?: (reason: string) => void; onDismiss?: () => void;
}) {
  const config = await api.get<PaymentConfig>('/payments/config');
  if (!config.enabled || !config.keyId) throw new Error('Online payments are not available yet. Please try again later.');
  await loadCheckout();
  const rzp = new window.Razorpay!({
    key: config.keyId,
    order_id: o.orderId,
    amount: o.amountPaise,
    currency: 'INR',
    name: 'Valley Ride',
    description: `Booking ${o.bookingCode}`,
    prefill: { contact: o.phone, name: o.name, email: o.email },
    theme: { color: '#000000' },
    // The signed result goes to POST /payments/verify; the payment.captured webhook confirms it too (whichever is first).
    handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      o.onPaid({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature }),
    modal: { ondismiss: o.onDismiss },
  });
  rzp.on('payment.failed', (r) => o.onFailed?.(r.error?.description ?? 'The payment did not go through.'));
  rzp.open();
}
