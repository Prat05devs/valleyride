import { defaultRentalWindow, type LocationDTO } from '@valleyride/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';

/** Tomorrow 9:00 → +3 days, the default search window. */
function defaults() {
  return defaultRentalWindow();
}

interface Trip {
  locations: LocationDTO[];
  locationError: string | null;
  reloadLocations: () => void;
  pickupId: string | null;
  returnId: string | null;
  startAt: Date;
  endAt: Date;
  set: (p: Partial<{ pickupId: string; returnId: string | null; startAt: Date; endAt: Date }>) => void;
  pickup?: LocationDTO;
  returnPoint?: LocationDTO;
  oneWay: boolean;
  days: number;
}

const Ctx = createContext<Trip | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [state, setState] = useState(() => ({ pickupId: null as string | null, returnId: null as string | null, ...defaults() }));

  const reloadLocations = useCallback(() => {
    setLocationError(null);
    api.get<LocationDTO[]>('/locations').then((ls) => {
      setLocations(ls);
      if (!ls.length) setLocationError('No pickup points are available. Please contact support.');
      setState((s) => ({ ...s, pickupId: s.pickupId ?? ls.find((l) => l.name.includes('ISBT'))?.id ?? ls[0]?.id ?? null }));
    }).catch(() => setLocationError('Could not load pickup points. Please try again.'));
  }, []);
  useEffect(reloadLocations, [reloadLocations]);

  const value = useMemo<Trip>(() => {
    const pickup = locations.find((l) => l.id === state.pickupId);
    const returnPoint = locations.find((l) => l.id === (state.returnId ?? state.pickupId));
    const hours = (state.endAt.getTime() - state.startAt.getTime()) / 3_600_000;
    return {
      locations, locationError, reloadLocations, ...state, pickup, returnPoint,
      oneWay: !!state.returnId && state.returnId !== state.pickupId,
      days: Math.max(1, Math.ceil(hours / 24 - 1e-9)),
      set: (p) => setState((s) => ({ ...s, ...p })),
    };
  }, [locations, locationError, reloadLocations, state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrip() {
  const t = useContext(Ctx);
  if (!t) throw new Error('useTrip outside TripProvider');
  return t;
}
