import type { BookingDTO, BookingStatus, VehicleModelDTO } from '@valleyride/shared';
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

// The fleet changes rarely; one request per app session is enough.
let modelsPromise: Promise<VehicleModelDTO[]> | null = null;
export function loadModels() {
  modelsPromise ??= api.get<VehicleModelDTO[]>('/vehicle-models').catch((e) => { modelsPromise = null; throw e; });
  return modelsPromise;
}

export function useModels() {
  const [models, setModels] = useState<VehicleModelDTO[]>([]);
  useEffect(() => { loadModels().then(setModels).catch(() => {}); }, []);
  const byId = useCallback((id: string) => models.find((m) => m.id === id), [models]);
  return { models, byId };
}

/** Fetches one booking; `pollMs` re-fetches while `keepPolling(booking)` is true. */
export function useBooking(id: string | undefined, opts: { pollMs?: number; keepPolling?: (b: BookingDTO) => boolean } = {}) {
  const [booking, setBooking] = useState<BookingDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!id) return;
    try { setBooking(await api.get<BookingDTO>(`/bookings/${id}`)); setError(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load the booking'); }
  }, [id]);

  useEffect(() => { reload(); }, [reload]);
  const polling = !!opts.pollMs && (!booking || (opts.keepPolling?.(booking) ?? false));
  useEffect(() => {
    if (!polling) return;
    const h = setInterval(reload, opts.pollMs);
    return () => clearInterval(h);
  }, [polling, reload, opts.pollMs]);

  return { booking, error, reload };
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  ONGOING: 'On the road',
  COMPLETED: 'Returned',
  DEPOSIT_SETTLED: 'Completed',
  EXPIRED: 'Hold ended',
  CANCELLED: 'Cancelled',
};

/** "Pickup in 9 days", "Pickup tomorrow", "Pickup today". */
export function pickupIn(startAt: string) {
  const day = (d: Date) => Math.floor((d.getTime() + 5.5 * 3_600_000) / 86_400_000); // IST calendar days
  const n = day(new Date(startAt)) - day(new Date());
  return n <= 0 ? 'Pickup today' : n === 1 ? 'Pickup tomorrow' : `Pickup in ${n} days`;
}

/** Seconds left on a payment hold, ticking every second. */
export function useCountdown(until: string | null | undefined) {
  const left = () => (until ? Math.max(0, Math.round((new Date(until).getTime() - Date.now()) / 1000)) : 0);
  const [s, setS] = useState(left);
  useEffect(() => {
    setS(left());
    if (!until) return;
    const h = setInterval(() => setS(left()), 1000);
    return () => clearInterval(h);
  }, [until]); // eslint-disable-line react-hooks/exhaustive-deps
  return { seconds: s, text: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` };
}

export interface HandoverView {
  registrationNo: string | null;
  pickup: import('@valleyride/shared').HandoverDTO | null;
  return: import('@valleyride/shared').HandoverDTO | null;
  emergencyContact: { name: string; phone: string; relationship: string } | null;
}

export function useHandover(id: string | undefined, enabled = true) {
  const [data, setData] = useState<HandoverView | null>(null);
  const reload = useCallback(async () => {
    if (!id || !enabled) return;
    try { setData(await api.get<HandoverView>(`/bookings/${id}/handover`)); } catch { /* shown as not recorded yet */ }
  }, [id, enabled]);
  useEffect(() => { reload(); }, [reload]);
  return { handover: data, reload };
}

/** "2 days 18 h", "5 h 20 min", "Overdue 1 h". */
export function timeLeft(until: string, now = Date.now()) {
  const ms = new Date(until).getTime() - now;
  const abs = Math.abs(ms);
  const d = Math.floor(abs / 86_400_000), h = Math.floor((abs % 86_400_000) / 3_600_000), m = Math.floor((abs % 3_600_000) / 60_000);
  const text = d > 0 ? `${d} ${d === 1 ? 'day' : 'days'} ${h} h` : h > 0 ? `${h} h ${m} min` : `${m} min`;
  return ms < 0 ? `Overdue ${text}` : text;
}
