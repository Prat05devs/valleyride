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
