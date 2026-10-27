'use client';

import type { Quote, VehicleModelDTO } from '@valleyride/shared';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { BIKE_COPY, bikePhoto } from '@/lib/bikes';
import { formatPaise } from '@/lib/format';
import { holdBike } from '@/lib/hold';
import { cn } from '@/lib/utils';
import { CATEGORY_LABEL } from '@/components/fleet/vehicle-card';

export interface Result { model: VehicleModelDTO; free: number; quote: Quote }
type Cat = 'all' | VehicleModelDTO['category'];

/** Filter and sort the free models, then hold one for 15 minutes. */
export function Results({ results, search, summary, tierHint }: {
  results: Result[]; search: { pickup: string; returnTo: string; from: string; to: string }; summary: string; tierHint: string | null;
}) {
  const router = useRouter();
  const [cat, setCat] = useState<Cat>('all');
  const [sort, setSort] = useState<'price-asc' | 'price-desc' | 'km'>('price-asc');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const free = results.filter((r) => r.free > 0);
  const shown = useMemo(() => {
    const list = cat === 'all' ? free : free.filter((r) => r.model.category === cat);
    return [...list].sort((a, b) => (sort === 'km' ? b.quote.kmIncluded - a.quote.kmIncluded : sort === 'price-desc' ? b.quote.totalPaise - a.quote.totalPaise : a.quote.totalPaise - b.quote.totalPaise));
  }, [free, cat, sort]);
  const chips: { id: Cat; label: string }[] = [{ id: 'all', label: 'All bikes' }, { id: 'SCOOTER', label: 'Scooters' }, { id: 'MOTORCYCLE', label: 'Motorcycles' }, { id: 'ADVENTURE', label: 'Adventure' }];

  async function select(r: Result) {
    setBusy(r.model.id); setError(null);
    try {
      const id = await holdBike({ modelId: r.model.id, ...search, expectedPayNowPaise: r.quote.payNowPaise });
      if (id) router.push(`/checkout/${id}`);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not hold the bike'); setBusy(null); }
  }

  return (
    <div className="flex flex-wrap items-start gap-6">
      <aside aria-label="Filters" className="flex min-w-0 flex-[1_1_260px] flex-col gap-4 rounded-sheet bg-surface p-6">
        <span className="text-xl">Filter</span>
        <div className="flex flex-col gap-1.5">
          {chips.map((c) => {
            const n = c.id === 'all' ? free.length : free.filter((r) => r.model.category === c.id).length;
            const on = cat === c.id;
            return (
              <button key={c.id} type="button" aria-pressed={on} onClick={() => setCat(c.id)}
                className={cn('flex h-12 items-center justify-between rounded-full px-[18px] text-left text-[15px]', on ? 'bg-ink text-surface' : 'bg-field text-ink')}>
                {c.label}<span className={on ? '' : 'text-muted'}>{n}</span>
              </button>
            );
          })}
        </div>
        <label className="label">Sort by
          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-12 text-[15px]">
            <option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option><option value="km">Km included</option>
          </Select>
        </label>
        {tierHint && <div className="rounded-[22px] bg-orange-tint px-4 py-3.5 text-sm leading-[1.45] text-orange-ink">{tierHint}</div>}
      </aside>

      <section aria-label="Results" className="flex min-w-0 flex-[999_1_640px] flex-col gap-3.5">
        <span className="text-[15px] text-muted">{shown.length} {shown.length === 1 ? 'model' : 'models'} free · {summary}</span>
        {error && <p role="alert" className="rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
        {shown.length === 0 && <div className="rounded-sheet bg-surface p-8 text-center text-lg">Nothing free for these dates. Try other dates or another pickup point.</div>}
        {shown.map((r) => (
          <div key={r.model.id} className="flex flex-wrap items-center gap-5 rounded-sheet bg-surface p-5">
            <div className="flex h-[170px] min-w-0 flex-[1_1_220px] items-center justify-center rounded-3xl bg-field">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bikePhoto(r.model.slug)} alt={r.model.name} className="h-[150px] w-[88%] object-contain" />
            </div>
            <div className="flex min-w-0 flex-[2_1_240px] flex-col gap-1.5">
              <span className="inline-flex h-7 items-center self-start rounded-full bg-field px-3 text-[13px]">{CATEGORY_LABEL[r.model.category]} · {BIKE_COPY[r.model.slug]?.tag}</span>
              <span className="text-[26px] tracking-[-0.3px]">{r.model.name}</span>
              <span className="text-[15px] text-muted">{r.quote.kmIncluded} km included · {formatPaise(r.model.extraKmPaise)}/km after · {formatPaise(r.model.depositPaise)} deposit</span>
              <span className="text-sm text-orange-ink">{r.free <= 2 ? `Only ${r.free} left` : `${r.free} free`}</span>
            </div>
            <div className="flex min-w-0 flex-[1_1_200px] flex-col items-end gap-1 text-right">
              <span className="text-[28px] font-medium">{formatPaise(r.quote.totalPaise, true)}</span>
              <span className="text-sm text-muted">for {r.quote.days} {r.quote.days === 1 ? 'day' : 'days'}, incl. GST · {formatPaise(r.model.pricePerDayPaise)}/day</span>
              <Button className="mt-2 px-[26px] text-[15px]" disabled={!!busy} onClick={() => select(r)}>{busy === r.model.id ? 'Holding…' : 'Select'}</Button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
