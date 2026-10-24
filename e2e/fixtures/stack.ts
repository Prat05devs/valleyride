import IORedis from 'ioredis';
import pg from 'pg';
import type { APIRequestContext, Page } from '@playwright/test';

export const API = process.env.E2E_API ?? 'http://localhost:4000/api/v1';
const redis = new IORedis(process.env.E2E_REDIS ?? 'redis://localhost:6379');
const db = new pg.Pool({ connectionString: process.env.E2E_DB ?? 'postgres://valley:valley@localhost:5432/valleyride' });

/** A fresh +91 number per run, so login rate limits and old bookings never collide. Recorded for cleanup. */
export const newPhone = () => {
  const phone = `+9198${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 90 + 10)}`.slice(0, 13);
  void redis.sadd('e2e:phones', phone);
  return phone;
};

/** Releases bikes held or booked by test riders (dev database only), so runs never fill the fleet. */
export async function releaseTestBookings() {
  const phones = await redis.smembers('e2e:phones');
  if (!phones.length) return 0;
  const rows = await sql(`UPDATE bookings SET status = 'CANCELLED', hold_expires_at = NULL, updated_at = now()
    WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED', 'ONGOING') AND user_id IN (SELECT id FROM users WHERE phone = ANY($1)) RETURNING id`, [phones]);
  return rows.length;
}

export const closeStack = async () => { await redis.quit(); await db.end(); };

/** Every test rider's password. */
export const PASSWORD = 'e2e-rider-password';

export const sql = <T = Record<string, unknown>>(text: string, params: unknown[] = []) => db.query(text, params).then((r) => r.rows as T[]);

/** Logs a browser context in through the API (cookies land on localhost, shared by :3000 and :4000). */
export async function apiLogin(request: APIRequestContext, phone: string, role?: 'staff' | 'admin', name = 'E2E Rider') {
  const reg = await request.post(`${API}/auth/register`, { data: { phone, password: PASSWORD } });
  if (reg.status() !== 201) await request.post(`${API}/auth/login`, { data: { phone, password: PASSWORD } });
  await request.patch(`${API}/me`, { data: { fullName: name } });
  if (role) {
    await sql('UPDATE users SET role = $1 WHERE phone = $2', [role, phone]);
    await request.post(`${API}/auth/login`, { data: { phone, password: PASSWORD } }); // new token carries the role
  }
}

/** Tomorrow-or-later 9:00 IST window as datetime-local strings, offset by `days` so runs don't compete for bikes. */
export function istWindow(days: number, length = 3) {
  const base = new Date(Date.now() + 5.5 * 3_600_000);
  const s = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + days, 9, 0));
  const e = new Date(s.getTime() + length * 86_400_000);
  const f = (d: Date) => d.toISOString().slice(0, 16);
  return { from: f(s), to: f(e), startAt: new Date(`${f(s)}:00+05:30`).toISOString(), endAt: new Date(`${f(e)}:00+05:30`).toISOString() };
}

/** A booking paid through the mock-payment path, for flows that start after checkout. */
export async function paidBooking(request: APIRequestContext, slug: string, days: number) {
  const models = (await (await request.get(`${API}/vehicle-models`)).json()).data as { id: string; slug: string }[];
  const locations = (await (await request.get(`${API}/locations`)).json()).data as { id: string }[];
  const w = istWindow(days);
  const res = await request.post(`${API}/bookings`, {
    headers: { 'Idempotency-Key': `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}` },
    data: { vehicleModelId: models.find((m) => m.slug === slug)!.id, pickupLocationId: locations[0]!.id, returnLocationId: locations[0]!.id, startAt: w.startAt, endAt: w.endAt },
  });
  const body = (await res.json()).data;
  if (!body?.booking) throw new Error(`hold failed: ${JSON.stringify(await res.json())}`);
  await request.post(`${API}/dev/payments/simulate`, { data: { orderId: body.razorpayOrderId, outcome: 'captured' } });
  return body.booking as { id: string; code: string };
}

/** Fails the test on any uncaught page error or failed API call (5xx). */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => {
    // WebKit reports Next.js link prefetches (?_rsc=) cancelled by a navigation as "access control checks"; not a page error.
    if (/_rsc=.*access control checks/.test(e.message)) return;
    errors.push(`pageerror: ${e.message}`);
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Expected 4xx responses the UI handles (e.g. 401 before login, 404 for a not-yet-signed agreement) log as "Failed to load resource".
    if (/Failed to load resource: the server responded with a status of 4\d\d/.test(t)) return;
    // The same cancelled WebKit prefetch, as logged by Next.js: it falls back to a normal navigation, so nothing breaks.
    if (/Failed to fetch RSC payload .* Falling back to browser navigation\. TypeError: Load failed/.test(t)) return;
    errors.push(`console: ${t.slice(0, 300)}`);
  });
  page.on('response', (r) => { if (r.url().includes('/api/v1/') && r.status() >= 500) errors.push(`${r.status()} ${r.url()}`); });
  return errors;
}

/** A tiny valid JPEG for upload fields. */
export const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
export const PNG_SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
