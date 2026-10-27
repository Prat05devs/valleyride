import type { Metadata } from 'next';
import type { AvailabilityDTO, LocationDTO, Tier, VehicleModelDTO } from '@valleyride/shared';
import { Results, type Result } from '@/components/booking/results';
import { SearchForm } from '@/components/booking/search-form';
import { SiteHeader } from '@/components/layout/site-header';
import { api } from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/format';
import { istInputToIso, readSearch, windowError, type SearchParams } from '@/lib/when';

export const metadata: Metadata = { title: 'Available bikes', robots: { index: false } };
export const dynamic = 'force-dynamic';

/** Search results: free units per model for the window and the exact quote (one-way fee included). */
export default async function BookPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const locations = await api.get<LocationDTO[]>('/locations', { next: { revalidate: 3600 } });
  const s = readSearch(await searchParams, locations[0]?.id);
  const startAt = istInputToIso(s.from);
  const endAt = istInputToIso(s.to);
  const invalid = windowError(s.from, s.to);

  let results: Result[] = [];
  if (!invalid) {
    // One call: free units and the API's quote per model (pricing_rules and the one-way fee included).
    const [models, free] = await Promise.all([
      api.get<VehicleModelDTO[]>('/vehicle-models', { next: { revalidate: 300 } }),
      api.get<AvailabilityDTO[]>(`/availability?${new URLSearchParams({ startAt, endAt, pickup: s.pickup, ...(s.returnTo ? { return: s.returnTo } : {}) })}`, { cache: 'no-store' }),
    ]);
    results = models.flatMap((model) => {
      const row = free.find((f) => f.model_id === model.id);
      return row?.quote ? [{ model, free: row.free, quote: row.quote }] : [];
    });
  }
  const tiers = (await api.get<{ tiers: Tier[] }>('/pricing', { next: { revalidate: 300 } })).tiers;
  const days = results[0]?.quote.days ?? 0;
  const next = [...tiers].reverse().find((t) => t.minDays > days);
  const current = tiers.find((t) => days >= t.minDays);
  const tierHint = days === 0 ? null
    : current && next ? `${days} days gets ${current.pct}% off. Add ${next.minDays - days} more ${next.minDays - days === 1 ? 'day' : 'days'} for ${next.pct}%.`
      : current ? `${days} days gets ${current.pct}% off.`
        : next ? `Book ${next.minDays - days} more ${next.minDays - days === 1 ? 'day' : 'days'} for ${next.pct}% off.` : null;
  const pickup = locations.find((l) => l.id === s.pickup);
  const ret = locations.find((l) => l.id === s.returnTo);
  const summary = invalid ? '' : `${pickup?.name ?? ''}${ret ? ` → ${ret.name}` : ''} · ${formatDateTime(startAt)} → ${formatDate(endAt)}`;

  return (
    <div className="pb-20">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 pt-6 sm:px-6">
        <SearchForm key={`${s.pickup}-${s.returnTo}-${s.from}-${s.to}`} variant="bar" locations={locations} initial={s} />
        {invalid ? <div className="rounded-sheet bg-surface p-8 text-lg">{invalid}</div>
          : <Results results={results} search={s} summary={summary} tierHint={tierHint} />}
      </main>
    </div>
  );
}
