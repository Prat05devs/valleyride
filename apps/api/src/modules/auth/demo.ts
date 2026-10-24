import { env } from '../../config/env';

/**
 * Demo accounts for trying the product locally and on staging. Outside production these numbers log in with the
 * fixed DEMO_PASSWORD; in production they are ordinary numbers with no special access.
 * Seeded by db/seeders/20261022-06-demo-accounts.js.
 */
export const DEMO_PASSWORD = 'valleyride';
export const DEMO_PHONES = ['+919000000001', '+919000000002', '+919000000003', '+919000000004'];

export const isDemoLogin = (phone: string, password: string) =>
  env.NODE_ENV !== 'production' && DEMO_PHONES.includes(phone) && password === DEMO_PASSWORD;
