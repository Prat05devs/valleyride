'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface Row { installmentNo: number; dueDate: string; openingPaise: number; interestPaise: number; principalPaise: number; paymentPaise: number; closingPaise: number }
interface Result { monthlyPaymentPaise: number; finalPaymentPaise: number; totalPaidPaise: number; totalInterestPaise: number; principalPaise: number; schedule: Row[]; disclaimer: string }

const inr = (p: number) => '₹' + Math.round(p / 100).toLocaleString('en-IN');
const START = '2026-11-01';
const STRUCTS = [
  { id: 'amortizing', label: 'Equal monthly instalments (principal + interest)' },
  { id: 'interest_only', label: 'Monthly interest only, principal repaid at maturity' },
] as const;

/** POST /investor/calculate: the same amortization code the portal uses. Nothing is stored. */
export function Calculator() {
  const [amount, setAmount] = useState(250000);
  const [rate, setRate] = useState(21);
  const [months, setMonths] = useState(18);
  const [structure, setStructure] = useState<'amortizing' | 'interest_only'>('amortizing');
  const [input, setInput] = useState({ amount, rate, months, structure });
  useEffect(() => { const h = setTimeout(() => setInput({ amount, rate, months, structure }), 250); return () => clearTimeout(h); }, [amount, rate, months, structure]);
  const valid = Number.isFinite(input.amount) && input.amount >= 10000 && input.amount <= 10_00_00_000 && input.rate >= 0 && input.rate <= 50 && input.months >= 6 && input.months <= 36;
  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ['calc', input], enabled: valid, placeholderData: (prev) => prev,
    queryFn: () => api.post<Result>('/investor/calculate', { principalPaise: Math.round(input.amount * 100), annualRatePct: input.rate, months: input.months, structure: input.structure, startDate: START }),
  });

  const field = 'field h-[58px] px-[22px] text-lg';
  return (
    <>
      <div className="flex flex-wrap items-stretch gap-5">
        <form aria-label="Calculator" className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px] rounded-[36px] bg-surface p-7" onSubmit={(e) => e.preventDefault()}>
          <h2 className="m-0 text-[26px] font-normal">Calculator</h2>
          <label className="label">Investment amount (₹)<input type="number" min={10000} step={10000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={field} /></label>
          <label className="label">Proposed annual rate (%)<input type="number" min={0} max={50} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))} className={field} /></label>
          <label className="label gap-2.5"><span className="flex justify-between">Tenure<span className="text-base text-ink">{months} months</span></span>
            <input type="range" min={6} max={36} step={1} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full accent-ink" /></label>
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" role="radiogroup">
            <legend className="mb-2 text-sm text-muted">Repayment structure</legend>
            {STRUCTS.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={structure === s.id} onClick={() => setStructure(s.id)}
                className={cn('min-h-14 rounded-3xl border-[1.5px] bg-surface px-[18px] py-2.5 text-left text-[15px]', structure === s.id ? 'border-ink' : 'border-line')}>{s.label}</button>
            ))}
          </fieldset>
          <span className="text-sm text-muted">Agreement start date: 1 Nov 2026 (illustration)</span>
          {!valid && <p role="alert" className="m-0 text-sm text-orange-ink">Enter an amount from ₹10,000 to ₹10 crore and a rate from 0% to 50%.</p>}
          {isError && <p role="alert" className="m-0 text-sm text-orange-ink">Could not calculate this illustration. <button type="button" className="underline" onClick={() => void refetch()}>Try again</button></p>}
        </form>

        <section aria-label="Illustration" className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
          <div className="flex flex-col gap-1.5 rounded-[36px] bg-dark p-7 text-surface">
            <span className="text-[15px] text-white/80">{structure === 'amortizing' ? 'Illustrative monthly instalment' : 'Illustrative monthly interest'}</span>
            <span className="text-[56px] font-medium tracking-[-1px]">{valid && data && !isFetching && !isError ? inr(data.monthlyPaymentPaise) : '—'}</span>
            {isFetching && <span role="status">Updating illustration…</span>}
            <span className="text-[15px] text-white/80">Illustration only, before any fees or taxes</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3">
            {[['Total paid over tenure', data?.totalPaidPaise], ['Total interest', data?.totalInterestPaise], ['Principal returned', data?.principalPaise], ['Final payment', data?.finalPaymentPaise]].map(([l, v]) => (
              <div key={l as string} className="rounded-card bg-surface p-5"><div className="text-sm text-muted">{l}</div><div className="mt-1 text-2xl font-medium">{typeof v === 'number' ? inr(v) : '—'}</div></div>
            ))}
          </div>
          <div role="note" className="rounded-card bg-orange-tint px-[22px] py-5 text-[15px] leading-[1.55] text-orange-ink">
            Illustrative commercial terms only. Returns and repayment of principal are <span className="font-medium">not guaranteed</span>. They depend on the final agreement, the legal structure and the business&apos;s ability to pay. The calculation assumes end-of-month payments, a constant monthly rate (annual ÷ 12), and no fees or taxes.
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3.5 rounded-[36px] bg-surface p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5"><h2 className="m-0 text-[26px] font-normal">Repayment schedule</h2><span className="text-sm text-muted">{months} instalments · illustration</span></div>
        <div className="max-h-[460px] overflow-auto rounded-[20px] border border-line">
          <table className="w-full min-w-[760px] border-collapse text-[15px]">
            <thead><tr className="bg-field text-right text-[13px] text-muted">{['#', 'Due date', 'Opening', 'Interest', 'Principal', 'Payment', 'Closing'].map((h, i) => <th key={h} className={cn('px-3.5 py-3 font-normal', i < 2 && 'text-left')}>{h}</th>)}</tr></thead>
            <tbody>
              {data?.schedule.map((r) => (
                <tr key={r.installmentNo} className="border-t border-line text-right">
                  <td className="px-3.5 py-[11px] text-left text-muted">{r.installmentNo}</td>
                  <td className="px-3.5 py-[11px] text-left">{new Date(r.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}</td>
                  <td className="px-3.5 py-[11px]">{inr(r.openingPaise)}</td><td className="px-3.5 py-[11px]">{inr(r.interestPaise)}</td><td className="px-3.5 py-[11px]">{inr(r.principalPaise)}</td>
                  <td className="px-3.5 py-[11px] font-medium">{inr(r.paymentPaise)}</td><td className="px-3.5 py-[11px]">{inr(r.closingPaise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
