'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useState } from 'react';
import { KV, Panel } from '@/components/admin/ui';
import { Icon } from '@/components/brand/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { docLabel, useAdminBooking } from '@/lib/admin';
import { api, ApiError } from '@/lib/api-client';
import { newIdempotencyKey } from '@/lib/hold';
import { shortName } from '@/lib/bikes';
import { formatDateTime, formatMinus, formatPaise } from '@/lib/format';

const KIND: Record<string, string> = { RENTAL: 'Rental + deposit', EXTRA: 'Extension', REFUND: 'Refund', DEPOSIT: 'Deposit' };
const short = (s: string | null) => (s && s.length > 14 ? `${s.slice(0, 9)}…${s.slice(-3)}` : s ?? '—');

export default function AdminBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const qc = useQueryClient();
  const { data: b, refetch } = useAdminBooking(id);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [key] = useState(newIdempotencyKey);
  if (!b) return <Panel>Loading…</Panel>;
  const dl = b.documents.find((d) => d.type === 'DL');
  const idDoc = b.documents.find((d) => d.type !== 'DL');
  const pickup = b.handovers.find((h) => h.type === 'PICKUP');
  const ret = b.handovers.find((h) => h.type === 'RETURN');
  const docText = (d?: { status: string }) => (!d ? 'Not uploaded' : d.status === 'VERIFIED' ? 'Verified' : d.status === 'PENDING' ? 'Waiting for review' : 'New photo requested');

  async function cancel() {
    setError(null);
    try { await api.post(`/admin/bookings/${id}/cancel`, { reason: reason.trim() || undefined }, { idempotencyKey: key }); setCancelling(false); await refetch(); qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] }); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Could not cancel'); }
  }

  return (
    <>
      <Link href="/admin/bookings" className="inline-flex h-10 items-center gap-2 self-start text-[15px]"><Icon name="back" size={18} />Calendar</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3"><h1 className="m-0 text-[36px] font-medium tracking-[1px]">{b.code}</h1><Badge variant={b.status === 'CANCELLED' || b.status === 'EXPIRED' ? 'default' : b.status === 'PENDING_PAYMENT' ? 'orange' : 'ink'} className="h-8 text-sm">{b.status}</Badge></div>
        <div className="flex flex-wrap gap-2">
          {b.status === 'CONFIRMED' && <Link href={`/admin/handover/${b.id}`} className="inline-flex h-[50px] items-center rounded-full bg-ink px-[22px] text-[15px] text-surface">{pickup ? 'Continue pickup handover' : 'Start pickup handover'}</Link>}
          {b.status === 'ONGOING' && <Link href={`/admin/returns/${b.id}`} className="inline-flex h-[50px] items-center rounded-full bg-ink px-[22px] text-[15px] text-surface">Start return</Link>}
          {(b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT') && <Button variant="secondary" onClick={() => setCancelling(true)}>Cancel booking</Button>}
        </div>
      </div>
      {cancelling && (
        <Panel title="Cancel this booking?">
          <p className="m-0 text-[15px] text-muted">The cancellation policy applies: full rental refund more than 24 hours before pickup, 50% within 24 hours; the deposit is always refunded. The refund goes to the rider&apos;s card or UPI.</p>
          <label className="label">Reason (kept in the audit log)<input className="field" value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          {error && <p role="alert" className="m-0 text-sm text-orange-ink">{error}</p>}
          <div className="flex gap-2"><Button onClick={cancel}>Cancel and refund</Button><Button variant="ghost" onClick={() => setCancelling(false)}>Keep booking</Button></div>
        </Panel>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4">
        <Panel title="Customer">
          <KV k="Name" v={b.customer.name ?? '—'} /><KV k="Phone" v={<a href={`tel:${b.customer.phone}`} className="underline">{b.customer.phone}</a>} />
          <KV k="Driving licence" v={docText(dl)} tone={dl?.status === 'VERIFIED' ? undefined : 'orange'} />
          <KV k={idDoc ? `ID proof · ${docLabel[idDoc.type]}` : 'ID proof'} v={docText(idDoc)} tone={idDoc?.status === 'VERIFIED' ? undefined : 'orange'} />
          <KV k="Emergency contact" v={pickup?.emergencyContact ? `${pickup.emergencyContact.name} · ${pickup.emergencyContact.phone} (${pickup.emergencyContact.relationship})` : 'Added at pickup'} />
          <Link href="/admin/customers" className="text-sm text-muted underline">Review documents</Link>
        </Panel>
        <Panel title="Booking">
          <KV k="Bike" v={<Link href={`/admin/fleet/${b.vehicle.id}`} className="underline">{b.vehicle.registrationNo} · {shortName(b.model.name)}</Link>} />
          <KV k="Pickup" v={`${formatDateTime(b.startAt)} · ${b.pickupLocation ?? ''}`} />
          <KV k="Return" v={`${formatDateTime(b.endAt)} · ${b.returnLocation ?? ''}`} />
          <KV k="Billable" v={`${b.billableDays} ${b.billableDays === 1 ? 'day' : 'days'} · ${b.kmIncluded} km`} />
          <KV k="Coupon" v={b.couponCode ?? 'None'} />
          {pickup && <KV k="Odometer at pickup" v={`${pickup.odometerKm.toLocaleString('en-IN')} km`} />}
          {ret && <KV k="Odometer at return" v={`${ret.odometerKm.toLocaleString('en-IN')} km`} />}
        </Panel>
        <Panel title="Money">
          <KV k="Rental" v={formatPaise(b.rentalPaise, true)} />
          {b.discountPaise > 0 && <KV k="Discount" v={formatMinus(b.discountPaise)} />}
          {b.feesPaise > 0 && <KV k="One-way fee" v={formatPaise(b.feesPaise, true)} />}
          <KV k="GST" v={formatPaise(b.taxPaise, true)} />
          <KV k="Deposit" v={formatPaise(b.depositPaise, true)} />
          <div className="flex justify-between text-[15px] font-medium"><span>Total</span><span>{formatPaise(b.totalPaise, true)}</span></div>
          {ret?.charges && <><KV k="Deducted at return" v={formatMinus(ret.charges.deductionPaise)} /><KV k="Deposit refund" v={formatPaise(ret.charges.refundPaise, true)} /></>}
        </Panel>
      </div>
      <Panel title="Payments" className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead><tr className="text-left text-[13px] text-muted"><th className="p-2.5 font-normal">Kind</th><th className="p-2.5 font-normal">Razorpay order</th><th className="p-2.5 font-normal">Payment / refund</th><th className="p-2.5 text-right font-normal">Amount</th><th className="p-2.5 font-normal">Status</th><th className="p-2.5 font-normal">When</th></tr></thead>
          <tbody>
            {b.payments.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="px-2.5 py-3">{KIND[p.kind] ?? p.kind}</td><td className="px-2.5 py-3 text-muted">{short(p.providerOrderId)}</td><td className="px-2.5 py-3 text-muted">{short(p.providerPaymentId)}</td>
                <td className="px-2.5 py-3 text-right font-medium">{p.kind === 'REFUND' ? '−' : ''}{formatPaise(p.amountPaise, true)}</td>
                <td className="px-2.5 py-3"><span className={`inline-flex h-[26px] items-center rounded-full px-2.5 text-xs ${p.status === 'CAPTURED' || p.status === 'REFUNDED' ? 'bg-ink text-surface' : p.status === 'FAILED' ? 'bg-field text-muted' : 'bg-orange-tint text-orange-ink'}`}>{p.status}</span></td>
                <td className="px-2.5 py-3 text-muted">{formatDateTime(p.at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="Activity">
        {b.activity.map((a, i) => (
          <div key={i} className="flex flex-wrap justify-between gap-2 border-t border-line py-2.5 text-sm"><span>{a.text}</span><span className="text-muted">{a.by} · {formatDateTime(a.at)}</span></div>
        ))}
      </Panel>
    </>
  );
}
