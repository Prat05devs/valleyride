'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageTitle, Stat } from '@/components/admin/ui';
import { Select } from '@/components/ui/input';
import { api, API_URL } from '@/lib/api-client';
import { shortName } from '@/lib/bikes';
import { formatPaise } from '@/lib/format';

interface Pnl {
  month: string; bookings: number; rentalRevenuePaise: number; extrasPaise: number; cancellationKeptPaise: number; damageRecoveredPaise: number;
  gstCollectedPaise: number; depositsHeldPaise: number; maintenancePaise: number; gatewayFeesPaise: number | null; fixedCostsPaise: number | null;
  investorRepaymentsPaise: number; beforeFixedCostsPaise: number; byModel: { model: string; slug: string; rentalPaise: number }[];
}

const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const short = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });

/** GET /admin/reports/pnl: this month and the one before. Rental is counted by pickup month, extras by return month. */
export default function FinancePage() {
  const now = new Date(Date.now() + 5.5 * 3_600_000);
  const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)); return d.toISOString().slice(0, 7); });
  const [month, setMonth] = useState(months[0]!);
  const { data, error } = useQuery({ queryKey: ['admin', 'pnl', month], queryFn: () => api.get<{ current: Pnl; previous: Pnl }>(`/admin/reports/pnl?month=${month}`) });
  if (error) return <><PageTitle title="Finance" /><p className="rounded-sheet bg-surface p-6">{(error as Error).message}</p></>;
  const c = data?.current; const p = data?.previous;
  const max = Math.max(1, ...(c?.byModel.map((m) => m.rentalPaise) ?? [1]));
  const money = (v: number | null | undefined, neg = false) => (v === null ? <span className="text-orange-ink">[enter]</span> : v === undefined ? '—' : `${neg && v ? '−' : ''}${formatPaise(v)}`);
  const lines: [string, (x: Pnl) => number | null, boolean?][] = [
    ['Rental revenue', (x) => x.rentalRevenuePaise], ['Extra km, late and one-way fees', (x) => x.extrasPaise], ['Cancellation charges kept', (x) => x.cancellationKeptPaise],
    ['Maintenance', (x) => x.maintenancePaise, true], ['Payment gateway fees', (x) => x.gatewayFeesPaise, true], ['Staff, rent, insurance', (x) => x.fixedCostsPaise, true],
    ['Investor repayments', (x) => x.investorRepaymentsPaise, true],
  ];

  return (
    <>
      <PageTitle title="Finance" sub={`${monthLabel(month)}${month === months[0] ? ' to date' : ''}`}>
        <label className="flex h-12 items-center gap-2.5 rounded-full bg-surface px-[18px] text-sm text-muted">Month
          <Select value={month} onChange={(e) => setMonth(e.target.value)} className="h-10 w-auto bg-transparent px-2 pr-8 text-[15px]">{months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}</Select></label>
        <a href={`${API_URL}/api/v1/admin/reports/pnl.csv?month=${month}`} className="inline-flex h-12 items-center rounded-full bg-ink px-5 text-[15px] text-surface">Export CSV</a>
      </PageTitle>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-3">
        <Stat dark label="Rental revenue" value={money(c?.rentalRevenuePaise)} sub="after discounts, before GST" />
        <Stat label="Extra km and fees" value={money(c?.extrasPaise)} sub="extra km, late, one-way" />
        <Stat label="GST collected" value={money(c?.gstCollectedPaise)} sub="to be filed" />
        <Stat label="Deposits held" value={money(c?.depositsHeldPaise)} sub="a liability, not revenue" />
      </div>
      <div className="flex flex-wrap items-stretch gap-4">
        <section aria-label="Rental revenue by model" className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-sheet bg-surface p-6">
          <div><h2 className="m-0 text-xl font-normal">Rental revenue by model</h2><span className="text-sm text-muted">{monthLabel(month)}, after discounts, before GST</span></div>
          <div className="flex h-60 items-end gap-[18px] border-b border-line px-1.5">
            {c?.byModel.map((m) => (
              <div key={m.slug} title={`${m.model}: ${formatPaise(m.rentalPaise)}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-sm font-medium">₹{(m.rentalPaise / 100_000).toFixed(1)}k</span>
                <span className="w-full max-w-14 rounded-t bg-ink" style={{ height: `${Math.round(m.rentalPaise / max * 190)}px` }} />
              </div>
            ))}
          </div>
          <div className="flex gap-[18px] px-1.5">{c?.byModel.map((m) => <span key={m.slug} className="flex-1 text-center text-[13px] text-muted">{shortName(m.model)}</span>)}</div>
        </section>
        <section className="min-w-0 flex-[1_1_380px] overflow-x-auto rounded-sheet bg-surface p-6">
          <h2 className="mb-2.5 mt-0 text-xl font-normal">Profit and loss</h2>
          <table className="w-full min-w-[360px] border-collapse text-[15px]">
            <thead><tr className="text-right text-[13px] text-muted"><th className="p-2.5 text-left font-normal">Line</th><th className="p-2.5 font-normal">{p ? short(p.month) : ''}</th><th className="p-2.5 font-normal">{c ? short(c.month) : ''}</th></tr></thead>
            <tbody>
              {lines.map(([label, f, neg]) => (
                <tr key={label} className="border-t border-line text-right"><td className="p-2.5 text-left">{label}</td><td className="p-2.5">{p ? money(f(p), neg) : '—'}</td><td className="p-2.5">{c ? money(f(c), neg) : '—'}</td></tr>
              ))}
              <tr className="border-t-2 border-ink text-right font-medium"><td className="p-3 text-left">Before fixed costs</td><td className="p-3">{money(p?.beforeFixedCostsPaise)}</td><td className="p-3">{money(c?.beforeFixedCostsPaise)}</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-[13px] text-muted">Gateway fees and fixed costs are not recorded in the system yet. Damage recovered from deposits ({money(c?.damageRecoveredPaise)}) is shown separately from revenue.</p>
        </section>
      </div>
    </>
  );
}
