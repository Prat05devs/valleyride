'use client';

import type { BookingDTO, LocationDTO } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useState } from 'react';
import { Panel } from '@/components/admin/ui';
import { Icon } from '@/components/brand/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { docLabel, type FleetVehicle } from '@/lib/admin';
import { api, ApiError } from '@/lib/api-client';
import { bikePhoto } from '@/lib/bikes';
import { useMe } from '@/lib/use-me';
import { formatDate, formatDay, formatPaise } from '@/lib/format';

type Detail = FleetVehicle & {
  maintenance: { id: string; type: 'SERVICE' | 'REPAIR'; odometerKm: number; costPaise: number; performedOn: string; notes: string | null }[];
  bookings: (BookingDTO & { customer: string | null })[];
};
const DOCS = ['RC', 'INSURANCE', 'PERMIT', 'PUC'] as const;

export default function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { data: me } = useMe();
  const points = useQuery({ queryKey: ['locations'], queryFn: () => api.get<LocationDTO[]>('/locations') });
  const [transfer, setTransfer] = useState({ locationId: '', reason: '' });
  const [transferring, setTransferring] = useState(false);
  const { data: v, refetch } = useQuery({ queryKey: ['admin', 'vehicle', id], queryFn: () => api.get<Detail>(`/admin/vehicles/${id}`) });
  const today = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 10);
  const [m, setM] = useState({ type: 'SERVICE', odometerKm: '', costRupees: '', performedOn: today, notes: '' });
  const [docEdit, setDocEdit] = useState<{ type: string; number: string; expiresOn: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!v) return <Panel>Loading…</Panel>;
  const upcoming = v.bookings.filter((b) => ['PENDING_PAYMENT', 'CONFIRMED', 'ONGOING'].includes(b.status) && new Date(b.endAt) > new Date()).reverse();

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try { await fn(); await refetch(); qc.invalidateQueries({ queryKey: ['admin', 'vehicles'] }); }
    catch (e) { setError(e instanceof ApiError ? (e.details ? 'Check the fields and try again.' : e.message) : 'Something went wrong'); }
  };

  return (
    <>
      <Link href="/admin/fleet" className="inline-flex h-10 items-center gap-2 self-start text-[15px]"><Icon name="back" size={18} />Fleet</Link>
      <section className="flex flex-wrap items-center gap-5 rounded-sheet bg-surface p-5">
        <span className="flex h-[150px] flex-[1_1_220px] items-center justify-center rounded-3xl bg-field">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bikePhoto(v.model.slug)} alt={v.model.name} className="h-[130px] w-[88%] object-contain" />
        </span>
        <div className="flex min-w-0 flex-[2_1_300px] flex-col gap-1.5">
          <h1 className="m-0 text-[34px] font-medium tracking-[1px]">{v.registrationNo}</h1>
          <span className="text-base text-muted">Current hub: {v.current?.name ?? v.home.name}</span>
          <span className="text-base text-muted">{v.model.name} · home {v.home.name}{v.purchasedOn ? ` · bought ${formatDay(v.purchasedOn)}` : ''}</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            <Badge>{v.status === 'ACTIVE' ? 'Active' : v.status === 'MAINT' ? 'Maintenance' : 'Retired'}</Badge>
            <Badge>{v.odometerKm.toLocaleString('en-IN')} km</Badge>
            {v.onRide && <Badge variant="ink">On a ride · {v.onRide.code}</Badge>}
          </div>
        </div>
        <label className="label flex-[1_1_180px]">Status
          <Select value={v.status} onChange={(e) => run(() => api.patch(`/admin/vehicles/${id}/status`, { status: e.target.value }))}>
            <option value="ACTIVE">Active</option><option value="MAINT">Maintenance</option><option value="RETIRED">Retired</option></Select></label>
      </section>
      {error && <p role="alert" className="m-0 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
      {me?.role === 'admin' && <Panel title="Record a physical hub transfer">
        <p className="m-0 text-sm text-muted">Record the destination after moving the bike. Active reservations must be finished or cancelled first.</p>
        <label className="label">Destination hub<Select value={transfer.locationId} onChange={(e) => setTransfer({ ...transfer, locationId: e.target.value })}><option value="">Choose a hub</option>{points.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></label>
        <label className="label">Transfer note<Input value={transfer.reason} onChange={(e) => setTransfer({ ...transfer, reason: e.target.value })} /></label>
        <Button disabled={transferring || !transfer.locationId || transfer.reason.trim().length < 3} onClick={async () => { setTransferring(true); await run(() => api.patch(`/admin/vehicles/${id}/location`, transfer)); setTransferring(false); }}>Save current hub</Button>
      </Panel>}
      <div className="flex flex-wrap items-start gap-4">
        <Panel title="Documents" className="flex-[999_1_420px] py-2">
          {DOCS.map((t) => {
            const d = v.documents.find((x) => x.type === t);
            const warn = d?.daysLeft !== null && d?.daysLeft !== undefined && d.daysLeft <= 30;
            return (
              <div key={t} className="flex flex-col gap-2.5 border-t border-line py-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex-[1_1_160px]"><span className="block">{docLabel[t]}</span>
                    <span className={`text-sm ${!d || warn ? 'text-orange-ink' : 'text-muted'}`}>{d ? `${d.number}${d.expiresOn ? ` · ${d.daysLeft! < 0 ? 'expired' : 'expires'} ${formatDay(d.expiresOn)}` : ''}` : 'Not recorded'}</span></span>
                  <Button variant="field" size="sm" onClick={() => setDocEdit({ type: t, number: d?.number ?? '', expiresOn: d?.expiresOn ?? '' })}>{d ? 'Renew' : 'Add'}</Button>
                </div>
                {docEdit?.type === t && (
                  <div className="flex flex-wrap items-end gap-2 rounded-[22px] bg-field p-3">
                    <label className="label flex-[1_1_160px]">Number<Input className="bg-surface" value={docEdit.number} onChange={(e) => setDocEdit({ ...docEdit, number: e.target.value })} /></label>
                    <label className="label flex-[1_1_140px]">Expires on<Input className="bg-surface" type="date" value={docEdit.expiresOn} onChange={(e) => setDocEdit({ ...docEdit, expiresOn: e.target.value })} /></label>
                    <Button size="sm" disabled={docEdit.number.trim().length < 2} onClick={() => run(async () => { await api.post(`/admin/vehicles/${id}/documents`, { type: t, number: docEdit.number, expiresOn: docEdit.expiresOn || undefined }); setDocEdit(null); })}>Save</Button>
                  </div>
                )}
              </div>
            );
          })}
        </Panel>
        <Panel title="Upcoming bookings" className="flex-[1_1_320px]">
          {upcoming.length === 0 && <p className="m-0 text-muted">None.</p>}
          {upcoming.map((b) => (
            <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex justify-between gap-2.5 rounded-[20px] bg-field p-3.5 text-[15px]">
              <span><span className="block">{b.code} · {b.customer ?? ''}</span><span className="text-sm text-muted">{formatDate(b.startAt)} → {formatDate(b.endAt)}</span></span>
              <span className="text-sm text-muted">{b.status === 'ONGOING' ? 'On ride' : b.status === 'PENDING_PAYMENT' ? 'Unpaid hold' : 'Confirmed'}</span>
            </Link>
          ))}
        </Panel>
      </div>
      <Panel title="Maintenance">
        <form aria-label="Log a service or repair" className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-2.5 rounded-3xl bg-field p-3.5"
          onSubmit={(e) => { e.preventDefault(); run(async () => { await api.post(`/admin/vehicles/${id}/maintenance`, { type: m.type, odometerKm: Number(m.odometerKm || v.odometerKm), costPaise: Math.round(Number(m.costRupees || 0) * 100), performedOn: m.performedOn, notes: m.notes || undefined }); setM({ ...m, costRupees: '', notes: '' }); }); }}>
          <label className="label text-[13px]">Type<Select className="h-[46px] bg-surface" value={m.type} onChange={(e) => setM({ ...m, type: e.target.value })}><option value="SERVICE">Service</option><option value="REPAIR">Repair</option></Select></label>
          <label className="label text-[13px]">Odometer (km)<Input className="h-[46px] bg-surface" inputMode="numeric" placeholder={String(v.odometerKm)} value={m.odometerKm} onChange={(e) => setM({ ...m, odometerKm: e.target.value.replace(/\D/g, '') })} /></label>
          <label className="label text-[13px]">Cost (₹)<Input className="h-[46px] bg-surface" inputMode="decimal" placeholder="0" value={m.costRupees} onChange={(e) => setM({ ...m, costRupees: e.target.value.replace(/[^\d.]/g, '') })} /></label>
          <label className="label text-[13px]">Date (future = schedule it)<Input className="h-[46px] bg-surface" type="date" value={m.performedOn} onChange={(e) => setM({ ...m, performedOn: e.target.value })} /></label>
          <label className="label col-span-full text-[13px]">Notes<Input className="h-[46px] bg-surface" placeholder="What was done" value={m.notes} onChange={(e) => setM({ ...m, notes: e.target.value })} /></label>
          <Button type="submit" size="sm" className="col-span-full justify-self-start">Save entry</Button>
        </form>
        {v.maintenance.map((r) => (
          <div key={r.id} className="flex flex-wrap justify-between gap-2.5 border-t border-line px-1 py-3 text-[15px]"><span>{r.performedOn > today && <span className="mr-2 rounded-full bg-orange-tint px-2 py-0.5 text-[13px] text-orange-ink">Scheduled</span>}{r.type === 'SERVICE' ? 'Service' : 'Repair'}{r.notes ? ` · ${r.notes}` : ''}</span><span className="text-muted">{formatDay(r.performedOn)} · {r.odometerKm.toLocaleString('en-IN')} km · {formatPaise(r.costPaise)}</span></div>
        ))}
      </Panel>
    </>
  );
}
