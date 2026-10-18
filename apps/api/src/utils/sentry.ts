import * as Sentry from '@sentry/node';
import { env } from '../config/env';

/** Sentry for the API and the worker; a no-op until SENTRY_DSN is set. */
export function initSentry(service: 'api' | 'worker') {
  if (!env.SENTRY_DSN) return;
  Sentry.init({ dsn: env.SENTRY_DSN, environment: env.NODE_ENV, tracesSampleRate: 0.1, initialScope: { tags: { service } } });
}

export function captureError(err: unknown, context: Record<string, unknown> = {}) {
  if (env.SENTRY_DSN) Sentry.captureException(err, { extra: context });
}
