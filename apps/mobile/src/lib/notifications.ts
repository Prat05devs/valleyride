import { useCallback, useEffect, useState } from 'react';
import { api, kv } from './api';
import { fmtDateTime, inr } from './format';

export interface FeedItem {
  id: string; kind: 'doc' | 'confirmed' | 'return' | 'review' | 'deposit' | 'refund'; at: string;
  bookingId?: string; bookingCode?: string; bike?: string; when?: string; amountPaise?: number; docType?: string;
}

const READ_KEY = 'vr.notificationsReadAt';

export function copyFor(n: FeedItem): { title: string; body: string } {
  switch (n.kind) {
    case 'doc': return { title: `${n.docType === 'DL' ? 'Driving licence' : 'ID proof'} needs a new photo`, body: 'We could not read the details. Upload a clearer one before pickup.' };
    case 'confirmed': return { title: `Booking ${n.bookingCode} confirmed`, body: `${n.bike} · pickup ${fmtDateTime(n.when!)}.` };
    case 'return': return { title: `Return due ${fmtDateTime(n.when!)}`, body: `Drop the ${n.bike} at the return point, or extend from the app.` };
    case 'review': return { title: 'How was your ride?', body: `Rate the ${n.bike} and the pickup.` };
    case 'deposit': return { title: `Deposit of ${inr(n.amountPaise!)} refunded`, body: `${n.bike} · ${n.bookingCode}. Sent back to the card or UPI you paid with.` };
    case 'refund': return { title: `Refund of ${inr(n.amountPaise!)} sent`, body: `${n.bike} · ${n.bookingCode}. Sent back to the card or UPI you paid with.` };
  }
}

/** Feed from GET /me/notifications plus a per-device "read up to" time. */
export function useNotifications() {
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [readAt, setReadAt] = useState<string>('');
  const load = useCallback(async () => {
    const [feed, r] = await Promise.all([api.get<FeedItem[]>('/me/notifications').catch(() => []), kv.get(READ_KEY)]);
    setItems(feed); setReadAt(r ?? '');
  }, []);
  useEffect(() => { load(); }, [load]);
  const markAllRead = useCallback(async () => { const now = new Date().toISOString(); await kv.set(READ_KEY, now); setReadAt(now); }, []);
  const unread = (items ?? []).filter((i) => i.at > readAt).length;
  return { items, readAt, unread, markAllRead, reload: load };
}
