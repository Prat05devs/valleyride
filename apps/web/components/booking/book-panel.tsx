'use client';

import type { AvailabilityDTO, LocationDTO, Quote, VehicleModelDTO } from '@valleyride/shared';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api-client';
import { BIKE_COPY, brandOf, shortName } from '@/lib/bikes';
import { formatMinus, formatPaise } from '@/lib/format';
import { holdBike } from '@/lib/hold';
import { defaultWindow, istInputToIso } from '@/lib/when';

const WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;

/** Bike page aside: dates and pickup point, live availability and the exact quote, then a 15-minute hold. */
export function BookPanel({ model, locations }: { model: VehicleModelDTO; locations: LocationDTO[] }) {
  const router = useRouter();
  const d = defaultWindow();
  const [from, setFrom] = useState(d.from);
  const [to, setTo] = useState(d.to);
  const [pickup, setPickup] = useState(locations[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = new Date(`${to}:00+05:30`).getTime() - new Date(`${from}:00+05:30`).getTime() >= 4 * 3_600_000;
  const window = { startAt: valid ? istInputToIso(from) : '', endAt: valid ? istInputToIso(to) : '' };

  const quote = useQuery({
    queryKey: ['quote', model.id, pickup, window.startAt, window.endAt],
    enabled: valid && !!pickup,
    queryFn: () => api.post<Quote>('/quotes', { vehicleModelId: model.id, pickupLocationId: pickup, returnLocationId: pickup, ...window }),
  });
  const free = useQuery({
    queryKey: ['availability', window.startAt, window.endAt],
    enabled: valid,
    queryFn: () => api.get<AvailabilityDTO[]>(`/availability?${new URLSearchParams(window)}`),
  });
  const units = free.data?.find((a) => a.model_id === model.id)?.free ?? 0;
  const q = quote.data;

  async function book() {
    setBusy(true); setError(null);
    try {
      const id = await holdBike({ modelId: model.id, pickup, returnTo: '', from, to });
      if (id) router.push(`/checkout/${id}`);
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not hold the bike'); } finally { setBusy(false); }
  }

  const cell = 'flex min-w-0 flex-col gap-0.5 rounded-3xl bg-field px-[18px] py-3 text-[13px] text-muted';
  const control = 'min-w-0 border-0 bg-transparent text-[15px] text-ink outline-none';
  return (
    <aside aria-label={`Book the ${shortName(model.name)}`} className="flex min-w-0 flex-[1_1_380px] flex-col gap-[18px] rounded-[40px] bg-surface p-7 lg:sticky lg:top-6">
      <div><div className="text-[15px] text-muted">{brandOf(model.name)} · {BIKE_COPY[model.slug]?.tag}</div><h1 className="mt-1 text-[40px] font-normal tracking-[-0.6px]">{shortName(model.name)}</h1></div>
      <div className="flex items-baseline gap-1.5"><span className="text-4xl font-medium">{formatPaise(model.pricePerDayPaise)}</span><span className="text-base text-muted">/day before GST</span></div>
      <div className="grid grid-cols-2 gap-2.5">
        <label className={cell}>Pickup<input type="datetime-local" step={1800} className={control} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className={cell}>Return<input type="datetime-local" step={1800} min={from} className={control} value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label className={`${cell} col-span-2`}>Pickup and return
          <select className={`${control} text-base`} value={pickup} onChange={(e) => setPickup(e.target.value)}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        </label>
      </div>
      {!valid ? <Notice>Rentals are at least 4 hours.</Notice>
        : free.data && <Notice>{units === 0 ? 'Fully booked on these dates' : `${units} free on your dates`}{q && q.tierPct > 0 ? ` · ${q.tierPct}% long-rental discount` : ''}</Notice>}
      {q && (
        <div className="flex flex-col gap-2.5 text-base">
          <Row label={`${q.days} ${q.days === 1 ? 'day' : 'days'} × ${formatPaise(model.pricePerDayPaise)}`} value={formatPaise(q.rentalPaise, true)} />
          {q.discountPaise > 0 && <Row label="Long-rental discount" value={formatMinus(q.discountPaise)} />}
          <Row label="GST 18%" value={formatPaise(q.taxPaise, true)} />
          <Row label="Refundable deposit" value={formatPaise(q.depositPaise, true)} />
          <div className="h-px bg-line" />
          <div className="flex items-baseline justify-between"><span className="text-lg">Pay now</span><span className="text-[26px] font-medium">{formatPaise(q.payNowPaise, true)}</span></div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-orange-ink">{error}</p>}
      <Button size="lg" disabled={!valid || !q || units === 0 || busy} onClick={book}>{busy ? 'Holding your bike…' : 'Book now'}</Button>
      <span className="text-center text-sm text-muted">{q ? `${q.kmIncluded} km included · ` : ''}UPI, cards and net banking</span>
      {WHATSAPP && (
        <a href={`https://wa.me/${WHATSAPP.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi Valley Ride, I'd like to ask about the ${shortName(model.name)} from ${from.replace('T', ' ')} to ${to.replace('T', ' ')}.`)}`}
          target="_blank" rel="noreferrer" className="text-center text-[15px] underline">Questions? Ask us on WhatsApp</a>
      )}
    </aside>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => <div className="flex justify-between gap-3"><span>{label}</span><span>{value}</span></div>;
const Notice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2.5 rounded-[20px] bg-orange-tint px-4 py-3 text-sm text-orange-ink"><span className="h-2 w-2 shrink-0 rounded-full bg-orange" />{children}</div>
);
