'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageTitle } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { docLabel } from '@/lib/admin';
import { api, ApiError } from '@/lib/api-client';
import { formatDate, formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

interface QueueDoc {
  id: string; type: string; numberMasked: string; status: 'PENDING' | 'VERIFIED' | 'REJECTED'; createdAt: string;
  user: { id: string; fullName: string | null; phone: string }; nextPickup: { bookingId: string; code: string; startAt: string } | null;
}
const REASONS = ['Photo blurry', 'Corners cut off', 'Name does not match', 'Document expired'];

/** KYC review queue. Files open through 5-minute signed links; every decision goes to audit_logs. */
export default function CustomersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const { data } = useQuery({ queryKey: ['admin', 'kyc', tab], queryFn: () => api.get<QueueDoc[]>(`/admin/kyc?status=${tab}`) });
  const [sel, setSel] = useState<string | null>(null);
  const [reason, setReason] = useState(REASONS[0]!);
  const [other, setOther] = useState('');
  const [error, setError] = useState<string | null>(null);
  const list = data ?? [];
  const cur = list.find((d) => d.id === sel) ?? list[0];
  const file = useQuery({ queryKey: ['admin', 'kyc-file', cur?.id], enabled: !!cur, queryFn: () => api.get<{ url: string }>(`/admin/kyc/${cur!.id}/file`), staleTime: 240_000 });

  async function decide(status: 'VERIFIED' | 'REJECTED') {
    if (!cur) return;
    setError(null);
    try {
      await api.patch(`/admin/kyc/${cur.id}`, { status, note: status === 'REJECTED' ? (other.trim() || reason) : undefined });
      setSel(null); setOther('');
      qc.invalidateQueries({ queryKey: ['admin'] });
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Could not save'); }
  }
  const isPdf = file.data?.url.includes('.pdf');

  return (
    <>
      <PageTitle title="Customers & documents" sub={tab === 'PENDING' ? `${list.length} waiting for review${list.some((d) => d.nextPickup) ? ' · earliest pickup first' : ''}` : `${list.length} ${tab.toLowerCase()}`}>
        <div className="flex gap-1 rounded-full bg-surface p-[5px]">
          {(['PENDING', 'VERIFIED', 'REJECTED'] as const).map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => { setTab(t); setSel(null); }} className={cn('h-10 rounded-full px-4 text-sm', tab === t && 'bg-ink text-surface')}>{t === 'PENDING' ? 'To review' : t === 'VERIFIED' ? 'Verified' : 'Rejected'}</button>)}
        </div>
      </PageTitle>
      <div className="flex flex-wrap items-start gap-4">
        <section aria-label="Review queue" className="flex min-w-0 flex-[1_1_280px] flex-col gap-1.5 rounded-sheet bg-surface p-3">
          {list.length === 0 && <p className="p-3 text-muted">{tab === 'PENDING' ? 'Nothing to review.' : 'None.'}</p>}
          {[...list].sort((a, b) => (a.nextPickup?.startAt ?? '9').localeCompare(b.nextPickup?.startAt ?? '9')).map((d) => {
            const on = d.id === cur?.id;
            return (
              <button key={d.id} type="button" aria-pressed={on} onClick={() => setSel(d.id)} className={cn('flex items-center gap-3 rounded-[22px] p-3.5 text-left', on ? 'bg-ink text-surface' : 'hover:bg-field')}>
                <span className={cn('flex h-10 w-10 flex-none items-center justify-center rounded-full text-[15px] font-medium', on ? 'bg-surface text-ink' : 'bg-field')}>{(d.user.fullName ?? '?')[0]}</span>
                <span className="min-w-0 flex-1"><span className="block">{d.user.fullName ?? d.user.phone}</span><span className="text-[13px] opacity-75">{docLabel[d.type]} · {formatDateTime(d.createdAt)}</span></span>
                {d.nextPickup && <span className="text-[13px]">{formatDate(d.nextPickup.startAt)}</span>}
              </button>
            );
          })}
        </section>
        {cur && (
          <section aria-label="Document" className="flex min-w-0 flex-[999_1_460px] flex-col gap-4 rounded-sheet bg-surface p-[22px]">
            <div className="flex flex-wrap items-center justify-between gap-2.5"><h2 className="m-0 text-[22px] font-normal">{cur.user.fullName ?? cur.user.phone} · {docLabel[cur.type]}</h2>{cur.nextPickup && <span className="text-sm text-muted">Next pickup {formatDateTime(cur.nextPickup.startAt)} · {cur.nextPickup.code}</span>}</div>
            <a href={file.data?.url} target="_blank" rel="noreferrer" className="flex h-[300px] items-center justify-center overflow-hidden rounded-3xl bg-dark text-sm text-white/80">
              {!file.data ? 'Loading…' : isPdf ? 'PDF · open in a new tab' : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.data.url} alt={`${docLabel[cur.type]} uploaded by ${cur.user.fullName ?? 'the customer'}`} className="h-full w-full object-contain" />
              )}
            </a>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] gap-2.5">
              <label className="label text-[13px]">Customer<Input readOnly value={`${cur.user.fullName ?? ''} · ${cur.user.phone}`} /></label>
              <label className="label text-[13px]">Number (only last 4 kept)<Input readOnly value={cur.numberMasked} /></label>
            </div>
            {cur.status === 'PENDING' ? (
              <div className="flex flex-col gap-2.5">
                <span className="text-sm text-muted">Reject reason (shown to the customer)</span>
                <div className="flex flex-wrap gap-2">{REASONS.map((r) => <button key={r} type="button" aria-pressed={reason === r && !other} onClick={() => { setReason(r); setOther(''); }} className={cn('h-[42px] rounded-full px-4 text-sm', reason === r && !other ? 'bg-ink text-surface' : 'bg-field')}>{r}</button>)}</div>
                <Input placeholder="Or write a reason" value={other} onChange={(e) => setOther(e.target.value)} />
                {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
                <div className="mt-1 flex flex-wrap gap-2.5"><Button size="lg" onClick={() => decide('VERIFIED')}>Approve</Button><Button size="lg" variant="tint" onClick={() => decide('REJECTED')}>Reject and ask again</Button></div>
              </div>
            ) : <div role="status" className="rounded-[22px] bg-field px-[18px] py-4 text-[15px]">{cur.status === 'VERIFIED' ? 'Verified' : 'Rejected'}</div>}
            <span className="text-[13px] text-muted">Files open through 5-minute signed links. Every decision is written to the audit log.</span>
          </section>
        )}
      </div>
    </>
  );
}
