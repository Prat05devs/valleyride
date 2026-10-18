import { DISPLAY_TIMEZONE } from '@valleyride/shared';

/** 382001 → ₹3,820.01 ; whole rupees drop the paise. */
export function inr(paise: number, opts: { decimals?: 'auto' | 'always' | 'never' } = {}): string {
  const mode = opts.decimals ?? 'auto';
  const rupees = paise / 100;
  const frac = mode === 'always' || (mode === 'auto' && paise % 100 !== 0) ? 2 : 0;
  return '₹' + rupees.toLocaleString('en-IN', { minimumFractionDigits: frac, maximumFractionDigits: frac });
}

const dateFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: DISPLAY_TIMEZONE });
const timeFmt = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: DISPLAY_TIMEZONE });

export const fmtDate = (d: Date | string) => dateFmt.format(new Date(d));
export const fmtTime = (d: Date | string) => timeFmt.format(new Date(d)).replace('am', 'AM').replace('pm', 'PM');
export const fmtDateTime = (d: Date | string) => `${fmtDate(d)}, ${fmtTime(d)}`;
