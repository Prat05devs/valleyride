'use client';

import type { PaymentResultDTO } from '@valleyride/shared';
import { api } from './api-client';
import { isMockOrder, openCheckout } from './razorpay';

/**
 * Pays an order: Razorpay Checkout, then POST /payments/verify with the signed result; or the dev simulate endpoint
 * for order_mock_* (local development without keys). `onPaid` gets the verified result, or null when verification
 * could not be reached (the webhook still confirms the payment).
 */
export async function payOrder(o: { orderId: string; amountPaise: number; bookingCode: string; phone?: string;
  onPaid: (result: PaymentResultDTO | null) => void; onFailed: (r: string) => void }) {
  if (isMockOrder(o.orderId)) {
    o.onPaid(await api.post<PaymentResultDTO>('/dev/payments/simulate', { orderId: o.orderId, outcome: 'captured' }));
    return;
  }
  await openCheckout({
    ...o,
    onPaid: (r) => { api.post<PaymentResultDTO>('/payments/verify', r).catch(() => null).then(o.onPaid); },
  });
}
