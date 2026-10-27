import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError, tokens } from './api';
import { listenForTaps, registerForPush, unregisterPush } from './push';

export interface SessionUser { id: string; role: string; fullName: string | null; phone: string; email?: string | null }

interface Session {
  user: SessionUser | null;
  ready: boolean;
  /** The session could not be checked (no network or the API is down); tokens are kept. */
  offline: boolean;
  retry: () => void;
  /** Phone and password; `register` creates the account first. */
  login: (phone: string, password: string, register?: boolean) => Promise<SessionUser>;
  /** Logs every other device out; this one keeps going with the fresh tokens. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (p: { fullName?: string; email?: string | null }) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);

  const load = useCallback(async () => {
    setReady(false); // a retry shows the loader, not a redirect to login, until /me answers
    try {
      if (await tokens.access()) setUser(await api.get<SessionUser>('/me'));
      else setUser(null);
      setOffline(false);
    } catch (e) {
      // Only a rejected session logs the rider out; a network error keeps the tokens for when the signal is back.
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) { await tokens.clear(); setUser(null); setOffline(false); }
      else setOffline(true);
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const login = useCallback(async (phone: string, password: string, register = false) => {
    const data = await api.post<{ user: SessionUser; accessToken: string; refreshToken: string }>(register ? '/auth/register' : '/auth/login', { phone, password });
    await tokens.save(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const data = await api.post<{ accessToken: string; refreshToken: string }>('/me/password', { currentPassword, newPassword });
    await tokens.save(data.accessToken, data.refreshToken);
  }, []);

  const updateProfile = useCallback(async (p: { fullName?: string; email?: string | null }) => {
    setUser(await api.patch<SessionUser>('/me', p));
  }, []);

  const logout = useCallback(async () => {
    await unregisterPush();
    const rt = await tokens.refresh();
    if (rt) await api.post('/auth/logout', { refreshToken: rt }).catch(() => {}); // revoke server-side; local logout happens regardless
    await tokens.clear(); setUser(null);
  }, []);

  // Register for push once someone is logged in, and route notification taps to their trip.
  useEffect(() => { if (user) registerForPush(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => listenForTaps(), []);

  const value = useMemo(() => ({ user, ready, login, changePassword, updateProfile, logout, offline, retry: load }), [user, ready, login, changePassword, updateProfile, logout, offline, load]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession outside SessionProvider');
  return s;
}
