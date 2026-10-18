'use client';

import { returnCharges } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { PhotoSlots, type Shot } from '@/components/admin/photo-slots';
import { Panel } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminBooking } from '@/lib/admin';
import { api, ApiError } from '@/lib/api-client';
import { newIdempotencyKey } from '@/lib/hold';
import { shortName } from '@/lib/bikes';
import { formatDateTime, formatMinus, formatPaise, formatTime } from '@/lib/format';

interface HandoverView { pickup: { photos: { label: string; url: string }[]; odometerKm: number; damageNotes: string | null } | null }
const PHOTOS = ['Front', 'Left', 'Right', 'Rear', 'Odometer', 'Fuel gauge'];

/** Return inspection: same charge maths as the API (packages/shared returnCharges), then COMPLETED and the deposit refund. */
export default function ReturnPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { data: b } = useAdminBooking(bookingId);
  const hv = useQuery({ queryKey: ['admin', 'handover', bookingId], queryFn: () => api.get<HandoverView>(`/bookings/${bookingId}/handover`) });
  const [odo, setOdo] = useState('');
  const [damage, setDamage] = useState('');
  const [notes, setNotes] = useState('');
  const [noNewDamage, setNoNewDamage] = useState(true);
  const [helmets, setHelmets] = useState(true);
  const [shots, setShots] = useState<Shot[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => new Date());
  const [key] = useState(newIdempotencyKey); // a double click completes the return once
  if (!b || !hv.data) return <Panel>Loading…</Panel>;
  const pickup = hv.data.pickup;
  if (b.status !== 'ONGOING' || !pickup) return <Panel title={`${b.code} is not on a ride`}><Link href={`/admin/bookings/${b.id}`} className="underline">Open the booking</Link></Panel>;

  const odometerEnd = odo === '' ? pickup.odometerKm : Number(odo);
  const damagePaise = Math.round(Number(damage || 0) * 100);
  const c = returnCharges(
    { kmIncluded: b.kmIncluded, endAt: b.endAt, depositPaise: b.depositPaise },
    { extraKmPaise: b.model.extraKmPaise, pricePerDayPaise: b.model.pricePerDayPaise },
    { odometerStartKm: pickup.odometerKm, odometerEndKm: odometerEnd, returnedAt: now, damagePaise },
  );
  const invalid = odometerEnd < pickup.odometerKm || (!noNewDamage && !notes.trim());

  async function complete() {
    setBusy(true); setError(null);
    try {
      await api.post(`/admin/bookings/${bookingId}/return`, {
        odometerKm: odometerEnd, damagePaise, returnedAt: now.toISOString(), photos: shots.map(({ key, label }) => ({ key, label })),
        damageNotes: noNewDamage ? (notes.trim() || undefined) : notes.trim(), checklist: { helmetsReturned: helmets, documentsReturned: helmets },
      }, { idempotencyKey: key });
      qc.invalidateQueries({ queryKey: ['admin'] });
      router.push(`/admin/bookings/${bookingId}`);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not complete the return'); setBusy(false); }
  }

  return (
    <>
      <div><span className="text-sm text-muted">Return · {b.code} · due {formatDateTime(b.endAt)} · returning {formatTime(now)}</span><h1 className="mt-0.5 text-[34px] font-normal tracking-[-0.4px]">{b.customer.name ?? b.customer.phone} · {shortName(b.model.name)} · {b.vehicle.registrationNo}</h1></div>
      <Panel title="Compare with pickup" action={<span className="text-sm text-muted">Pickup photos above, return photos below</span>}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-2 rounded-3xl bg-field p-2.5">
          {pickup.photos.map((p) => (
            <div key={p.url} className="relative h-28 overflow-hidden rounded-[18px] bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`${p.label} at pickup`} className="h-full w-full object-cover" />
              <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[13px]">{p.label}</span>
            </div>
          ))}
        </div>
        {pickup.damageNotes && <p className="m-0 whitespace-pre-line text-sm text-muted">Noted at pickup: {pickup.damageNotes}</p>}
        <PhotoSlots bookingId={bookingId} labels={PHOTOS} value={shots} onChange={setShots} />
        <label className="flex min-h-12 items-center gap-3 rounded-[18px] bg-field px-3.5 text-[15px]"><input type="checkbox" checked={noNewDamage} onChange={() => setNoNewDamage(!noNewDamage)} className="h-[22px] w-[22px] accent-ink" />No new damage beyond what was noted at pickup</label>
        <label className="flex min-h-12 items-center gap-3 rounded-[18px] bg-field px-3.5 text-[15px]"><input type="checkbox" checked={helmets} onChange={() => setHelmets(!helmets)} className="h-[22px] w-[22px] accent-ink" />Helmets and documents returned</label>
        <label className="label">{noNewDamage ? 'Notes (optional)' : 'Describe the new damage'}<Input value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      </Panel>
      <div className="flex flex-wrap items-stretch gap-4">
        <Panel title="Readings and charges" className="flex-[1_1_320px]">
          <label className="label">Odometer at return (km) · pickup was {pickup.odometerKm.toLocaleString('en-IN')}<Input inputMode="numeric" value={odo === '' ? '' : odo} placeholder={String(pickup.odometerKm)} onChange={(e) => setOdo(e.target.value.replace(/\D/g, ''))} /></label>
          <label className="label">Damage charge (₹)<Input inputMode="decimal" value={damage} onChange={(e) => setDamage(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0" /></label>
          <p className="m-0 text-sm text-muted">Late return is charged automatically: {formatPaise(Math.round(b.model.pricePerDayPaise / 8))} per started hour after {formatTime(b.endAt)}, plus GST.</p>
        </Panel>
        <section aria-live="polite" className="flex flex-[1_1_320px] flex-col gap-3 rounded-sheet bg-dark p-6 text-base text-surface">
          <h2 className="m-0 text-xl font-normal">Deposit</h2>
          <Row k="Ridden" v={`${c.kmRidden.toLocaleString('en-IN')} km of ${b.kmIncluded} included`} />
          <Row k={`Extra km ${c.extraKm} × ${formatPaise(b.model.extraKmPaise)} + GST`} v={formatMinus(c.extraKmPaise + c.extraKmTaxPaise)} />
          <Row k="Damage" v={formatMinus(c.damagePaise)} />
          <Row k={`Late return${c.lateHours ? ` · ${c.lateHours} h + GST` : ''}`} v={formatMinus(c.lateFeePaise + c.lateFeeTaxPaise)} />
          <div className="h-px bg-white/[0.18]" />
          <Row k="Deposit held" v={formatPaise(b.depositPaise, true)} />
          <div className="flex items-baseline justify-between"><span>Refund to customer</span><span className="text-[30px] font-medium">{formatPaise(c.refundPaise, true)}</span></div>
          {c.owedPaise > 0 && <span className="text-sm text-[#F9B98A]">Charges exceed the deposit. Collect {formatPaise(c.owedPaise, true)} from the customer.</span>}
        </section>
      </div>
      {odometerEnd < pickup.odometerKm && <p className="m-0 text-sm text-orange-ink">The odometer can&apos;t be below the pickup reading.</p>}
      {error && <p role="alert" className="m-0 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2.5">
        <Link href={`/admin/bookings/${b.id}`} className="inline-flex h-14 items-center rounded-full bg-surface px-[22px]">Back to booking</Link>
        <Button size="lg" className="h-14" disabled={invalid || busy || odo === ''} onClick={complete}>{busy ? 'Completing…' : `Complete return · refund ${formatPaise(c.refundPaise, true)}`}</Button>
      </div>
    </>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between gap-3"><span className="text-white/80">{k}</span><span>{v}</span></div>;
