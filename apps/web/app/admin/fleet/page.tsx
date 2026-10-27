'use client';

import type { LocationDTO, VehicleModelDTO } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageTitle, Panel } from '@/components/admin/ui';
import { Icon } from '@/components/brand/icon';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { docLabel, useFleet } from '@/lib/admin';
import { api, ApiError } from '@/lib/api-client';
import { shortName } from '@/lib/bikes';
import { formatDay } from '@/lib/format';
import { useMe } from '@/lib/use-me';
import { cn } from '@/lib/utils';

export default function FleetAdminPage() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data, isError, refetch } = useFleet();
  const [statusError, setStatusError] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [model, setModel] = useState('all');
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const all = useMemo(() => data ?? [], [data]);
  const models = [...new Map(all.map((v) => [v.model.id, v.model.name])).entries()];
  const rows = useMemo(() => all.filter((v) => (model === 'all' || v.model.id === model) && v.registrationNo.toLowerCase().replace(/\s/g, '').includes(q.toLowerCase().replace(/\s/g, ''))), [all, model, q]);
  const out = all.filter((v) => v.onRide).length;
  const maint = all.filter((v) => v.status === 'MAINT').length;
  const available = all.filter((v) => v.status === 'ACTIVE' && !v.onRide).length;

  async function setStatus(id: string, status: string) {
    setStatusError(null); setSavingStatus(id);
    try {
      const r = await api.patch<{ affectedBookings: { code: string }[] }>(`/admin/vehicles/${id}/status`, { status });
      if (r.affectedBookings.length) alert(`This bike has ${r.affectedBookings.length} upcoming booking(s): ${r.affectedBookings.map((b) => b.code).join(', ')}. Move the riders to another unit.`);
      await qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (e) { setStatusError(e instanceof ApiError ? e.message : 'Could not update the vehicle status. Please try again.'); }
    finally { setSavingStatus(null); }
  }

  return (
    <>
      <PageTitle title="Fleet" sub={`${out} on a ride · ${available} available · ${maint} in maintenance`}>
        {me?.role === 'admin' && <Button onClick={() => setAdding(!adding)}><Icon name="plus" size={18} />Add vehicle</Button>}
      </PageTitle>
      {isError && <p role="alert">Could not load the fleet. <button type="button" className="underline" onClick={() => void refetch()}>Try again</button></p>}
      {statusError && <p role="alert" className="text-sm text-orange-ink">{statusError}</p>}
      {adding && <AddVehicle onDone={() => { setAdding(false); qc.invalidateQueries({ queryKey: ['admin', 'vehicles'] }); }} />}
      <div className="flex flex-wrap items-center gap-2.5">
        <div role="group" aria-label="Model" className="flex flex-wrap gap-1 rounded-full bg-surface p-[5px]">
          {[['all', `All ${all.length}`], ...models.map(([id, name]) => [id, `${shortName(name)} · ${all.filter((v) => v.model.id === id).length}`])].map(([id, label]) => (
            <button key={id} type="button" aria-pressed={model === id} onClick={() => setModel(id!)} className={cn('h-10 rounded-full px-4 text-sm', model === id && 'bg-ink text-surface')}>{label}</button>
          ))}
        </div>
        <label className="flex h-[50px] items-center gap-2 rounded-full bg-surface px-4 text-sm text-muted"><Icon name="search" size={18} /><span className="sr-only">Search registration</span>
          <input placeholder="Search registration" value={q} onChange={(e) => setQ(e.target.value)} className="w-44 border-0 bg-transparent text-[15px] text-ink outline-none" /></label>
      </div>
      <section className="overflow-hidden rounded-sheet bg-surface p-2">
        <div className="max-h-[760px] overflow-auto">
          <table className="w-full min-w-[860px] border-collapse text-[15px]">
            <thead><tr className="text-left text-[13px] text-muted">{['Registration', 'Model', 'Home point', 'Now', 'Odometer', 'Documents', 'Status'].map((h) => <th key={h} className={cn('px-4 py-3.5 font-normal', h === 'Odometer' && 'text-right')}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((v) => {
                const soon = v.documents.filter((d) => d.daysLeft !== null && d.daysLeft <= 30).sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0];
                const missing = (['RC', 'INSURANCE', 'PERMIT', 'PUC'] as const).filter((t) => !v.documents.some((d) => d.type === t));
                return (
                  <tr key={v.id} className="border-t border-line">
                    <td className="px-4 py-3"><Link href={`/admin/fleet/${v.id}`} className="font-medium tracking-[0.5px] underline decoration-[#D5D8DC]">{v.registrationNo}</Link></td>
                    <td className="px-4 py-3">{shortName(v.model.name)}</td>
                    <td className="px-4 py-3 text-muted">{v.current?.name ?? v.home.name}<span className="block text-xs">Home: {v.home.name}</span></td>
                    <td className="px-4 py-3"><span className={cn('inline-flex h-7 items-center whitespace-nowrap rounded-full px-2.5 text-[13px]', v.status === 'MAINT' ? 'bg-orange-tint text-orange-ink' : v.onRide ? 'bg-ink text-surface' : 'bg-field')}>
                      {v.status === 'MAINT' ? 'Maintenance' : v.status === 'RETIRED' ? 'Retired' : v.onRide ? 'On a ride' : 'Available'}</span></td>
                    <td className="px-4 py-3 text-right">{v.odometerKm.toLocaleString('en-IN')} km</td>
                    <td className={cn('px-4 py-3', soon || missing.length ? 'text-orange-ink' : 'text-muted')}>
                      {soon ? `${docLabel[soon.type]?.split(' ')[0]} ${soon.daysLeft! < 0 ? 'expired' : 'expires'} ${formatDay(soon.expiresOn!)}` : missing.length ? `${missing.length} missing` : 'All valid'}</td>
                    <td className="px-4 py-2"><label className="sr-only" htmlFor={`st-${v.id}`}>Status for {v.registrationNo}</label>
                      <select id={`st-${v.id}`} value={v.status} disabled={savingStatus === v.id} onChange={(e) => setStatus(v.id, e.target.value)} className="h-10 rounded-full border-0 bg-field px-3 text-sm">
                        <option value="ACTIVE">Active</option><option value="MAINT">Maintenance</option><option value="RETIRED">Retired</option></select></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function AddVehicle({ onDone }: { onDone: () => void }) {
  const models = useQuery({ queryKey: ['models'], queryFn: () => api.get<VehicleModelDTO[]>('/vehicle-models') });
  const locations = useQuery({ queryKey: ['locations'], queryFn: () => api.get<LocationDTO[]>('/locations') });
  const [f, setF] = useState({ vehicleModelId: '', registrationNo: '', homeLocationId: '', odometerKm: '0', purchasedOn: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function save() {
    setError(null); setBusy(true);
    try {
      await api.post('/admin/vehicles', { vehicleModelId: f.vehicleModelId || models.data?.[0]?.id, registrationNo: f.registrationNo, homeLocationId: f.homeLocationId || locations.data?.[0]?.id, odometerKm: Number(f.odometerKm || 0), purchasedOn: f.purchasedOn || undefined });
      onDone();
    } catch (e) { setError(e instanceof ApiError ? (e.details ? 'Check the registration (like UK07 RE 4205).' : e.message) : 'Could not add'); }
    finally { setBusy(false); }
  }
  return (
    <Panel title="Add vehicle">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2.5">
        <label className="label">Model<Select value={f.vehicleModelId} onChange={(e) => setF({ ...f, vehicleModelId: e.target.value })}>{models.data?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</Select></label>
        <label className="label">Registration<Input value={f.registrationNo} onChange={(e) => setF({ ...f, registrationNo: e.target.value.toUpperCase() })} placeholder="UK07 RE 4205" /></label>
        <label className="label">Home point<Select value={f.homeLocationId} onChange={(e) => setF({ ...f, homeLocationId: e.target.value })}>{locations.data?.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></label>
        <label className="label">Odometer (km)<Input inputMode="numeric" value={f.odometerKm} onChange={(e) => setF({ ...f, odometerKm: e.target.value.replace(/\D/g, '') })} /></label>
        <label className="label">Bought on<Input type="date" value={f.purchasedOn} onChange={(e) => setF({ ...f, purchasedOn: e.target.value })} /></label>
      </div>
      {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
      <Button className="self-start" disabled={busy || !f.registrationNo.trim() || !models.data?.length || !locations.data?.length} onClick={save}>{busy ? 'Adding…' : 'Add to fleet'}</Button>
    </Panel>
  );
}
