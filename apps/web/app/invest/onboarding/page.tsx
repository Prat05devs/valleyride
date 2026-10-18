'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/brand/icon';
import { NotInvestor, useInvestments } from '@/components/investor/portal';
import { SiteHeader } from '@/components/layout/site-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface Profile { name: string | null; panMasked: string | null; bankAccountRef: string | null; kycStatus: string }

/** Phase 4 onboarding for an invited investor: PAN, bank account, then the agreement, which our team prepares and signs with them. */
export default function OnboardingPage() {
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ['investor-profile'], queryFn: () => api.get<Profile>('/investor/profile'), retry: false });
  const investments = useInvestments();
  const p = profile.data;
  const step = !p?.panMasked ? 1 : !p.bankAccountRef ? 2 : (investments.data?.length ?? 0) === 0 ? 3 : 4;
  const [pan, setPan] = useState('');
  const [bank, setBank] = useState({ holder: '', ifsc: '', accountNumber: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(body: object) {
    setBusy(true); setError(null);
    try { await api.patch('/investor/profile', body); await qc.invalidateQueries({ queryKey: ['investor-profile'] }); }
    catch (e) { setError(e instanceof ApiError ? (e.code === 'VALIDATION' ? 'Check the details and try again.' : e.message) : 'Could not save'); } finally { setBusy(false); } // CAPITAL_CLOSED explains that onboarding opens after legal review
  }

  const steps = ['Identity', 'Bank account', 'Review agreement', 'Sign'];
  return (
    <div className="pb-20">
      <SiteHeader active="capital" />
      <main className="mx-auto flex max-w-[1000px] flex-col gap-5 px-4 pt-6 sm:px-6">
        <div role="note" className="flex items-center gap-2.5 self-start rounded-full bg-orange-tint px-[18px] py-3 text-[15px] text-orange-ink"><span className="h-2 w-2 rounded-full bg-orange" />Phase 4 · opens only after legal and CA sign-off</div>
        <div><h1 className="m-0 text-[44px] font-normal tracking-[-0.7px]">Become an investor</h1><p className="mt-1.5 text-[17px] text-muted">We need these details before an agreement can be prepared.</p></div>
        {profile.error ? <NotInvestor error={profile.error} /> : (
          <>
            <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(180px,100%),1fr))] gap-2.5 p-0">
              {steps.map((s, i) => {
                const n = i + 1, done = n < step, on = n === step;
                return (
                  <li key={s} aria-current={on ? 'step' : undefined} className={cn('flex items-center gap-2.5 rounded-3xl px-4 py-3.5', on ? 'bg-ink text-surface' : 'bg-surface', !done && !on && 'text-muted')}>
                    <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-[15px]', done ? 'bg-ink text-surface' : on ? 'bg-orange font-medium text-ink' : 'bg-field')}>{done ? <Icon name="check" size={16} strokeWidth={2} /> : n}</span>{s}
                  </li>
                );
              })}
            </ol>
            {p?.panMasked && <div className="flex items-center gap-3 rounded-3xl bg-surface px-5 py-4"><Icon name="check" />PAN {p.panMasked} {p.kycStatus === 'VERIFIED' ? 'verified' : 'received, being checked'} · we store only the masked number</div>}
            {p?.bankAccountRef && <div className="flex items-center gap-3 rounded-3xl bg-surface px-5 py-4"><Icon name="check" />Repayments to {p.bankAccountRef}</div>}

            {step === 1 && (
              <form className="flex flex-col gap-[18px] rounded-[36px] bg-surface p-8" onSubmit={(e) => { e.preventDefault(); save({ pan }); }}>
                <div><h2 className="m-0 text-[28px] font-normal">Your PAN</h2><p className="mt-1.5 text-[15px] text-muted">Needed for the agreement and tax documents. We keep only the last 4 characters.</p></div>
                <label className="label max-w-[360px]">PAN<Input className="h-[58px] uppercase tracking-[1px]" value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} maxLength={10} placeholder="ABCDE1234F" /></label>
                {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
                <Button size="lg" className="self-end" disabled={busy || !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)}>Save and continue</Button>
              </form>
            )}
            {step === 2 && (
              <form className="flex flex-col gap-[18px] rounded-[36px] bg-surface p-8" onSubmit={(e) => { e.preventDefault(); save({ bank: { holder: bank.holder, ifsc: bank.ifsc, accountNumber: bank.accountNumber } }); }}>
                <div><h2 className="m-0 text-[28px] font-normal">Bank account for repayments</h2><p className="mt-1.5 text-[15px] text-muted">Repayments are paid only to an account in your name.</p></div>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3.5">
                  <label className="label">Account holder name<Input className="h-[58px]" value={bank.holder} onChange={(e) => setBank({ ...bank, holder: e.target.value })} /></label>
                  <label className="label">IFSC<Input className="h-[58px] uppercase tracking-[1px]" value={bank.ifsc} maxLength={11} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} /></label>
                  <label className="label">Account number<Input className="h-[58px]" type="password" inputMode="numeric" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value.replace(/\D/g, '') })} /></label>
                  <label className="label">Confirm account number<Input className="h-[58px]" type="password" inputMode="numeric" value={bank.confirm} onChange={(e) => setBank({ ...bank, confirm: e.target.value.replace(/\D/g, '') })} /></label>
                </div>
                {bank.confirm && bank.confirm !== bank.accountNumber && <p className="m-0 text-sm text-orange-ink">The account numbers don&apos;t match.</p>}
                {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <span className="text-sm text-muted">We verify the account before the first repayment.</span>
                  <Button size="lg" disabled={busy || bank.holder.trim().length < 2 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc) || bank.accountNumber.length < 9 || bank.accountNumber !== bank.confirm}>Save and continue</Button>
                </div>
              </form>
            )}
            {step >= 3 && (
              <section className="flex flex-col items-start gap-3 rounded-[36px] bg-surface p-8">
                <h2 className="m-0 text-[28px] font-normal">{step === 3 ? 'Your agreement is being prepared' : 'You are all set'}</h2>
                <p className="m-0 text-[15px] leading-normal text-muted">{step === 3
                  ? 'Our team prepares the agreement once legal and CA review is complete, and goes through it with you before you sign. It will appear in your portal after signing.'
                  : 'Your signed agreements, schedules and statements are in the portal.'}</p>
                <Link href="/invest/portal" className="inline-flex h-12 items-center rounded-full bg-ink px-6 text-surface">Go to the portal</Link>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
