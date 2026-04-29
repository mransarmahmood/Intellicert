function resolveApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (envBase && /^https?:\/\//i.test(envBase)) return envBase;
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const sitePrefix = path.replace(/\/(?:backend\/public\/)?(?:app|admin)(?:\/.*)?$/, '').replace(/\/+$/, '');
  return sitePrefix + '/api';
}
const API_BASE = resolveApiBase();
const TOKEN_KEY = 'intellicert_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type FetchOpts = RequestInit & { params?: Record<string, string | number | undefined> };

/**
 * Multipart upload helper — sends a FormData body and the auth token,
 * but does NOT set Content-Type so the browser fills in the boundary.
 */
export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired — redirecting to login');
  }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export async function api<T = any>(path: string, opts: FetchOpts = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(opts.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let url = API_BASE + path;
  if (opts.params) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(opts.params)) {
      if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
    }
    const s = q.toString();
    if (s) url += (url.includes('?') ? '&' : '?') + s;
  }

  const res = await fetch(url, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Session expired — redirecting to login');
  }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/**
 * Centralized 401 handler — clears the stale token and bounces the user
 * back to the login screen so React Query doesn't cache a bad state.
 */
let _redirecting = false;
function handleUnauthorized(): void {
  if (_redirecting) return;
  _redirecting = true;
  clearToken();
  if (typeof window !== 'undefined') {
    // HashRouter — navigate via hash change
    if (!/#\/login$/.test(window.location.hash)) {
      window.location.hash = '#/login';
    }
    // Give React a tick to remount login, then allow future 401s
    setTimeout(() => { _redirecting = false; }, 500);
  }
}
