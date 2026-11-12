'use client';

import { useState } from 'react';
import { INVEST_PHONE_DISPLAY, INVEST_TEL_URL, investWhatsAppUrl } from '@/lib/legal';
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
          <p className="m-0 text-sm text-muted">Our team replies with the agreement and the bank details for the transfer. Call or WhatsApp <a href={INVEST_TEL_URL} className="text-ink underline">{INVEST_PHONE_DISPLAY}</a> (investments only).</p>
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

      <Schedule principal={principal} />
    </>
  );
}

/**
 * The 18 payments at a glance: every month pays the same interest and the last one adds the principal, so a summary
 * with a month strip says it all without a scrolling table; the full month-by-month list expands inline.
 * The last month's interest takes the rounding (₹1,666.67 × 17 + ₹1,666.61 = ₹30,000), so the payments add up
 * exactly to the totals shown above.
 */
function Schedule({ principal }: { principal: number }) {
  const f = planFigures(principal);
  const last = Math.round((f.totalInterest - f.monthlyInterest * (LOCK_IN_MONTHS - 1)) * 100) / 100;
  const months = Array.from({ length: LOCK_IN_MONTHS }, (_, i) => i + 1);
  const pay = (m: number) => (m === LOCK_IN_MONTHS ? last + principal : f.monthlyInterest);
  return (
    <section aria-labelledby="schedule-title" className="flex flex-col gap-5 rounded-[36px] bg-surface p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2.5">
        <h2 id="schedule-title" className="m-0 text-[26px] font-normal">Payment schedule</h2>
        <span className="text-sm text-muted">{lakh(principal)} plan · {LOCK_IN_MONTHS} monthly payments</span>
      </div>

      {/* One block per month: grey = interest only, dark = interest plus your principal back. */}
      <ol aria-label="Months" className="m-0 grid list-none grid-cols-9 gap-1.5 p-0 sm:grid-cols-[repeat(18,minmax(0,1fr))]">
        {months.map((m) => (
          <li key={m} className="flex flex-col items-center gap-1">
            <span className={cn('block h-10 w-full rounded-[10px] sm:h-14', m === LOCK_IN_MONTHS ? 'bg-ink' : 'bg-orange-tint')} />
            <span className={cn('text-xs', m === LOCK_IN_MONTHS ? 'font-medium text-ink' : 'text-muted')}>{m}</span>
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[22px] bg-field px-5 py-4">
          <div className="flex items-center gap-3"><span aria-hidden className="h-3 w-3 shrink-0 rounded-full bg-orange-tint ring-1 ring-orange/40" />
            <div><div className="font-medium">Months 1–{LOCK_IN_MONTHS - 1}</div><div className="text-sm text-muted">Interest only, every month</div></div></div>
          <div className="text-right"><div className="text-xl font-medium">{inr(f.monthlyInterest, true)}<span className="text-sm font-normal text-muted"> / month</span></div></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[22px] bg-ink px-5 py-4 text-surface">
          <div className="flex items-center gap-3"><span aria-hidden className="h-3 w-3 shrink-0 rounded-full bg-surface" />
            <div><div className="font-medium">Month {LOCK_IN_MONTHS}</div><div className="text-sm text-white/75">Last interest {inr(last, true)} + your {lakh(principal)} back</div></div></div>
          <div className="text-xl font-medium">{inr(last + principal, true)}</div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 px-5 pt-1">
          <span className="text-muted">Total you receive over {LOCK_IN_MONTHS} months</span>
          <span className="text-xl font-medium">{inr(f.totalReceived)}</span>
        </div>
      </div>

      <details className="group rounded-[22px] border border-line">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-[15px] [&::-webkit-details-marker]:hidden">
          <span>See every month</span><span aria-hidden className="text-muted transition-transform group-open:rotate-180">⌄</span>
        </summary>
        <ul className="m-0 grid list-none grid-cols-1 gap-x-8 border-t border-line p-0 px-5 py-2 sm:grid-cols-2">
          {months.map((m) => (
            <li key={m} className={cn('flex items-center justify-between gap-3 border-b border-line py-2.5 text-[15px] last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0', m === LOCK_IN_MONTHS && 'font-medium')}>
              <span className="text-muted">Month {m}</span>
              <span>{m === LOCK_IN_MONTHS ? `${inr(last, true)} + ${inr(principal)} = ${inr(pay(m), true)}` : inr(pay(m), true)}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
