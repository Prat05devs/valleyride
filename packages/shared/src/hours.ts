/** locations.open_hours, e.g. { "mon-sun": "08:00-20:00" } → "Open 8:00 AM – 8:00 PM" (days shown when not every day). */
export function formatOpenHours(h: Record<string, string> | null | undefined): string | null {
  if (!h) return null;
  const t = (hhmm: string) => {
    const [hh, mm] = hhmm.split(':').map(Number) as [number, number];
    return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
  };
  const parts = Object.entries(h).map(([days, range]) => {
    const [from, to] = range.split('-');
    const span = from && to ? `${t(from)} – ${t(to)}` : range;
    return days === 'mon-sun' ? span : `${days.replace('-', '–').replace(/\b\w/g, (c) => c.toUpperCase())} ${span}`;
  });
  return parts.length ? `Open ${parts.join(' · ')}` : null;
}
/** All rental desk times are India wall-clock times, regardless of the device time zone. */
export const IST_OFFSET_MS = 19_800_000;
export const istWallClock = (instant: Date) => new Date(instant.getTime() + IST_OFFSET_MS);
export const fromIstWallClock = (wallClock: Date) => new Date(wallClock.getTime() - IST_OFFSET_MS);
export function defaultRentalWindow(now = new Date()) {
  const wall = istWallClock(now);
  const startAt = fromIstWallClock(new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate() + 1, 9)));
  return { startAt, endAt: new Date(startAt.getTime() + 3 * 86_400_000) };
}

/** Null hours mean no published restriction; a published schedule closes unlisted days. */
export function deskOpenAt(hours: Record<string, string> | null | undefined, instant: Date): boolean {
  if (!hours || !Object.keys(hours).length) return true;
  const wall = istWallClock(instant);
  const day = wall.getUTCDay();
  const names = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const minute = wall.getUTCHours() * 60 + wall.getUTCMinutes();
  return Object.entries(hours).some(([days, range]) => {
    const [first, last = first] = days.toLowerCase().split('-');
    const a = names.indexOf(first!), b = names.indexOf(last!);
    if (a < 0 || b < 0 || !(a <= b ? day >= a && day <= b : day >= a || day <= b)) return false;
    const m = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(range);
    return !!m && minute >= Number(m[1]) * 60 + Number(m[2]) && minute <= Number(m[3]) * 60 + Number(m[4]);
  });
}

