'use client';

import { Icon } from '@/components/brand/icon';
import { exact, NotInvestor, PortalHeader, useInvestments } from '@/components/investor/portal';
import { api } from '@/lib/api-client';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function StatementsPage() {
  const { data, error } = useInvestments();
  if (error) return <><PortalHeader title="Statements & agreements" /><NotInvestor error={error} /></>;
  const list = data ?? [];
  // Received payments grouped by the month they were paid.
  const months = new Map<string, { label: string; detail: string[]; amount: number }>();
  for (const i of list) for (const r of i.schedule.filter((x) => x.status === 'PAID' && x.paidAt)) {
    const key = r.paidAt!.slice(0, 7);
    const m = months.get(key) ?? { label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }), detail: [], amount: 0 };
    m.detail.push(`${i.ref} ${i.structure === 'amortizing' ? 'instalment' : 'interest'} ${r.installmentNo}`); m.amount += r.paymentPaise;
    months.set(key, m);
  }
  async function agreement(id: string) {
    const r = await api.get<{ url: string }>(`/investor/investments/${id}/agreement`).catch((e) => { alert((e as Error).message); return null; });
    if (r?.url) window.open(r.url, '_blank', 'noopener');
  }

  return (
    <>
      <PortalHeader title="Statements & agreements" />
      <div className="flex flex-wrap items-start gap-5">
        <section className="min-w-0 flex-[999_1_560px] rounded-[36px] bg-surface px-7 py-2.5">
          <h2 className="mb-1.5 mt-[18px] text-2xl font-normal">Payments received</h2>
          {months.size === 0 && <p className="border-t border-line py-4 text-muted">No payments yet.</p>}
          {[...months.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([k, m]) => (
            <div key={k} className="flex flex-wrap items-center gap-3.5 border-t border-line py-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-field"><Icon name="receipt" size={20} /></span>
              <span className="flex-[1_1_220px]"><span className="block text-[17px]">{m.label}</span><span className="text-sm text-muted">{m.detail.join(' · ')}</span></span>
              <span className="text-[17px] font-medium">{exact(m.amount)}</span>
            </div>
          ))}
          <h2 className="mb-1.5 mt-6 text-2xl font-normal">Statements</h2>
          {list.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3.5 border-t border-line py-4">
              <span className="flex-[1_1_220px]"><span className="block text-[17px]">{i.ref} statement</span><span className="text-sm text-muted">Schedule and payments to date</span></span>
              <a href={`${API}/api/v1/investor/statements/${i.id}.pdf`} aria-label={`Download the ${i.ref} statement`} className="inline-flex h-11 items-center gap-1.5 rounded-full bg-field px-[18px] text-sm"><Icon name="download" size={16} />PDF</a>
            </div>
          ))}
        </section>
        <aside className="flex min-w-0 flex-[1_1_360px] flex-col gap-3.5">
          <section className="flex flex-col gap-3 rounded-[36px] bg-surface p-6">
            <h2 className="m-0 text-2xl font-normal">Signed agreements</h2>
            {list.map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-[22px] bg-field px-4 py-3.5">
                <span className="flex-1"><span className="block">{i.ref} agreement</span><span className="text-sm text-muted">Started {new Date(i.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                <button type="button" onClick={() => agreement(i.id)} className="h-10 rounded-full bg-surface px-3.5 text-sm">Open</button>
              </div>
            ))}
          </section>
          <section className="flex flex-col gap-2 rounded-[36px] bg-dark p-6 text-surface">
            <span className="text-lg">Tax documents</span>
            <span className="text-[15px] leading-normal text-white/80">[Annual interest certificate and TDS details, format to be confirmed with the CA]</span>
          </section>
        </aside>
      </div>
    </>
  );
}
