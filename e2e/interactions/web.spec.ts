import { expect, test } from '@playwright/test';

test('bike offers update dates, selected state and server quote; pickup changes availability', async ({ page }) => {
  await page.goto('/fleet/activa-125');
  const panel = page.getByRole('complementary', { name: 'Book the Activa 125' });
  await expect(panel.getByText('Pay now', { exact: true })).toBeVisible();
  for (const [days, pct] of [[7, 20], [28, 35], [3, 10]]) {
    const offer = panel.getByRole('button', { name: `${days}+ days · ${pct}% off` });
    await offer.click();
    await expect(offer).toHaveAttribute('aria-pressed', 'true');
    const from = await panel.getByLabel('Pickup', { exact: true }).inputValue();
    const to = await panel.getByLabel('Return', { exact: true }).inputValue();
    expect((Date.parse(to) - Date.parse(from)) / 86_400_000).toBe(days);
    await expect(panel.getByText(new RegExp(`^${days} days ×`))).toBeVisible();
  }
  await panel.getByRole('combobox').selectOption({ index: 1 });
  await expect(panel.getByText('Fully booked on these dates', { exact: false })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Book now' })).toBeDisabled();
});

test('cleared, past and short dates show recovery text; valid dates enable search', async ({ page }) => {
  await page.goto('/');
  const form = page.getByRole('form', { name: 'Find your ride' });
  const from = await form.getByLabel('Pickup date & time').inputValue();
  const day = from.split('T')[0];
  await form.getByLabel('Pickup date & time').fill('');
  await expect(form.getByRole('button', { name: 'Find available rides' })).toBeDisabled();
  await expect(form.getByRole('alert')).toContainText('Choose pickup');
  await form.getByLabel('Pickup date & time').fill('2000-01-01T09:00');
  await expect(form.getByRole('alert')).toContainText('has passed');
  await form.getByLabel('Pickup date & time').fill(from);
  await form.getByLabel('Return date & time').fill(`${day}T11:00`);
  await expect(form.getByRole('alert')).toContainText('at least 4 hours');
  await form.getByLabel('Return date & time').fill(`${day}T14:00`);
  await form.getByRole('button', { name: 'Find available rides' }).click();
  await expect(page).toHaveURL(/\/book\?/);
  await expect(page.getByRole('region', { name: 'Results' })).toContainText('models free');
});

test('bike date fields tolerate clearing and show live-price failure with retry', async ({ page }) => {
  await page.goto('/fleet/activa-125');
  const panel = page.getByRole('complementary', { name: 'Book the Activa 125' });
  await panel.getByLabel('Return', { exact: true }).fill('');
  await expect(panel.getByRole('button', { name: 'Book now' })).toBeDisabled();
  await expect(panel).toContainText('Choose pickup and return dates');
  await panel.getByRole('button', { name: '7+ days · 20% off' }).click();
  await expect(panel.getByRole('button', { name: 'Book now' })).toBeEnabled();
  let fail = true;
  await page.route('**/api/v1/quotes', (r) => fail ? r.fulfill({ status: 503, json: { error: { message: 'Unavailable' } } }) : r.continue());
  await panel.getByRole('button', { name: '28+ days · 35% off' }).click();
  await expect(panel.getByRole('alert')).toContainText('Could not check');
  await expect(panel.getByRole('button', { name: 'Book now' })).toBeDisabled();
  fail = false;
  await panel.getByRole('button', { name: 'Try again' }).click();
  await expect(panel.getByRole('button', { name: 'Book now' })).toBeEnabled();
});

test('public navigation, category filters, sort, guides, investor calculator, and protected pages', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/fleet');
  await page.getByRole('button', { name: 'Scooters', exact: false }).click();
  await expect(page.getByRole('link', { name: /Activa 125/ }).first()).toBeVisible();
  await page.goto('/book');
  await page.getByRole('button', { name: /Motorcycles/ }).click();
  await expect(page.getByRole('region', { name: 'Results' })).not.toContainText('Activa');
  await page.getByLabel('Sort by').selectOption('price-desc');
  await page.goto('/routes/dehradun-mussoorie');
  await expect(page.getByRole('heading', { name: 'Along the way' })).toBeVisible();
  await page.goto('/invest');
  await page.getByRole('radio', { name: /Monthly interest only/ }).click();
  await expect(page.getByText('₹4,375').first()).toBeVisible();
  await page.goto('/account/bookings');
  await expect(page).toHaveURL(/\/login\?/);
  expect(errors).toEqual([]);
});

test('admin add vehicle and filters have working controls; account forms and payments load', async ({ page, context }) => {
  await context.addCookies([{ name: 'vr_access', value: 'ui-review-token', domain: '127.0.0.1', path: '/' }]);
  await page.goto('/admin/fleet');
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add to fleet' })).toBeDisabled();
  await page.getByLabel('Registration', { exact: true }).fill('UK07TEST123');
  await expect(page.getByRole('button', { name: 'Add to fleet' })).toBeEnabled();
  await page.getByRole('button', { name: 'Add vehicle', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Add to fleet' })).toHaveCount(0);
  await page.getByLabel('Search registration').fill('UNKNOWN');
  await page.goto('/account/profile');
  await page.getByLabel('Full name, as on your driving licence').fill('UI Rider');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  await page.goto('/account/payments');
  await expect(page.getByText('No payments yet.')).toBeVisible();
  let failDocuments = true;
  await page.route('**/api/v1/kyc/documents', (r) => failDocuments ? r.fulfill({ status: 503, json: { error: { message: 'Unavailable' } } }) : r.continue());
  await page.goto('/account/documents');
  await expect(page.getByRole('alert').filter({ hasText: 'Could not check your documents' })).toContainText('Could not check your documents');
  await expect(page.getByRole('button', { name: 'Send for checking' })).toHaveCount(0);
  failDocuments = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Driving licence' })).toBeVisible();
  let failBookings = true;
  await page.route('**/api/v1/bookings', (r) => failBookings ? r.fulfill({ status: 503, json: { error: { message: 'Unavailable' } } }) : r.continue());
  await page.goto('/account/bookings');
  await expect(page.getByRole('alert').filter({ hasText: 'Could not load your bookings' })).toContainText('Could not load your bookings');
  await expect(page.getByText('No upcoming trips')).toHaveCount(0);
  failBookings = false;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('No upcoming trips')).toBeVisible();
});
