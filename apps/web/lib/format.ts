import { DISPLAY_TIMEZONE } from '@valleyride/shared';

const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 64900 → ₹649; with exact, always two decimals (₹8,820.01) as on price breakdowns. */
export const formatPaise = (paise: number, exact = false) => (exact ? inr2 : inr0).format(paise / 100);
/** −₹359.70 style for deductions. */
export const formatMinus = (paise: number) => (paise ? '−' : '') + inr2.format(Math.abs(paise) / 100);

const tz = { timeZone: DISPLAY_TIMEZONE } as const;
/** Stored in UTC, shown in Asia/Kolkata: "Fri 23 Oct, 9:00 AM". */
export const formatDateTime = (d: Date | string) =>
  `${formatDate(d)}, ${new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, ...tz }).format(new Date(d)).replace('am', 'AM').replace('pm', 'PM')}`;
export const formatDate = (d: Date | string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', ...tz }).format(new Date(d)).replace(',', '');
export const formatTime = (d: Date | string) =>
  new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, ...tz }).format(new Date(d)).replace('am', 'AM').replace('pm', 'PM');
export const formatDay = (d: Date | string) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', ...tz }).format(new Date(d));

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
/** "four models", as in running copy; numbers above ten stay digits. */
export const countWord = (n: number) => WORDS[n] ?? String(n);
