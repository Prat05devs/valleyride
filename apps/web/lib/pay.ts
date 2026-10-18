'use client';

import { api } from './api-client';
import { isMockOrder, openCheckout } from './razorpay';

/**
 * Pays an order: Razorpay Checkout, then POST /payments/verify with the signed result; or the dev simulate endpoint
 * for order_mock_* (local development without keys).
 */
export async function payOrder(o: { orderId: string; amountPaise: number; bookingCode: string; phone?: string; onPaid: () => void; onFailed: (r: string) => void }) {
  if (isMockOrder(o.orderId)) {
    await api.post('/dev/payments/simulate', { orderId: o.orderId, outcome: 'captured' });
    o.onPaid();
    return;
  }
  await openCheckout({
    ...o,
    onPaid: (r) => { api.post('/payments/verify', r).catch(() => {}).finally(o.onPaid); },
  });
}
