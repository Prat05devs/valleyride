'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import { Icon } from '@/components/brand/icon';
import { dateOf, exact, NotInvestor, type Investment, whole } from '@/components/investor/portal';
import { api, API_URL } from '@/lib/api-client';
import { cn } from '@/lib/utils';

export default function InvestmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: i, error } = useQuery({ queryKey: ['investment', id], queryFn: () => api.get<Investment>(`/investor/investments/${id}/schedule`), retry: false });
  if (error) return <NotInvestor error={error} />;
  if (!i) return <div className="rounded-sheet bg-surface p-8">Loading…</div>;
  const total = i.schedule.reduce((s, r) => s + r.paymentPaise, 0);
  const nextNo = i.next?.installmentNo;
  let opening = i.principalPaise;

  async function agreement() {
    const { url } = await api.get<{ url: string }>(`/investor/investments/${id}/agreement`).catch((e) => { alert((e as Error).message); return { url: '' }; });
    if (url) window.open(url, '_blank', 'noopener');
  }

  return (
    <>
      <Link href="/invest/portal" className="inline-flex h-11 items-center gap-2 self-start text-[15px]"><Icon name="back" size={18} />My investments</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><span className="text-[15px] tracking-[0.5px] text-muted">{i.ref} · Phase 4</span><h1 className="mt-1 text-[40px] font-normal tracking-[-0.6px]">{whole(i.principalPaise)} at {i.annualRatePct}% for {i.tenureMonths} months</h1></div>
        <div className="flex gap-2">
          <a href={`${API_URL}/api/v1/investor/statements/${i.id}.pdf`} className="inline-flex h-[50px] items-center gap-2 rounded-full bg-surface px-[22px] text-[15px]"><Icon name="download" size={18} />Statement PDF</a>
          <button type="button" onClick={agreement} className="inline-flex h-[50px] items-center gap-2 rounded-full bg-surface px-[22px] text-[15px]"><Icon name="doc" size={18} />Signed agreement</button>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-3.5">
        {[[i.structure === 'amortizing' ? 'Monthly instalment' : 'Monthly interest', exact(i.schedule[0]?.paymentPaise ?? 0)], ['Received', exact(i.receivedPaise)], ['Principal outstanding', exact(i.outstandingPrincipalPaise)], ['Total over tenure', exact(total)]].map(([l, v]) => (
          <div key={l} className="rounded-card bg-surface p-[22px]"><div className="text-sm text-muted">{l}</div><div className="mt-1 text-[28px] font-medium">{v}</div></div>
        ))}
      </div>
      <section className="overflow-x-auto rounded-[36px] bg-surface p-6">
        <table className="w-full min-w-[860px] border-collapse text-[15px]">
          <thead><tr className="text-right text-[13px] text-muted">{['#', 'Due date', 'Opening', 'Interest', 'Principal', 'Payment', 'Closing', 'Status'].map((h, k) => <th key={h} className={cn('p-3 font-normal', (k < 2 || k === 7) && 'text-left')}>{h}</th>)}</tr></thead>
          <tbody>
            {i.schedule.map((r) => {
              const open = opening; opening -= r.principalPaise;
              const next = r.installmentNo === nextNo;
              return (
                <tr key={r.id} className={cn('border-t border-line text-right', next && 'bg-[#FFFAF6]')}>
                  <td className="p-3 text-left text-muted">{r.installmentNo}</td><td className="p-3 text-left">{dateOf(r.dueDate)}</td>
                  <td className="p-3">{exact(open)}</td><td className="p-3">{exact(r.interestPaise)}</td><td className="p-3">{exact(r.principalPaise)}</td>
                  <td className="p-3 font-medium">{exact(r.paymentPaise)}</td><td className="p-3">{exact(open - r.principalPaise)}</td>
                  <td className="p-3 text-left"><span className={cn('inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[13px]', r.status === 'PAID' ? 'bg-ink text-surface' : next ? 'bg-orange-tint text-orange-ink' : 'bg-field text-muted')}>
                    {r.status === 'PAID' ? `Paid${r.txnRef ? ` · UTR ••${r.txnRef.slice(-4)}` : ''}` : next ? 'Due next' : 'Upcoming'}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}
