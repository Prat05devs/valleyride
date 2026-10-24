import { checkoutOptions, type CheckoutInput, type CheckoutResult } from './payment-checkout';

declare global {
  interface Window { Razorpay?: new (options: Record<string, unknown>) => { open(): void; on(event: string, cb: (r: { error?: { description?: string } }) => void): void } }
}

let loading: Promise<void> | undefined;
function load(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => { loading = undefined; script.remove(); reject(new Error('Could not load Razorpay. Check your connection.')); };
    document.body.appendChild(script);
  });
  return loading;
}

/** Browser preview uses Standard Checkout; Metro selects razorpay.native.ts on phones. */
export async function openPaymentCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const options = await checkoutOptions(input);
  await load();
  return new Promise((resolve, reject) => {
    const checkout = new window.Razorpay!({ ...options,
      handler: resolve,
      modal: { ondismiss: () => reject({ code: 2, description: 'Payment cancelled' }) },
    });
    checkout.on('payment.failed', (r) => reject(new Error(r.error?.description || 'The payment did not go through.')));
    checkout.open();
  });
}
