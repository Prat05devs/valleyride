'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDashboard } from '@/lib/admin';
import { useMe } from '@/lib/use-me';
import { cn } from '@/lib/utils';

/** Dark sidebar with Today / Operations / Money groups and live counts, as in the AdmSidebar design component. */
export function AdminSidebar() {
  const path = usePathname();
  const { data: me } = useMe();
  const { data: d } = useDashboard();
  const admin = me?.role === 'admin';
  const groups = [
    { title: 'Today', items: [
      { href: '/admin', label: 'Overview', exact: true },
      { href: '/admin/handover', label: 'Pickups', badge: d?.pickups.filter((p) => p.status === 'CONFIRMED').length },
      { href: '/admin/returns', label: 'Returns', badge: d ? d.returns.length + d.overdueReturns : undefined },
    ] },
    { title: 'Operations', items: [
      { href: '/admin/bookings', label: 'Bookings calendar' },
      { href: '/admin/fleet', label: 'Fleet', badge: d ? d.docAlerts.length + (d.fleet.byStatus.MAINT ?? 0) : undefined },
      { href: '/admin/customers', label: 'Customers & documents', badge: d?.kycPending },
      { href: '/admin/content', label: 'Content' },
    ] },
    ...(admin ? [{ title: 'Money', items: [
      { href: '/admin/finance', label: 'Finance' }, { href: '/admin/pricing', label: 'Pricing' }, { href: '/admin/marketing', label: 'Coupons' }, { href: '/admin/investors', label: 'Investors' },
    ] }] : []),
  ];
  return (
    <nav aria-label="Admin" className="flex w-full flex-col gap-[18px] rounded-sheet bg-dark px-3.5 py-[22px] text-surface">
      <Link href="/admin" className="flex items-center gap-2.5 px-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.jpg" alt="" className="h-[42px] w-[42px] rounded-full object-cover" />
        <span><span className="block text-lg font-medium">Valley <span className="text-orange">Ride</span></span><span className="text-[13px] text-white/70">Admin</span></span>
      </Link>
      {groups.map((g) => (
        <div key={g.title} className="flex flex-col gap-0.5">
          <span className="px-3 py-1 text-[13px] text-white/60">{g.title}</span>
          {g.items.map((i) => {
            const on = 'exact' in i && i.exact ? path === i.href : path.startsWith(i.href);
            return (
              <Link key={i.href} href={i.href} aria-current={on ? 'page' : undefined}
                className={cn('flex h-11 items-center justify-between gap-2 rounded-full px-3 text-[15px]', on ? 'bg-surface text-ink' : 'hover:bg-white/10')}>
                {i.label}
                {'badge' in i && !!i.badge && <span className={cn('flex h-6 min-w-6 items-center justify-center rounded-full px-[7px] text-[13px] font-medium', on ? 'bg-ink text-surface' : 'bg-orange text-ink')}>{i.badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="mt-1.5 flex items-center gap-2.5 rounded-[22px] bg-white/[0.08] p-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-[15px] font-medium text-ink">{(me?.fullName ?? '?')[0]?.toUpperCase()}</span>
        <span><span className="block text-[15px]">{me?.fullName ?? me?.phone}</span><span className="text-[13px] capitalize text-white/70">{me?.role}</span></span>
      </div>
    </nav>
  );
}
