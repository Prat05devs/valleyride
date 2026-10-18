import * as Sentry from '@sentry/nextjs';

/** Server-side Sentry (Server Components, route handlers, middleware). No-op until NEXT_PUBLIC_SENTRY_DSN is set. */
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 });
}

export const onRequestError = Sentry.captureRequestError;
