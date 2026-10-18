'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { PageTitle, Panel } from '@/components/admin/ui';
import { api } from '@/lib/api-client';
import { istDayStart, type CalendarRow } from '@/lib/admin';
import { shortName } from '@/lib/bikes';
import { formatDateTime } from '@/lib/format';

/** Bikes on a ride that are due back by the end of tomorrow, overdue first. */
export default function ReturnsPage() {
  const from = istDayStart(-30).toISOString();
  const to = istDayStart(2).toISOString();
  const { data } = useQuery({ queryKey: ['admin', 'returns', from], queryFn: () => api.get<CalendarRow[]>(`/admin/bookings?${new URLSearchParams({ from, to })}`), refetchInterval: 60_000 });
  const list = (data ?? []).filter((b) => b.status === 'ONGOING' && new Date(b.endAt) < new Date(to)).sort((a, b) => a.endAt.localeCompare(b.endAt));
  return (
    <>
      <PageTitle title="Returns" sub="Due today and tomorrow, and anything overdue" />
      <Panel className="py-2">
        {data && list.length === 0 && <p className="py-4 text-muted">No returns due.</p>}
        {list.map((b) => {
          const late = new Date(b.endAt) < new Date();
          return (
            <div key={b.id} className="flex flex-wrap items-center gap-3.5 border-t border-line py-3.5 first:border-t-0">
              <span className="min-w-0 flex-[1_1_240px]"><span className="block">{b.customer.name ?? b.customer.phone} · {shortName(b.model.name)} · {b.vehicle.registrationNo}</span><span className={`text-sm ${late ? 'text-orange-ink' : 'text-muted'}`}>{late ? 'Overdue since' : 'Due'} {formatDateTime(b.endAt)} · {b.code}</span></span>
              <Link href={`/admin/returns/${b.id}`} className="inline-flex h-[42px] items-center rounded-full bg-ink px-4 text-sm text-surface">Start return</Link>
            </div>
          );
        })}
      </Panel>
    </>
  );
}
