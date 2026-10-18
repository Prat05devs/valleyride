'use client';

import type { LocationDTO, VehicleModelDTO } from '@valleyride/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from './api-client';

/** Models and locations, cached for the session; used to label bookings. */
export function useCatalog() {
  const models = useQuery({ queryKey: ['models'], queryFn: () => api.get<VehicleModelDTO[]>('/vehicle-models'), staleTime: 300_000 });
  const locations = useQuery({ queryKey: ['locations'], queryFn: () => api.get<LocationDTO[]>('/locations'), staleTime: 300_000 });
  return {
    model: (id: string) => models.data?.find((m) => m.id === id),
    location: (id: string) => locations.data?.find((l) => l.id === id),
  };
}

export const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment', CONFIRMED: 'Confirmed', ONGOING: 'On the road', COMPLETED: 'Returned',
  DEPOSIT_SETTLED: 'Completed', EXPIRED: 'Hold ended', CANCELLED: 'Cancelled',
};

export function pickupIn(startAt: string) {
  const day = (d: Date) => Math.floor((d.getTime() + 5.5 * 3_600_000) / 86_400_000);
  const n = day(new Date(startAt)) - day(new Date());
  return n <= 0 ? 'Pickup today' : n === 1 ? 'Pickup tomorrow' : `Pickup in ${n} days`;
}
