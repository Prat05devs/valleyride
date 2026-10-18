'use client';

import type { BookingDTO } from '@valleyride/shared';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import { bikePhoto, shortName } from '@/lib/bikes';
import { formatDate, formatDateTime, formatPaise } from '@/lib/format';
import { pickupIn, STATUS_LABEL, useCatalog } from '@/lib/use-catalog';
import { cn } from '@/lib/utils';

const UPCOMING = ['PENDING_PAYMENT', 'CONFIRMED', 'ONGOING'];

export default function BookingsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const { data } = useQuery({ queryKey: ['bookings'], queryFn: () => api.get<BookingDTO[]>('/bookings') });
  const { model, location } = useCatalog();
  const upcoming = (data ?? []).filter((b) => UPCOMING.includes(b.status) && !(b.status === 'PENDING_PAYMENT' && b.holdExpiresAt && new Date(b.holdExpiresAt) < new Date())).sort((a, b) => a.startAt.localeCompare(b.startAt));
  const past = (data ?? []).filter((b) => !upcoming.includes(b));
  const held = (data ?? []).filter((b) => ['CONFIRMED', 'ONGOING', 'COMPLETED'].includes(b.status));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="m-0 text-[40px] font-normal tracking-[-0.6px]">My bookings</h1>
        <div className="flex rounded-full bg-surface p-1" role="tablist">
          {(['upcoming', 'past'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={cn('h-11 rounded-full px-[22px] text-[15px]', tab === t ? 'bg-ink text-surface' : '')}>{t === 'upcoming' ? 'Upcoming' : 'Past'}</button>
          ))}
        </div>
      </div>

      {data && (tab === 'upcoming' ? upcoming : past).length === 0 && (
        <div className="flex flex-col items-start gap-4 rounded-sheet bg-surface p-8">
          <span className="text-xl">{tab === 'upcoming' ? 'No upcoming trips' : 'No past trips yet'}</span>
          {tab === 'upcoming' && <Link href="/book" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-surface">Find a ride</Link>}
        </div>
      )}

      {tab === 'upcoming' && upcoming.map((b) => {
        const m = model(b.vehicleModelId);
        return (
          <Link key={b.id} href={b.status === 'PENDING_PAYMENT' ? `/checkout/${b.id}` : `/account/bookings/${b.id}`} className="flex flex-wrap items-center gap-5 rounded-sheet bg-surface p-5">
            <span className="flex h-[150px] flex-[1_1_200px] items-center justify-center rounded-3xl bg-field">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {m && <img src={bikePhoto(m.slug)} alt={m.name} className="h-[130px] w-[88%] object-contain" />}
            </span>
            <span className="flex min-w-0 flex-[2_1_260px] flex-col gap-1.5">
              <span className="flex items-center gap-2"><Badge variant={b.status === 'PENDING_PAYMENT' ? 'orange' : 'ink'} className="h-7 text-[13px]">{STATUS_LABEL[b.status]}</Badge><span className="text-sm text-orange-ink">{b.status === 'ONGOING' ? `Return ${formatDateTime(b.endAt)}` : pickupIn(b.startAt)}</span></span>
              <span className="text-2xl">{m ? shortName(m.name) : ''} · {b.code}</span>
              <span className="text-[15px] text-muted">{formatDateTime(b.startAt)} → {formatDateTime(b.endAt)} · {location(b.pickupLocationId)?.name}</span>
            </span>
            <span className="flex flex-[1_1_160px] flex-col items-end gap-1">
              <span className="text-[22px] font-medium">{formatPaise(b.totalPaise, true)}</span><span className="text-sm text-muted">incl. {formatPaise(b.depositPaise)} deposit</span>
              <span className="mt-2 inline-flex h-[46px] items-center rounded-full bg-ink px-[22px] text-[15px] text-surface">{b.status === 'PENDING_PAYMENT' ? 'Finish paying' : 'View booking'}</span>
            </span>
          </Link>
        );
      })}

      {tab === 'past' && past.length > 0 && (
        <div className="rounded-sheet bg-surface px-6 py-2">
          {past.map((b, i) => {
            const m = model(b.vehicleModelId);
            return (
              <Link key={b.id} href={`/account/bookings/${b.id}`} className={cn('flex flex-wrap items-center gap-4 py-4', i < past.length - 1 && 'border-b border-line')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m && <img src={bikePhoto(m.slug)} alt={m.name} className="h-16 w-20 object-contain" />}
                <span className="flex-[1_1_240px]"><span className="block text-lg">{m ? shortName(m.name) : ''} · {b.code}</span><span className="text-sm text-muted">{formatDate(b.startAt)} → {formatDate(b.endAt)} · {location(b.pickupLocationId)?.name}</span></span>
                <Badge className="h-8">{b.status === 'DEPOSIT_SETTLED' ? `Deposit refunded · ${formatPaise(b.depositPaise)}` : b.status === 'COMPLETED' ? 'Deposit being checked' : STATUS_LABEL[b.status]}</Badge>
              </Link>
            );
          })}
        </div>
      )}

      {held.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-sheet bg-dark px-7 py-6 text-surface">
          <span><span className="block text-sm text-white/80">Deposit held with us</span><span className="text-[30px] font-medium">{formatPaise(held.reduce((s, b) => s + b.depositPaise, 0))}</span></span>
          <span className="max-w-[420px] text-[15px] text-white/85">Refunded after you return {held.length === 1 ? `the ${shortName(model(held[0]!.vehicleModelId)?.name ?? 'bike')}` : 'each bike'} and it passes inspection.</span>
        </div>
      )}
    </>
  );
}
