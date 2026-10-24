import RazorpayCheckout from 'react-native-razorpay';
import { checkoutOptions, type CheckoutInput, type CheckoutResult } from './payment-checkout';

/** Official native SDK handles payment apps, authentication and returning to checkout. */
export async function openPaymentCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  return RazorpayCheckout.open(await checkoutOptions(input));
}
