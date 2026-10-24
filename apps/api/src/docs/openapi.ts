import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { Router } from 'express';
import { z, type ZodTypeAny } from 'zod';
import * as S from '@valleyride/shared';
import { changePasswordSchema, loginSchema, passwordResetSchema, pushTokenSchema, registerSchema, updateMeSchema } from '../modules/auth/auth.schema';

/**
 * OpenAPI 3.1 for /api/v1, generated from the same Zod schemas the routes validate with (packages/shared), served at
 * /api/docs (Redoc) and /api/docs/openapi.json. The list mirrors the routers; a test checks every router path is here.
 */
// Patch both zod copies (the API's and the one packages/shared was built with; they can differ under CJS/ESM).
extendZodWithOpenApi(z);
extendZodWithOpenApi(S.sharedZod);

type Auth = 'public' | 'customer' | 'staff' | 'admin' | 'investor' | 'any' | 'signature';
type Op = [method: 'get' | 'post' | 'patch' | 'put' | 'delete', path: string, auth: Auth, summary: string, req?: { body?: ZodTypeAny; query?: ZodTypeAny }];

const unwrap = (s: ZodTypeAny): z.AnyZodObject => (s instanceof z.ZodEffects ? unwrap(s._def.schema) : (s as z.AnyZodObject));
const reason = z.object({ reason: z.string().max(300).optional() });

export const OPERATIONS: Op[] = [
  ['post', '/auth/register', 'public', 'Create a customer account with phone and password; sets the session like login', { body: registerSchema }],
  ['post', '/auth/login', 'public', 'Phone and password; sets access + refresh cookies (tokens in the body for X-Client: mobile)', { body: loginSchema }],
  ['post', '/me/password', 'any', 'Change your password; signs out every other device', { body: changePasswordSchema }],
  ['post', '/admin/users/password-reset', 'staff', 'Temporary password for a rider who forgot theirs (admins: any account)', { body: passwordResetSchema }],
  ['post', '/auth/refresh', 'public', 'Rotate the refresh token'],
  ['post', '/auth/logout', 'public', 'Revoke the refresh token and clear cookies'],
  ['get', '/me', 'any', 'Current user and role'],
  ['patch', '/me', 'any', 'Update name and email', { body: updateMeSchema }],
  ['post', '/me/push-tokens', 'any', 'Register an Expo push token', { body: pushTokenSchema }],
  ['delete', '/me/push-tokens', 'any', 'Remove an Expo push token', { body: pushTokenSchema.pick({ token: true }) }],
  ['get', '/me/payments', 'any', 'Payments, refunds and deposits held'],
  ['get', '/me/notifications', 'any', 'Notification feed'],
  ['get', '/locations', 'public', 'Pickup and return points'],
  ['get', '/vehicle-models', 'public', 'Fleet catalogue with prices'],
  ['get', '/vehicle-models/:slug', 'public', 'Model detail page'],
  ['get', '/availability', 'public', 'Free units per model and, with pickup, a quote', { query: S.availabilityQuerySchema }],
  ['post', '/quotes', 'public', 'Price breakdown (tiers, season, coupon, one-way, GST, deposit)', { body: S.quoteRequestSchema }],
  ['get', '/pricing', 'public', 'Discount tiers, one-way fee and GST for client hints'],
  ['post', '/bookings', 'customer', 'Hold a vehicle (15 min) and return a Razorpay order · Idempotency-Key', { body: S.createBookingSchema }],
  ['get', '/bookings', 'customer', 'My bookings'],
  ['get', '/bookings/:id', 'customer', 'Booking detail and the pending order while unpaid'],
  ['post', '/bookings/:id/coupon', 'customer', 'Add or remove a coupon on an unpaid hold (new order) · Idempotency-Key', { body: z.object({ code: z.string().nullable() }) }],
  ['get', '/bookings/:id/cancel', 'customer', 'Refund this cancellation would give'],
  ['post', '/bookings/:id/cancel', 'customer', 'Cancel and refund according to policy · Idempotency-Key', { body: S.cancelBookingSchema }],
  ['get', '/bookings/:id/extend', 'customer', 'Price and availability of a longer trip', { query: S.extendBookingSchema }],
  ['post', '/bookings/:id/extend', 'customer', 'Extend if the vehicle is free, with a new payment order · Idempotency-Key', { body: S.extendBookingSchema }],
  ['get', '/bookings/:id/handover', 'customer', 'Pickup and return records with 5-minute photo links'],
  ['post', '/bookings/:id/handover/report', 'customer', 'Report a mark missing from the pickup checklist', { body: S.reportMarkSchema }],
  ['post', '/bookings/:id/start', 'customer', 'Sign the agreement and start the ride (CONFIRMED → ONGOING)', { body: S.startRideSchema }],
  ['get', '/bookings/:id/agreement', 'customer', '5-minute link to the signed agreement PDF'],
  ['get', '/bookings/:id/invoice', 'customer', 'Invoice data'],
  ['get', '/bookings/:id/invoice.pdf', 'customer', 'Invoice PDF'],
  ['get', '/bookings/:id/review', 'customer', 'My review of this ride'],
  ['put', '/bookings/:id/review', 'customer', 'Rate the ride', { body: S.reviewSchema }],
  ['post', '/kyc/documents/presign', 'customer', 'Signed upload link for a DL or ID photo', { body: S.presignUploadSchema }],
  ['put', '/files', 'signature', 'Upload a private file through a signed link (STORAGE_DRIVER=local)'],
  ['get', '/files', 'signature', 'Read a private file through a 5-minute signed link (STORAGE_DRIVER=local)'],
  ['post', '/kyc/documents', 'customer', 'Submit an uploaded document (only the last 4 characters are kept)', { body: S.submitDocumentSchema }],
  ['get', '/kyc/documents', 'customer', 'My documents and their review status'],
  ['get', '/payments/config', 'public', 'Runtime public Razorpay key and availability; contains no secrets'],
  ['post', '/payments/verify', 'customer', 'Checkout callback: verify the signature and confirm the payment (same code as the webhook)'],
  ['post', '/webhooks/razorpay', 'signature', 'Payment captured, failed or refunded (HMAC-verified, once per event id)'],
  ['get', '/routes', 'public', 'Ride discovery guides'],
  ['get', '/routes/:slug', 'public', 'One route guide'],
  ['get', '/admin/dashboard', 'staff', "Today's pickups, returns, fleet and alerts"],
  ['get', '/admin/vehicles', 'staff', 'Fleet list with documents and status'],
  ['get', '/admin/vehicles/:id', 'staff', 'Vehicle detail, maintenance and bookings'],
  ['post', '/admin/vehicles', 'admin', 'Add a vehicle', { body: S.createVehicleSchema }],
  ['patch', '/admin/vehicles/:id/status', 'staff', 'Mark ACTIVE, MAINT or RETIRED', { body: S.vehicleStatusSchema }],
  ['post', '/admin/vehicles/:id/maintenance', 'staff', 'Log (or schedule) a service or repair', { body: S.maintenanceSchema }],
  ['post', '/admin/vehicles/:id/documents', 'staff', 'Record RC, insurance, permit or PUC', { body: S.vehicleDocumentSchema }],
  ['get', '/admin/bookings', 'staff', 'Pickup and return calendar', { query: S.calendarQuerySchema }],
  ['get', '/admin/bookings/:id', 'staff', 'Booking with customer, payments, handovers and activity'],
  ['post', '/admin/bookings/:id/cancel', 'staff', 'Cancel by staff, refund by policy · Idempotency-Key', { body: reason }],
  ['post', '/admin/bookings/:id/photos/presign', 'staff', 'Pre-signed URL for a handover photo', { body: z.object({ contentType: z.enum(['image/jpeg', 'image/png', 'image/heic']) }) }],
  ['post', '/admin/bookings/:id/handover', 'staff', 'Pickup: photos, odometer, checks', { body: S.pickupHandoverSchema }],
  ['post', '/admin/bookings/:id/return', 'staff', 'Return: inspection, extra km, late fee, damage, deposit refund · Idempotency-Key', { body: S.returnHandoverSchema }],
  ['get', '/admin/kyc', 'staff', 'Document review queue'],
  ['get', '/admin/kyc/:docId/file', 'staff', '5-minute link to a document file'],
  ['patch', '/admin/kyc/:docId', 'staff', 'Approve or reject a document', { body: S.reviewDocumentSchema }],
  ['get', '/admin/reports/utilisation', 'admin', 'Utilisation by vehicle and model', { query: S.calendarQuerySchema }],
  ['get', '/admin/reports/pnl', 'admin', 'Revenue, expenses, deposits held', { query: S.monthQuerySchema }],
  ['get', '/admin/reports/pnl.csv', 'admin', 'P&L as CSV', { query: S.monthQuerySchema }],
  ['get', '/admin/coupons', 'admin', 'Coupons'],
  ['post', '/admin/coupons', 'admin', 'Create a partner or referral coupon', { body: S.createCouponSchema }],
  ['get', '/admin/pricing-rules', 'admin', 'Duration tiers and seasons'],
  ['post', '/admin/pricing-rules', 'admin', 'Add a tier or season', { body: S.pricingRuleSchema }],
  ['patch', '/admin/pricing-rules/:id', 'admin', 'Change a tier or season', { body: S.pricingRuleSchema }],
  ['delete', '/admin/pricing-rules/:id', 'admin', 'Remove a tier or season'],
  ['patch', '/admin/vehicle-models/:id', 'admin', 'Change day price, deposit or km allowance', { body: S.vehicleModelPriceSchema }],
  ['put', '/admin/vehicle-models/:id/specs', 'staff', 'Replace a model page\'s specs and terrain notes', { body: S.vehicleSpecsSchema }],
  ['get', '/admin/routes', 'staff', 'Route guides (CMS)'],
  ['post', '/admin/routes', 'staff', 'Add a route guide', { body: S.routeGuideInputSchema }],
  ['patch', '/admin/routes/:id', 'staff', 'Edit a route guide', { body: S.routeGuideInputSchema }],
  ['delete', '/admin/routes/:id', 'admin', 'Remove a route guide'],
  ['post', '/investor/calculate', 'public', 'Illustrative schedule (no data stored)', { body: S.investorCalculateSchema }],
  ['get', '/investor/profile', 'investor', 'Masked PAN and bank details'],
  ['patch', '/investor/profile', 'investor', 'Onboarding: PAN and bank account (Phase 4 flag)'],
  ['get', '/investor/investments', 'investor', 'My investments'],
  ['get', '/investor/investments/:id/schedule', 'investor', 'Repayment schedule and status'],
  ['get', '/investor/investments/:id/agreement', 'investor', '5-minute link to the signed agreement'],
  ['get', '/investor/statements/:id.pdf', 'investor', 'Downloadable statement'],
  ['get', '/admin/investors', 'admin', 'Investors'],
  ['post', '/admin/investors', 'admin', 'Add an investor (Phase 4 flag)', { body: S.createInvestorSchema }],
  ['get', '/admin/investments', 'admin', 'All investments'],
  ['post', '/admin/investments/agreement/presign', 'admin', 'Upload URL for a signed agreement PDF (Phase 4 flag)'],
  ['post', '/admin/investments', 'admin', 'Record a signed investment (Phase 4 flag) · Idempotency-Key', { body: S.createInvestmentSchema }],
  ['get', '/admin/repayments', 'admin', 'Instalments due in a month', { query: S.monthQuerySchema }],
  ['post', '/admin/repayments/:id/mark-paid', 'admin', 'Reconcile a transfer · Idempotency-Key', { body: S.markPaidSchema }],
];

export function buildSpec() {
  const registry = new OpenAPIRegistry();
  registry.registerComponent('securitySchemes', 'cookie', { type: 'apiKey', in: 'cookie', name: 'vr_access' });
  registry.registerComponent('securitySchemes', 'bearer', { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' });
  for (const [method, path, auth, summary, req] of OPERATIONS) {
    const params = [...path.matchAll(/:(\w+)/g)].map((m) => m[1]!);
    registry.registerPath({
      method, path: `/api/v1${path.replace(/:(\w+)/g, '{$1}')}`, summary, tags: [path.split('/')[1]!],
      description: `Auth: ${auth}`,
      security: auth === 'public' || auth === 'signature' ? [] : [{ cookie: [] }, { bearer: [] }],
      request: {
        ...(params.length ? { params: z.object(Object.fromEntries(params.map((p) => [p, z.string()]))) } : {}),
        ...(req?.query ? { query: unwrap(req.query) } : {}),
        ...(req?.body ? { body: { content: { 'application/json': { schema: req.body } } } } : {}),
      },
      responses: {
        200: { description: '{ data, meta: { requestId } }' },
        400: { description: '{ error: { code, message } }' },
      },
    });
  }
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: { title: 'Valley Ride API', version: '1.0.0', description: 'REST /api/v1. Money in integer paise; times in UTC.' },
    servers: [{ url: '/' }],
  });
}

let spec: ReturnType<typeof buildSpec> | undefined;
export const docsRouter = Router();
docsRouter.get('/api/docs/openapi.json', (_req, res) => { res.json((spec ??= buildSpec())); });
docsRouter.get('/api/docs', (_req, res) => {
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://cdn.redoc.ly; worker-src blob:");
  res.type('html').send(`<!doctype html><html><head><title>Valley Ride API</title><meta charset="utf-8"/></head>
<body><redoc spec-url="/api/docs/openapi.json"></redoc><script src="https://cdn.jsdelivr.net/npm/redoc@2.1.5/bundles/redoc.standalone.js"></script></body></html>`);
});
