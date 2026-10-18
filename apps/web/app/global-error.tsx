'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/** Last-resort error page; reports the crash to Sentry. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="en-IN">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#ECEEF0', display: 'grid', placeItems: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontWeight: 400 }}>Something went wrong</h1>
          <button type="button" onClick={reset} style={{ height: 48, padding: '0 24px', borderRadius: 999, border: 0, background: '#000', color: '#fff' }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
