'use client';

import type { PresignedUpload } from '@valleyride/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { PageTitle, Panel } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';
import { newIdempotencyKey } from '@/lib/hold';
import { formatDay } from '@/lib/format';

interface Investor { id: string; name: string | null; phone: string | null; panMasked: string | null; kycStatus: string }
interface Inv { id: string; ref: string; investor: string | null; principalPaise: number; annualRatePct: number; tenureMonths: number; structure: string; paidCount: number; status: string }
interface Due { id: string; ref: string; investor: string | null; installmentNo: number; tenureMonths: number; structure: string; dueDate: string; paymentPaise: number; status: string; txnRef: string | null }

const exact = (p: number) => '₹' + (p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const whole = (p: number) => '₹' + Math.round(p / 100).toLocaleString('en-IN');

/** Phase 4, only after legal and CA sign-off: record signed investments and reconcile repayments by UTR. */
export default function InvestorsAdminPage() {
  const qc = useQueryClient();
  const month = new Date(Date.now() + 5.5 * 3_600_000).toISOString().slice(0, 7);
  const investors = useQuery({ queryKey: ['admin', 'investors'], queryFn: () => api.get<Investor[]>('/admin/investors') });
  const investments = useQuery({ queryKey: ['admin', 'investments'], queryFn: () => api.get<Inv[]>('/admin/investments') });
  const dues = useQuery({ queryKey: ['admin', 'dues', month], queryFn: () => api.get<Due[]>(`/admin/repayments?month=${month}`) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin'] });
  if (investors.error) return <><PageTitle title="Investors" /><p className="rounded-sheet bg-surface p-6">{(investors.error as Error).message}</p></>;
  const left = (dues.data ?? []).filter((d) => d.status !== 'PAID').length;

  return (
    <>
      <PageTitle eyebrow={<span className="text-orange-ink">Phase 4 · only after legal and CA sign-off</span>} title="Investors">
        <Link href="/invest/portal" className="inline-flex h-12 items-center rounded-full bg-surface px-5 text-[15px]">See the investor&apos;s view</Link>
      </PageTitle>
      <Panel title="Due this month" action={<span className="text-sm text-muted">{new Date(`${month}-01`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} · {left ? `${left} to pay` : 'all paid'}</span>} className="gap-1.5">
        {dues.data?.length === 0 && <p className="m-0 border-t border-line py-3.5 text-muted">Nothing due this month.</p>}
        {dues.data?.map((d) => <DueRow key={d.id} d={d} onPaid={refresh} />)}
      </Panel>
      <div className="flex flex-wrap items-start gap-4">
        <Panel title="Investments" className="min-w-0 flex-[999_1_420px] overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead><tr className="text-left text-[13px] text-muted"><th className="px-2 py-2.5 font-normal">Ref</th><th className="px-2 py-2.5 font-normal">Investor</th><th className="px-2 py-2.5 text-right font-normal">Principal</th><th className="px-2 py-2.5 font-normal">Terms</th><th className="px-2 py-2.5 font-normal">Progress</th></tr></thead>
            <tbody>
              {investments.data?.length === 0 && <tr><td colSpan={5} className="px-2 py-3 text-muted">None recorded.</td></tr>}
              {investments.data?.map((i) => (
                <tr key={i.id} className="border-t border-line"><td className="px-2 py-3 font-medium">{i.ref}</td><td className="px-2 py-3">{i.investor}</td><td className="px-2 py-3 text-right">{whole(i.principalPaise)}</td>
                  <td className="px-2 py-3 text-muted">{i.annualRatePct}% · {i.tenureMonths} mo · {i.structure === 'amortizing' ? 'equal instalments' : 'interest only'}</td><td className="px-2 py-3">{i.status === 'CLOSED' ? 'Closed' : `${i.paidCount} of ${i.tenureMonths} paid`}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
          <RecordInvestment investors={investors.data ?? []} onDone={refresh} />
          <AddInvestor onDone={refresh} />
        </div>
      </div>
    </>
  );
}

function DueRow({ d, onPaid }: { d: Due; onPaid: () => void }) {
  const [utr, setUtr] = useState('');
  const [key] = useState(newIdempotencyKey);
  const [error, setError] = useState<string | null>(null);
  const late = d.status !== 'PAID' && d.dueDate < new Date().toISOString().slice(0, 10);
  async function pay() {
    setError(null);
    try { await api.post(`/admin/repayments/${d.id}/mark-paid`, { txnRef: utr.trim() }, { idempotencyKey: key }); onPaid(); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not save'); }
  }
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line py-3.5">
      <span className="flex-[1_1_220px]"><span className="block">{d.investor} · {d.ref}</span><span className={`text-sm ${late ? 'text-orange-ink' : 'text-muted'}`}>{d.structure === 'amortizing' ? 'Instalment' : 'Interest'} {d.installmentNo} of {d.tenureMonths} · due {formatDay(d.dueDate)}</span></span>
      <span className="text-lg font-medium">{exact(d.paymentPaise)}</span>
      {d.status === 'PAID' ? <span className="inline-flex h-8 items-center rounded-full bg-ink px-3 text-[13px] text-surface">PAID · UTR ••{d.txnRef?.slice(-4)}</span> : (
        <label className="flex h-[46px] items-center gap-2 rounded-full bg-field py-0 pl-4 pr-1.5 text-[13px] text-muted">UTR
          <input placeholder="Bank reference" value={utr} onChange={(e) => setUtr(e.target.value)} className="w-[130px] border-0 bg-transparent text-sm text-ink outline-none" />
          <button type="button" disabled={utr.trim().length < 4} onClick={pay} className="h-9 rounded-full bg-ink px-3.5 text-[13px] text-surface disabled:bg-disabled">Mark paid</button>
        </label>
      )}
      {error && <span className="w-full text-sm text-orange-ink">{error}</span>}
    </div>
  );
}

function RecordInvestment({ investors, onDone }: { investors: Investor[]; onDone: () => void }) {
  const [f, setF] = useState({ investorId: '', principal: '', rate: '', months: '', start: '', structure: 'amortizing' });
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState(newIdempotencyKey);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setBusy(true); setError(null);
    try {
      let agreementFileKey: string | undefined;
      if (file) {
        const p = await api.post<PresignedUpload>('/admin/investments/agreement/presign', {});
        const r = await fetch(p.uploadUrl, { method: 'PUT', headers: p.headers, body: file });
        if (!r.ok) throw new Error('The agreement upload failed.');
        agreementFileKey = p.fileKey;
      }
      await api.post('/admin/investments', {
        investorId: f.investorId || investors[0]?.id, principalPaise: Math.round(Number(f.principal) * 100), annualRatePct: Number(f.rate),
        tenureMonths: Number(f.months), structure: f.structure, startDate: f.start, agreementFileKey,
      }, { idempotencyKey: key });
      setF({ investorId: '', principal: '', rate: '', months: '', start: '', structure: 'amortizing' }); setFile(null); setKey(newIdempotencyKey()); onDone();
    } catch (e) { setError(e instanceof ApiError ? (e.code === 'CAPITAL_CLOSED' ? 'Recording investments is switched off until legal and CA sign-off (CAPITAL_PORTAL_ENABLED).' : e.details ? 'Check the amounts and dates.' : e.message) : (e as Error).message); } finally { setBusy(false); }
  }
  const valid = investors.length > 0 && Number(f.principal) > 0 && f.rate !== '' && Number(f.months) > 0 && !!f.start;
  return (
    <form aria-label="Record a signed investment" className="flex flex-col gap-2.5 rounded-sheet bg-surface p-[22px]" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <h2 className="m-0 mb-1 text-xl font-normal">Record a signed investment</h2>
      <label className="label text-[13px]">Investor<Select value={f.investorId} onChange={(e) => setF({ ...f, investorId: e.target.value })}>
        {investors.length === 0 && <option value="">Add an investor first</option>}
        {investors.map((i) => <option key={i.id} value={i.id}>{i.name} · {i.panMasked ? `PAN ${i.kycStatus === 'VERIFIED' ? 'verified' : 'received'}` : 'no PAN'}</option>)}</Select></label>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="label text-[13px]">Principal (₹)<Input type="number" placeholder="250000" value={f.principal} onChange={(e) => setF({ ...f, principal: e.target.value })} /></label>
        <label className="label text-[13px]">Annual rate (%)<Input type="number" step="0.5" placeholder="21" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></label>
        <label className="label text-[13px]">Tenure (months)<Input type="number" placeholder="18" value={f.months} onChange={(e) => setF({ ...f, months: e.target.value })} /></label>
        <label className="label text-[13px]">Start date<Input type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label>
      </div>
      <label className="label text-[13px]">Structure<Select value={f.structure} onChange={(e) => setF({ ...f, structure: e.target.value })}><option value="amortizing">Equal monthly instalments</option><option value="interest_only">Interest only, principal at maturity</option></Select></label>
      <label className="label text-[13px]">Signed agreement (PDF)<input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="px-1 py-2.5 text-sm text-ink" /></label>
      {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
      <Button type="submit" disabled={!valid || busy}>{busy ? 'Saving…' : 'Save and build schedule'}</Button>
    </form>
  );
}

function AddInvestor({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: '', phone: '', pan: '' });
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<{ phone: string; temporaryPassword: string | null } | null>(null);
  async function save() {
    setError(null); setAdded(null);
    try {
      const r = await api.post<{ phone: string; temporaryPassword: string | null }>('/admin/investors', { fullName: f.name, phone: `+91${f.phone.replace(/\D/g, '')}`, pan: f.pan || undefined });
      setAdded(r); setF({ name: '', phone: '', pan: '' }); onDone();
    }
    catch (e) { setError(e instanceof ApiError ? (e.code === 'CAPITAL_CLOSED' ? 'Adding investors is switched off until legal and CA sign-off (CAPITAL_PORTAL_ENABLED).' : e.details ? 'Check the phone and PAN.' : e.message) : 'Could not add'); }
  }
  return (
    <form aria-label="Add an investor" className="flex flex-col gap-2.5 rounded-sheet bg-surface p-[22px]" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <h2 className="m-0 mb-1 text-xl font-normal">Add an investor</h2>
      <label className="label text-[13px]">Full name<Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="label text-[13px]">Mobile (+91)<Input inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
      <label className="label text-[13px]">PAN (optional, only last 4 kept)<Input className="uppercase" maxLength={10} value={f.pan} onChange={(e) => setF({ ...f, pan: e.target.value.toUpperCase() })} /></label>
      {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
      {added && (
        <p role="status" className="m-0 rounded-[18px] bg-field p-3 text-sm">
          {added.temporaryPassword
            ? <>Added. Send them their temporary password: <span className="select-all font-mono text-base">{added.temporaryPassword}</span>. It is shown only once; they can change it under Profile.</>
            : <>Added. They already have an account, so they log in with their own password.</>}
        </p>
      )}
      <Button type="submit" variant="field" disabled={f.name.trim().length < 2 || f.phone.length !== 10}>Add investor</Button>
      <span className="text-[13px] text-muted">They log in with this number and a password to see the portal.</span>
    </form>
  );
}
