import { expect, test } from '@playwright/test';
import { API, apiLogin, istWindow, newPhone } from '../fixtures/stack';

test('checkout reads changed public keys at runtime and handles unavailable payments', async ({ page }) => {
  await apiLogin(page.request, newPhone());
  const models = (await (await page.request.get(`${API}/vehicle-models`)).json()).data;
  const locations = (await (await page.request.get(`${API}/locations`)).json()).data;
  const dates = istWindow(980);
  const created = await page.request.post(`${API}/bookings`, {
    headers: { 'Idempotency-Key': `runtime-key-${Date.now()}` },
    data: { vehicleModelId: models[0].id, pickupLocationId: locations[0].id, returnLocationId: locations[0].id, startAt: dates.startAt, endAt: dates.endAt },
  });
  expect(created.status()).toBe(201);
  const id = (await created.json()).data.booking.id;
  await page.route(`**/api/v1/bookings/${id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.data.pendingOrderId = 'order_runtime_public_key';
    await route.fulfill({ response, json: body });
  });
  let key: string | null = 'rzp_test_firstRuntimeKey';
  await page.route('**/api/v1/payments/config', (route) => route.fulfill({ json: {
    data: { keyId: key, enabled: !!key, mode: key ? 'test' : 'unconfigured', currency: 'INR' },
  } }));
  // Stub the external widget only; checkout and its runtime configuration request run normally.
  await page.addInitScript(() => {
    (window as any).Razorpay = class {
      constructor(private options: Record<string, unknown>) {}
      on() {}
      open() { (window as any).lastCheckoutKey = this.options.key; }
    };
  });
  await page.goto(`/checkout/${id}`);
  const pay = page.getByRole('button', { name: /^Pay ₹/ });
  await pay.click();
  await expect.poll(() => page.evaluate(() => (window as any).lastCheckoutKey)).toBe(key);
  key = 'rzp_test_secondRuntimeKey';
  await pay.click();
  await expect.poll(() => page.evaluate(() => (window as any).lastCheckoutKey)).toBe(key);
  key = null;
  await pay.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Online payments are not available yet.' }))
    .toHaveText('Online payments are not available yet. Please try again later.');
});
