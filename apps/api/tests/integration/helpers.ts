import { createHmac, randomUUID } from 'node:crypto';
import request from 'supertest';
import { QueryTypes } from 'sequelize';
import { app } from '../../src/app';
import { sequelize } from '../../src/db';

export const TEST_PASSWORD = 'correct-horse-1';

/** Logs in with a given password, e.g. a temporary one from staff. */
export async function loginWith(phone: string, password: string) {
  const agent = request.agent(app);
  await agent.post('/api/v1/auth/login').send({ phone, password }).expect(200);
  return agent;
}

/** Signs a customer up (or back in) through the real password flow and returns an agent that carries the cookies. */
export async function loginAs(phone: string) {
  const agent = request.agent(app);
  const reg = await agent.post('/api/v1/auth/register').send({ phone, password: TEST_PASSWORD });
  if (reg.status !== 201) await agent.post('/api/v1/auth/login').send({ phone, password: TEST_PASSWORD }).expect(200);
  return agent;
}

export async function ids() {
  const models = await sequelize.query<{ id: string; slug: string }>('SELECT id, slug FROM vehicle_models', { type: QueryTypes.SELECT });
  const locations = await sequelize.query<{ id: string; name: string }>('SELECT id, name FROM locations ORDER BY name', { type: QueryTypes.SELECT });
  return { model: Object.fromEntries(models.map((m) => [m.slug, m.id])), locations: locations.map((l) => l.id) };
}

/** A rental window `daysAhead` days from now, `hours` long, so each test can use a window nobody else books. */
export function window(daysAhead: number, hours = 48) {
  const startAt = new Date(Date.now() + daysAhead * 86_400_000);
  startAt.setUTCHours(3, 30, 0, 0);
  return { startAt: startAt.toISOString(), endAt: new Date(startAt.getTime() + hours * 3_600_000).toISOString() };
}

export const newKey = () => `test-${randomUUID()}`;

export function signWebhook(body: object) {
  const raw = JSON.stringify(body);
  return { raw, signature: createHmac('sha256', 'whsec_test').update(raw).digest('hex') };
}

export { app, request };
