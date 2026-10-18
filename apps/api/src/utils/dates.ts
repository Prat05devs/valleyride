import { DISPLAY_TIMEZONE } from '@valleyride/shared';

/** All timestamps are stored as timestamptz in UTC; this formats them for people in India. */
export function formatIST(d: Date, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }): string {
  return new Intl.DateTimeFormat('en-IN', { ...opts, timeZone: DISPLAY_TIMEZONE }).format(d);
}

export const minutesFromNow = (minutes: number): Date => new Date(Date.now() + minutes * 60_000);
