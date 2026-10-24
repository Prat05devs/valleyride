import type { PaymentConfig } from '@valleyride/shared';
import { api } from './api';

export interface CheckoutResult { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
export interface CheckoutInput { orderId: string; amount: number; code: string; phone: string; name: string; email: string }

export async function checkoutOptions(o: CheckoutInput) {
  const config = await api.get<PaymentConfig>('/payments/config');
  if (!config.enabled || !config.keyId) throw new Error('Online payments are not available yet. Please try again later.');
  return {
    key: config.keyId, order_id: o.orderId, amount: String(o.amount), currency: 'INR',
    name: 'Valley Ride', description: `Booking ${o.code}`,
    prefill: { contact: o.phone, name: o.name, email: o.email }, theme: { color: '#000000' },
  };
}
