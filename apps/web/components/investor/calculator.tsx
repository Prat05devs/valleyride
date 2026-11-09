'use client';

import { useState } from 'react';
import { investWhatsAppUrl, PHONE_DISPLAY } from '@/lib/legal';
import { cn } from '@/lib/utils';

/**
 * Valley Ride Capital offers exactly two plans on the same terms: 20% a year simple interest, paid every month,
 * with an 18-month fixed lock-in and the principal returned in one payment at the end. Calculated here in the
 * browser, so the page works without the API.
 */
export const PLANS = [100_000, 250_000] as const;
export const ANNUAL_RATE_PCT = 20;
export const LOCK_IN_MONTHS = 18;

const inr = (rupees: number, paise = false) =>
  '₹' + rupees.toLocaleString('en-IN', { minimumFractionDigits: paise ? 2 : 0, maximumFractionDigits: paise ? 2 : 0 });
const lakh = (rupees: number) => `₹${(rupees / 100_000).toLocaleString('en-IN')} lakh`;

export function planFigures(principal: number) {
  const monthlyInterest = Math.round((principal * ANNUAL_RATE_PCT) / 100 / 12 * 100) / 100;
  const totalInterest = (principal * ANNUAL_RATE_PCT * LOCK_IN_MONTHS) / 100 / 12;
  return { principal, monthlyInterest, totalInterest, totalReceived: principal + totalInterest };
}

export function Calculator() {
  const [principal, setPrincipal] = useState<number>(PLANS[0]);
  const f = planFigures(principal);
  const schedule = Array.from({ length: LOCK_IN_MONTHS }, (_, i) => i + 1);

  return (
    <>
      <div className="flex flex-wrap items-stretch gap-5">
        <section aria-label="Choose a plan" className="flex min-w-0 flex-[1_1_400px] flex-col gap-[18px] rounded-[36px] bg-surface p-7">
          <h2 className="m-0 text-[26px] font-normal">Choose your plan</h2>
          <div role="radiogroup" aria-label="Investment amount" className="flex flex-col gap-3">
            {PLANS.map((p) => (
              <button key={p} type="button" role="radio" aria-checked={principal === p} onClick={() => setPrincipal(p)}
                className={cn('flex min-h-[72px] items-center justify-between rounded-3xl border-[1.5px] bg-surface px-[22px] py-3 text-left', principal === p ? 'border-ink' : 'border-line')}>
                <span className="text-[22px] font-medium">{lakh(p)}</span>
                <span className="text-[15px] text-muted">{inr(planFigures(p).monthlyInterest, true)} / month</span>
              </button>
            ))}
          </div>
          <dl className="m-0 grid grid-cols-2 gap-3 text-[15px]">
            <div className="rounded-card bg-field p-4"><dt className="text-muted">Interest</dt><dd className="m-0 mt-1 text-lg font-medium">{ANNUAL_RATE_PCT}% a year</dd></div>
            <div className="rounded-card bg-field p-4"><dt className="text-muted">Fixed lock-in</dt><dd className="m-0 mt-1 text-lg font-medium">{LOCK_IN_MONTHS} months</dd></div>
          </dl>
          <p className="m-0 text-sm text-muted">Only these two amounts are offered. The lock-in is fixed: the principal cannot be withdrawn before {LOCK_IN_MONTHS} months.</p>
          <a href={investWhatsAppUrl(principal)} target="_blank" rel="noreferrer" className="flex min-h-14 items-center justify-center rounded-full bg-ink px-6 text-center text-[17px] text-surface">Invest {lakh(principal)}: message us on WhatsApp</a>
          <p className="m-0 text-sm text-muted">Our team replies with the agreement and the bank details for the transfer. Call or WhatsApp {PHONE_DISPLAY}.</p>
        </section>

        <section aria-label="Your returns" className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
          <div className="flex flex-col gap-1.5 rounded-[36px] bg-dark p-7 text-surface">
            <span className="text-[15px] text-white/80">Interest paid to you every month</span>
            <span className="text-[56px] font-medium tracking-[-1px]">{inr(f.monthlyInterest, true)}</span>
            <span className="text-[15px] text-white/80">for {LOCK_IN_MONTHS} months, then your {lakh(principal)} principal is returned after {LOCK_IN_MONTHS} months</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-3">
            {([['You invest', f.principal], [`Interest over ${LOCK_IN_MONTHS} months`, f.totalInterest], [`Principal back in month ${LOCK_IN_MONTHS}`, f.principal], ['Total you receive', f.totalReceived]] as const).map(([l, v]) => (
              <div key={l} className="rounded-card bg-surface p-5"><div className="text-sm text-muted">{l}</div><div className="mt-1 text-2xl font-medium">{inr(v)}</div></div>
            ))}
          </div>
          <div role="note" className="rounded-card bg-orange-tint px-[22px] py-5 text-[15px] leading-[1.55] text-orange-ink">
            Simple interest at {ANNUAL_RATE_PCT}% a year, paid monthly ({ANNUAL_RATE_PCT}% ÷ 12 of the principal each month), before any TDS or taxes.
            The principal is repaid in full at the end of the {LOCK_IN_MONTHS}-month lock-in. Final terms are set by the signed agreement.
            Payments depend on the business&apos;s ability to pay and are not guaranteed by a bank or regulator.
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-3.5 rounded-[36px] bg-surface p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2.5"><h2 className="m-0 text-[26px] font-normal">Payment schedule</h2><span className="text-sm text-muted">{lakh(principal)} plan · {LOCK_IN_MONTHS} monthly payments</span></div>
        <div className="max-h-[460px] overflow-auto rounded-[20px] border border-line">
          <table className="w-full min-w-[560px] border-collapse text-[15px]">
            <thead><tr className="bg-field text-right text-[13px] text-muted">{['Month', 'Interest', 'Principal returned', 'Payment to you'].map((h, i) => <th key={h} className={cn('px-3.5 py-3 font-normal', i === 0 && 'text-left')}>{h}</th>)}</tr></thead>
            <tbody>
              {schedule.map((m) => {
                const back = m === LOCK_IN_MONTHS ? principal : 0;
                return (
                  <tr key={m} className={cn('border-t border-line text-right', back && 'bg-field')}>
                    <td className="px-3.5 py-[11px] text-left text-muted">{m}</td>
                    <td className="px-3.5 py-[11px]">{inr(f.monthlyInterest, true)}</td>
                    <td className="px-3.5 py-[11px]">{back ? inr(back) : '—'}</td>
                    <td className="px-3.5 py-[11px] font-medium">{inr(f.monthlyInterest + back, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
