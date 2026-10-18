import { DURATION_TIERS, type Tier } from '@valleyride/shared';
import { useEffect, useState } from 'react';
import { api } from './api';

let tiersPromise: Promise<Tier[]> | null = null;

/** Discount tiers from GET /pricing (the pricing_rules table), for hints only; charges come from the API's quotes. */
export function useTiers() {
  const [tiers, setTiers] = useState<readonly Tier[]>(DURATION_TIERS);
  useEffect(() => {
    tiersPromise ??= api.get<{ tiers: Tier[] }>('/pricing').then((p) => p.tiers).catch(() => { tiersPromise = null; return [...DURATION_TIERS]; });
    tiersPromise.then(setTiers);
  }, []);
  return tiers;
}

/** "3 days · 10% long-rental discount applied" or "2 days · 1 more for 10% off". `tiers` is longest first. */
export function tierNote(days: number, tiers: readonly Tier[] = DURATION_TIERS) {
  const tier = tiers.find((t) => days >= t.minDays);
  if (tier) return `${days} days · ${tier.pct}% long-rental discount applied`;
  const next = [...tiers].reverse()[0];
  if (!next) return `${days} ${days === 1 ? 'day' : 'days'}`;
  return `${days} ${days === 1 ? 'day' : 'days'} · ${next.minDays - days} more for ${next.pct}% off`;
}
