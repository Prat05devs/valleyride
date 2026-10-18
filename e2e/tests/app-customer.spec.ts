import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { API, apiLogin, clearOtp, newPhone, otpFor, paidBooking, PNG_SIGNATURE, watchErrors } from '../fixtures/stack';

/** Screens below the top of the stack stay mounted but hidden; only match what the rider can see. */
const seen = (page: Page, text: string | RegExp) => page.getByText(text, typeof text === 'string' ? { exact: true } : undefined).locator('visible=true').first();
const tap = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).locator('visible=true').first();

/**
 * The Expo app's own screens (React Native code rendered by react-native-web) at iPhone and Pixel sizes.
 * Native-only pieces are covered separately: Razorpay runs in a WebView on phones (here the mock-payment sheet),
 * the camera and signature pad need a device.
 */
test.describe('rider app', () => {
  test('sign up → search → bike → checkout → pay → trip → cancel', async ({ page }) => {
    const errors = watchErrors(page);
    const phone = newPhone();
    await page.goto('/');
    await expect(seen(page, 'Ride the valley')).toBeVisible();
    await page.getByLabel('Mobile number').fill(phone.slice(3));
    await tap(page, 'Get OTP').click();
    await page.locator('input[aria-label="One-time code"]').fill(await otpFor(phone));
    await page.getByLabel('Full name').fill('Rohan Kapoor');
    await tap(page, 'Skip for now').click();
    await expect(seen(page, 'Hello, Rohan')).toBeVisible();

    await tap(page, 'Find your ride').click();
    await tap(page, 'Find rides').click();
    await expect(seen(page, 'Available rides')).toBeVisible();
    await expect(seen(page, /models? free for your/)).toBeVisible();
    await seen(page, 'Hunter 350').click();
    await expect(seen(page, /free on your dates/)).toBeVisible();
    await tap(page, 'Book now').click();

    await expect(seen(page, 'Price details')).toBeVisible();
    await tap(page, /^Pay ₹/).click();
    await expect(seen(page, 'Test payment')).toBeVisible();
    await tap(page, 'Simulate a successful payment').click();
    await expect(seen(page, "You're booked")).toBeVisible({ timeout: 30_000 });
    await tap(page, 'View trip').click();
    await expect(seen(page, 'Before pickup')).toBeVisible();
    await expect(seen(page, 'Confirmed')).toBeVisible();

    await seen(page, 'Cancel booking').click();
    await expect(seen(page, 'You get back')).toBeVisible();
    await tap(page, 'Cancel booking').click();
    await expect(seen(page, 'Trips')).toBeVisible();
    await page.getByRole('tab', { name: 'Past' }).click();
    await expect(seen(page, 'Cancelled')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('profile, help, routes, notifications and payments screens open', async ({ page }) => {
    const errors = watchErrors(page);
    const phone = newPhone();
    await page.goto('/');
    await page.getByLabel('Mobile number').fill(phone.slice(3));
    await tap(page, 'Get OTP').click();
    await page.locator('input[aria-label="One-time code"]').fill(await otpFor(phone));
    await page.getByLabel('Full name').fill('Neel Gupta');
    await tap(page, 'Skip for now').click();
    await expect(seen(page, 'Hello, Neel')).toBeVisible();

    for (const [path, text] of [['/routes', 'Ride the hills from Dehradun'], ['/route/dehradun-mussoorie', 'Along the way'], ['/route/maldevta', 'Best bikes for this route'], ['/bike/scram-440', 'How it handles Doon roads'], ['/notifications', 'Notifications'],
      ['/payments', 'No payments yet.'], ['/documents', 'Driving licence'], ['/terms', 'Rental terms and privacy'], ['/profile', 'Neel Gupta'], ['/help', 'Common questions'], ['/menu', 'Fleet and prices']] as const) {
      await page.goto(path);
      await expect(seen(page, text)).toBeVisible();
    }
    await page.goto('/profile');
    await tap(page, 'Log out').click();
    await expect(seen(page, 'Ride the valley')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('declined payment → retry → paid; extend the trip; returned trip shows the deposit and invoice', async ({ page, browser }) => {
    const errors = watchErrors(page);
    const phone = newPhone();
    await page.goto('/');
    await page.getByLabel('Mobile number').fill(phone.slice(3));
    await tap(page, 'Get OTP').click();
    await page.locator('input[aria-label="One-time code"]').fill(await otpFor(phone));
    await page.getByLabel('Full name').fill('Diya Bisht');
    await tap(page, 'Skip for now').click();
    await expect(seen(page, 'Hello, Diya')).toBeVisible();
    await page.goto('/bike/activa-125');
    await tap(page, 'Book now').click();
    await tap(page, /^Pay ₹/).click();
    await tap(page, 'Simulate a declined payment').click();
    await expect(seen(page, "Payment didn't go through")).toBeVisible();
    await expect(seen(page, /Bike still held for/)).toBeVisible();
    await tap(page, 'Try again').click();
    await tap(page, 'Simulate a successful payment').click();
    await expect(seen(page, "You're booked")).toBeVisible({ timeout: 30_000 });
    await tap(page, 'View trip').click();

    await tap(page, 'Extend trip').click();
    await expect(seen(page, 'What changes')).toBeVisible();
    await expect(seen(page, /is free for these dates/)).toBeVisible();
    await tap(page, /and extend$/).click();
    await tap(page, 'Simulate a successful payment').click();
    await expect(seen(page, 'Before pickup')).toBeVisible({ timeout: 30_000 });
    await expect(seen(page, /4 days ·/)).toBeVisible();

    // a returned trip (staff did pickup and return through the console API) shows the summary, deposit and invoice
    const staff = await browser.newContext();
    await apiLogin(staff.request, newPhone(), 'staff', 'Desk Staff');
    const rider = await browser.newContext();
    const riderPhone = newPhone();
    await apiLogin(rider.request, riderPhone, undefined, 'Diya Bisht');
    const b = await paidBooking(rider.request, 'hunter-350', 500 + Math.floor(Math.random() * 50));
    const photos = ['Front', 'Left', 'Right', 'Rear'].map((label) => ({ key: `handovers/e2e/${label}.jpg`, label }));
    expect((await staff.request.post(`${API}/admin/bookings/${b.id}/handover`, { data: { odometerKm: 1000, photos, licenceChecked: true } })).status()).toBe(201);
    expect((await rider.request.post(`${API}/bookings/${b.id}/start`, { data: { signaturePng: PNG_SIGNATURE, acceptedTerms: true, conditionConfirmed: true, emergencyContact: { name: 'Asha Bisht', phone: '+919812345671', relationship: 'Family' } } })).status()).toBe(200);
    expect((await staff.request.post(`${API}/admin/bookings/${b.id}/return`, { headers: { 'Idempotency-Key': `e2e-${Date.now()}` }, data: { odometerKm: 1700, checklist: { helmetsReturned: true, documentsReturned: true } } })).status()).toBe(201);
    // log the app in as that rider
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await clearOtp(riderPhone);
    await page.getByLabel('Mobile number').fill(riderPhone.slice(3));
    await tap(page, 'Get OTP').click();
    await page.locator('input[aria-label="One-time code"]').fill(await otpFor(riderPhone));
    await expect(seen(page, 'Hello, Diya')).toBeVisible();
    await page.goto(`/trip/${b.id}`);
    await expect(seen(page, 'Ride complete')).toBeVisible();
    await expect(seen(page, /Refunded to you|Refunding to you/)).toBeVisible();
    await tap(page, 'Track deposit refund').click();
    await expect(seen(page, 'Deposit refund')).toBeVisible();
    await page.goto(`/invoice/${b.id}`);
    await expect(seen(page, 'Taxable value')).toBeVisible();
    await page.goto(`/review/${b.id}`);
    await page.getByRole('radio', { name: '5 stars' }).click();
    await tap(page, 'Submit').click();
    await expect(seen(page, 'Thank you')).toBeVisible();
    expect(errors).toEqual([]);
    await staff.close(); await rider.close();
  });

  test('opening the app with no connection keeps the rider logged in', async ({ page }) => {
    const phone = newPhone();
    await page.goto('/');
    await page.getByLabel('Mobile number').fill(phone.slice(3));
    await tap(page, 'Get OTP').click();
    await page.locator('input[aria-label="One-time code"]').fill(await otpFor(phone));
    await page.getByLabel('Full name').fill('Arjun Negi');
    await tap(page, 'Skip for now').click();
    await expect(seen(page, 'Hello, Arjun')).toBeVisible();

    await page.route('**/api/v1/me', (r) => r.abort('internetdisconnected'));
    await page.goto('/');
    await expect(seen(page, "Can't reach Valley Ride")).toBeVisible();
    await page.unroute('**/api/v1/me');
    await tap(page, 'Try again').click();
    await expect(seen(page, 'Hello, Arjun')).toBeVisible();
  });
});
