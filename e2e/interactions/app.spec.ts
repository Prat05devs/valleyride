import { expect, test, type Page } from '@playwright/test';

const visible = (page: Page, text: string | RegExp) => page.getByText(text, typeof text === 'string' ? { exact: true } : undefined).locator('visible=true').first();
const tap = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).locator('visible=true').first();

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-25T04:00:00Z'));
  await page.addInitScript(() => { localStorage.setItem('vr.access', 'ui-review-token'); localStorage.setItem('vr.refresh', 'ui-review-refresh'); });
});

test('calendar accepts pickup, return, and Done; the changed window reaches ride prices', async ({ page }) => {
  await page.goto('/bike/activa-125');
  await visible(page, 'Change').click();
  await tap(page, 'Mon, 26 Oct').click();
  await page.getByRole('button', { name: 'Tue Oct 27 2026', exact: true }).click();
  await expect(tap(page, 'Done')).toBeDisabled();
  await page.getByRole('button', { name: 'Fri Oct 30 2026', exact: true }).click();
  await expect(tap(page, 'Done')).toBeEnabled();
  await tap(page, 'Done').click();
  await expect(tap(page, 'Tue, 27 Oct')).toBeVisible();
  await expect(tap(page, 'Fri, 30 Oct')).toBeVisible();
  await tap(page, 'Find rides').click();
  await expect(visible(page, /free for your 3-day trip/)).toBeVisible();
  await visible(page, 'Activa 125').click();
  await expect(visible(page, 'for 3 days · incl. GST')).toBeVisible();
});

test('return field edits return directly; same-day four-hour rentals work', async ({ page }) => {
  await page.goto('/search');
  await tap(page, 'Thu, 29 Oct').click();
  await expect(page.getByRole('button', { name: 'Choose return day' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Mon Oct 26 2026', exact: true }).click();
  await expect(tap(page, 'Done')).toBeDisabled();
  await page.getByRole('button', { name: '2:00 PM', exact: true }).locator('visible=true').last().click();
  await expect(tap(page, 'Done')).toBeEnabled();
  await tap(page, 'Done').click();
  await expect(visible(page, /1 day/)).toBeVisible();
});

test('time fields open the time choices rather than leaving them below six months of dates', async ({ page }) => {
  await page.goto('/search');
  await page.getByRole('button', { name: '9:00 AM', exact: true }).locator('visible=true').last().click();
  await expect(visible(page, 'Return time · desks open 8 AM – 8 PM')).toBeInViewport();
});

test('all duration offers update the quote, selected state, and checkout', async ({ page }) => {
  await page.goto('/bike/activa-125');
  for (const [days, pct] of [[7, 20], [28, 35], [3, 10]]) {
    const offer = tap(page, `${days}+ days · ${pct}% off`);
    await offer.click();
    await expect(offer).toHaveAttribute('aria-pressed', 'true');
    await expect(visible(page, `for ${days} days · incl. GST`)).toBeVisible();
    await expect(tap(page, 'Book now')).toBeEnabled();
  }
  await tap(page, 'Book now').click();
  await expect(visible(page, 'Rental · 3 days')).toBeVisible();
  await page.getByLabel('Coupon code').fill('INVALID');
  await tap(page, 'Apply').click();
  await expect(visible(page, "That coupon isn't valid or has expired.")).toBeVisible();
  await tap(page, 'Remove').click();
  await page.getByLabel('Coupon code').fill('VALID10');
  await tap(page, 'Apply').click();
  await expect(visible(page, 'Coupon VALID10')).toBeVisible();
});

test('ride filters and unavailable bike cards stay usable', async ({ page }) => {
  await page.goto('/rides');
  await tap(page, 'Scooters').click();
  await expect(visible(page, 'Activa 125')).toBeVisible();
  await expect(visible(page, 'Hunter 350')).toHaveCount(0);
  await tap(page, 'Motorcycles').click();
  await expect(visible(page, 'Hunter 350')).toBeVisible();
  await expect(visible(page, 'Activa 125')).toHaveCount(0);
  await tap(page, 'Change search').click();
  await tap(page, /Dehradun · ISBT/).click();
  await page.getByRole('radio').nth(1).click();
  await tap(page, 'Find rides').click();
  await visible(page, 'Activa 125').click();
  await expect(visible(page, 'Fully booked on your dates')).toBeVisible();
  await expect(tap(page, 'Book now')).toBeDisabled();
  await expect(visible(page, 'Change')).toBeVisible();
});

test('request failures show retry and recover rather than fake empty payments or endless loading', async ({ page }) => {
  let fail = true;
  await page.route('**/api/v1/me/payments', (r) => fail ? r.fulfill({ status: 503, json: { error: { message: 'Unavailable' } } }) : r.continue());
  await page.goto('/payments');
  await expect(visible(page, /Could not load payments/)).toBeVisible();
  await expect(visible(page, 'No payments yet.')).toHaveCount(0);
  fail = false;
  await tap(page, 'Try again').click();
  await expect(visible(page, 'No payments yet.')).toBeVisible();
  let documentsFail = true;
  await page.route('**/api/v1/kyc/documents', (r) => documentsFail ? r.fulfill({ status: 503, json: { error: { message: 'Unavailable' } } }) : r.continue());
  await page.goto('/documents');
  await expect(visible(page, /Could not check your documents/)).toBeVisible();
  await expect(tap(page, 'Upload file')).toHaveCount(0);
  documentsFail = false;
  await tap(page, 'Try again').click();
  await expect(visible(page, 'Driving licence')).toBeVisible();
  documentsFail = true;
  await page.goto('/profile');
  await expect(visible(page, 'Could not check your documents.')).toBeVisible();
  await expect(visible(page, 'Action needed')).toHaveCount(0);
  documentsFail = false;
  await tap(page, 'Try again').click();
  await expect(visible(page, 'Action needed')).toBeVisible();
  let fleetFail = true;
  await page.route('**/api/v1/vehicle-models', (r) => fleetFail ? r.fulfill({ status: 503, json: { error: { message: 'Unavailable' } } }) : r.continue());
  await page.goto('/');
  await expect(visible(page, /Could not load the fleet/)).toBeVisible();
  fleetFail = false;
  await tap(page, 'Try again').click();
  await expect(visible(page, 'Hunter 350')).toBeVisible();
  for (const path of ['/trip/missing', '/extend/missing', '/pickup/missing', '/deposit/missing', '/confirmed/missing', '/cancel/missing']) {
    await page.goto(path);
    await expect(tap(page, 'Try again')).toBeVisible();
  }
});

test('navigation, trips tabs, FAQ, profile form, route guides, and Capital destination', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/trips');
  await expect(visible(page, 'No upcoming trips')).toBeVisible();
  await page.getByRole('tab', { name: 'Past', exact: true }).click();
  await expect(visible(page, 'No past trips yet')).toBeVisible();
  await page.goto('/help');
  await page.getByRole('button', { expanded: false }).first().click();
  await expect(page.getByRole('button', { expanded: true })).toBeVisible();
  await page.goto('/profile-edit');
  await page.getByLabel('Full name').fill('Updated Rider');
  await tap(page, 'Save').click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.goto('/routes');
  await visible(page, 'Dehradun → Mussoorie').click();
  await expect(visible(page, 'Along the way')).toBeVisible();
  await page.goto('/menu');
  // React Native links use an onPress handler rather than href. Observe the opened page.
  const popup = page.waitForEvent('popup');
  await page.getByRole('link').click();
  await expect(await popup).toHaveURL(/\/invest/);
  expect(errors).toEqual([]);
});
