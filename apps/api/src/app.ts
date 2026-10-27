import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { requestId } from './middleware/requestId';
import { rateLimiter } from './middleware/rateLimit';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiRouter } from './routes';
import { paymentWebhookRouter } from './modules/payment/payment.webhook';
import { env } from './config/env';
import { docsRouter } from './docs/openapi';
import { readiness } from './health';

export const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
app.use('/api/v1/webhooks', paymentWebhookRouter);         // needs the raw body for the HMAC check, so it goes before express.json()
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestId);
app.use('/api/v1', rateLimiter, apiRouter);
// Route-guide photos and other editorial images. Served cross-origin so the website and app can show them.
app.use('/static', express.static(path.join(__dirname, '../public'), {
  maxAge: '7d', index: false, fallthrough: true,
  setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
}));
app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/ready', readiness);
if (env.NODE_ENV !== 'production') app.use(docsRouter);      // OpenAPI from the Zod schemas: /api/docs (not public in production)
app.use(notFound);
app.use(errorHandler);
