'use client';

import type { VehicleModelDTO } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageTitle, Panel } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';
import { shortName } from '@/lib/bikes';
import { formatDay } from '@/lib/format';

interface Rule { id: string; vehicleModelId: string | null; minDays: number | null; discountPct: number | null; seasonFrom: string | null; seasonTo: string | null; multiplier: number }

/**
 * Prices live in vehicle_models and pricing_rules, so they change here without a deploy. Every quote, hold and
 * extension reads them through the API; changes are audit-logged.
 */
export default function PricingPage() {
  const qc = useQueryClient();
  const models = useQuery({ queryKey: ['models'], queryFn: () => api.get<VehicleModelDTO[]>('/vehicle-models') });
  const rules = useQuery({ queryKey: ['admin', 'pricing-rules'], queryFn: () => api.get<Rule[]>('/admin/pricing-rules') });
  const [error, setError] = useState<string | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin', 'pricing-rules'] }); qc.invalidateQueries({ queryKey: ['models'] }); };
  const run = async (fn: () => Promise<unknown>) => { setError(null); try { await fn(); refresh(); } catch (e) { setError(e instanceof ApiError ? (e.details ? 'Check the values.' : e.message) : 'Could not save'); } };
  const modelName = (id: string | null) => (id ? shortName(models.data?.find((m) => m.id === id)?.name ?? 'model') : 'All models');
  const tiers = (rules.data ?? []).filter((r) => r.minDays !== null).sort((a, b) => (a.vehicleModelId ?? '').localeCompare(b.vehicleModelId ?? '') || a.minDays! - b.minDays!);
  const seasons = (rules.data ?? []).filter((r) => r.seasonFrom !== null);

  if (rules.error) return <><PageTitle title="Pricing" /><p className="rounded-sheet bg-surface p-6">{(rules.error as Error).message}</p></>;
  return (
    <>
      <PageTitle title="Pricing" sub="Day and extra-km prices include 18% GST. Long-rental tiers and seasons. Applies to new quotes straight away; existing bookings keep their price." />
      {error && <p role="alert" className="m-0 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
      <Panel title="Day prices" className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[15px]">
          <thead><tr className="text-left text-[13px] text-muted">{['Model', 'Per day (₹)', 'Deposit (₹)', 'Km per day', 'Extra km (₹)', ''].map((h) => <th key={h} className="p-2.5 font-normal">{h}</th>)}</tr></thead>
          <tbody>{models.data?.map((m) => <ModelRow key={m.id} m={m} onSave={(patch) => run(() => api.patch(`/admin/vehicle-models/${m.id}`, patch))} />)}</tbody>
        </table>
      </Panel>
      <div className="flex flex-wrap items-start gap-4">
        <Panel title="Long-rental tiers" className="flex-[1_1_380px]">
          <p className="m-0 text-sm text-muted">A model&apos;s own tiers replace the all-model tiers for that model.</p>
          {tiers.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-t border-line pt-3 text-[15px]">
              <span className="flex-1">{modelName(r.vehicleModelId)} · {r.minDays}+ days · {r.discountPct}% off</span>
              <Button variant="field" size="sm" onClick={() => run(() => api.delete(`/admin/pricing-rules/${r.id}`))}>Remove</Button>
            </div>
          ))}
          <RuleForm kind="tier" models={models.data ?? []} onSave={(body) => run(() => api.post('/admin/pricing-rules', body))} />
        </Panel>
        <Panel title="Seasons" className="flex-[1_1_380px]">
          <p className="m-0 text-sm text-muted">Multiplies the day price for pickups in the date range (IST). A model&apos;s own season wins.</p>
          {seasons.length === 0 && <p className="m-0 text-muted">No seasons set.</p>}
          {seasons.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-t border-line pt-3 text-[15px]">
              <span className="flex-1">{modelName(r.vehicleModelId)} · {formatDay(r.seasonFrom!)} – {formatDay(r.seasonTo!)} · ×{r.multiplier}</span>
              <Button variant="field" size="sm" onClick={() => run(() => api.delete(`/admin/pricing-rules/${r.id}`))}>Remove</Button>
            </div>
          ))}
          <RuleForm kind="season" models={models.data ?? []} onSave={(body) => run(() => api.post('/admin/pricing-rules', body))} />
        </Panel>
      </div>
    </>
  );
}

function ModelRow({ m, onSave }: { m: VehicleModelDTO; onSave: (p: object) => void }) {
  const r = (p: number) => String(p / 100);
  const [v, setV] = useState({ price: r(m.pricePerDayPaise), deposit: r(m.depositPaise), km: String(m.kmPerDay), extra: r(m.extraKmPaise) });
  const cell = 'h-11 w-28 bg-field';
  const changed = v.price !== r(m.pricePerDayPaise) || v.deposit !== r(m.depositPaise) || v.km !== String(m.kmPerDay) || v.extra !== r(m.extraKmPaise);
  return (
    <tr className="border-t border-line">
      <td className="px-2.5 py-2.5">{m.name}</td>
      {(['price', 'deposit', 'km', 'extra'] as const).map((k) => <td key={k} className="px-2.5 py-2.5"><Input className={cell} inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/[^\d.]/g, '') })} /></td>)}
      <td className="px-2.5 py-2.5"><Button size="sm" disabled={!changed} onClick={() => onSave({ pricePerDayPaise: Math.round(Number(v.price) * 100), depositPaise: Math.round(Number(v.deposit) * 100), kmPerDay: Number(v.km), extraKmPaise: Math.round(Number(v.extra) * 100) })}>Save</Button></td>
    </tr>
  );
}

function RuleForm({ kind, models, onSave }: { kind: 'tier' | 'season'; models: VehicleModelDTO[]; onSave: (b: object) => void }) {
  const [f, setF] = useState({ model: '', minDays: '', pct: '', from: '', to: '', mult: '1.2' });
  const valid = kind === 'tier' ? Number(f.minDays) > 0 && f.pct !== '' : !!f.from && !!f.to && Number(f.mult) > 0;
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-[22px] bg-field p-3">
      <label className="label flex-[1_1_140px] text-[13px]">Model<Select className="h-11 bg-surface" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })}><option value="">All models</option>{models.map((m) => <option key={m.id} value={m.id}>{shortName(m.name)}</option>)}</Select></label>
      {kind === 'tier' ? (<>
        <label className="label w-24 text-[13px]">From days<Input className="h-11 bg-surface" inputMode="numeric" value={f.minDays} onChange={(e) => setF({ ...f, minDays: e.target.value.replace(/\D/g, '') })} /></label>
        <label className="label w-24 text-[13px]">% off<Input className="h-11 bg-surface" inputMode="decimal" value={f.pct} onChange={(e) => setF({ ...f, pct: e.target.value.replace(/[^\d.]/g, '') })} /></label>
      </>) : (<>
        <label className="label text-[13px]">From<Input className="h-11 bg-surface" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></label>
        <label className="label text-[13px]">To<Input className="h-11 bg-surface" type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></label>
        <label className="label w-24 text-[13px]">× price<Input className="h-11 bg-surface" inputMode="decimal" value={f.mult} onChange={(e) => setF({ ...f, mult: e.target.value.replace(/[^\d.]/g, '') })} /></label>
      </>)}
      <Button size="sm" disabled={!valid} onClick={() => onSave(kind === 'tier'
        ? { vehicleModelId: f.model || null, minDays: Number(f.minDays), discountPct: Number(f.pct) }
        : { vehicleModelId: f.model || null, seasonFrom: f.from, seasonTo: f.to, multiplier: Number(f.mult) })}>Add</Button>
    </div>
  );
}
