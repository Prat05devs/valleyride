'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import { Icon } from '@/components/brand/icon';
import { api, API_URL } from '@/lib/api-client';
import { formatDay, formatPaise } from '@/lib/format';

interface Invoice {
  number: string; issuedAt: string; final: boolean;
  seller: { name: string; gstin: string | null; sac: string | null; address: string | null };
  billedTo: { name: string | null; phone: string | null }; bookingCode: string;
  lines: { label: string; amountPaise: number }[]; taxablePaise: number; gstPct: number;
  cgstPaise: number; sgstPaise: number; totalPaise: number; depositPaise: number;
}

const money = (p: number) => (p < 0 ? '−' : '') + formatPaise(Math.abs(p), true);
/** Owner-supplied fields stay as visible placeholders until they are set. */


/** Tax invoice; the PDF comes from GET /bookings/:id/invoice.pdf. */
export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: inv, error } = useQuery({ queryKey: ['invoice', id], queryFn: () => api.get<Invoice>(`/bookings/${id}/invoice`) });
  if (error) return <div className="rounded-sheet bg-surface p-8">{(error as Error).message}</div>;
  if (!inv) return <div className="rounded-sheet bg-surface p-8">Loading…</div>;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/account/bookings/${id}`} className="inline-flex h-11 items-center gap-2 text-[15px]"><Icon name="back" size={18} />Booking {inv.bookingCode}</Link>
        <a href={`${API_URL}/api/v1/bookings/${id}/invoice.pdf`} className="inline-flex h-[50px] items-center gap-2 rounded-full bg-surface px-[22px]"><Icon name="download" size={18} />Download PDF</a>
      </div>
      <article className="flex flex-col gap-6 rounded-[36px] bg-surface p-8 print:rounded-none print:p-0">
        <div className="flex flex-wrap justify-between gap-4">
          <div><div className="text-2xl font-medium">{inv.seller.name}</div>{inv.seller.gstin && <div className="text-sm text-muted">GSTIN {inv.seller.gstin}</div>}<div className="text-sm text-muted">{inv.seller.address}</div></div>
          <div className="text-right"><div className="text-sm text-muted">{inv.seller.gstin ? 'Tax invoice' : 'Booking receipt'}</div><div className="text-xl tracking-[0.5px]">{inv.number}</div><div className="text-sm text-muted">Issued {formatDay(inv.issuedAt)}</div></div>
        </div>
        <div className="flex flex-wrap justify-between gap-4 rounded-[22px] bg-field p-5">
          <div><div className="text-sm text-muted">Billed to</div><div className="text-lg">{inv.billedTo.name ?? '—'}</div><div className="text-sm text-muted">{inv.billedTo.phone}</div></div>
          <div className="text-right"><div className="text-sm text-muted">Booking</div><div className="text-lg">{inv.bookingCode}</div></div>
        </div>
        <table className="w-full border-collapse text-base">
          <thead><tr className="text-left text-sm text-muted"><th className="py-2 font-normal">Item{inv.seller.sac ? ` · SAC ${inv.seller.sac}` : ''}</th><th className="py-2 text-right font-normal">Amount</th></tr></thead>
          <tbody>
            {inv.lines.map((l) => <tr key={l.label} className="border-t border-line"><td className="py-3">{l.label}</td><td className="py-3 text-right">{money(l.amountPaise)}</td></tr>)}
            <tr className="border-t border-line"><td className="py-3">Taxable value</td><td className="py-3 text-right">{money(inv.taxablePaise)}</td></tr>
            <tr><td className="py-1.5 text-muted">CGST {inv.gstPct / 2}%</td><td className="py-1.5 text-right">{money(inv.cgstPaise)}</td></tr>
            <tr><td className="py-1.5 text-muted">SGST {inv.gstPct / 2}%</td><td className="py-1.5 text-right">{money(inv.sgstPaise)}</td></tr>
            <tr className="border-t-2 border-ink text-xl font-medium"><td className="py-3">Total</td><td className="py-3 text-right">{money(inv.totalPaise)}</td></tr>
          </tbody>
        </table>
        <p className="m-0 text-sm text-muted">The {formatPaise(inv.depositPaise)} refundable deposit is not part of this invoice.{inv.final ? '' : ' Extra km and late fees, if any, are added after the return.'}</p>
      </article>
    </div>
  );
}
