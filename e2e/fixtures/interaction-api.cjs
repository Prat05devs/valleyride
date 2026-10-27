const http = require('node:http');
const catalog = require('./interaction-catalog.json');
const { quote, DURATION_TIERS } = require('../../packages/shared/dist/pricing.js');
const { buildSchedule } = require('../../apps/api/src/modules/investor/amortization.ts');
const models = catalog['vehicle-models'];
const locations = catalog.locations;
const user = { id: 'ui-review-user', role: 'admin', fullName: 'UI Review', phone: '+919999999999', email: 'ui@example.test' };

http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Client,Idempotency-Key');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const url = new URL(req.url, 'http://127.0.0.1');
  const path = url.pathname.replace('/api/v1', '');
  let body = '';
  for await (const chunk of req) body += chunk;
  const input = body ? JSON.parse(body) : {};
  let data;
  if (path === '/locations') data = locations;
  else if (path === '/vehicle-models') data = models;
  else if (path.startsWith('/vehicle-models/')) data = models.find((m) => m.slug === path.split('/').pop());
  else if (path === '/routes') data = catalog.routes;
  else if (path.startsWith('/routes/')) data = catalog.routes.find((r) => r.slug === path.split('/').pop());
  else if (path === '/pricing') data = { tiers: DURATION_TIERS };
  else if (path === '/me') data = { ...user, ...input };
  else if (path === '/auth/login' || path === '/auth/register') data = { user, accessToken: 'ui-review-token', refreshToken: 'ui-review-refresh' };
  else if (path === '/availability') {
    try {
      data = models.map((m) => ({ model_id: m.id, free: url.searchParams.get('pickup') === locations[1].id ? 0 : 2,
        quote: quote(m, new Date(url.searchParams.get('startAt')), new Date(url.searchParams.get('endAt')), { oneWay: !!url.searchParams.get('return') }) }));
    } catch { res.writeHead(400); res.end(JSON.stringify({ error: { code: 'MIN_DURATION', message: 'Rentals are at least 4 hours' } })); return; }
  }
  else if (path === '/quotes') {
    const model = models.find((m) => m.id === input.vehicleModelId);
    data = { ...quote(model, new Date(input.startAt), new Date(input.endAt), { oneWay: input.pickupLocationId !== input.returnLocationId, couponPct: input.couponCode === 'VALID10' ? 10 : 0 }),
      couponCode: input.couponCode === 'VALID10' ? 'VALID10' : null, couponValid: input.couponCode ? input.couponCode === 'VALID10' : null };
  }
  else if (path === '/investor/calculate') {
    const rows = buildSchedule({ ...input, startDate: new Date(input.startDate) });
    data = { principalPaise: input.principalPaise, monthlyPaymentPaise: rows[0].paymentPaise, finalPaymentPaise: rows.at(-1).paymentPaise, totalPaidPaise: rows.reduce((s, r) => s + r.paymentPaise, 0), totalInterestPaise: rows.reduce((s, r) => s + r.interestPaise, 0), schedule: rows };
  }
  else if (path === '/me/payments') data = { lines: [], depositsHeld: [] };
  else if (path === '/me/notifications') data = [];
  else if (path === '/bookings' || path === '/kyc/documents' || path === '/admin/vehicles' || path === '/admin/pricing-rules') data = [];
  else if (path === '/payments/config') data = { enabled: false, mode: 'test', currency: 'INR' };
  else if (path === '/me/password' || path === '/auth/logout') data = {};
  else { res.writeHead(404); res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'This UI fixture does not contain that record.' } })); return; }
  res.end(JSON.stringify({ data }));
}).listen(4100, '127.0.0.1', () => console.log('Isolated interaction API on 4100'));
