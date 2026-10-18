'use client';

import type { VehicleModelDTO } from '@valleyride/shared';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { VehicleCard } from './vehicle-card';

const CHIPS = [
  { id: 'all', label: 'All' }, { id: 'SCOOTER', label: 'Scooters' }, { id: 'MOTORCYCLE', label: 'Motorcycles' }, { id: 'ADVENTURE', label: 'Adventure' },
] as const;

export function FleetGrid({ models, title, sub }: { models: VehicleModelDTO[]; title: React.ReactNode; sub: string }) {
  const [cat, setCat] = useState<(typeof CHIPS)[number]['id']>('all');
  const shown = cat === 'all' ? models : models.filter((m) => m.category === cat);
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>{title}<p className="mt-2 text-lg text-muted">{sub}</p></div>
        <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-1.5 rounded-full bg-surface p-[5px]">
          {CHIPS.filter((c) => c.id === 'all' || models.some((m) => m.category === c.id)).map((c) => (
            <button key={c.id} type="button" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}
              className={cn('h-11 rounded-full px-5 text-[15px]', cat === c.id ? 'bg-ink text-surface' : 'bg-transparent text-ink')}>{c.label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(560px,100%),1fr))] gap-4">
        {shown.map((m) => <VehicleCard key={m.id} model={m} />)}
      </div>
    </>
  );
}
