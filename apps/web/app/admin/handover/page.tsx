'use client';

import Link from 'next/link';
import { PageTitle, Panel } from '@/components/admin/ui';
import { useDashboard } from '@/lib/admin';
import { shortName } from '@/lib/bikes';
import { formatTime } from '@/lib/format';

export default function PickupsToday() {
  const { data: d } = useDashboard();
  const list = (d?.pickups ?? []).filter((p) => p.status === 'CONFIRMED' || p.status === 'ONGOING');
  return (
    <>
      <PageTitle title="Pickups" sub="Today, all pickup points" />
      <Panel className="py-2">
        {list.length === 0 && <p className="py-4 text-muted">No pickups today.</p>}
        {list.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center gap-3.5 border-t border-line py-3.5 first:border-t-0">
            <span className="w-[72px] text-[17px] font-medium">{formatTime(p.startAt)}</span>
            <span className="min-w-0 flex-[1_1_220px]"><span className="block">{p.customer.name ?? p.customer.phone} · {shortName(p.model.name)} · {p.vehicle.registrationNo}</span><span className="text-sm text-muted">{p.code}</span></span>
            {p.status === 'ONGOING' ? <span className="text-sm text-muted">Picked up</span>
              : <Link href={`/admin/handover/${p.id}`} className="inline-flex h-[42px] items-center rounded-full bg-ink px-4 text-sm text-surface">Start handover</Link>}
          </div>
        ))}
      </Panel>
      <p className="text-sm text-muted">Booking for another day? Open it from the <Link href="/admin/bookings" className="underline">calendar</Link>.</p>
    </>
  );
}
