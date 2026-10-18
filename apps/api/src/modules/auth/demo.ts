import { env } from '../../config/env';

/**
 * Demo accounts for trying the product locally and on staging. Outside production these numbers accept the fixed code
 * DEMO_OTP instead of a random one; in production they are ordinary numbers and get a real OTP.
 * Seeded by db/seeders/20261022-06-demo-accounts.js.
 */
export const DEMO_OTP = '123456';
export const DEMO_PHONES = ['+919000000001', '+919000000002', '+919000000003', '+919000000004'];

export const isDemoLogin = (phone: string) => env.NODE_ENV !== 'production' && DEMO_PHONES.includes(phone);
