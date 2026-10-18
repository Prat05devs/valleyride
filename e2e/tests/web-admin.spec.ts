import { expect, test } from '@playwright/test';
import { API, apiLogin, JPEG, newPhone, paidBooking, PNG_SIGNATURE, sql, watchErrors } from '../fixtures/stack';

test.describe('staff and admin console', () => {
  test('pickup handover → rider signs → return inspection → deposit settled', async ({ page, browser }) => {
    const errors = watchErrors(page);
    const rider = await browser.newContext();
    const riderPhone = newPhone();
    await apiLogin(rider.request, riderPhone, undefined, 'Kabir Mehta');
    const booking = await paidBooking(rider.request, 'scram-440', 400 + Math.floor(Math.random() * 60));

    await apiLogin(page.request, newPhone(), 'admin', 'Meera Joshi');
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), Meera/ })).toBeVisible();
    await page.goto(`/admin/bookings/${booking.id}`);
    await expect(page.getByRole('heading', { name: booking.code })).toBeVisible();
    await page.getByRole('link', { name: /pickup handover/ }).click();

    await expect(page.getByRole('heading', { name: '1 · Check the originals' })).toBeVisible();
    for (const c of await page.getByRole('checkbox').all()) await c.check();
    for (const label of ['Front', 'Left', 'Right', 'Rear', 'Odometer', 'Fuel gauge']) {
      await page.locator(`label[aria-label="Take ${label} photo"] input[type="file"]`).setInputFiles({ name: `${label}.jpg`, mimeType: 'image/jpeg', buffer: JPEG });
      await expect(page.getByText(`${label} ✓`)).toBeVisible();
    }
    await page.getByRole('button', { name: 'Save and send for signing' }).click();
    await expect(page.getByText('Waiting for the rider to sign on their phone')).toBeVisible();

    // the rider signs in the app (the API call the app makes)
    const start = await rider.request.post(`${API}/bookings/${booking.id}/start`, {
      data: { signaturePng: PNG_SIGNATURE, acceptedTerms: true, conditionConfirmed: true, emergencyContact: { name: 'Isha Mehta', phone: '+919812345670', relationship: 'Family' } },
    });
    expect(start.status()).toBe(200);
    await expect(page.getByText(/Signed by Kabir Mehta/)).toBeVisible({ timeout: 20_000 });

    // return with 100 km over the allowance
    const odo = (await sql<{ odometer_km: number }>("SELECT odometer_km FROM handovers WHERE booking_id = $1 AND type = 'PICKUP'", [booking.id]))[0]!.odometer_km;
    const km = (await sql<{ km_included: number }>('SELECT km_included FROM bookings WHERE id = $1', [booking.id]))[0]!.km_included;
    await page.goto(`/admin/returns/${booking.id}`);
    await page.getByLabel(/Odometer at return/).fill(String(odo + km + 100));
    await expect(page.getByText('Extra km 100 ×')).toBeVisible();
    await page.getByRole('button', { name: /Complete return · refund/ }).click();
    await expect(page.getByText('DEPOSIT_SETTLED')).toBeVisible({ timeout: 20_000 });
    expect(errors).toEqual([]);
    await rider.close();
  });

  test('every console page loads, KYC review, pricing, content and coupons', async ({ page, browser }) => {
    const errors = watchErrors(page);
    const rider = await browser.newContext();
    const riderName = `Tara ${Date.now().toString(36)}`;
    await apiLogin(rider.request, newPhone(), undefined, riderName);
    const p = (await (await rider.request.post(`${API}/kyc/documents/presign`, { data: { type: 'PASSPORT', contentType: 'image/jpeg' } })).json()).data;
    await rider.request.put(p.uploadUrl, { headers: p.headers, data: JPEG });
    await rider.request.post(`${API}/kyc/documents`, { data: { type: 'PASSPORT', number: 'Z1234567', fileKey: p.fileKey } });

    await apiLogin(page.request, newPhone(), 'admin', 'Meera Joshi');
    for (const [path, heading] of [['/admin/bookings', 'Bookings calendar'], ['/admin/fleet', 'Fleet'], ['/admin/finance', 'Finance'], ['/admin/investors', 'Investors'], ['/admin/handover', 'Pickups'], ['/admin/returns', 'Returns']] as const) {
      await page.goto(path);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    await page.goto('/admin/customers');
    await page.getByRole('button', { name: new RegExp(riderName) }).click();
    await page.getByRole('button', { name: 'Approve' }).click();
    await expect(page.getByRole('button', { name: new RegExp(riderName) })).toHaveCount(0);

    await page.goto('/admin/pricing');
    await expect(page.getByText(/3\+ days · 10% off/)).toBeVisible();
    await page.goto('/admin/content');
    await page.getByRole('button', { name: /Sahastradhara loop/ }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved and live')).toBeVisible();
    await page.getByRole('tab', { name: 'Model pages' }).click();
    await page.getByRole('button', { name: /Hunter 350/ }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Saved and live')).toBeVisible();
    await page.goto('/admin/marketing');
    const code = `ADM${Date.now().toString(36).toUpperCase().slice(-5)}`;
    await page.getByLabel('Code', { exact: true }).fill(code);
    await page.getByRole('button', { name: 'Create coupon' }).click();
    await expect(page.getByRole('cell', { name: code })).toBeVisible();
    await page.goto('/admin/fleet');
    await page.getByRole('link', { name: /UK07/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Maintenance' })).toBeVisible();
    expect(errors).toEqual([]);
    await rider.close();
  });
});
