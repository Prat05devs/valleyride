'use client';

import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from './api-client';
import type { SessionUser } from './auth';

/** The signed-in user in client components (cookies go to the API with credentials: 'include'). */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try { return await api.get<SessionUser>('/me'); } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
    },
    staleTime: 60_000,
  });
}
