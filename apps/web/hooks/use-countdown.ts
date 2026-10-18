'use client';

import { useEffect, useState } from 'react';

/** Seconds left until `until`, ticking every second; "14:52" text. */
export function useCountdown(until: string | null | undefined) {
  const left = () => (until ? Math.max(0, Math.round((new Date(until).getTime() - Date.now()) / 1000)) : 0);
  const [s, setS] = useState(left);
  useEffect(() => {
    setS(left());
    if (!until) return;
    const h = setInterval(() => setS(left()), 1000);
    return () => clearInterval(h);
  }, [until]); // eslint-disable-line react-hooks/exhaustive-deps
  return { seconds: s, text: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` };
}
