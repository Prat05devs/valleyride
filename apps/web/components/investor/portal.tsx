'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export interface ScheduleRow { id: string; installmentNo: number; dueDate: string; principalPaise: number; interestPaise: number; paymentPaise: number; status: 'DUE' | 'PAID' | 'LATE'; paidAt: string | null; txnRef: string | null }
export interface Investment {
  id: string; ref: string; principalPaise: number; annualRatePct: number; tenureMonths: number; structure: 'amortizing' | 'interest_only';
  startDate: string; status: string; paidCount: number; receivedPaise: number; outstandingPrincipalPaise: number; next: ScheduleRow | null; schedule: ScheduleRow[];
}

export const exact = (p: number) => '₹' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const whole = (p: number) => '₹' + Math.round(p / 100).toLocaleString('en-IN');
export const dateOf = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const structureLabel = (s: Investment['structure']) => (s === 'amortizing' ? 'Equal monthly instalments' : 'Monthly interest, principal at maturity');

export function useInvestments() {
  return useQuery({ queryKey: ['investments'], queryFn: () => api.get<Investment[]>('/investor/investments'), retry: false });
}

/** Header shared by the portal pages: Phase 4 label, title and the Overview / Statements switch. */
export function PortalHeader({ title }: { title: string }) {
  const path = usePathname();
  const tabs = [['/invest/portal', 'Overview'], ['/invest/portal/statements', 'Statements & agreements']] as const;
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><span className="text-sm text-orange-ink">Phase 4 · investor portal</span><h1 className="mt-1 text-[44px] font-normal tracking-[-0.7px]">{title}</h1></div>
      <nav aria-label="Portal" className="flex gap-1 rounded-full bg-surface p-[5px]">
        {tabs.map(([href, label]) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} className={cn('inline-flex h-11 items-center rounded-full px-5 text-[15px]', path === href && 'bg-ink text-surface')}>{label}</Link>)}
      </nav>
    </div>
  );
}

export function NotInvestor({ error }: { error: unknown }) {
  const forbidden = error instanceof ApiError && error.status === 403;
  return (
    <div className="flex flex-col items-start gap-4 rounded-[36px] bg-surface p-8">
      <h2 className="m-0 text-3xl font-normal">{forbidden ? 'No investor profile on this account' : 'Could not load your investments'}</h2>
      <p className="m-0 text-muted">{forbidden ? 'Valley Ride Capital is not open to new investors yet. The illustrative calculator is on the Capital page.' : (error as Error)?.message}</p>
      <Link href="/invest" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-surface">Valley Ride Capital</Link>
    </div>
  );
}

export function PaidBar({ paid, total }: { paid: number; total: number }) {
  return (
    <div aria-label={`${paid} of ${total} instalments paid`} className="mt-1.5 flex gap-[3px]">
      {Array.from({ length: total }, (_, i) => <span key={i} className={cn('h-2 flex-1 rounded-full', i < paid ? 'bg-ink' : i === paid ? 'bg-orange' : 'bg-line')} />)}
    </div>
  );
}
