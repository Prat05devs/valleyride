'use client';

import { MAX_MODEL_PHOTO_BYTES, MODEL_PHOTO_TYPES, VEHICLE_CATEGORIES, type VehicleModelDTO } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageTitle, Panel } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';
import { bikePhoto, shortName } from '@/lib/bikes';
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
  const run = async (fn: () => Promise<unknown>) => { setError(null); try { await fn(); refresh(); return true; } catch (e) { setError(e instanceof ApiError ? (e.details ? 'Check the values.' : e.message) : 'Could not save'); return false; } };
  const modelName = (id: string | null) => (id ? shortName(models.data?.find((m) => m.id === id)?.name ?? 'model') : 'All models');
  const tiers = (rules.data ?? []).filter((r) => r.minDays !== null).sort((a, b) => (a.vehicleModelId ?? '').localeCompare(b.vehicleModelId ?? '') || a.minDays! - b.minDays!);
  const seasons = (rules.data ?? []).filter((r) => r.seasonFrom !== null);

  if (rules.error) return <><PageTitle title="Pricing" /><p className="rounded-sheet bg-surface p-6">{(rules.error as Error).message}</p></>;
  return (
    <>
      <PageTitle title="Pricing" sub="Day and extra-km prices include 18% GST. Long-rental tiers and seasons. Applies to new quotes straight away; existing bookings keep their price." />
      {error && <p role="alert" className="m-0 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
      <Panel title="Models and day prices" className="overflow-x-auto">
        <p className="m-0 text-sm text-muted">Photos: a PNG cut-out with a transparent background looks best (JPEG and WebP work too, up to 3 MB). It replaces the photo on the website and in the app within about five minutes.</p>
        <table className="w-full min-w-[860px] border-collapse text-[15px]">
          <thead><tr className="text-left text-[13px] text-muted">{['Photo', 'Model', 'Per day (₹)', 'Deposit (₹)', 'Km per day', 'Extra km (₹)', ''].map((h) => <th key={h} className="p-2.5 font-normal">{h}</th>)}</tr></thead>
          <tbody>{models.data?.map((m) => <ModelRow key={`${m.id}:${m.pricePerDayPaise}:${m.depositPaise}:${m.kmPerDay}:${m.extraKmPaise}`} m={m}
            onSave={(patch) => run(() => api.patch(`/admin/vehicle-models/${m.id}`, patch))}
            onPhoto={(file) => run(() => (file ? api.upload(`/admin/vehicle-models/${m.id}/photo`, file) : api.delete(`/admin/vehicle-models/${m.id}/photo`)))}
            onError={setError} />)}</tbody>
        </table>
        <AddModel onSave={(body) => run(() => api.post('/admin/vehicle-models', body))} />
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

function ModelRow({ m, onSave, onPhoto, onError }: { m: VehicleModelDTO; onSave: (p: object) => void; onPhoto: (f: File | null) => Promise<boolean>; onError: (e: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    if (!(MODEL_PHOTO_TYPES as readonly string[]).includes(f.type)) return onError('Use a PNG, JPEG or WebP photo.');
    if (f.size > MAX_MODEL_PHOTO_BYTES) return onError('The photo must be under 3 MB.');
    setUploading(true); try { await onPhoto(f); } finally { setUploading(false); }
  };
  const r = (p: number) => String(p / 100);
  const [v, setV] = useState({ price: r(m.pricePerDayPaise), deposit: r(m.depositPaise), km: String(m.kmPerDay), extra: r(m.extraKmPaise) });
  const cell = 'h-11 w-28 bg-field';
  const changed = v.price !== r(m.pricePerDayPaise) || v.deposit !== r(m.depositPaise) || v.km !== String(m.kmPerDay) || v.extra !== r(m.extraKmPaise);
  return (
    <tr className="border-t border-line">
      <td className="px-2.5 py-2.5">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bikePhoto(m)} alt="" className="h-12 w-16 rounded-xl bg-field object-contain" />
          <div className="flex flex-col text-[13px]">
            <label className="cursor-pointer underline">{uploading ? 'Uploading…' : 'Change'}
              <input type="file" accept={MODEL_PHOTO_TYPES.join(',')} className="sr-only" disabled={uploading} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} /></label>
            {m.images[0] && <button type="button" className="text-left text-muted underline" onClick={() => void onPhoto(null)}>Default</button>}
          </div>
        </div>
      </td>
      <td className="px-2.5 py-2.5">{m.name}<span className="block text-xs text-muted">{m.units ?? 0} in the fleet</span></td>
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

const CATEGORY_LABEL: Record<(typeof VEHICLE_CATEGORIES)[number], string> = { SCOOTER: 'Scooter', MOTORCYCLE: 'Motorcycle', ADVENTURE: 'Adventure' };

/** A new model shows on the website and app at once; add its units under Fleet so riders can book it. */
function AddModel({ onSave }: { onSave: (b: object) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const empty = { name: '', category: 'MOTORCYCLE', cc: '', price: '', deposit: '', km: '200', extra: '' };
  const [f, setF] = useState(empty);
  const num = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value.replace(/[^\d.]/g, '') });
  const valid = f.name.trim().length >= 3 && Number(f.cc) >= 50 && Number(f.price) > 0 && f.deposit !== '' && Number(f.km) > 0 && f.extra !== '';
  if (!open) return <Button variant="field" className="self-start" onClick={() => setOpen(true)}>Add a model</Button>;
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-[22px] bg-field p-3">
      <label className="label flex-[2_1_220px] text-[13px]">Name (with brand)<Input className="h-11 bg-surface" placeholder="Bajaj Dominar 400" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="label flex-[1_1_140px] text-[13px]">Type<Select className="h-11 bg-surface" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{VEHICLE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</Select></label>
      <label className="label w-24 text-[13px]">Engine cc<Input className="h-11 bg-surface" inputMode="numeric" value={f.cc} onChange={num('cc')} /></label>
      <label className="label w-28 text-[13px]">Per day (₹)<Input className="h-11 bg-surface" inputMode="decimal" value={f.price} onChange={num('price')} /></label>
      <label className="label w-28 text-[13px]">Deposit (₹)<Input className="h-11 bg-surface" inputMode="decimal" value={f.deposit} onChange={num('deposit')} /></label>
      <label className="label w-24 text-[13px]">Km per day<Input className="h-11 bg-surface" inputMode="numeric" value={f.km} onChange={num('km')} /></label>
      <label className="label w-24 text-[13px]">Extra km (₹)<Input className="h-11 bg-surface" inputMode="decimal" value={f.extra} onChange={num('extra')} /></label>
      <Button size="sm" disabled={!valid} onClick={async () => {
        const ok = await onSave({ name: f.name.trim(), category: f.category, engineCc: Math.round(Number(f.cc)), pricePerDayPaise: Math.round(Number(f.price) * 100),
          depositPaise: Math.round(Number(f.deposit) * 100), kmPerDay: Math.round(Number(f.km)), extraKmPaise: Math.round(Number(f.extra) * 100) });
        if (ok) { setF(empty); setOpen(false); }
      }}>Add model</Button>
      <Button size="sm" variant="field" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}
