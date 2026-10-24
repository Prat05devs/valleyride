'use client';

import { formatOpenHours, type BookingDTO, type CancellationRefund, type CustomerDocumentDTO, type HandoverDTO, type Quote } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { MapArt } from '@/components/brand/art';
import { Icon } from '@/components/brand/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api-client';
import { bikePhoto } from '@/lib/bikes';
import { formatDateTime, formatMinus, formatPaise, formatTime } from '@/lib/format';
import { newIdempotencyKey } from '@/lib/hold';
import { payOrder } from '@/lib/pay';
import { pickupIn, STATUS_LABEL, useCatalog } from '@/lib/use-catalog';
import { useMe } from '@/lib/use-me';
import { cn } from '@/lib/utils';
import { istInputToIso, isoToIstInput } from '@/lib/when';

interface HandoverView { registrationNo: string | null; pickup: HandoverDTO | null; return: HandoverDTO | null }
const DESK = process.env.NEXT_PUBLIC_DESK_PHONE;

export function BookingDetail({ id }: { id: string }) {
  const qc = useQueryClient();
  const justBooked = useSearchParams().get('confirmed') === '1';
  const { data: me } = useMe();
  const { model, location } = useCatalog();
  const [extending, setExtending] = useState<'confirming' | null>(null);
  const booking = useQuery({
    queryKey: ['booking', id], queryFn: () => api.get<BookingDTO>(`/bookings/${id}`),
    refetchInterval: (q) => (extending || q.state.data?.status === 'COMPLETED' ? 3000 : false),
  });
  const b = booking.data;
  const live = !!b && !['PENDING_PAYMENT', 'EXPIRED', 'CANCELLED'].includes(b.status);
  const handover = useQuery({ queryKey: ['handover', id], enabled: live, queryFn: () => api.get<HandoverView>(`/bookings/${id}/handover`) });
  const docs = useQuery({ queryKey: ['kyc'], queryFn: () => api.get<CustomerDocumentDTO[]>('/kyc/documents') });

  const onExtended = useCallback(() => { setExtending(null); qc.invalidateQueries({ queryKey: ['handover', id] }); }, [qc, id]);

  if (booking.error) return <div className="rounded-sheet bg-surface p-8 text-lg">Booking not found. <Link href="/account/bookings" className="underline">Back to My bookings</Link></div>;
  if (!b) return <div className="rounded-sheet bg-surface p-8">Loading…</div>;
  const m = model(b.vehicleModelId);
  const pickup = location(b.pickupLocationId);
  const ret = location(b.returnLocationId);
  const step = { CONFIRMED: 1, ONGOING: 2, COMPLETED: 3, DEPOSIT_SETTLED: 4 }[b.status as string] ?? 0;
  const closed = b.status === 'CANCELLED' || b.status === 'EXPIRED';
  const r = handover.data?.return;
  const c = r?.charges;
  const dl = docs.data?.find((d) => d.type === 'DL');
  const idDoc = docs.data?.find((d) => d.type !== 'DL');

  return (
    <div className="flex flex-col gap-5">
      <Link href="/account/bookings" className="inline-flex h-11 items-center gap-2 self-start text-[15px]"><Icon name="back" size={18} />My bookings</Link>
      {justBooked && b.status === 'CONFIRMED' && (
        <div className="flex items-center gap-3 rounded-card bg-ink p-5 text-surface"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange text-ink"><Icon name="check" strokeWidth={2} /></span>
          <span><span className="block text-xl">You&apos;re booked</span><span className="text-sm text-white/80">Bring your original driving licence and ID to pickup.</span></span></div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="m-0 text-[44px] font-normal tracking-[1px]">{b.code}</h1>
        <Badge variant={closed ? 'default' : 'ink'} className="h-[34px] text-[15px]">{STATUS_LABEL[b.status]}</Badge>
        {b.status === 'CONFIRMED' && <span className="text-base text-orange-ink">{pickupIn(b.startAt)}</span>}
        {b.status === 'ONGOING' && <span className="text-base text-orange-ink">Return by {formatDateTime(b.endAt)}</span>}
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <section className="flex flex-wrap items-center gap-5 rounded-sheet bg-surface p-6">
            <span className="flex h-40 flex-[1_1_220px] items-center justify-center rounded-3xl bg-field">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m && <img src={bikePhoto(m.slug)} alt={m.name} className="h-[140px] w-[88%] object-contain" />}
            </span>
            <div className="flex min-w-0 flex-[2_1_280px] flex-col gap-2">
              <span className="text-[26px]">{m?.name}{handover.data?.registrationNo ? ` · ${handover.data.registrationNo}` : ''}</span>
              <span className="text-base text-muted">{formatDateTime(b.startAt)} → {formatDateTime(b.endAt)}</span>
              <span className="text-base text-muted">{b.kmIncluded} km included{m ? ` · ${formatPaise(m.extraKmPaise)}/km after` : ''}</span>
            </div>
          </section>

          {!closed && step > 0 && <Progress step={step} />}

          {b.status === 'CONFIRMED' && (
            <section className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3.5 rounded-sheet bg-surface p-7">
              <h2 className="col-span-full m-0 text-2xl font-normal">Before pickup</h2>
              <DocTile label="Driving licence" d={dl} />
              <DocTile label="ID proof" d={idDoc} />
              <div className="flex items-center gap-3 rounded-[22px] bg-field p-4">{handover.data?.pickup ? 'Sign the agreement in the app at the desk' : 'Sign the agreement at pickup'}</div>
              <div className="flex items-center gap-3 rounded-[22px] bg-field p-4">Pre-ride photos taken by staff</div>
            </section>
          )}

          {(b.status === 'COMPLETED' || b.status === 'DEPOSIT_SETTLED') && r && c && (
            <section className="flex flex-col gap-4 rounded-sheet bg-surface p-7">
              <h2 className="m-0 text-2xl font-normal">Ride complete</h2>
              <div className="grid grid-cols-2 gap-4 rounded-card bg-dark p-6 text-surface">
                <div><div className="text-[32px] font-medium">{c.kmRidden} km</div><div className="text-sm text-white/80">ridden in {b.billableDays} {b.billableDays === 1 ? 'day' : 'days'}</div></div>
                <div><div className="text-[32px] font-medium">{formatTime(r.at)}</div><div className="text-sm text-white/80">returned, {c.lateHours ? `${c.lateHours} h late` : 'on time'}</div></div>
              </div>
              <Line label="Deposit held" value={formatPaise(b.depositPaise, true)} />
              <Line label={`Extra km${c.extraKm ? ` · ${c.extraKm} km, incl. GST` : ''}`} value={formatMinus(c.extraKmPaise + c.extraKmTaxPaise)} />
              <Line label={`Late return${c.lateHours ? ` · ${c.lateHours} h, incl. GST` : ''}`} value={formatMinus(c.lateFeePaise + c.lateFeeTaxPaise)} />
              {c.damagePaise > 0 && <Line label="Damage" value={formatMinus(c.damagePaise)} />}
              <div className="h-px bg-line" />
              <div className="flex items-baseline justify-between"><span className="text-lg">{b.status === 'DEPOSIT_SETTLED' ? 'Refunded to you' : 'Refunding to you'}</span><span className="text-2xl font-medium">{formatPaise(c.refundPaise, true)}</span></div>
              {c.owedPaise > 0 && <p className="m-0 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">Charges are {formatPaise(c.owedPaise, true)} more than the deposit. Our team will contact you.</p>}
            </section>
          )}

          {pickup && !closed && (
            <section className="flex flex-wrap items-center gap-[18px] rounded-sheet bg-surface p-[18px]">
              <div className="min-w-0 flex-[1_1_300px] overflow-hidden rounded-3xl"><MapArt height={180} /></div>
              <div className="flex flex-[1_1_260px] flex-col gap-2 p-1.5">
                <span className="text-[22px]">{b.status === 'ONGOING' ? `Return to ${ret?.name ?? pickup.name}` : pickup.name}</span>
                <span className="text-base text-muted">{[(b.status === 'ONGOING' ? ret ?? pickup : pickup).address, formatOpenHours((b.status === 'ONGOING' ? ret ?? pickup : pickup).openHours)?.replace('Open ', 'open ')].filter(Boolean).join(' · ')}</span>
                <span className="mt-1.5 flex gap-2.5">
                  <a className="inline-flex h-12 items-center rounded-full bg-ink px-[22px] text-[15px] text-surface" target="_blank" rel="noreferrer"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickup.lat != null ? `${pickup.lat},${pickup.lng}` : `${pickup.name}, ${pickup.address}`)}`}>Directions</a>
                  {DESK && <a className="inline-flex h-12 items-center rounded-full bg-field px-[22px] text-[15px]" href={`tel:${DESK}`}>Call desk</a>}
                </span>
              </div>
            </section>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
          {!closed && b.status !== 'PENDING_PAYMENT' && (
            <section className="flex flex-col gap-3 rounded-sheet bg-surface p-7 text-base">
              <h2 className="m-0 mb-1 text-2xl font-normal">Payment</h2>
              <Line label="Rental total" value={formatPaise(b.totalPaise - b.depositPaise, true)} />
              <Line label="Deposit held" value={formatPaise(b.depositPaise, true)} />
              <div className="h-px bg-line" />
              <Line label="Paid" value={formatPaise(b.totalPaise, true)} strong />
              <Link href={`/account/bookings/${b.id}/invoice`} className="mt-1.5 flex h-[50px] items-center justify-center gap-2 rounded-full bg-field text-[15px]"><Icon name="download" size={18} />{b.status === 'COMPLETED' || b.status === 'DEPOSIT_SETTLED' ? 'Final invoice' : 'Invoice'}</Link>
              {handover.data?.pickup?.signedAt && (
                <button type="button" onClick={async () => { const r = await api.get<{ url: string }>(`/bookings/${b.id}/agreement`).catch(() => null); if (r) window.open(r.url, '_blank', 'noopener'); }}
                  className="flex h-[50px] items-center justify-center gap-2 rounded-full bg-field text-[15px]"><Icon name="doc" size={18} />Signed agreement</button>
              )}
            </section>
          )}
          {b.status === 'PENDING_PAYMENT' && <Link href={`/checkout/${b.id}`} className="flex h-14 items-center justify-center rounded-full bg-ink text-surface">Finish paying</Link>}
          {(b.status === 'CONFIRMED' || b.status === 'ONGOING') && (
            <Change booking={b} phone={me?.phone} onPaid={() => setExtending('confirming')} onDone={onExtended} confirming={!!extending} />
          )}
          {closed && <Link href="/book" className="flex h-14 items-center justify-center rounded-full bg-ink text-surface">Book again</Link>}
        </aside>
      </div>
    </div>
  );
}

function Change({ booking: b, phone, onPaid, onDone, confirming }: { booking: BookingDTO; phone?: string; onPaid: () => void; onDone: () => void; confirming: boolean }) {
  const qc = useQueryClient();
  const [to, setTo] = useState(isoToIstInput(new Date(new Date(b.endAt).getTime() + 86_400_000).toISOString()));
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endAt = to ? istInputToIso(to) : '';
  const later = !!endAt && new Date(endAt) > new Date(b.endAt);
  const preview = useQuery({
    queryKey: ['extend', b.id, endAt], enabled: later,
    queryFn: () => api.get<{ available: boolean; quote: Quote; payPaise: number }>(`/bookings/${b.id}/extend?endAt=${encodeURIComponent(endAt)}`),
  });
  const p = preview.data;
  useEffect(() => { if (confirming && b.endAt === endAt) onDone(); }, [confirming, b.endAt, endAt, onDone]);

  async function extend() {
    setBusy(true); setError(null);
    try {
      const res = await api.post<{ razorpayOrderId: string | null; payPaise: number }>(`/bookings/${b.id}/extend`, { endAt }, { idempotencyKey: newIdempotencyKey() });
      if (!res.razorpayOrderId) { qc.invalidateQueries({ queryKey: ['booking', b.id] }); return; }
      await payOrder({
        orderId: res.razorpayOrderId, amountPaise: res.payPaise, bookingCode: b.code, phone,
        onPaid: (result) => {
          if (!result?.paymentRefunded) return onPaid();
          setError('Someone booked your bike for that time while you were paying, so your trip was not extended. We are refunding the full amount to the UPI or card you paid with; refunds usually take 5–7 working days.');
          qc.invalidateQueries({ queryKey: ['booking', b.id] });
        },
        onFailed: (r) => setError(`${r} Your trip was not changed.`),
      });
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not extend'); } finally { setBusy(false); }
  }

  return (
    <section className="flex flex-col gap-3 rounded-sheet bg-surface p-7">
      <h2 className="m-0 text-2xl font-normal">Need a change?</h2>
      <label className="label">Extend the return to<input type="datetime-local" step={1800} min={isoToIstInput(b.endAt)} value={to} onChange={(e) => setTo(e.target.value)} className="field h-[54px]" /></label>
      {p && <span className={cn('text-sm', p.available ? 'text-muted' : 'text-orange-ink')}>{p.available ? `${b.billableDays} → ${p.quote.days} days · ${b.kmIncluded} → ${p.quote.kmIncluded} km` : 'Your bike is booked by someone else for that time.'}</span>}
      {error && <p role="alert" className="m-0 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
      <Button className="h-[54px]" disabled={!p || !p.available || busy || confirming} onClick={extend}>
        {confirming ? 'Confirming payment…' : p ? (p.payPaise ? `Extend · pay ${formatPaise(p.payPaise, true)}` : 'Extend, no extra charge') : 'Extend'}
      </Button>
      {b.status === 'CONFIRMED' && <button type="button" onClick={() => setCancelOpen(true)} className="flex h-11 items-center justify-center text-[15px] underline">Cancel booking</button>}
      {cancelOpen && <CancelDialog booking={b} onClose={() => setCancelOpen(false)} />}
    </section>
  );
}

const REASONS = ['Plans changed', 'Weather', 'Found another ride', 'Something else'];

function CancelDialog({ booking: b, onClose }: { booking: BookingDTO; onClose: () => void }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(newIdempotencyKey);
  const preview = useQuery({ queryKey: ['cancel', b.id], queryFn: () => api.get<{ cancellable: boolean; refund: CancellationRefund | null }>(`/bookings/${b.id}/cancel`) });
  const r = preview.data?.refund;
  async function confirm() {
    setBusy(true); setError(null);
    try { await api.post(`/bookings/${b.id}/cancel`, { reason: reason ?? undefined }, { idempotencyKey: key }); await qc.invalidateQueries({ queryKey: ['booking', b.id] }); await qc.invalidateQueries({ queryKey: ['bookings'] }); onClose(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not cancel'); } finally { setBusy(false); }
  }
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="cancel-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center" onClick={onClose}>
      <div className="flex w-full max-w-[520px] flex-col gap-4 rounded-sheet bg-surface p-7" onClick={(e) => e.stopPropagation()}>
        <h2 id="cancel-title" className="m-0 text-[28px] font-normal">Cancel this booking?</h2>
        <p className="m-0 text-muted">{formatDateTime(b.startAt)}. The bike goes back on sale straight away.</p>
        {r && (
          <div className="flex flex-col gap-2.5 rounded-[22px] bg-field p-4">
            <Line label="Deposit" value={`${formatPaise(r.depositRefundPaise, true)} back`} />
            <Line label={r.pct === 100 ? 'Rental · full refund, more than 24 h before pickup' : `Rental · ${r.pct}% back within 24 h`} value={formatPaise(r.rentalRefundPaise, true)} />
            <div className="h-px bg-line" />
            <Line label="You get back" value={formatPaise(r.refundPaise, true)} strong />
            <span className="text-sm text-muted">Refunds go to the UPI or card you paid with.</span>
          </div>
        )}
        <div className="flex flex-wrap gap-2">{REASONS.map((l) => (
          <button key={l} type="button" aria-pressed={reason === l} onClick={() => setReason(reason === l ? null : l)} className={cn('h-11 rounded-full px-[18px] text-[15px]', reason === l ? 'bg-ink text-surface' : 'bg-field')}>{l}</button>
        ))}</div>
        {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
        <Button size="lg" disabled={busy || !preview.data?.cancellable} onClick={confirm}>{busy ? 'Cancelling…' : 'Cancel booking'}</Button>
        <Button variant="ghost" onClick={onClose}>Keep my booking</Button>
      </div>
    </div>
  );
}

function Progress({ step }: { step: number }) {
  const labels = ['Booked', 'Pickup', 'Return', 'Deposit back'];
  return (
    <section className="rounded-sheet bg-surface p-7">
      <div className="relative grid grid-cols-4 text-center text-[15px]">
        <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-4 h-0.5 bg-line" />
        <div aria-hidden="true" className="absolute left-[12.5%] top-4 h-0.5 bg-ink" style={{ width: `${Math.min(step, 3) * 25}%` }} />
        {labels.map((l, i) => (
          <div key={l} className={cn('relative flex flex-col items-center gap-2.5', i > step && 'text-muted')}>
            {i < step || step === 4 ? <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-ink text-surface"><Icon name="check" size={18} strokeWidth={2} /></span>
              : i === step ? <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-orange bg-surface"><span className="h-3 w-3 rounded-full bg-orange" /></span>
                : <span className="h-[34px] w-[34px] rounded-full border border-line bg-field" />}
            {l}
          </div>
        ))}
      </div>
    </section>
  );
}

function DocTile({ label, d }: { label: string; d?: CustomerDocumentDTO }) {
  if (d?.status === 'VERIFIED') return <div className="flex items-center gap-3 rounded-[22px] bg-field p-4"><Icon name="check" />{label} verified</div>;
  return (
    <Link href="/account/documents" className="flex items-center gap-3 rounded-[22px] bg-orange-tint p-4 text-orange-ink"><span className="h-2.5 w-2.5 rounded-full bg-orange" />
      {label} {!d ? '· add before pickup' : d.status === 'PENDING' ? 'in review' : 'needs a new photo'}</Link>
  );
}

const Line = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className={cn('flex justify-between gap-3', strong && 'font-medium')}><span>{label}</span><span>{value}</span></div>
);
