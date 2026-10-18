/** Ride-time lines from the architecture document's routes table, keyed by route_guides.slug. */
export const ROUTE_META: Record<string, { time?: string; feel: string; kind: 'climb' | 'loop' }> = {
  'dehradun-mussoorie': { time: '1.5 h', feel: 'winding climb, Kempty Falls detour', kind: 'climb' },
  'dehradun-rishikesh': { time: '1.25 h', feel: 'Rajaji forest road', kind: 'climb' },
  'sahastradhara-loop': { time: '40 min', feel: 'sulphur springs, easy ride', kind: 'loop' },
  maldevta: { feel: 'river valley, gravel sections', kind: 'loop' },
};
export const routeLine = (slug: string, km: number) => {
  const m = ROUTE_META[slug];
  return [`${km} km`, m?.time, m?.feel].filter(Boolean).join(' · ');
};
