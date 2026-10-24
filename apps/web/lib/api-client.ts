/**
 * Thin fetch wrapper for the Express API. Unwraps `{ data }`, throws ApiError for `{ error }`.
 * In the browser it sends the httpOnly cookies and retries once after a silent token refresh.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? 'https://api.valleyride.in' : 'http://localhost:4000')).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export interface RequestOptions {
  headers?: HeadersInit;
  cache?: RequestCache;
  next?: RequestInit['next'];
  idempotencyKey?: string;
}

async function request<T>(method: string, path: string, body: unknown, opts: RequestOptions = {}, retried = false): Promise<T> {
  const headers = new Headers(opts.headers);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (opts.idempotencyKey) headers.set('Idempotency-Key', opts.idempotencyKey);

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
    cache: opts.cache,
    next: opts.next,
  });

  if (res.status === 401 && typeof window !== 'undefined' && !retried && !path.startsWith('/auth/')) {
    const refreshed = await fetch(`${API_URL}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refreshed.ok) return request<T>(method, path, body, opts, true);
  }

  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? `HTTP_${res.status}`, e?.message ?? res.statusText, e?.details);
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, body ?? {}, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, body ?? {}, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, body ?? {}, opts),
  delete: <T = void>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, undefined, opts),
};

/** Editorial images: "/static/…" paths are served by the API; absolute URLs pass through. */
export const mediaUrl = (u: string) => (u.startsWith('/') ? `${API_URL}${u}` : u);
