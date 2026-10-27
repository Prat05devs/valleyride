/**
 * Booking windows are entered as IST wall-clock times (datetime-local "YYYY-MM-DDTHH:mm") and sent as UTC ISO strings,
 * whatever the browser's own time zone is.
 */
const IST_MS = 5.5 * 3_600_000;

export const istInputToIso = (v: string) => {
  const d = new Date(`${v}:00+05:30`);
  return Number.isFinite(d.getTime()) ? d.toISOString() : '';
};
export const isoToIstInput = (iso: string) => new Date(new Date(iso).getTime() + IST_MS).toISOString().slice(0, 16);

export function windowError(from: string, to: string, now = Date.now()): string | null {
  const start = Date.parse(istInputToIso(from));
  const end = Date.parse(istInputToIso(to));
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 'Choose pickup and return dates and times.';
  if (start < now) return 'Pickup time has passed. Choose a future pickup.';
  if (end - start < 4 * 3_600_000) return 'Rentals are at least 4 hours. Pick a later return time.';
  return null;
}

/** Add full days to an IST wall-clock input without depending on the browser time zone. */
export function offerReturn(from: string, days: number) {
  const iso = istInputToIso(from);
  return iso ? isoToIstInput(new Date(Date.parse(iso) + days * 86_400_000).toISOString()) : '';
}

/** Tomorrow 9:00 AM IST → +3 days, the default search window (same as the app). */
export function defaultWindow() {
  const nowIst = new Date(Date.now() + IST_MS);
  const day = new Date(Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate() + 1, 9, 0));
  const start = day.toISOString().slice(0, 16);
  const end = new Date(day.getTime() + 3 * 86_400_000).toISOString().slice(0, 16);
  return { from: start, to: end };
}

export interface SearchParams { pickup?: string; return?: string; from?: string; to?: string }

/** Reads /book?pickup&return&from&to (IST inputs), falling back to the defaults. */
export function readSearch(sp: SearchParams, firstLocationId?: string) {
  const d = defaultWindow();
  return {
    pickup: sp.pickup ?? firstLocationId ?? '',
    returnTo: sp.return && sp.return !== sp.pickup ? sp.return : '',
    from: sp.from && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(sp.from) ? sp.from : d.from,
    to: sp.to && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(sp.to) ? sp.to : d.to,
  };
}

export const searchQuery = (s: { pickup: string; returnTo: string; from: string; to: string }) =>
  new URLSearchParams({ pickup: s.pickup, ...(s.returnTo ? { return: s.returnTo } : {}), from: s.from, to: s.to }).toString();
