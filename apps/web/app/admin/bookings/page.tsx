'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { PageTitle } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { istDayStart, useFleet, type CalendarRow } from '@/lib/admin';
import { shortName } from '@/lib/bikes';
import { formatDateTime } from '@/lib/format';

const DAYS = 14;
const MAINT_BG = 'repeating-linear-gradient(45deg, #B9BDC3 0 3px, #E3E5E8 3px 6px)';

/** 14-day Gantt: one row per bike, booked (ink), pending payment (orange), maintenance (striped). */
export default function CalendarPage() {
  const [offset, setOffset] = useState(0);
  const start = istDayStart(offset);
  const end = new Date(start.getTime() + DAYS * 86_400_000);
  const fleet = useFleet();
  const { data } = useQuery({ queryKey: ['admin', 'calendar', start.toISOString()], queryFn: () => api.get<CalendarRow[]>(`/admin/bookings?${new URLSearchParams({ from: start.toISOString(), to: end.toISOString() })}`) });
  const span = end.getTime() - start.getTime();
  const pct = (t: number) => `${Math.max(0, Math.min(100, ((t - start.getTime()) / span) * 100)).toFixed(3)}%`;
  const vehicles = (fleet.data ?? []).filter((v) => v.status !== 'RETIRED');
  const nowPct = offset === 0 ? pct(Date.now()) : null;
  const days = Array.from({ length: DAYS }, (_, i) => new Date(start.getTime() + i * 86_400_000));

  return (
    <>
      <PageTitle title="Bookings calendar" sub={`${DAYS} days from ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(start)} · ${vehicles.length} bikes`}>
        <div className="flex flex-wrap items-center gap-3.5 text-sm">
          <Legend bg="#000000" label="Booked" /><Legend bg="var(--orange)" label="Pending payment" /><Legend bg={MAINT_BG} label="Maintenance" />
        </div>
        <Button variant="secondary" size="sm" onClick={() => setOffset(offset - 7)}>← Week</Button>
        <Button variant="secondary" size="sm" onClick={() => setOffset(0)} disabled={offset === 0}>Today</Button>
        <Button variant="secondary" size="sm" onClick={() => setOffset(offset + 7)}>Week →</Button>
      </PageTitle>
      <section className="overflow-x-auto rounded-sheet bg-surface p-[18px]">
        <div className="flex min-w-[900px] flex-col">
          <div className="flex items-end border-b border-line pb-2">
            <span className="w-[190px] flex-none text-[13px] text-muted">Bike</span>
            <div className="grid flex-1 grid-cols-[repeat(14,minmax(0,1fr))]">
              {days.map((d, i) => (
                <span key={i} className={`text-center text-xs leading-[1.3] ${offset === 0 && i === 0 ? 'text-orange-ink' : 'text-muted'}`}>
                  {offset === 0 && i === 0 ? 'Today' : new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Asia/Kolkata' }).format(d)}<br />{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(d)}
                </span>
              ))}
            </div>
          </div>
          {vehicles.map((v) => (
            <div key={v.id} className="flex h-[30px] items-center border-b border-[#F1F3F5]">
              <Link href={`/admin/fleet/${v.id}`} className="w-[190px] flex-none truncate text-[13px]"><span className="font-medium">{v.registrationNo}</span> <span className="text-muted">{shortName(v.model.name)}</span></Link>
              <div className="relative h-full flex-1">
                {nowPct && <span aria-hidden="true" className="absolute bottom-0 top-0 w-0.5 bg-orange" style={{ left: nowPct }} />}
                {v.status === 'MAINT' && <span title={`${v.registrationNo}: maintenance`} className="absolute top-1.5 h-[18px] rounded px-1.5 text-[11px] leading-4" style={{ left: 0, width: '100%', background: MAINT_BG }}>Maintenance</span>}
                {(data ?? []).filter((b) => b.vehicle.id === v.id && b.status !== 'CANCELLED').map((b) => {
                  const pending = b.status === 'PENDING_PAYMENT';
                  const tip = `${v.registrationNo}: ${b.code}, ${b.customer.name ?? b.customer.phone} · ${formatDateTime(b.startAt)} → ${formatDateTime(b.endAt)}${pending ? ' (pending payment)' : ''}`;
                  const l = pct(new Date(b.startAt).getTime()); const r = pct(new Date(b.endAt).getTime());
                  return (
                    <Link key={b.id} href={`/admin/bookings/${b.id}`} title={tip} aria-label={tip}
                      className={`absolute top-1.5 h-[18px] overflow-hidden whitespace-nowrap rounded border border-surface px-1.5 text-[11px] leading-4 ${pending ? 'bg-orange text-ink' : 'bg-ink text-surface'}`}
                      style={{ left: l, width: `calc(${r} - ${l})` }}>{b.customer.name ?? b.code}</Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

const Legend = ({ bg, label }: { bg: string; label: string }) => <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-[18px] rounded" style={{ background: bg }} />{label}</span>;
