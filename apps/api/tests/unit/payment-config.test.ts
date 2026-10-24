import { beforeEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ NODE_ENV: 'production', RAZORPAY_KEY_ID: '', RAZORPAY_KEY_SECRET: '', RAZORPAY_WEBHOOK_SECRET: '' }));
vi.mock('../../src/config/env', () => ({ env }));
import { checkoutConfig, getRazorpay, verifyWebhookSignature } from '../../src/modules/payment/razorpay.client';

beforeEach(() => { env.RAZORPAY_KEY_ID = ''; env.RAZORPAY_KEY_SECRET = ''; env.RAZORPAY_WEBHOOK_SECRET = ''; });

describe('runtime payment configuration', () => {
  it('keeps production checkout disabled until every credential is supplied', () => {
    expect(checkoutConfig()).toEqual({ enabled: false, keyId: null, mode: 'unconfigured', currency: 'INR' });
    expect(() => getRazorpay()).toThrow('Online payments are not available yet');
    env.RAZORPAY_KEY_ID = 'rzp_live_publicKey';
    env.RAZORPAY_KEY_SECRET = 'private-api-secret';
    expect(checkoutConfig().enabled).toBe(false);
    env.RAZORPAY_WEBHOOK_SECRET = 'private-webhook-secret';
    expect(checkoutConfig()).toEqual({ enabled: true, keyId: 'rzp_live_publicKey', mode: 'live', currency: 'INR' });
  });

  it('never exposes private credentials in the public response', () => {
    Object.assign(env, { RAZORPAY_KEY_ID: 'rzp_test_publicKey', RAZORPAY_KEY_SECRET: 'private-api-secret', RAZORPAY_WEBHOOK_SECRET: 'private-webhook-secret' });
    expect(checkoutConfig().mode).toBe('test');
    const publicResponse = JSON.stringify(checkoutConfig());
    expect(publicResponse).not.toContain('private-api-secret');
    expect(publicResponse).not.toContain('private-webhook-secret');
  });

  it('does not turn production placeholders into mock or live payments', () => {
    Object.assign(env, { RAZORPAY_KEY_ID: 'rzp_test_xxx', RAZORPAY_KEY_SECRET: 'xxx', RAZORPAY_WEBHOOK_SECRET: 'xxx' });
    expect(checkoutConfig().enabled).toBe(false);
    expect(checkoutConfig().mode).toBe('unconfigured');
  });

  it('rejects webhook signatures when the webhook secret has not been configured', () => {
    expect(verifyWebhookSignature(Buffer.from('{}'), 'a'.repeat(64))).toBe(false);
  });
});
