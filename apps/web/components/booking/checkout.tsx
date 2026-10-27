'use client';

import type { BookingDTO, CustomerDocumentDTO, LocationDTO, VehicleModelDTO } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/brand/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';
import { bikePhoto } from '@/lib/bikes';
import { formatDateTime, formatMinus, formatPaise } from '@/lib/format';
import { isMockOrder, openCheckout } from '@/lib/razorpay';
import { newIdempotencyKey } from '@/lib/hold';
import { useMe } from '@/lib/use-me';
import { useCountdown } from '@/hooks/use-countdown';

type Stage = 'review' | 'confirming' | 'slow';

export function Checkout({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [stage, setStage] = useState<Stage>('review');
  const [name, setName] = useState<string | null>(null);
  const [coupon, setCoupon] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const booking = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => api.get<BookingDTO>(`/bookings/${bookingId}`),
    refetchInterval: (q) => (stage !== 'review' && q.state.data?.status === 'PENDING_PAYMENT' ? 2000 : false),
  });
  const models = useQuery({ queryKey: ['models'], queryFn: () => api.get<VehicleModelDTO[]>('/vehicle-models') });
  const locations = useQuery({ queryKey: ['locations'], queryFn: () => api.get<LocationDTO[]>('/locations') });
  const docs = useQuery({ queryKey: ['kyc'], queryFn: () => api.get<CustomerDocumentDTO[]>('/kyc/documents') });
  const b = booking.data;
  const hold = useCountdown(b?.status === 'PENDING_PAYMENT' ? b.holdExpiresAt : null);

  useEffect(() => { if (b?.status === 'CONFIRMED') router.replace(`/account/bookings/${b.id}?confirmed=1`); }, [b, router]);
  useEffect(() => { if (stage !== 'confirming') return; const h = setTimeout(() => setStage('slow'), 45_000); return () => clearTimeout(h); }, [stage]);
  useEffect(() => { if (b?.couponCode) setCoupon(b.couponCode); }, [b?.couponCode]);

  if (booking.error) return <Panel title="Booking not found"><Link href="/book" className="underline">Search again</Link></Panel>;
  if (!b) return <Panel title="Loading…" />;
  const model = models.data?.find((m) => m.id === b.vehicleModelId);
  const pickup = locations.data?.find((l) => l.id === b.pickupLocationId);
  const ret = locations.data?.find((l) => l.id === b.returnLocationId);
  // Once the rider has paid, only the server's status counts: a payment can still confirm after the countdown ends.
  const expired = b.status === 'EXPIRED' || b.status === 'CANCELLED' || (stage === 'review' && b.status === 'PENDING_PAYMENT' && hold.seconds === 0 && !!b.holdExpiresAt);

  if (expired && stage !== 'review') return (
    <Panel title="Your hold ended before the payment arrived">
      <p className="text-lg text-muted">The {model?.name ?? 'bike'} was released when the 15 minutes ran out, so we are refunding the full amount to the UPI or card you paid with. Refunds usually take 5–7 working days.</p>
      <Link href="/book" className="inline-flex h-[50px] items-center rounded-full bg-ink px-6 text-surface">Check availability again</Link>
    </Panel>
  );
  if (expired) return (
    <Panel title="Your hold ended">
      <p className="text-lg text-muted">We keep a bike for 15 minutes while you pay. The time ran out, so the {model?.name ?? 'bike'} was released. Check My bookings for the payment status before trying again.</p>
      <Link href="/book" className="inline-flex h-[50px] items-center rounded-full bg-ink px-6 text-surface">Check availability again</Link>
    </Panel>
  );
  if (stage !== 'review') return (
    <Panel title={stage === 'confirming' ? 'Confirming your payment' : 'Still confirming'}>
      <p className="text-lg text-muted">{stage === 'confirming' ? 'This usually takes a few seconds. Please keep this page open.'
        : 'We are checking the payment status with Razorpay. Your trip will show as Confirmed in My bookings as soon as it arrives.'}</p>
      {stage === 'slow' && <Link href="/account/bookings" className="inline-flex h-[50px] items-center rounded-full bg-ink px-6 text-surface">Go to My bookings</Link>}
    </Panel>
  );

  const rental = b.totalPaise - b.depositPaise;
  const tierPct = b.tierPct; // stored at booking time from pricing_rules
  const tierOff = Math.round(b.rentalPaise * tierPct / 100);
  const dl = docs.data?.find((d) => d.type === 'DL');
  const idDoc = docs.data?.find((d) => d.type !== 'DL');
  const orderId = b.pendingOrderId ?? '';

  async function applyCoupon(code: string | null) {
    setBusy('coupon'); setError(null);
    try {
      await api.post(`/bookings/${bookingId}/coupon`, { code }, { idempotencyKey: newIdempotencyKey() });
      if (!code) setCoupon('');
      await qc.invalidateQueries({ queryKey: ['booking', bookingId] });
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not apply the coupon'); } finally { setBusy(null); }
  }

  async function pay(mockOutcome?: 'captured' | 'failed') {
    setBusy(mockOutcome ?? 'pay'); setError(null);
    try {
      if (name !== null && name.trim().length >= 2 && name.trim() !== me?.fullName) {
        await api.patch('/me', { fullName: name.trim() });
        await qc.invalidateQueries({ queryKey: ['me'] });
      }
      if (isMockOrder(orderId)) {
        await api.post('/dev/payments/simulate', { orderId, outcome: mockOutcome ?? 'captured' });
        if (mockOutcome === 'failed') setError('The test payment was declined. Your bike is still held, so you can try again.');
        else setStage('confirming');
        return;
      }
      await openCheckout({
        orderId, amountPaise: b!.totalPaise, bookingCode: b!.code, phone: me?.phone, name: name ?? me?.fullName ?? undefined, email: me?.email ?? undefined,
        onPaid: (r) => { setStage('confirming'); api.post('/payments/verify', r).then(() => qc.invalidateQueries({ queryKey: ['booking', bookingId] })).catch(() => { /* the webhook still confirms */ }); },
        onFailed: (r) => setError(`${r} Your bike is still held, so you can try again.`),
      });
    } catch (e) { setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not start the payment'); }
    finally { setBusy(null); }
  }

  const step = (n: number, title: string) => (
    <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[15px] text-surface">{n}</span><h2 className="m-0 text-2xl font-normal">{title}</h2></div>
  );
  const docTile = (label: string, d?: CustomerDocumentDTO) => d?.status === 'VERIFIED'
    ? <div className="flex flex-[1_1_240px] items-center gap-3 rounded-3xl bg-field p-4"><Icon name="check" /><span>{label} · verified</span></div>
    : <Link href="/account/documents" className="flex flex-[1_1_240px] items-center gap-3 rounded-3xl bg-orange-tint p-4 text-orange-ink"><span className="h-2.5 w-2.5 rounded-full bg-orange" />
        <span>{label} · {!d ? 'add before pickup' : d.status === 'PENDING' ? 'in review' : 'add a clearer photo'}</span></Link>;

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-5 px-4 pt-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-[44px] font-normal tracking-[-0.7px]">Review &amp; pay</h1>
        <div role="status" className="inline-flex h-12 items-center gap-2.5 rounded-full bg-orange-tint px-5 text-[15px] text-orange-ink"><Icon name="timer" size={20} />Bike held for <span className="font-medium">{hold.text}</span></div>
      </div>
      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-sheet bg-surface p-7">
            {step(1, 'Rider')}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3">
              <label className="label">Full name, as on your licence<Input className="h-14" value={name ?? me?.fullName ?? ''} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
              <label className="label">Mobile, verified<Input className="h-14" value={me?.phone ?? ''} readOnly /></label>
            </div>
          </section>
          <section className="flex flex-col gap-3.5 rounded-sheet bg-surface p-7">
            {step(2, 'Documents')}
            <div className="flex flex-wrap gap-3">{docTile('Driving licence', dl)}{docTile('ID proof', idDoc)}</div>
            <span className="text-sm text-muted">You can pay now and finish documents before pickup.</span>
          </section>
          <section className="flex flex-col gap-3.5 rounded-sheet bg-surface p-7">
            {step(3, 'Coupon')}
            <div className="flex h-[58px] max-w-[520px] items-center gap-2.5 rounded-full bg-field py-1.5 pl-5 pr-1.5">
              <label htmlFor="coupon" className="sr-only">Coupon code</label>
              <input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} disabled={!!b.couponCode} placeholder="Enter a code"
                className="min-w-0 flex-1 border-0 bg-transparent text-base uppercase tracking-[1px] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-disabled" />
              <Button size="sm" className="h-[46px]" disabled={busy === 'coupon' || (!b.couponCode && !coupon.trim())}
                onClick={() => applyCoupon(b.couponCode ? null : coupon.trim())}>{b.couponCode ? 'Remove' : 'Apply'}</Button>
            </div>
          </section>
        </div>

        <aside aria-label="Order summary" className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[36px] bg-surface p-7">
          <div className="flex items-center gap-3.5">
            <span className="flex h-[84px] w-[120px] flex-none items-center justify-center rounded-[22px] bg-field">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {model && <img src={bikePhoto(model.slug)} alt={model.name} className="h-[72px] w-[104px] object-contain" />}
            </span>
            <span><span className="block text-[19px]">{model?.name}</span><span className="text-sm text-muted">{formatDateTime(b.startAt)} → {formatDateTime(b.endAt)} · {pickup?.name}{ret && ret.id !== pickup?.id ? ` → ${ret.name}` : ''}</span></span>
          </div>
          <div className="h-px bg-line" />
          <div className="flex flex-col gap-2.5 text-base">
            <Row label={`Taxable rental · ${b.billableDays} ${b.billableDays === 1 ? 'day' : 'days'}`} value={formatPaise(b.rentalPaise, true)} />
            {tierOff > 0 && <Row label={`Long-rental discount · ${tierPct}%`} value={formatMinus(tierOff)} />}
            {b.couponCode && <Row label={`Coupon ${b.couponCode}`} value={formatMinus(b.discountPaise - tierOff)} />}
            {b.feesPaise > 0 && <Row label="Taxable one-way fee" value={formatPaise(b.feesPaise, true)} />}
            <Row label="GST component · 18%" value={formatPaise(b.taxPaise, true)} />
            <Row label="Rental total · incl. GST" value={formatPaise(rental, true)} strong />
            <Row label="Refundable deposit" value={formatPaise(b.depositPaise, true)} />
            <div className="h-px bg-line" />
            <div className="flex items-baseline justify-between"><span className="text-[19px]">Pay now</span><span className="text-[30px] font-medium">{formatPaise(b.totalPaise, true)}</span></div>
          </div>
          {error && <p role="alert" className="rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink">{error}</p>}
          {isMockOrder(orderId) ? (
            <div className="flex flex-col gap-2.5 rounded-3xl bg-field p-4">
              <span className="text-sm text-muted">Test mode: Razorpay keys aren&apos;t set, so these run the same capture code as the webhook.</span>
              <Button size="lg" disabled={!!busy} onClick={() => pay('captured')}>{busy === 'captured' ? 'Paying…' : `Pay ${formatPaise(b.totalPaise, true)} (test)`}</Button>
              <Button variant="secondary" disabled={!!busy} onClick={() => pay('failed')}>Simulate a declined payment</Button>
            </div>
          ) : (
            <Button size="lg" disabled={!!busy || !orderId} onClick={() => pay()}>{busy === 'pay' ? 'Opening Razorpay…' : `Pay ${formatPaise(b.totalPaise, true)}`}</Button>
          )}
          <span className="flex items-center justify-center gap-1.5 text-sm text-muted"><Icon name="lock" size={16} />Secure payment via Razorpay · UPI, cards, net banking</span>
        </aside>
      </div>
    </main>
  );
}

const Row = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className={`flex justify-between gap-3 ${strong ? 'font-medium' : ''}`}><span>{label}</span><span>{value}</span></div>
);
function Panel({ title, children }: { title: string; children?: React.ReactNode }) {
  return <main className="mx-auto max-w-[720px] px-4 pt-10 sm:px-6"><div className="flex flex-col items-start gap-4 rounded-[36px] bg-surface p-8"><h1 className="m-0 text-4xl font-normal">{title}</h1>{children}</div></main>;
}
