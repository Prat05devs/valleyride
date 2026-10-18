'use client';

import type { LocationDTO } from '@valleyride/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/components/brand/icon';
import { cn } from '@/lib/utils';
import { searchQuery } from '@/lib/when';

type Value = { pickup: string; returnTo: string; from: string; to: string };

/** "Find your ride": glass panel over the home hero, or a white bar on the results page. */
export function SearchForm({ locations, initial, variant = 'hero' }: { locations: LocationDTO[]; initial: Value; variant?: 'hero' | 'bar' }) {
  const router = useRouter();
  const [v, setV] = useState<Value>(initial);
  const hero = variant === 'hero';
  const cell = cn('flex min-w-0 flex-col gap-0.5 rounded-[26px] text-[13px] text-muted', hero ? 'bg-surface px-5 py-3' : 'bg-field px-5 py-2.5');
  const control = 'min-w-0 border-0 bg-transparent py-0.5 text-[17px] text-ink outline-none';
  const tooShort = new Date(`${v.to}:00+05:30`).getTime() - new Date(`${v.from}:00+05:30`).getTime() < 4 * 3_600_000;

  return (
    <form aria-label={hero ? 'Find your ride' : 'Change search'}
      onSubmit={(e) => { e.preventDefault(); if (!tooShort) router.push(`/book?${searchQuery(v)}`); }}
      className={cn('grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))]', hero ? 'glass gap-2.5 rounded-hero p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]' : 'gap-2 rounded-hero bg-surface p-2')}>
      <label className={cell}>Pickup location
        <select className={control} value={v.pickup} onChange={(e) => setV({ ...v, pickup: e.target.value, returnTo: v.returnTo === e.target.value ? '' : v.returnTo })}>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </label>
      <label className={cell}>Return location
        <select className={control} value={v.returnTo} onChange={(e) => setV({ ...v, returnTo: e.target.value })}>
          <option value="">Same as pickup</option>
          {locations.filter((l) => l.id !== v.pickup).map((l) => <option key={l.id} value={l.id}>{l.name} (+₹400)</option>)}
        </select>
      </label>
      <label className={cell}>Pickup date &amp; time
        <input type="datetime-local" className={control} value={v.from} step={1800} onChange={(e) => setV({ ...v, from: e.target.value })} required />
      </label>
      <label className={cell}>Return date &amp; time
        <input type="datetime-local" className={control} value={v.to} min={v.from} step={1800} onChange={(e) => setV({ ...v, to: e.target.value })} required />
      </label>
      <button type="submit" disabled={tooShort} title={tooShort ? 'Rentals are at least 4 hours' : undefined}
        className="flex min-h-[58px] items-center justify-center gap-2.5 rounded-[26px] bg-ink text-[17px] text-surface disabled:bg-disabled">
        {hero && <Icon name="search" size={20} />}{hero ? 'Find available rides' : 'Update search'}
      </button>
    </form>
  );
}
