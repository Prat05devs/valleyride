import { expect, test } from '@playwright/test';
import { API, apiLogin, istWindow, JPEG, newPhone, otpFor, sql, watchErrors } from '../fixtures/stack';

test.describe('customer on the website', () => {
  test('login with OTP → book → coupon → pay → booking → documents → extend → cancel', async ({ page, request, browser }, info) => {
    const errors = watchErrors(page);
    const days = 300 + info.project.name.length * 3 + Math.floor(Math.random() * 40);
    // a coupon made by an admin
    const adminPhone = newPhone();
    const admin = await browser.newContext();
    await apiLogin(admin.request, adminPhone, 'admin', 'E2E Admin');
    const code = `E2E${Date.now().toString(36).toUpperCase().slice(-6)}`;
    expect((await admin.request.post(`${API}/admin/coupons`, { data: { code, percentOff: 10 } })).status()).toBe(201);

    // login through the UI
    const phone = newPhone();
    await page.goto('/login?next=/fleet/hunter-350');
    await page.getByPlaceholder('98765 43210').fill(phone.slice(3));
    await page.getByRole('button', { name: 'Get OTP' }).click();
    const otp = await otpFor(phone);
    await page.getByLabel('Digit 1').fill(otp); // pasting fills all six boxes
    await expect(page).toHaveURL(/\/account\/profile\?welcome=1/);
    await page.getByLabel(/Full name/).fill('Asha Rawat');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/fleet\/hunter-350/);

    // pick dates on the bike page and hold
    const w = istWindow(days);
    const inputs = page.locator('aside input[type="datetime-local"]');
    await inputs.nth(0).fill(w.from);
    await inputs.nth(1).fill(w.to);
    await expect(page.getByText(/free on your dates/)).toBeVisible();
    await page.getByRole('button', { name: 'Book now' }).click();
    await expect(page).toHaveURL(/\/checkout\//);
    await expect(page.getByText('Bike held for')).toBeVisible();

    // coupon re-prices the hold
    const before = await page.getByText(/^Pay ₹/).first().textContent();
    await page.getByLabel('Coupon code').fill(code);
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText(`Coupon ${code}`)).toBeVisible();
    await expect(page.getByText(/^Pay ₹/).first()).not.toHaveText(before!);

    // mock payment (Razorpay keys not set locally)
    await page.getByRole('button', { name: /\(test\)$/ }).click();
    await expect(page).toHaveURL(/\/account\/bookings\/.+confirmed=1/, { timeout: 30_000 });
    await expect(page.getByText("You're booked")).toBeVisible();
    const bookingId = page.url().split('/account/bookings/')[1]!.split('?')[0]!;

    // invoice
    await page.getByRole('link', { name: 'Invoice' }).click();
    await expect(page.getByText('Taxable value')).toBeVisible();
    await page.goBack();

    // documents: upload a licence
    await page.goto('/account/documents');
    const dl = page.locator('div.rounded-sheet', { has: page.getByRole('heading', { name: 'Driving licence' }) });
    await dl.getByLabel('Licence number').fill('UK0720190012345');
    await dl.locator('input[type="file"]').setInputFiles({ name: 'dl.jpg', mimeType: 'image/jpeg', buffer: JPEG });
    await dl.getByRole('button', { name: 'Send for checking' }).click();
    await expect(dl.getByText('In review')).toBeVisible();

    // extend by a day (mock payment), then cancel with the policy refund
    await page.goto(`/account/bookings/${bookingId}`);
    await expect(page.getByRole('button', { name: /Extend · pay ₹/ })).toBeVisible();
    await page.getByRole('button', { name: /Extend · pay ₹/ }).click();
    await expect.poll(async () => (await sql<{ billable_days: number }>('SELECT billable_days FROM bookings WHERE id = $1', [bookingId]))[0]?.billable_days, { timeout: 20_000 }).toBe(4);
    await page.reload();
    await page.getByRole('button', { name: 'Cancel booking' }).click();
    await expect(page.getByRole('dialog')).toContainText('You get back');
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel booking' }).click();
    await expect(page.getByText('Cancelled').first()).toBeVisible();

    // payments page shows the charge and the refunds
    await page.goto('/account/payments');
    await expect(page.getByText(/Cancellation refund/).first()).toBeVisible();
    expect(errors).toEqual([]);
    await admin.close();
  });
});
