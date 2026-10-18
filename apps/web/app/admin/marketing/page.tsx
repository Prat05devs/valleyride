'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageTitle } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api-client';
import { formatDay } from '@/lib/format';

interface Coupon { code: string; percentOff: number; maxUses: number | null; used: number; validTill: string | null; partner: string | null }

/** Partner and referral coupons (admin only). Coupons apply after the long-rental discount, before GST. */
export default function CouponsPage() {
  const qc = useQueryClient();
  const { data, error: loadError } = useQuery({ queryKey: ['admin', 'coupons'], queryFn: () => api.get<Coupon[]>('/admin/coupons') });
  const [f, setF] = useState({ code: '', pct: '10', max: '200', till: '', partner: '' });
  const [error, setError] = useState<string | null>(null);
  // Hunter 350, 3 days: ₹3,597 − 10% tier = ₹3,237.30; the example shows what this coupon takes off that.
  const example = Math.round(323_730 * Number(f.pct || 0) / 100);

  async function create() {
    setError(null);
    try {
      await api.post('/admin/coupons', { code: f.code, percentOff: Number(f.pct), maxUses: f.max ? Number(f.max) : undefined, validTill: f.till ? `${f.till}T23:59:59+05:30` : undefined, partner: f.partner || undefined });
      setF({ code: '', pct: '10', max: '200', till: '', partner: '' });
      qc.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    } catch (e) { setError(e instanceof ApiError ? (e.details ? 'Codes are 4–20 letters and digits; 1–50% off.' : e.message) : 'Could not create'); }
  }

  if (loadError) return <><PageTitle title="Coupons" /><p className="rounded-sheet bg-surface p-6">{(loadError as Error).message}</p></>;
  return (
    <>
      <PageTitle title="Coupons" sub="Coupons apply after the long-rental discount, before GST · admin only" />
      <div className="flex flex-wrap items-start gap-4">
        <section className="min-w-0 flex-[999_1_460px] overflow-x-auto rounded-sheet bg-surface p-5">
          <table className="w-full min-w-[520px] border-collapse text-[15px]">
            <thead><tr className="text-left text-[13px] text-muted">{['Code', 'Off', 'Used', 'Valid till', 'Partner'].map((h) => <th key={h} className="p-2.5 font-normal">{h}</th>)}</tr></thead>
            <tbody>
              {data?.length === 0 && <tr><td colSpan={5} className="p-2.5 text-muted">No coupons yet.</td></tr>}
              {data?.map((c) => (
                <tr key={c.code} className="border-t border-line">
                  <td className="px-2.5 py-3.5 font-medium tracking-[1px]">{c.code}</td><td className="px-2.5 py-3.5">{c.percentOff}%</td>
                  <td className="px-2.5 py-3.5"><span className="flex min-w-[110px] flex-col gap-1"><span>{c.used}{c.maxUses ? ` / ${c.maxUses}` : ''}</span>
                    {c.maxUses && <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-field"><span className="block h-full rounded bg-ink" style={{ width: `${Math.min(100, Math.round(c.used / c.maxUses * 100))}%` }} /></span>}</span></td>
                  <td className="px-2.5 py-3.5 text-muted">{c.validTill ? formatDay(c.validTill) : 'No end date'}</td><td className="px-2.5 py-3.5 text-muted">{c.partner ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <form aria-label="Create a coupon" className="flex min-w-0 flex-[1_1_320px] flex-col gap-3 rounded-sheet bg-surface p-[22px]" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <h2 className="m-0 text-xl font-normal">New coupon</h2>
          <label className="label">Code<Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} className="uppercase tracking-[1px]" maxLength={20} /></label>
          <div className="grid grid-cols-2 gap-2.5">
            <label className="label">Percent off<Input type="number" min={1} max={50} value={f.pct} onChange={(e) => setF({ ...f, pct: e.target.value })} /></label>
            <label className="label">Max uses<Input type="number" min={1} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></label>
          </div>
          <label className="label">Valid till<Input type="date" value={f.till} onChange={(e) => setF({ ...f, till: e.target.value })} /></label>
          <label className="label">Partner (optional)<Input placeholder="Hostel, café or tour operator" value={f.partner} onChange={(e) => setF({ ...f, partner: e.target.value })} /></label>
          {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
          <Button type="submit" disabled={f.code.length < 4}>Create coupon</Button>
          <span className="text-[13px] text-muted">Example: on a 3-day Hunter 350, {f.pct || 0}% off saves the rider ₹{(example / 100).toFixed(2)} before GST.</span>
        </form>
      </div>
    </>
  );
}
