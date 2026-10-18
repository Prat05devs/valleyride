import * as Sentry from '@sentry/nextjs';

/** Browser Sentry; no-op until NEXT_PUBLIC_SENTRY_DSN is set. */
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0.1 });
}
