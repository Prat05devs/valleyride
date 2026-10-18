'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { dateOf, exact, NotInvestor, PaidBar, PortalHeader, structureLabel, useInvestments, whole } from '@/components/investor/portal';

export default function PortalPage() {
  const { data, error } = useInvestments();
  if (error) return <><PortalHeader title="My investments" /><NotInvestor error={error} /></>;
  const list = data ?? [];
  const invested = list.reduce((s, i) => s + i.principalPaise, 0);
  const received = list.reduce((s, i) => s + i.receivedPaise, 0);
  const paidRows = list.flatMap((i) => i.schedule.filter((r) => r.status === 'PAID'));
  const late = paidRows.filter((r) => r.paidAt && r.paidAt.slice(0, 10) > r.dueDate).length;
  const nextDate = list.map((i) => i.next?.dueDate).filter(Boolean).sort()[0];
  const nextTotal = list.filter((i) => i.next?.dueDate === nextDate).reduce((s, i) => s + (i.next?.paymentPaise ?? 0), 0);

  return (
    <>
      <PortalHeader title="My investments" />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3.5">
        <div className="rounded-sheet bg-dark p-6 text-surface"><div className="text-[15px] text-white/80">Invested</div><div className="mt-1 text-[34px] font-medium">{whole(invested)}</div><div className="mt-1 text-sm text-white/80">across {list.length} {list.length === 1 ? 'agreement' : 'agreements'}</div></div>
        <div className="rounded-sheet bg-surface p-6"><div className="text-[15px] text-muted">Received so far</div><div className="mt-1 text-[34px] font-medium">{exact(received)}</div><div className="mt-1 text-sm text-muted">{paidRows.length} {paidRows.length === 1 ? 'payment' : 'payments'}{paidRows.length ? (late ? `, ${late} late` : ', all on time') : ''}</div></div>
        <div className="rounded-sheet bg-surface p-6"><div className="text-[15px] text-muted">Next payments</div><div className="mt-1 text-[34px] font-medium">{nextDate ? exact(nextTotal) : '—'}</div><div className="mt-1 text-sm text-orange-ink">{nextDate ? `due ${dateOf(nextDate)}` : 'nothing due'}</div></div>
      </div>
      <section className="flex flex-col gap-3.5">
        {list.map((i) => {
          const last = i.schedule[i.schedule.length - 1];
          return (
            <Link key={i.id} href={`/invest/portal/${i.id}`} className="flex flex-wrap items-center gap-6 rounded-sheet bg-surface p-[26px]">
              <div className="flex min-w-0 flex-[2_1_320px] flex-col gap-2">
                <span className="flex items-center gap-2"><Badge variant="ink" className="h-7 text-[13px]">{i.status === 'CLOSED' ? 'Closed' : 'Active'}</Badge><span className="text-sm tracking-[0.5px] text-muted">{i.ref}</span></span>
                <span className="text-[26px]">{whole(i.principalPaise)} · {i.annualRatePct}% a year · {i.tenureMonths} months</span>
                <span className="text-[15px] text-muted">{structureLabel(i.structure)} · started {dateOf(i.startDate)}</span>
                <PaidBar paid={i.paidCount} total={i.tenureMonths} />
                <span className="text-sm text-muted">{i.paidCount} of {i.tenureMonths} paid · {i.structure === 'amortizing' ? `${exact(i.outstandingPrincipalPaise)} principal outstanding` : last ? `${exact(last.paymentPaise)} final payment on ${dateOf(last.dueDate)}` : ''}</span>
              </div>
              <div className="flex flex-[1_1_220px] flex-col items-end gap-1 text-right">
                <span className="text-sm text-muted">{i.structure === 'amortizing' ? 'Next instalment' : 'Next interest'}</span>
                <span className="text-[28px] font-medium">{i.next ? exact(i.next.paymentPaise) : '—'}</span>
                <span className="text-sm text-orange-ink">{i.next ? dateOf(i.next.dueDate) : 'Fully repaid'}</span>
                <span className="mt-2 inline-flex h-[46px] items-center rounded-full bg-field px-[22px] text-[15px]">View schedule</span>
              </div>
            </Link>
          );
        })}
      </section>
      <p role="note" className="m-0 rounded-3xl bg-orange-tint px-[22px] py-[18px] text-[15px] leading-normal text-orange-ink">Repayments depend on the agreement and the business&apos;s ability to pay; they are not guaranteed.</p>
    </>
  );
}
