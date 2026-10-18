'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useState } from 'react';
import { PhotoSlots, type Shot } from '@/components/admin/photo-slots';
import { Panel } from '@/components/admin/ui';
import { Icon } from '@/components/brand/icon';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { useAdminBooking } from '@/lib/admin';
import { api, ApiError } from '@/lib/api-client';
import { shortName } from '@/lib/bikes';
import { formatDateTime, formatTime } from '@/lib/format';

const CHECKS = ['Driving licence matches the uploaded copy and is valid for this bike', 'ID proof matches the customer', 'Customer is the person who booked'];
const PHOTOS = ['Front', 'Left', 'Right', 'Rear', 'Odometer', 'Fuel gauge'];
const FUEL = [['100', 'Full'], ['75', 'About 3/4'], ['50', 'Half'], ['25', 'About 1/4']];

/** Pickup at the desk: staff check originals, take photos and readings; the rider then signs on their phone (→ ONGOING). */
export default function HandoverPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params);
  const qc = useQueryClient();
  const { data: b, refetch } = useAdminBooking(bookingId, (x) => (x?.handovers.some((h) => h.type === 'PICKUP' && !h.signedAt) ? 4000 : false));
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [shots, setShots] = useState<Shot[]>([]);
  const [notes, setNotes] = useState('');
  const [odo, setOdo] = useState<string>('');
  const [fuel, setFuel] = useState('75');
  const [helmets, setHelmets] = useState('2');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!b) return <Panel>Loading…</Panel>;
  const pickup = b.handovers.find((h) => h.type === 'PICKUP');
  const recorded = !!pickup;
  const signed = !!pickup?.signedAt;
  const odometer = odo === '' ? b.vehicle.odometerKm : Number(odo);
  const done = CHECKS.filter((c) => checks[c]).length + PHOTOS.filter((p) => shots.some((s) => s.label === p)).length + (recorded ? 1 : 0);
  const total = CHECKS.length + PHOTOS.length + 1;
  const ready = CHECKS.every((c) => checks[c]) && PHOTOS.every((p) => shots.some((s) => s.label === p)) && Number.isFinite(odometer);

  async function record() {
    setBusy(true); setError(null);
    try {
      await api.post(`/admin/bookings/${bookingId}/handover`, {
        odometerKm: odometer, fuelLevel: Number(fuel), photos: shots.map(({ key, label }) => ({ key, label })),
        damageNotes: [notes.trim(), `Helmets handed over: ${helmets}`].filter(Boolean).join('\n'), licenceChecked: true,
      });
      await refetch();
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not save'); } finally { setBusy(false); }
  }

  if (b.status !== 'CONFIRMED' && !signed) return <Panel title={`${b.code} is ${b.status.toLowerCase().replace('_', ' ')}`}><Link href={`/admin/bookings/${b.id}`} className="underline">Open the booking</Link></Panel>;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><span className="text-sm text-muted">Pickup · {b.code} · {formatDateTime(b.startAt)}</span><h1 className="mt-0.5 text-[34px] font-normal tracking-[-0.4px]">{b.customer.name ?? b.customer.phone} · {shortName(b.model.name)} · {b.vehicle.registrationNo}</h1></div>
        <div className="flex min-w-[220px] flex-col gap-1.5"><span className="text-right text-sm text-muted">{signed ? 'Done' : `${done} of ${total} steps done`}</span><div className="h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded bg-ink" style={{ width: `${signed ? 100 : Math.round(done / total * 100)}%` }} /></div></div>
      </div>
      {signed ? (
        <Panel title="Ride started">
          <div role="status" className="flex items-center gap-2.5 rounded-[20px] bg-field px-4 py-3.5 text-[15px]"><Icon name="check" />Signed by {b.customer.name ?? 'the rider'} at {formatTime(pickup!.signedAt!)}{pickup!.emergencyContact ? ` · emergency contact ${pickup!.emergencyContact.name} (${pickup!.emergencyContact.relationship})` : ''}</div>
          <Link href="/admin" className="inline-flex h-12 items-center self-start rounded-full bg-ink px-6 text-surface">Back to today</Link>
        </Panel>
      ) : recorded ? (
        <Panel title="4 · Agreement">
          <p className="m-0 text-[15px] leading-[1.45] text-muted">Bike recorded at {String(pickup!.odometerKm).padStart(5, '0')} km with {pickup!.photos} photos. Ask {b.customer.name ?? 'the rider'} to open the Valley Ride app: Trips → this booking → Start pickup. They check the photos, sign, and add an emergency contact.</p>
          <div className="flex items-center gap-2.5 rounded-[20px] bg-orange-tint px-4 py-3.5 text-[15px] text-orange-ink"><span className="h-2 w-2 animate-pulse rounded-full bg-orange" />Waiting for the rider to sign on their phone</div>
          <Button variant="field" className="self-start" onClick={() => refetch()}>Check again</Button>
        </Panel>
      ) : (
        <>
          <Panel title="1 · Check the originals">
            {CHECKS.map((c) => (
              <label key={c} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[18px] bg-field px-3.5 text-base">
                <input type="checkbox" checked={!!checks[c]} onChange={() => setChecks({ ...checks, [c]: !checks[c] })} className="h-[22px] w-[22px] accent-ink" />{c}
              </label>
            ))}
            {b.documents.length === 0 && <p className="m-0 text-sm text-orange-ink">This rider has not uploaded any documents. Check the originals carefully.</p>}
          </Panel>
          <Panel title="2 · Pre-ride photos" action={<span className="text-sm text-muted">Take them with the customer present</span>}>
            <PhotoSlots bookingId={bookingId} labels={PHOTOS} value={shots} onChange={setShots} />
            <label className="label">Damage notes<Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Small scratch on the left side panel" /></label>
          </Panel>
          <div className="flex flex-wrap items-stretch gap-4">
            <Panel title="3 · Readings" className="flex-[1_1_300px]">
              <label className="label">Odometer (km)<Input inputMode="numeric" value={odo === '' ? String(b.vehicle.odometerKm) : odo} onChange={(e) => setOdo(e.target.value.replace(/\D/g, ''))} /></label>
              <label className="label">Fuel<Select value={fuel} onChange={(e) => setFuel(e.target.value)}>{FUEL.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></label>
              <label className="label">Helmets handed over<Select value={helmets} onChange={(e) => setHelmets(e.target.value)}><option>1</option><option>2</option></Select></label>
            </Panel>
            <Panel title="4 · Agreement" className="flex-[1_1_300px]">
              <p className="m-0 text-[15px] leading-[1.45] text-muted">The customer signs on their phone once you save this record.</p>
            </Panel>
          </div>
          {error && <p role="alert" className="m-0 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2.5">
            <Link href={`/admin/bookings/${b.id}`} className="inline-flex h-14 items-center rounded-full bg-surface px-[22px]">Back to booking</Link>
            <Button size="lg" className="h-14" disabled={!ready || busy} onClick={record}>{busy ? 'Saving…' : 'Save and send for signing'}</Button>
          </div>
        </>
      )}
    </>
  );
}
