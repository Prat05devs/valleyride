import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Release builds use our domain, independent of the backend hosting provider.
export const API_URL = (__DEV__ ? process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000' : 'https://api.valleyride.in').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

const KEYS = { access: 'vr.access', refresh: 'vr.refresh' };

// SecureStore (Keychain / Keystore) on phones. The web build of the app is a development preview only, so it keeps
// the session in localStorage, falling back to memory when storage is blocked.
const memory = new Map<string, string>();
const web = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return memory.get(k) ?? null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { memory.set(k, v); } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { memory.delete(k); } },
};
export const kv = {
  get: (k: string) => (Platform.OS === 'web' ? Promise.resolve(web.get(k)) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === 'web' ? Promise.resolve(web.set(k, v)) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === 'web' ? Promise.resolve(web.del(k)) : SecureStore.deleteItemAsync(k)),
};

export const tokens = {
  async save(access: string, refresh: string) { await kv.set(KEYS.access, access); await kv.set(KEYS.refresh, refresh); },
  access: () => kv.get(KEYS.access),
  refresh: () => kv.get(KEYS.refresh),
  async clear() { await kv.del(KEYS.access); await kv.del(KEYS.refresh); },
};

/**
 * One refresh at a time: refresh tokens rotate, and the API revokes the whole session if an old one is reused,
 * so parallel 401s must share a single refresh. Tokens are cleared only when the server rejects the refresh,
 * never on a network error (offline riders stay logged in).
 */
let refreshing: Promise<boolean> | null = null;
function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const rt = await kv.get(KEYS.refresh);
    if (!rt) return false;
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client': 'mobile' }, body: JSON.stringify({ refreshToken: rt }),
      });
    } catch { return false; }
    if (!res.ok) { if (res.status === 401) await tokens.clear(); return false; }
    const json = await res.json();
    await tokens.save(json.data.accessToken, json.data.refreshToken);
    return true;
  })().finally(() => { refreshing = null; });
  return refreshing;
}

interface Opts { idempotencyKey?: string; auth?: boolean }

/** Unwraps `{ data }`, throws ApiError for `{ error }`, and retries once after a token refresh. */
async function request<T>(method: string, path: string, body?: unknown, opts: Opts = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = { 'X-Client': 'mobile' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  const access = await tokens.access();
  if (access) headers.Authorization = `Bearer ${access}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Could not reach Valley Ride. Check your connection.');
  }
  if (res.status === 401 && !retried && !path.startsWith('/auth/') && (await refresh())) {
    return request<T>(method, path, body, opts, true);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? `HTTP_${res.status}`, e?.message ?? 'Something went wrong', e?.details);
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}, opts?: Opts) => request<T>('POST', path, body, opts),
  patch: <T>(path: string, body: unknown = {}) => request<T>('PATCH', path, body),
  put: <T>(path: string, body: unknown = {}) => request<T>('PUT', path, body),
  del: <T = void>(path: string, body?: unknown) => request<T>('DELETE', path, body),
};

export const newIdempotencyKey = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Editorial images: "/static/…" paths are served by the API; absolute URLs pass through. */
export const mediaUrl = (u: string) => (u.startsWith('/') ? `${API_URL}${u}` : u);
