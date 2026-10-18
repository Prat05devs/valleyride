import { expect, test } from '@playwright/test';
import { watchErrors } from '../fixtures/stack';

test.describe('public website', () => {
  test('home → search → results with live prices', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Find your ride into the Himalayas' })).toBeVisible();
    await expect(page.getByText(/bikes across four models/)).toBeVisible();
    await page.getByRole('button', { name: /Find available rides/ }).click();
    await expect(page).toHaveURL(/\/book\?/);
    await expect(page.getByText(/models? free ·/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select' }).first()).toBeVisible();
    expect(await page.getByText(/incl\. GST/).count()).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Motorcycles' }).click();
    await expect(page.getByText('Honda Activa 125')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('fleet, bike page quote, routes, guide, terms and 404', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/fleet');
    await expect(page.getByRole('heading', { name: 'Our fleet' })).toBeVisible();
    await expect(page.getByRole('table')).toContainText('Royal Enfield Himalayan 450');
    await page.goto('/fleet/hunter-350');
    await expect(page.getByRole('heading', { name: 'Hunter 350', exact: true })).toBeVisible();
    await expect(page.getByText('Pay now')).toBeVisible();
    await expect(page.getByText(/free on your dates/)).toBeVisible();
    await expect(page.getByText('2026 model · new')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Fuel economy' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How it handles Doon roads' })).toBeVisible();
    await expect(page.getByText('36.2 km/l').first()).toBeVisible();
    await page.goto('/routes');
    await expect(page.getByRole('heading', { name: 'Dehradun → Mussoorie' })).toBeVisible();
    await page.getByRole('link', { name: /Dehradun → Mussoorie/ }).click();
    await expect(page.getByRole('heading', { name: 'The ride' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Along the way' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cafés and food' })).toBeVisible();
    const maggi = page.getByRole('img', { name: 'Maggi points' });
    await maggi.scrollIntoViewIfNeeded();
    await expect.poll(() => maggi.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Cancellation' })).toBeVisible();
    const res = await page.goto('/no-such-page');
    expect(res?.status()).toBe(404);
    expect(errors).toEqual([]);
  });

  test('Valley Ride Capital calculator matches the architecture example', async ({ page }) => {
    await page.goto('/invest');
    await expect(page.getByText('We are not accepting investments yet', { exact: false })).toBeVisible();
    await expect(page.getByText('₹16,311').first()).toBeVisible(); // ₹2,50,000 at 21% for 18 months
    await page.getByRole('radio', { name: /Monthly interest only/ }).click();
    await expect(page.getByText('₹4,375').first()).toBeVisible();
  });

  test('protected pages send you to login', async ({ page }) => {
    await page.goto('/account/bookings');
    await expect(page).toHaveURL(/\/login\?next=%2Faccount%2Fbookings/);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});
