'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/brand/icon';
import { PageTitle, Panel, Stat } from '@/components/admin/ui';
import { api } from '@/lib/api-client';
import { docLabel, useDashboard } from '@/lib/admin';
import { shortName } from '@/lib/bikes';
import { formatDay, formatPaise, formatTime } from '@/lib/format';
import { useMe } from '@/lib/use-me';

interface Util { models: { modelId: string; model: string; units: number; pct: number }[] }

export default function AdminDashboard() {
  const { data: me } = useMe();
  const { data: d } = useDashboard();
  const util = useQuery({
    queryKey: ['admin', 'util', d?.monthStart], enabled: !!d && me?.role === 'admin',
    queryFn: () => api.get<Util>(`/admin/reports/utilisation?${new URLSearchParams({ from: d!.monthStart, to: new Date().toISOString() })}`),
  });
  const hour = Number(new Intl.DateTimeFormat('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }).format(new Date()));
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(new Date());
  const pickups = (d?.pickups ?? []).filter((p) => p.status === 'CONFIRMED' || p.status === 'ONGOING');
  const nextPickup = pickups.find((p) => p.status === 'CONFIRMED');
  const late = (d?.returns ?? []).filter((r) => new Date(r.endAt) < new Date()).length + (d?.overdueReturns ?? 0);

  return (
    <>
      <PageTitle title={`${greet}${me?.fullName ? `, ${me.fullName.split(' ')[0]}` : ''}`} sub={`${today} · all pickup points`} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
        <Link href="/admin/handover"><Stat dark label="Pickups today" value={pickups.length} sub={nextPickup ? `next at ${formatTime(nextPickup.startAt)}` : 'none left'} /></Link>
        <Link href="/admin/returns"><Stat label="Returns today" value={d?.returns.length ?? '—'} sub={late ? `${late} running late` : 'all on time'} subTone={late ? 'orange' : undefined} /></Link>
        <Stat label="Out on the road" value={<>{d?.fleet.onRide ?? '—'}<span className="text-lg font-normal text-muted"> / {d?.fleet.total ?? '—'}</span></>} sub={`${d?.fleet.byStatus.MAINT ?? 0} in maintenance`} />
        <Stat label="Deposits held" value={d ? formatPaise(d.depositsHeld.paise) : '—'} sub={d ? `across ${d.depositsHeld.bookings} bookings` : ''} />
      </div>
      <div className="flex flex-wrap items-start gap-4">
        <Panel title="Today's pickups" action={<Link href="/admin/bookings" className="text-[15px] text-muted underline">Calendar</Link>} className="flex-[999_1_460px] px-[22px] py-2">
          {pickups.length === 0 && <p className="border-t border-line py-4 text-muted">No pickups today.</p>}
          {pickups.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3.5 border-t border-line py-3.5">
              <span className="w-[72px] flex-none text-[17px] font-medium">{formatTime(p.startAt)}</span>
              <span className="min-w-0 flex-[1_1_200px]"><span className="block">{p.customer.name ?? p.customer.phone} · {shortName(p.model.name)}</span><span className="text-sm text-muted">{p.code} · {p.vehicle.registrationNo}</span></span>
              <span className={`inline-flex h-[30px] items-center rounded-full px-3 text-[13px] ${p.customer.docs === 'verified' ? 'bg-field' : 'bg-orange-tint text-orange-ink'}`}>{p.customer.docs === 'verified' ? 'Docs verified' : p.customer.docs === 'pending' ? 'Docs in review' : 'Docs missing'}</span>
              {p.status === 'ONGOING' ? <span className="text-sm text-muted">Picked up</span>
                : <Link href={`/admin/handover/${p.id}`} className="inline-flex h-[42px] items-center rounded-full bg-ink px-4 text-sm text-surface">Start handover</Link>}
            </div>
          ))}
        </Panel>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
          <Panel title="Needs attention">
            {d?.docAlerts.map((a) => (
              <Link key={`${a.vehicleId}${a.type}`} href={`/admin/fleet/${a.vehicleId}`} className="flex items-start gap-3 rounded-[20px] bg-orange-tint p-3.5 text-[15px] leading-[1.4] text-orange-ink">
                <Icon name="info" size={20} /><span>{docLabel[a.type] ?? a.type} for {a.registrationNo} {new Date(a.expiresOn) < new Date() ? 'expired' : 'expires'} {formatDay(a.expiresOn)}</span></Link>
            ))}
            {!!d?.kycPending && <Link href="/admin/customers" className="flex items-start gap-3 rounded-[20px] bg-field p-3.5 text-[15px]"><Icon name="idcard" size={20} />{d.kycPending} {d.kycPending === 1 ? 'document' : 'documents'} waiting for review</Link>}
            {d?.servicesDue.map((s) => (
              <Link key={`${s.vehicleId}${s.on}`} href={`/admin/fleet/${s.vehicleId}`} className="flex items-start gap-3 rounded-[20px] bg-field p-3.5 text-[15px]"><Icon name="gauge" size={20} />{s.type === 'SERVICE' ? 'Service' : 'Repair'} due for {s.registrationNo} on {formatDay(s.on)}{s.notes ? ` · ${s.notes}` : ''}</Link>
            ))}
            {!!d?.fleet.byStatus.MAINT && <Link href="/admin/fleet" className="flex items-start gap-3 rounded-[20px] bg-field p-3.5 text-[15px]"><Icon name="gauge" size={20} />{d.fleet.byStatus.MAINT} {d.fleet.byStatus.MAINT === 1 ? 'bike' : 'bikes'} in maintenance</Link>}
            {!!d?.overdueReturns && <Link href="/admin/returns" className="flex items-start gap-3 rounded-[20px] bg-orange-tint p-3.5 text-[15px] text-orange-ink"><Icon name="clock" size={20} />{d.overdueReturns} {d.overdueReturns === 1 ? 'return is' : 'returns are'} overdue</Link>}
            {d && !d.docAlerts.length && !d.servicesDue.length && !d.kycPending && !d.fleet.byStatus.MAINT && !d.overdueReturns && <p className="m-0 text-muted">Nothing needs attention.</p>}
          </Panel>
          {util.data && (
            <Panel title="Utilisation" action={<span className="text-sm text-muted">This month to date</span>}>
              {util.data.models.map((u) => (
                <div key={u.modelId} title={`${u.model}: ${u.pct}% of bike-hours booked this month`} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[15px]"><span>{shortName(u.model)} · {u.units} {u.units === 1 ? 'bike' : 'bikes'}</span><span className="font-medium">{u.pct}%</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-field"><div className="h-full rounded bg-ink" style={{ width: `${Math.min(100, u.pct)}%` }} /></div>
                </div>
              ))}
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
