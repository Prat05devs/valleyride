'use client';

import type { BookingDTO, ReturnCharges } from '@valleyride/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from './api-client';

export type CalendarRow = BookingDTO & {
  customer: { name: string | null; phone: string | null; docs: 'verified' | 'pending' | 'missing' };
  vehicle: { id: string; registrationNo: string }; model: { slug: string; name: string };
};

export interface Dashboard {
  pickups: CalendarRow[]; returns: CalendarRow[]; kycPending: number; overdueReturns: number;
  docAlerts: { vehicleId: string; registrationNo: string; type: string; expiresOn: string }[];
  servicesDue: { vehicleId: string; registrationNo: string; type: string; on: string; notes: string | null }[];
  depositsHeld: { paise: number; bookings: number }; monthStart: string;
  fleet: { total: number; onRide: number; byStatus: Record<string, number> }; monthRentalPaise: number;
}

export interface FleetVehicle {
  id: string; registrationNo: string; status: 'ACTIVE' | 'MAINT' | 'RETIRED'; odometerKm: number; purchasedOn: string | null;
  model: { id: string; slug: string; name: string }; home: { id: string; name: string };
  current?: { id: string; name: string };
  onRide: { bookingId: string; code: string; endAt: string } | null; next: { bookingId: string; code: string; startAt: string } | null;
  documents: { id: string; type: string; number: string; expiresOn: string | null; daysLeft: number | null }[]; docAlert: boolean;
}

export interface AdminBooking extends BookingDTO {
  customer: { id: string; name: string | null; phone: string; email: string | null };
  vehicle: { id: string; registrationNo: string; odometerKm: number };
  model: { slug: string; name: string; extraKmPaise: number; pricePerDayPaise: number };
  pickupLocation: string | null; returnLocation: string | null;
  documents: { id: string; type: string; numberMasked: string; status: string }[];
  payments: { id: string; kind: string; status: string; amountPaise: number; providerOrderId: string | null; providerPaymentId: string | null; at: string }[];
  handovers: { type: 'PICKUP' | 'RETURN'; odometerKm: number; fuelLevel: number | null; photos: number; damageNotes: string | null; signedAt: string | null; charges: ReturnCharges | null; emergencyContact: { name: string; phone: string; relationship: string } | null; at: string }[];
  activity: { text: string; by: string; at: string }[];
}

export const useDashboard = () => useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => api.get<Dashboard>('/admin/dashboard'), refetchInterval: 60_000 });
export const useFleet = () => useQuery({ queryKey: ['admin', 'vehicles'], queryFn: () => api.get<FleetVehicle[]>('/admin/vehicles') });
export const useAdminBooking = (id: string, pollMs?: (b: AdminBooking | undefined) => number | false) =>
  useQuery({ queryKey: ['admin', 'booking', id], queryFn: () => api.get<AdminBooking>(`/admin/bookings/${id}`), refetchInterval: pollMs ? (q) => pollMs(q.state.data) : undefined });

/** Start of today in IST, as a Date. */
export function istDayStart(offsetDays = 0) {
  const ist = new Date(Date.now() + 5.5 * 3_600_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() + offsetDays) - 5.5 * 3_600_000);
}

export const docLabel: Record<string, string> = { RC: 'Registration (RC)', INSURANCE: 'Insurance (commercial)', PERMIT: 'Rental permit', PUC: 'Pollution certificate (PUC)', DL: 'Driving licence', AADHAAR: 'Aadhaar', PASSPORT: 'Passport' };
