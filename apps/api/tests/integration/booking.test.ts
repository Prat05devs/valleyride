import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { QueryTypes } from 'sequelize';
import { quote } from '@valleyride/shared';
import { app, ids, loginAs, newKey, otpCodes, request, signWebhook, window } from './helpers';
import { sequelize } from '../../src/db';
import { closeQueues } from '../../src/jobs/queue';
import { holdExpiry } from '../../src/jobs/processors/holdExpiry';

// Capture OTPs instead of sending them.
vi.mock('../../src/modules/notification/sms', () => ({
  sendOtp: async (phone: string, code: string) => { otpCodes.set(phone, code); },
}));

// Razorpay is replaced with a fake that returns a new order id per call.
let orderSeq = 0;
const orderAmounts = new Map<string, number>();
vi.mock('../../src/modules/payment/razorpay.client', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/modules/payment/razorpay.client')>();
  return {
    ...real,
    getRazorpay: () => ({
      orders: { create: async (o: { amount: number }) => { const id = `order_test_${++orderSeq}`; orderAmounts.set(id, o.amount); return { id, amount: o.amount }; } },
      payments: {
        // pay_for_<orderId>: an authorized payment the API must capture (manual-capture accounts)
        fetch: async (id: string) => ({ id, order_id: id.replace('pay_for_', ''), amount: orderAmounts.get(id.replace('pay_for_', '')), status: 'authorized' }),
        capture: async (id: string, amount: number) => ({ id, order_id: id.replace('pay_for_', ''), amount, status: 'captured' }),
        refund: async (paymentId: string, o: { amount: number }) => ({ id: `rfnd_test_${++orderSeq}`, payment_id: paymentId, amount: o.amount, status: 'processed' }) },
    }),
  };
});

let fixture: Awaited<ReturnType<typeof ids>>;
beforeAll(async () => { fixture = await ids(); });
afterAll(async () => { await closeQueues(); await sequelize.close(); });

const bookingBody = (slug: string, w: { startAt: string; endAt: string }) => ({
  vehicleModelId: fixture.model[slug],
  pickupLocationId: fixture.locations[0],
  returnLocationId: fixture.locations[0],
  ...w,
});

describe('public catalogue', () => {
  it('GET /health', async () => {
    await request(app).get('/health').expect(200, { ok: true });
  });

  it('lists the 4 models cheapest first, in the { data, meta.requestId } envelope', async () => {
    const res = await request(app).get('/api/v1/vehicle-models').expect(200);
    expect(res.body.data.map((m: any) => m.slug)).toEqual(['activa-125', 'hunter-350', 'scram-440', 'himalayan-450']);
    expect(res.body.data[0].pricePerDayPaise).toBe(64_900);
    expect(res.body.meta.requestId).toBeTruthy();
  });

  it('returns free units per model', async () => {
    const res = await request(app).get('/api/v1/availability').query(window(60)).expect(200);
    const free = Object.fromEntries(res.body.data.map((r: any) => [r.model_id, r.free]));
    expect(free[fixture.model['activa-125']]).toBe(15);
    expect(free[fixture.model['himalayan-450']]).toBe(5);
  });

  it('rejects a window shorter than 4 hours with 422', async () => {
    const res = await request(app).get('/api/v1/availability').query(window(60, 3)).expect(422);
    expect(res.body.error.code).toBe('VALIDATION');
  });

  it('POST /quotes matches the shared pricing formula, one-way fee included', async () => {
    const w = window(60, 72);
    const body = { ...bookingBody('hunter-350', w), returnLocationId: fixture.locations[1] };
    const res = await request(app).post('/api/v1/quotes').send(body).expect(200);
    const expected = quote({ pricePerDayPaise: 119_900, depositPaise: 500_000, kmPerDay: 200 }, new Date(w.startAt), new Date(w.endAt), { oneWay: true });
    expect(res.body.data.payNowPaise).toBe(expected.payNowPaise);
    expect(res.body.data.feesPaise).toBe(40_000);
  });

  it('POST /investor/calculate gives the illustrative EMI', async () => {
    const res = await request(app).post('/api/v1/investor/calculate')
      .send({ principalPaise: 250_000_00, annualRatePct: 21, months: 18, structure: 'amortizing', startDate: '2026-11-01' })
      .expect(200);
    expect(Math.round(res.body.data.monthlyPaymentPaise / 100)).toBe(16_311);
    expect(res.body.data.schedule).toHaveLength(18);
  });

  it('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/api/v1/nope').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

describe('auth', () => {
  it('logs in with an OTP, sets cookies and serves /me', async () => {
    const agent = await loginAs('+919800000001');
    const me = await agent.get('/api/v1/me').expect(200);
    expect(me.body.data).toMatchObject({ phone: '+919800000001', role: 'customer' });
  });

  it('rejects a wrong code', async () => {
    await request(app).post('/api/v1/auth/otp/request').send({ phone: '+919800000002' }).expect(202);
    const res = await request(app).post('/api/v1/auth/otp/verify').send({ phone: '+919800000002', code: '000000' === otpCodes.get('+919800000002') ? '111111' : '000000' }).expect(400);
    expect(res.body.error.code).toBe('OTP_INVALID');
  });

  it('protects /bookings', async () => {
    await request(app).get('/api/v1/bookings').expect(401);
  });
});

describe('booking engine', () => {
  it('requires an Idempotency-Key to create a booking', async () => {
    const agent = await loginAs('+919800000010');
    const res = await agent.post('/api/v1/bookings').send(bookingBody('activa-125', window(70))).expect(400);
    expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('holds a vehicle for 15 minutes and returns a Razorpay order', async () => {
    const agent = await loginAs('+919800000011');
    const res = await agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send(bookingBody('activa-125', window(71))).expect(201);
    const { booking, razorpayOrderId } = res.body.data;
    expect(booking.status).toBe('PENDING_PAYMENT');
    expect(booking.code).toMatch(/^VR-[A-Z2-9]{5}$/);
    expect(razorpayOrderId).toMatch(/^order_test_/);
    const holdMinutes = (new Date(booking.holdExpiresAt).getTime() - Date.now()) / 60_000;
    expect(holdMinutes).toBeGreaterThan(14);
    expect(holdMinutes).toBeLessThanOrEqual(15);

    const mine = await agent.get('/api/v1/bookings').expect(200);
    expect(mine.body.data.map((b: any) => b.id)).toContain(booking.id);
  });

  it('never double-books: 6 parallel requests for the 5 Himalayans give 5 holds and one 409', async () => {
    const agent = await loginAs('+919800000012');
    const w = window(80);
    const results = await Promise.all(Array.from({ length: 6 }, () =>
      agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send(bookingBody('himalayan-450', w))));
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 201, 201, 201, 201, 409]);
    const conflict = results.find((r) => r.status === 409)!;
    expect(conflict.body.error.code).toBe('NO_AVAILABILITY');
    const vehicles = new Set(results.filter((r) => r.status === 201).map((r) => r.body.data.booking.id));
    expect(vehicles.size).toBe(5);

    const avail = await request(app).get('/api/v1/availability').query(w).expect(200);
    expect(avail.body.data.find((r: any) => r.model_id === fixture.model['himalayan-450'])).toBeUndefined();
  });

  it('the exclusion constraint rejects an overlapping row even when written directly', async () => {
    const [b] = await sequelize.query<any>(`SELECT * FROM bookings WHERE status = 'PENDING_PAYMENT' LIMIT 1`, { type: QueryTypes.SELECT });
    await expect(sequelize.query(
      `INSERT INTO bookings (code, user_id, vehicle_id, vehicle_model_id, pickup_location_id, return_location_id, start_at, end_at,
         billable_days, km_included, rental_paise, tax_paise, deposit_paise, total_paise)
       VALUES ('VR-DUPE1', :u, :v, :m, :l, :l, :s::timestamptz + interval '1 hour', :e, 1, 1, 1, 1, 1, 1)`,
      { replacements: { u: b.user_id, v: b.vehicle_id, m: b.vehicle_model_id, l: b.pickup_location_id, s: b.start_at, e: b.end_at } },
    )).rejects.toMatchObject({ parent: { code: '23P01' } });
  });

  it('cancels an unpaid hold', async () => {
    const agent = await loginAs('+919800000013');
    const created = await agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send(bookingBody('scram-440', window(90))).expect(201);
    const res = await agent.post(`/api/v1/bookings/${created.body.data.booking.id}/cancel`).set('Idempotency-Key', newKey()).send({}).expect(200);
    expect(res.body.data.booking.status).toBe('CANCELLED');
    expect(res.body.data.refund).toBeNull();
  });

  it('expires holds that were not paid and frees the vehicle', async () => {
    const agent = await loginAs('+919800000014');
    const w = window(100);
    const created = await agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send(bookingBody('scram-440', w)).expect(201);
    const id = created.body.data.booking.id;
    await sequelize.query(`UPDATE bookings SET hold_expires_at = now() - interval '1 minute' WHERE id = :id`, { replacements: { id } });

    await holdExpiry({ data: {} } as any); // the once-a-minute sweep

    const after = await agent.get(`/api/v1/bookings/${id}`).expect(200);
    expect(after.body.data.status).toBe('EXPIRED');
    const avail = await request(app).get('/api/v1/availability').query(w).expect(200);
    expect(avail.body.data.find((r: any) => r.model_id === fixture.model['scram-440']).free).toBe(5);
  });
});

describe('Razorpay webhook', () => {
  it('confirms the booking on payment.captured, once per event id', async () => {
    const agent = await loginAs('+919800000020');
    const created = await agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send(bookingBody('hunter-350', window(110))).expect(201);
    const { booking, razorpayOrderId } = created.body.data;

    const event = { event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test_1', order_id: razorpayOrderId, amount: booking.totalPaise, status: 'captured' } } } };
    const { raw, signature } = signWebhook(event);
    const eventId = `evt_${newKey()}`; // the seen-key outlives a test run, so ids must be unique per run
    const send = () => request(app).post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json').set('X-Razorpay-Signature', signature).set('X-Razorpay-Event-Id', eventId).send(raw);

    await send().expect(200, { ok: true });
    const again = await send().expect(200);
    expect(again.body.duplicate).toBe(true);

    const after = await agent.get(`/api/v1/bookings/${booking.id}`).expect(200);
    expect(after.body.data.status).toBe('CONFIRMED');
    expect(after.body.data.holdExpiresAt).toBeNull();
    const [payment] = await sequelize.query<any>(`SELECT status, provider_payment_id FROM payments WHERE provider_order_id = :o`, { replacements: { o: razorpayOrderId }, type: QueryTypes.SELECT });
    expect(payment).toEqual({ status: 'CAPTURED', provider_payment_id: 'pay_test_1' });
  });

  it('rejects a bad signature', async () => {
    const res = await request(app).post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json').set('X-Razorpay-Signature', 'deadbeef').send('{"event":"payment.captured"}').expect(400);
    expect(res.body.error.code).toBe('BAD_SIGNATURE');
  });
});

/** Books and confirms through a signed payment.captured webhook. */
async function confirmedBooking(phone: string, slug: string, w: { startAt: string; endAt: string }) {
  const agent = await loginAs(phone);
  const created = await agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send(bookingBody(slug, w)).expect(201);
  const { booking, razorpayOrderId } = created.body.data;
  await capture(razorpayOrderId, booking.totalPaise);
  return { agent, booking };
}

async function capture(orderId: string, amount: number) {
  const event = { event: 'payment.captured', payload: { payment: { entity: { id: `pay_${newKey()}`.slice(0, 40), order_id: orderId, amount, status: 'captured' } } } };
  const { raw, signature } = signWebhook(event);
  await request(app).post('/api/v1/webhooks/razorpay').set('Content-Type', 'application/json')
    .set('X-Razorpay-Signature', signature).set('X-Razorpay-Event-Id', `evt_${newKey()}`).send(raw).expect(200);
}

describe('changing a paid trip', () => {
  it('cancels more than 24 h ahead with the rental and deposit refunded in full', async () => {
    const { agent, booking } = await confirmedBooking('+919800000030', 'hunter-350', window(120));
    const preview = await agent.get(`/api/v1/bookings/${booking.id}/cancel`).expect(200);
    expect(preview.body.data.refund).toMatchObject({ pct: 100, refundPaise: booking.totalPaise, depositRefundPaise: booking.depositPaise });

    const res = await agent.post(`/api/v1/bookings/${booking.id}/cancel`).set('Idempotency-Key', newKey()).send({ reason: 'Plans changed' }).expect(200);
    expect(res.body.data.booking.status).toBe('CANCELLED');
    const refunds = await sequelize.query<any>(`SELECT amount_paise, status FROM payments WHERE booking_id = :id AND kind = 'REFUND'`, { replacements: { id: booking.id }, type: QueryTypes.SELECT });
    expect(refunds).toEqual([{ amount_paise: booking.totalPaise, status: 'REFUNDED' }]);
  });

  it('refunds half the rental within 24 h of pickup, and all of the deposit', async () => {
    const { agent, booking } = await confirmedBooking('+919800000031', 'scram-440', window(125));
    await sequelize.query(`UPDATE bookings SET start_at = now() + interval '6 hours', end_at = now() + interval '30 hours' WHERE id = :id`, { replacements: { id: booking.id } });
    const res = await agent.post(`/api/v1/bookings/${booking.id}/cancel`).set('Idempotency-Key', newKey()).send({}).expect(200);
    const rental = booking.totalPaise - booking.depositPaise;
    expect(res.body.data.refund).toMatchObject({ pct: 50, rentalRefundPaise: Math.round(rental / 2), refundPaise: Math.round(rental / 2) + booking.depositPaise });
  });

  it('extends after the difference is paid, re-pricing the whole trip', async () => {
    const w = window(130, 72);
    const { agent, booking } = await confirmedBooking('+919800000032', 'hunter-350', w);
    const endAt = new Date(new Date(w.endAt).getTime() + 2 * 86_400_000).toISOString();

    const preview = await agent.get(`/api/v1/bookings/${booking.id}/extend`).query({ endAt }).expect(200);
    const expected = quote({ pricePerDayPaise: 119_900, depositPaise: 500_000, kmPerDay: 200 }, new Date(w.startAt), new Date(endAt));
    expect(preview.body.data).toMatchObject({ available: true, payPaise: expected.payNowPaise - booking.totalPaise });

    const res = await agent.post(`/api/v1/bookings/${booking.id}/extend`).set('Idempotency-Key', newKey()).send({ endAt }).expect(201);
    expect(res.body.data.booking.endAt).toBe(w.endAt); // unchanged until paid
    await capture(res.body.data.razorpayOrderId, res.body.data.payPaise);

    const after = await agent.get(`/api/v1/bookings/${booking.id}`).expect(200);
    expect(after.body.data).toMatchObject({ endAt, billableDays: 5, totalPaise: expected.payNowPaise, kmIncluded: expected.kmIncluded });
  });

  it('refuses an extension that overlaps the next booking of the same bike', async () => {
    const w = window(140, 48);
    const { agent, booking } = await confirmedBooking('+919800000033', 'himalayan-450', w);
    const vehicle = await sequelize.query<any>(`SELECT vehicle_id FROM bookings WHERE id = :id`, { replacements: { id: booking.id }, type: QueryTypes.SELECT });
    await sequelize.query(
      `INSERT INTO bookings (code, user_id, vehicle_id, vehicle_model_id, pickup_location_id, return_location_id, start_at, end_at,
         status, billable_days, km_included, rental_paise, tax_paise, deposit_paise, total_paise)
       SELECT 'VR-NEXT1', user_id, vehicle_id, vehicle_model_id, pickup_location_id, return_location_id, end_at, end_at + interval '1 day',
         'CONFIRMED', 1, 1, 1, 1, 1, 1 FROM bookings WHERE id = :id`, { replacements: { id: booking.id } });
    const endAt = new Date(new Date(w.endAt).getTime() + 86_400_000).toISOString();
    const preview = await agent.get(`/api/v1/bookings/${booking.id}/extend`).query({ endAt }).expect(200);
    expect(preview.body.data.available).toBe(false);
    const res = await agent.post(`/api/v1/bookings/${booking.id}/extend`).set('Idempotency-Key', newKey()).send({ endAt }).expect(409);
    expect(res.body.error.code).toBe('NO_AVAILABILITY');
    expect(vehicle[0].vehicle_id).toBeTruthy();
  });
});

describe('profile', () => {
  it('PATCH /me updates the name and email', async () => {
    const agent = await loginAs('+919800000040');
    const res = await agent.patch('/api/v1/me').send({ fullName: 'Asha Rawat', email: 'asha@example.com' }).expect(200);
    expect(res.body.data).toMatchObject({ fullName: 'Asha Rawat', email: 'asha@example.com' });
    await agent.patch('/api/v1/me').send({ email: 'not-an-email' }).expect(422);
  });
});

async function staffAgent(phone: string) {
  await loginAs(phone);
  await sequelize.query(`UPDATE users SET role = 'staff' WHERE phone = :phone`, { replacements: { phone } });
  return loginAs(phone); // a new token carries the staff role
}

const SIGNATURE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const photos = ['Front', 'Left', 'Right', 'Rear'].map((label) => ({ key: `handovers/test/${label}.jpg`, label }));

describe('pickup and return', () => {
  it('runs a trip from desk handover to deposit refund, with the invoice and a review', async () => {
    const w = window(150, 72); // Hunter 350, 3 days: 600 km included, ₹6/km after
    const { agent, booking } = await confirmedBooking('+919800000050', 'hunter-350', w);
    const staff = await staffAgent('+919800000051');

    await agent.post(`/api/v1/bookings/${booking.id}/start`).send({}).expect(422);
    const start = { signaturePng: SIGNATURE, acceptedTerms: true, conditionConfirmed: true, emergencyContact: { name: 'Meera Sharma', phone: '+919812345678', relationship: 'Family' } };
    const early = await agent.post(`/api/v1/bookings/${booking.id}/start`).send(start).expect(409);
    expect(early.body.error.code).toBe('NO_HANDOVER');

    await agent.post(`/api/v1/admin/bookings/${booking.id}/handover`).send({ odometerKm: 1055, photos, licenceChecked: true }).expect(403);
    await staff.post(`/api/v1/admin/bookings/${booking.id}/handover`)
      .send({ odometerKm: 1055, fuelLevel: 75, photos, damageNotes: 'Small scratch on the left side panel', licenceChecked: true }).expect(201);

    const seen = await agent.get(`/api/v1/bookings/${booking.id}/handover`).expect(200);
    expect(seen.body.data.pickup).toMatchObject({ odometerKm: 1055, signedAt: null });
    expect(seen.body.data.pickup.photos).toHaveLength(4);
    expect(seen.body.data.pickup.photos[0].url).toContain('sig=');

    await agent.post(`/api/v1/bookings/${booking.id}/handover/report`).send({ note: 'Dent on the rear mudguard' }).expect(200);
    const started = await agent.post(`/api/v1/bookings/${booking.id}/start`).send(start).expect(200);
    expect(started.body.data.status).toBe('ONGOING');

    // 657 km ridden, returned on time: 57 km × ₹6 = ₹342 + 18% GST = ₹403.56 out of the ₹5,000 deposit.
    const ret = await staff.post(`/api/v1/admin/bookings/${booking.id}/return`).set('Idempotency-Key', newKey())
      .send({ odometerKm: 1712, returnedAt: w.endAt, checklist: { helmetsReturned: true, documentsReturned: true } }).expect(201);
    expect(ret.body.data.charges).toMatchObject({ kmRidden: 657, extraKm: 57, extraKmPaise: 34_200, taxPaise: 6_156, lateFeePaise: 0, refundPaise: 459_644 });
    expect(ret.body.data.booking.status).toBe('DEPOSIT_SETTLED'); // the fake Razorpay processes refunds at once

    const inv = await agent.get(`/api/v1/bookings/${booking.id}/invoice`).expect(200);
    expect(inv.body.data.final).toBe(true);
    expect(inv.body.data.totalPaise).toBe(booking.totalPaise - booking.depositPaise + 34_200 + 6_156);
    expect(inv.body.data.cgstPaise + inv.body.data.sgstPaise).toBe(booking.taxPaise + 6_156);

    await agent.put(`/api/v1/bookings/${booking.id}/review`).send({ rating: 5, tags: ['Clean bike'], comment: 'Smooth pickup' }).expect(200);
    const review = await agent.get(`/api/v1/bookings/${booking.id}/review`).expect(200);
    expect(review.body.data).toMatchObject({ rating: 5, tags: ['Clean bike'] });
  });

  it('charges a late return per started hour at an eighth of the day price', async () => {
    const w = window(160, 24);
    const { agent, booking } = await confirmedBooking('+919800000052', 'activa-125', w);
    const staff = await staffAgent('+919800000053');
    await staff.post(`/api/v1/admin/bookings/${booking.id}/handover`).send({ odometerKm: 100, photos, licenceChecked: true }).expect(201);
    await agent.post(`/api/v1/bookings/${booking.id}/start`).send({ signaturePng: SIGNATURE, acceptedTerms: true, conditionConfirmed: true, emergencyContact: { name: 'Ravi Kumar', phone: '+919812345679', relationship: 'Friend' } }).expect(200);
    const returnedAt = new Date(new Date(w.endAt).getTime() + 90 * 60_000).toISOString(); // 1.5 h late → 2 hours
    const ret = await staff.post(`/api/v1/admin/bookings/${booking.id}/return`).set('Idempotency-Key', newKey())
      .send({ odometerKm: 150, returnedAt, checklist: { helmetsReturned: true, documentsReturned: true } }).expect(201);
    expect(ret.body.data.charges).toMatchObject({ lateHours: 2, lateFeePaise: 2 * Math.round(64_900 / 8), extraKm: 0 });
  });
});

describe('KYC documents', () => {
  it('uploads through a signed URL, keeps only the last 4 digits and lets staff verify', async () => {
    const agent = await loginAs('+919800000060');
    const presigned = await agent.post('/api/v1/kyc/documents/presign').send({ type: 'AADHAAR', contentType: 'image/jpeg' }).expect(200);
    const { uploadUrl, fileKey } = presigned.body.data;
    const path = new URL(uploadUrl).pathname + new URL(uploadUrl).search;
    await request(app).put(path).set('Content-Type', 'image/jpeg').send(Buffer.from('fake-jpeg')).expect(200);
    await request(app).put(path.replace(/sig=[^&]+/, 'sig=00')).set('Content-Type', 'image/jpeg').send(Buffer.from('x')).expect(403);

    await agent.post('/api/v1/kyc/documents').send({ type: 'AADHAAR', number: '1234 5678 9012', fileKey: 'kyc/someone-else/x.jpg' }).expect(422);
    const doc = await agent.post('/api/v1/kyc/documents').send({ type: 'AADHAAR', number: '1234 5678 4821', fileKey }).expect(201);
    expect(doc.body.data).toMatchObject({ numberMasked: '••••4821', status: 'PENDING' });
    const stored = await sequelize.query<any>(`SELECT number_masked FROM customer_documents WHERE id = :id`, { replacements: { id: doc.body.data.id }, type: QueryTypes.SELECT });
    expect(stored[0].number_masked).toBe('••••4821');

    const staff = await staffAgent('+919800000061');
    const link = await staff.get(`/api/v1/admin/kyc/${doc.body.data.id}/file`).expect(200);
    const file = await request(app).get(new URL(link.body.data.url).pathname + new URL(link.body.data.url).search).expect(200);
    expect(file.body.toString()).toBe('fake-jpeg');
    await staff.patch(`/api/v1/admin/kyc/${doc.body.data.id}`).send({ status: 'VERIFIED' }).expect(200);

    const mine = await agent.get('/api/v1/kyc/documents').expect(200);
    expect(mine.body.data[0].status).toBe('VERIFIED');
    const audit = await sequelize.query<any>(`SELECT action FROM audit_logs WHERE entity_id = :id`, { replacements: { id: doc.body.data.id }, type: QueryTypes.SELECT });
    expect(audit).toEqual([{ action: 'kyc.verified' }]);
  });
});

async function adminAgent(phone: string) {
  await loginAs(phone);
  await sequelize.query(`UPDATE users SET role = 'admin' WHERE phone = :phone`, { replacements: { phone } });
  return loginAs(phone);
}

describe('admin console', () => {
  it('adds a vehicle, logs maintenance and takes it out of service', async () => {
    const admin = await adminAgent('+919800000070');
    const v = await admin.post('/api/v1/admin/vehicles').send({ vehicleModelId: fixture.model['scram-440'], registrationNo: 'uk07 ab 9001', homeLocationId: fixture.locations[0], odometerKm: 120 }).expect(201);
    expect(v.body.data).toMatchObject({ registrationNo: 'UK07 AB 9001', status: 'ACTIVE' });
    await admin.post('/api/v1/admin/vehicles').send({ vehicleModelId: fixture.model['scram-440'], registrationNo: 'UK07 AB 9001', homeLocationId: fixture.locations[0] }).expect(409);

    const m = await admin.post(`/api/v1/admin/vehicles/${v.body.data.id}/maintenance`).send({ type: 'SERVICE', odometerKm: 500, costPaise: 150_000, performedOn: '2026-10-10' }).expect(201);
    expect(m.body.data).toMatchObject({ odometerKm: 500 });
    expect(m.body.data.maintenance[0]).toMatchObject({ type: 'SERVICE', costPaise: 150_000 });

    const d = await admin.post(`/api/v1/admin/vehicles/${v.body.data.id}/documents`).send({ type: 'PUC', number: 'PUC-123', expiresOn: new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10) }).expect(201);
    expect(d.body.data.docAlert).toBe(true);

    const s = await admin.patch(`/api/v1/admin/vehicles/${v.body.data.id}/status`).send({ status: 'MAINT', reason: 'Brake pads' }).expect(200);
    expect(s.body.data.status).toBe('MAINT');
    const customer = await loginAs('+919800000071');
    await customer.get('/api/v1/admin/vehicles').expect(403);
  });

  it('shows the calendar, dashboard and reports', async () => {
    const w = window(170, 48);
    const { booking } = await confirmedBooking('+919800000072', 'activa-125', w);
    const admin = await adminAgent('+919800000073');
    const cal = await admin.get('/api/v1/admin/bookings').query({ from: w.startAt, to: w.endAt }).expect(200);
    const row = cal.body.data.find((b: any) => b.id === booking.id);
    expect(row).toMatchObject({ code: booking.code, customer: { phone: '+919800000072' }, model: { slug: 'activa-125' } });
    await admin.get('/api/v1/admin/bookings').query({ from: w.startAt, to: new Date(Date.now() + 400 * 86_400_000).toISOString() }).expect(422);

    const detail = await admin.get(`/api/v1/admin/bookings/${booking.id}`).expect(200);
    expect(detail.body.data.payments[0]).toMatchObject({ kind: 'RENTAL', status: 'CAPTURED' });

    const dash = await admin.get('/api/v1/admin/dashboard').expect(200);
    expect(dash.body.data.fleet.total).toBeGreaterThan(0);

    const month = new Date(new Date(w.startAt).getTime() + 5.5 * 3_600_000).toISOString().slice(0, 7);
    const pnl = await admin.get('/api/v1/admin/reports/pnl').query({ month }).expect(200);
    expect(pnl.body.data.current.rentalRevenuePaise).toBeGreaterThanOrEqual(booking.rentalPaise - booking.discountPaise);
    expect(pnl.body.data.current.gatewayFeesPaise).toBeNull();
    const csv = await admin.get('/api/v1/admin/reports/pnl.csv').query({ month }).expect(200);
    expect(csv.text.split('\n')[0]).toContain(month);

    const util = await admin.get('/api/v1/admin/reports/utilisation').query({ from: w.startAt, to: w.endAt }).expect(200);
    const unit = util.body.data.vehicles.find((v: any) => v.pct === 100 && v.model === 'Honda Activa 125');
    expect(unit).toBeTruthy();
  });

  it('creates coupons that the quote and booking honour, and counts uses', async () => {
    const admin = await adminAgent('+919800000074');
    await admin.post('/api/v1/admin/coupons').send({ code: 'hills12', percentOff: 12, maxUses: 2 }).expect(201);
    await admin.post('/api/v1/admin/coupons').send({ code: 'HILLS12', percentOff: 12 }).expect(409);
    const agent = await loginAs('+919800000075');
    const w = window(180, 72);
    const created = await agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send({ ...bookingBody('hunter-350', w), couponCode: 'HILLS12' }).expect(201);
    const expected = quote({ pricePerDayPaise: 119_900, depositPaise: 500_000, kmPerDay: 200 }, new Date(w.startAt), new Date(w.endAt), { couponPct: 12 });
    expect(created.body.data.booking.totalPaise).toBe(expected.payNowPaise);
    await capture(created.body.data.razorpayOrderId, created.body.data.booking.totalPaise);
    const list = await admin.get('/api/v1/admin/coupons').expect(200);
    expect(list.body.data.find((c: any) => c.code === 'HILLS12').used).toBe(1);
  });
});

describe('Valley Ride Capital (Phase 4)', () => {
  it('records an investment, reconciles a repayment and serves the investor portal and statement', async () => {
    const admin = await adminAgent('+919800000080');
    const inv = await admin.post('/api/v1/admin/investors').send({ phone: '+919800000081', fullName: 'Rohit Negi', pan: 'ABCDE1234F' }).expect(201);
    expect(inv.body.data.panMasked).toBe('••••••234F');
    const created = await admin.post('/api/v1/admin/investments').set('Idempotency-Key', newKey())
      .send({ investorId: inv.body.data.id, principalPaise: 250_000_00, annualRatePct: 21, tenureMonths: 18, structure: 'amortizing', startDate: '2026-11-01' }).expect(201);

    const dues = await admin.get('/api/v1/admin/repayments').query({ month: '2026-12' }).expect(200);
    const first = dues.body.data.find((d: any) => d.investmentId === created.body.data.id);
    expect(Math.round(first.paymentPaise / 100)).toBe(16_311);
    await admin.post(`/api/v1/admin/repayments/${first.id}/mark-paid`).set('Idempotency-Key', newKey()).send({ txnRef: 'UTR8812' }).expect(200);
    await admin.post(`/api/v1/admin/repayments/${first.id}/mark-paid`).set('Idempotency-Key', newKey()).send({ txnRef: 'UTR8812' }).expect(409);

    const investor = await loginAs('+919800000081');
    const mine = await investor.get('/api/v1/investor/investments').expect(200);
    expect(mine.body.data[0]).toMatchObject({ paidCount: 1, tenureMonths: 18 });
    expect(mine.body.data[0].ref).toMatch(/^VRC-\d{4}$/);
    const schedule = await investor.get(`/api/v1/investor/investments/${created.body.data.id}/schedule`).expect(200);
    expect(schedule.body.data.schedule).toHaveLength(18);
    const pdf = await investor.get(`/api/v1/investor/statements/${created.body.data.id}.pdf`).buffer(true).parse((res, cb) => {
      const chunks: Buffer[] = []; res.on('data', (c: Buffer) => chunks.push(c)); res.on('end', () => cb(null, Buffer.concat(chunks)));
    }).expect(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect((pdf.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');

    const stranger = await loginAs('+919800000082');
    await stranger.get('/api/v1/investor/investments').expect(403);
  });
});

describe('logout', () => {
  it('revokes the refresh token and clears the cookies', async () => {
    const agent = await loginAs('+919800000090');
    const out = await agent.post('/api/v1/auth/logout').send({}).expect(200);
    expect(String(out.headers['set-cookie'])).toContain('vr_refresh=;');
    await agent.post('/api/v1/auth/refresh').send({}).expect(401);
  });
});

describe('coupon on a held booking', () => {
  it('re-prices the hold and issues a new order for the new amount', async () => {
    const admin = await adminAgent('+919800000095');
    await admin.post('/api/v1/admin/coupons').send({ code: 'WEB10', percentOff: 10 }).expect(201);
    const agent = await loginAs('+919800000096');
    const w = window(190, 72);
    const created = await agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send(bookingBody('hunter-350', w)).expect(201);
    const { booking, razorpayOrderId } = created.body.data;
    await agent.post(`/api/v1/bookings/${booking.id}/coupon`).set('Idempotency-Key', newKey()).send({ code: 'NOPE' }).expect(422);
    const res = await agent.post(`/api/v1/bookings/${booking.id}/coupon`).set('Idempotency-Key', newKey()).send({ code: 'web10' }).expect(200);
    const expected = quote({ pricePerDayPaise: 119_900, depositPaise: 500_000, kmPerDay: 200 }, new Date(w.startAt), new Date(w.endAt), { couponPct: 10 });
    expect(res.body.data.booking).toMatchObject({ couponCode: 'WEB10', totalPaise: expected.payNowPaise });
    expect(res.body.data.razorpayOrderId).not.toBe(razorpayOrderId);
    const detail = await agent.get(`/api/v1/bookings/${booking.id}`).expect(200);
    expect(detail.body.data.pendingOrderId).toBe(res.body.data.razorpayOrderId);
  });
});

describe('investor onboarding', () => {
  it('stores only masked PAN and bank details', async () => {
    const admin = await adminAgent('+919800000097');
    await admin.post('/api/v1/admin/investors').send({ phone: '+919800000098', fullName: 'Kavya Bisht' }).expect(201);
    const inv = await loginAs('+919800000098');
    const res = await inv.patch('/api/v1/investor/profile').send({ pan: 'abcde9876f', bank: { holder: 'Kavya Bisht', ifsc: 'sbin0001234', accountNumber: '123456789012' } }).expect(200);
    expect(res.body.data).toMatchObject({ panMasked: '••••••876F', bankAccountRef: 'Kavya Bisht · SBIN0001234 · ••••9012', kycStatus: 'PENDING' });
    const raw = await sequelize.query<any>(`SELECT pan_masked, bank_account_ref FROM investors i JOIN users u ON u.id = i.user_id WHERE u.phone = '+919800000098'`, { type: QueryTypes.SELECT });
    expect(JSON.stringify(raw)).not.toContain('123456789012');
  });
});

describe('staff actions', () => {
  it('cancels a paid booking with the policy refund, logs it, and tells the rider why a document was rejected', async () => {
    const { agent, booking } = await confirmedBooking('+919800000100', 'hunter-350', window(200));
    const staff = await staffAgent('+919800000101');
    const res = await staff.post(`/api/v1/admin/bookings/${booking.id}/cancel`).set('Idempotency-Key', newKey()).send({ reason: 'Bike damaged in a fall' }).expect(200);
    expect(res.body.data).toMatchObject({ booking: { status: 'CANCELLED' }, refund: { pct: 100, refundPaise: booking.totalPaise } });
    const detail = await staff.get(`/api/v1/admin/bookings/${booking.id}`).expect(200);
    const activity = detail.body.data.activity.map((a: any) => `${a.text} | ${a.by}`);
    expect(activity).toEqual(expect.arrayContaining([expect.stringMatching(/^Booking cancelled: staff: Bike damaged in a fall \| /), expect.stringMatching(/^Payment captured · ₹\d+\.\d\d \| System$/), expect.stringMatching(/^Refund sent/)]));

    const p = await agent.post('/api/v1/kyc/documents/presign').send({ type: 'DL', contentType: 'image/jpeg' }).expect(200);
    const doc = await agent.post('/api/v1/kyc/documents').send({ type: 'DL', number: 'UK0720190012345', fileKey: p.body.data.fileKey }).expect(201);
    await staff.patch(`/api/v1/admin/kyc/${doc.body.data.id}`).send({ status: 'REJECTED', note: 'Photo blurry' }).expect(200);
    const mine = await agent.get('/api/v1/kyc/documents').expect(200);
    expect(mine.body.data[0]).toMatchObject({ status: 'REJECTED', note: 'Photo blurry' });
  });
});

const binary = (res: any, cb: (err: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = []; res.on('data', (c: Buffer) => chunks.push(c)); res.on('end', () => cb(null, Buffer.concat(chunks)));
};

describe('documents as PDF', () => {
  it('stores a signed agreement PDF at ride start and serves the invoice as PDF', async () => {
    const { agent, booking } = await confirmedBooking('+919800000110', 'scram-440', window(210, 48));
    const staff = await staffAgent('+919800000111');
    await staff.post(`/api/v1/admin/bookings/${booking.id}/handover`).send({ odometerKm: 500, photos, licenceChecked: true }).expect(201);
    await agent.get(`/api/v1/bookings/${booking.id}/agreement`).expect(404);
    await agent.post(`/api/v1/bookings/${booking.id}/start`).send({ signaturePng: SIGNATURE, acceptedTerms: true, conditionConfirmed: true, emergencyContact: { name: 'Asha Rawat', phone: '+919812345670', relationship: 'Family' } }).expect(200);

    const link = await agent.get(`/api/v1/bookings/${booking.id}/agreement`).expect(200);
    const u = new URL(link.body.data.url);
    expect(u.searchParams.get('key')).toBe(`agreements/${booking.id}/agreement.pdf`);
    const file = await request(app).get(u.pathname + u.search).buffer(true).parse(binary).expect(200);
    expect((file.body as Buffer).subarray(0, 5).toString()).toBe('%PDF-');

    const inv = await agent.get(`/api/v1/bookings/${booking.id}/invoice.pdf`).buffer(true).parse(binary).expect(200);
    expect(inv.headers['content-type']).toBe('application/pdf');
    const { invoicePdf } = await import('../../src/jobs/processors/invoicePdf');
    await expect(invoicePdf({ data: { bookingId: booking.id } } as any)).resolves.toMatchObject({ invoice: expect.stringMatching(/^VR-INV-/) });
  });
});

describe('idempotency', () => {
  it('replays the first response for a repeated key instead of refunding twice', async () => {
    const { agent, booking } = await confirmedBooking('+919800000120', 'activa-125', window(220));
    const key = newKey();
    const first = await agent.post(`/api/v1/bookings/${booking.id}/cancel`).set('Idempotency-Key', key).send({}).expect(200);
    const again = await agent.post(`/api/v1/bookings/${booking.id}/cancel`).set('Idempotency-Key', key).send({}).expect(200);
    expect(again.headers['idempotent-replayed']).toBe('true');
    expect(again.body.data).toEqual(first.body.data);
    const refunds = await sequelize.query<any>(`SELECT COUNT(*)::int AS n FROM payments WHERE booking_id = :id AND kind = 'REFUND'`, { replacements: { id: booking.id }, type: QueryTypes.SELECT });
    expect(refunds[0].n).toBe(1);
    await agent.post(`/api/v1/bookings/${booking.id}/cancel`).send({}).expect(400);
    const audit = await sequelize.query<any>(`SELECT action FROM audit_logs WHERE entity_id = :id ORDER BY id`, { replacements: { id: booking.id }, type: QueryTypes.SELECT });
    expect(audit.map((a: any) => a.action)).toEqual(['payment.captured', 'booking.cancelled', 'payment.refund']);
  });
});

describe('pricing rules', () => {
  it('applies a seasonal multiplier and custom tiers from pricing_rules to quotes and holds', async () => {
    const admin = await adminAgent('+919800000121');
    const w = window(230, 72);
    const day = new Date(new Date(w.startAt).getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);
    const season = await admin.post('/api/v1/admin/pricing-rules').send({ vehicleModelId: fixture.model['hunter-350'], seasonFrom: day, seasonTo: day, multiplier: 1.5 }).expect(201);
    await admin.post('/api/v1/admin/pricing-rules').send({ minDays: 3, discountPct: 10, seasonFrom: day, seasonTo: day }).expect(422);

    const avail = await request(app).get('/api/v1/availability').query({ ...w, pickup: fixture.locations[0] }).expect(200);
    const hunter = avail.body.data.find((r: any) => r.model_id === fixture.model['hunter-350']);
    const expected = quote({ pricePerDayPaise: Math.round(119_900 * 1.5), depositPaise: 500_000, kmPerDay: 200 }, new Date(w.startAt), new Date(w.endAt));
    expect(hunter.quote.payNowPaise).toBe(expected.payNowPaise);

    const agent = await loginAs('+919800000122');
    const held = await agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send(bookingBody('hunter-350', w)).expect(201);
    expect(held.body.data.booking).toMatchObject({ totalPaise: expected.payNowPaise, tierPct: 10 });
    await admin.delete(`/api/v1/admin/pricing-rules/${season.body.data.id}`).expect(204);
    const after = await request(app).post('/api/v1/quotes').send(bookingBody('hunter-350', w)).expect(200);
    expect(after.body.data.rentalPaise).toBe(3 * 119_900);
  });

  it('rejects a pickup in the past', async () => {
    const res = await request(app).get('/api/v1/availability').query({ startAt: new Date(Date.now() - 2 * 3_600_000).toISOString(), endAt: new Date(Date.now() + 86_400_000).toISOString() }).expect(422);
    expect(JSON.stringify(res.body)).toContain('past');
  });
});

describe('route guide CMS', () => {
  it('lets staff edit a guide and the public page sees it', async () => {
    const staff = await staffAgent('+919800000123');
    const list = await staff.get('/api/v1/admin/routes').expect(200);
    expect(list.body.data.map((r: any) => r.slug)).toEqual(['dehradun-mussoorie', 'dehradun-rishikesh', 'sahastradhara-loop', 'maldevta']);
    const g = list.body.data[0];
    await staff.patch(`/api/v1/admin/routes/${g.id}`).send({ ...g, bodyMd: 'About 1.5 hours.\n\n- Pick up at Dehradun · ISBT — Fill up before the climb.' }).expect(200);
    const pub = await request(app).get(`/api/v1/routes/${g.slug}`).expect(200);
    expect(pub.body.data.bodyMd).toContain('Fill up before the climb');
  });
});

describe('model pages and route pages', () => {
  it('serves 2026 specs for every model and stops, tips and credited photos for every route', async () => {
    const models = await request(app).get('/api/v1/vehicle-models').expect(200);
    for (const m of models.body.data) {
      expect(m.specs.modelYear).toBe(2026);
      expect(m.specs.mileage.tankL).toBeGreaterThan(0);
      expect(m.specs.terrain.length).toBeGreaterThanOrEqual(4);
    }
    const routes = await request(app).get('/api/v1/routes').expect(200);
    for (const r of routes.body.data) {
      expect(r.stops.filter((s: any) => s.section === 'way').length).toBeGreaterThanOrEqual(3);
      expect(r.tips.length).toBeGreaterThan(0);
      expect(r.cover.credit).toBeTruthy();
      for (const p of [r.cover, ...r.stops.map((s: any) => s.photo).filter(Boolean)]) {
        expect(p.source).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
        const img = await request(app).get(p.url).expect(200);
        expect(img.headers['content-type']).toBe('image/jpeg');
        expect(img.headers['cross-origin-resource-policy']).toBe('cross-origin');
      }
    }
    const mussoorie = routes.body.data.find((r: any) => r.slug === 'dehradun-mussoorie');
    expect(mussoorie.stops.map((s: any) => s.name)).toContain('Maggi points');
  });

  it('lets staff replace a model page and rejects malformed specs', async () => {
    const staff = await staffAgent('+919800000125');
    const m = (await request(app).get('/api/v1/vehicle-models/hunter-350').expect(200)).body.data;
    const specs = { ...m.specs, fromUs: ['Two ISI helmets come with every booking.'] };
    const saved = await staff.put(`/api/v1/admin/vehicle-models/${m.id}/specs`).send(specs).expect(200);
    expect(saved.body.data.specs.fromUs).toEqual(['Two ISI helmets come with every booking.']);
    const pub = await request(app).get('/api/v1/vehicle-models/hunter-350').expect(200);
    expect(pub.body.data.specs.fromUs).toHaveLength(1);
    await staff.put(`/api/v1/admin/vehicle-models/${m.id}/specs`).send({ ...specs, terrain: [{ label: 'City', score: 9, note: 'x' }] }).expect(422);
    const rider = await loginAs('+919800000126');
    await rider.put(`/api/v1/admin/vehicle-models/${m.id}/specs`).send(specs).expect(403);
    const audit = await sequelize.query<any>(`SELECT COUNT(*)::int AS n FROM audit_logs WHERE action = 'content.specs' AND entity_id = :id`, { replacements: { id: m.id }, type: QueryTypes.SELECT });
    expect(audit[0].n).toBe(1);
  });

  it('saves route stops from the CMS and validates them', async () => {
    const staff = await staffAgent('+919800000127');
    const g = (await staff.get('/api/v1/admin/routes').expect(200)).body.data.find((r: any) => r.slug === 'sahastradhara-loop');
    const stops = [...g.stops, { name: 'Test chai stall', kind: 'food', section: 'eat', km: null, blurb: 'Ginger chai by the stream.' }];
    await staff.patch(`/api/v1/admin/routes/${g.id}`).send({ ...g, stops }).expect(200);
    const pub = await request(app).get('/api/v1/routes/sahastradhara-loop').expect(200);
    expect(pub.body.data.stops.at(-1).name).toBe('Test chai stall');
    await staff.patch(`/api/v1/admin/routes/${g.id}`).send({ ...g, stops: [{ name: 'Bad', kind: 'spaceport', section: 'way', blurb: 'x' }] }).expect(422);
    await staff.patch(`/api/v1/admin/routes/${g.id}`).send({ ...g, cover: { url: 'http://insecure.example/x.jpg', credit: 'x' } }).expect(422);
  });
});

describe('notifications and scheduled jobs', () => {
  it('stores Expo push tokens per device', async () => {
    const agent = await loginAs('+919800000130');
    await agent.post('/api/v1/me/push-tokens').send({ token: 'ExponentPushToken[abc123]', platform: 'ios' }).expect(204);
    await agent.post('/api/v1/me/push-tokens').send({ token: 'ExponentPushToken[abc123]', platform: 'ios' }).expect(204);
    await agent.post('/api/v1/me/push-tokens').send({ token: 'not-a-token', platform: 'ios' }).expect(422);
    const rows = await sequelize.query<any>(`SELECT COUNT(*)::int AS n FROM push_tokens WHERE token = 'ExponentPushToken[abc123]'`, { type: QueryTypes.SELECT });
    expect(rows[0].n).toBe(1);
    await agent.delete('/api/v1/me/push-tokens').send({ token: 'ExponentPushToken[abc123]' }).expect(204);
  });

  it('reminds riders due back within 24 h, alerts on expiring documents and marks late repayments', async () => {
    const { returnReminder } = await import('../../src/jobs/processors/returnReminder');
    const { docExpiry } = await import('../../src/jobs/processors/docExpiry');
    const { repaymentDue } = await import('../../src/jobs/processors/repaymentDue');
    const { booking } = await confirmedBooking('+919800000131', 'hunter-350', window(240));
    await sequelize.query(`UPDATE bookings SET status = 'ONGOING', start_at = now() - interval '1 day', end_at = now() + interval '20 hours' WHERE id = :id`, { replacements: { id: booking.id } });
    expect((await returnReminder({} as any)).reminded).toBeGreaterThanOrEqual(1);

    await sequelize.query(`INSERT INTO vehicle_documents (vehicle_id, type, number, expires_on)
      SELECT id, 'INSURANCE', 'POL-7731', (now() AT TIME ZONE 'Asia/Kolkata')::date + 7 FROM vehicles WHERE status = 'ACTIVE' LIMIT 1`);
    expect((await docExpiry({} as any)).alerts).toBeGreaterThanOrEqual(1);

    await sequelize.query(`UPDATE repayment_schedules SET due_date = (now() AT TIME ZONE 'Asia/Kolkata')::date - 2 WHERE id = (SELECT id FROM repayment_schedules WHERE status = 'DUE' ORDER BY due_date LIMIT 1)`);
    expect((await repaymentDue({} as any)).late).toBeGreaterThanOrEqual(1);
  });

  it('keeps Valley Ride Capital read-only until it is switched on', async () => {
    const { env } = await import('../../src/config/env');
    const admin = await adminAgent('+919800000132');
    env.CAPITAL_PORTAL_ENABLED = false;
    try {
      const res = await admin.post('/api/v1/admin/investors').send({ phone: '+919800000133', fullName: 'Not Yet' }).expect(403);
      expect(res.body.error.code).toBe('CAPITAL_CLOSED');
      await request(app).post('/api/v1/investor/calculate').send({ principalPaise: 100_000_00, annualRatePct: 18, months: 12, structure: 'amortizing', startDate: '2026-11-01' }).expect(200);
    } finally { env.CAPITAL_PORTAL_ENABLED = true; }
  });
});

describe('OpenAPI', () => {
  it('serves a spec that documents every /api/v1 route', async () => {
    const res = await request(app).get('/api/docs/openapi.json').expect(200);
    expect(res.body.openapi).toBe('3.1.0');
    const { apiRouter } = await import('../../src/routes');
    const { OPERATIONS } = await import('../../src/docs/openapi');
    const documented = new Set(OPERATIONS.map(([m, p]) => `${m} ${p}`));
    const live: string[] = [];
    const walk = (stack: any[]) => stack.forEach((l) => {
      if (l.route) Object.keys(l.route.methods).forEach((m) => live.push(`${m} ${l.route.path}`));
      else if (l.handle?.stack) walk(l.handle.stack);
    });
    walk((apiRouter as any).stack);
    const missing = live.filter((r) => !documented.has(r) && !r.includes('/dev/'));
    expect(missing).toEqual([]);
    await request(app).get('/api/docs').expect(200).expect('Content-Type', /html/);
  });
});

describe('Checkout callback', () => {
  it('confirms from the signed Checkout result without waiting for the webhook, and rejects a forged signature', async () => {
    const { createHmac } = await import('node:crypto');
    const agent = await loginAs('+919800000140');
    const created = await agent.post('/api/v1/bookings').set('Idempotency-Key', newKey()).send(bookingBody('hunter-350', window(250))).expect(201);
    const orderId = created.body.data.razorpayOrderId;
    const paymentId = `pay_for_${orderId}`;
    const signature = createHmac('sha256', 'dummy').update(`${orderId}|${paymentId}`).digest('hex');
    await agent.post('/api/v1/payments/verify').send({ orderId, paymentId, signature: 'a'.repeat(64) }).expect(400);
    const ok = await agent.post('/api/v1/payments/verify').send({ orderId, paymentId, signature }).expect(200);
    expect(ok.body.data.status).toBe('CONFIRMED');
    await agent.post('/api/v1/payments/verify').send({ orderId, paymentId, signature }).expect(200); // repeat is harmless
  });
});
