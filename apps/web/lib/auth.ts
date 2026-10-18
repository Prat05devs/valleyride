import { cookies } from 'next/headers';
import type { Role } from '@valleyride/shared';
import { api, ApiError } from './api-client';

/** Must match ACCESS_COOKIE in apps/api/src/modules/auth/tokens.ts. */
export const ACCESS_COOKIE = 'vr_access';

export interface SessionUser { id: string; role: Role; fullName: string | null; phone: string; email: string | null }

/** Server Components only: the logged-in user, or null. Forwards the access cookie as a Bearer token. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return await api.get<SessionUser>('/me', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}
