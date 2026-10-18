'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Icon } from '@/components/brand/icon';
import { api } from '@/lib/api-client';
import { formatDay, formatPaise } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Line { id: string; kind: 'PAID' | 'REFUND'; bookingId: string; bookingCode: string; amountPaise: number; at: string; note: string; pending: boolean }
interface Held { bookingId: string; bookingCode: string; bike: string; depositPaise: number; status: string }

export default function PaymentsPage() {
  const { data } = useQuery({ queryKey: ['payments'], queryFn: () => api.get<{ lines: Line[]; depositsHeld: Held[] }>('/me/payments') });
  return (
    <>
      <h1 className="m-0 text-[40px] font-normal tracking-[-0.6px]">Payments and refunds</h1>
      {data?.depositsHeld.map((h) => (
        <Link key={h.bookingId} href={`/account/bookings/${h.bookingId}`} className="flex flex-wrap items-center justify-between gap-3 rounded-sheet bg-dark px-7 py-6 text-surface">
          <span><span className="block text-sm text-white/80">Deposit held with us · {h.bookingCode}</span><span className="text-[30px] font-medium">{formatPaise(h.depositPaise)}</span></span>
          <span className="max-w-[420px] text-[15px] text-white/85">{h.status === 'COMPLETED' ? 'Refund on its way after the inspection.' : `Refunded after you return the ${h.bike} and it passes inspection.`}</span>
        </Link>
      ))}
      <div className="rounded-sheet bg-surface px-6 py-2">
        {data && data.lines.length === 0 && <p className="py-4 text-muted">No payments yet.</p>}
        {data?.lines.map((l, i) => (
          <Link key={l.id} href={`/account/bookings/${l.bookingId}`} className={cn('flex items-center gap-3 py-4', i > 0 && 'border-t border-line')}>
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', l.kind === 'REFUND' ? 'bg-ink text-surface' : 'bg-field')}><Icon name={l.kind === 'REFUND' ? 'download' : 'receipt'} size={18} /></span>
            <span className="flex-1"><span className="block">{l.kind === 'REFUND' ? l.note : 'Paid'} · {l.bookingCode}</span><span className="text-sm text-muted">{formatDay(l.at)} · {l.kind === 'REFUND' ? (l.pending ? 'on its way' : 'to the card or UPI you paid with') : l.note}</span></span>
            <span className="font-medium">{l.kind === 'REFUND' ? '+' : ''}{formatPaise(l.amountPaise, true)}</span>
          </Link>
        ))}
      </div>
      <p className="text-center text-sm text-muted">Payments go through Razorpay. Refunds return to the card or UPI you paid with.</p>
    </>
  );
}
