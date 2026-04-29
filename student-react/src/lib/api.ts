// API base resolution:
//  1. Absolute URL in VITE_API_BASE wins (e.g. http://127.0.0.1:8000/api in dev).
//  2. Otherwise compute from the current path so the same build serves both
//     production (site at root → "/api") and local XAMPP (site at
//     "/visuallearn/backend/public/app/" → "/visuallearn/api").
function resolveApiBase(): string {
  const envBase = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  if (envBase && /^https?:\/\//i.test(envBase)) return envBase;
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  const sitePrefix = path.replace(/\/(?:backend\/public\/)?(?:app|admin)(?:\/.*)?$/, '').replace(/\/+$/, '');
  return sitePrefix + '/api';
}
const API_BASE = resolveApiBase();
const TOKEN_KEY = 'intellicert_student_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string) {
  localStorage.setItem(TOKEN_KEY, t);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type FetchOpts = RequestInit & { params?: Record<string, string | number | undefined> };
type LearningEventPayload = {
  topic_id?: number;
  concept_id?: number;
  event_type: string;
  step_type?: string;
  step_order?: number;
  is_correct?: boolean;
  confidence?: number;
  time_spent_ms?: number;
  meta_json?: Record<string, unknown>;
};

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

  // Fallback for Apache setups that may not forward Authorization headers.
  // LegacyTokenAuth accepts token from input(), so we append it as query too.
  if (token) {
    const t = new URLSearchParams({ token }).toString();
    url += (url.includes('?') ? '&' : '?') + t;
  }

  const res = await fetch(url, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    // Throw a standard Error but attach status + body so React Query /
    // callers can branch on 402 (Mastery paywall) etc.
    const err = new Error(msg) as Error & { status?: number; body?: any };
    err.status = res.status;
    err.body = data;
    throw err;
  }
  const xp = Number((data as any)?.xp_awarded ?? 0);
  if (!Number.isNaN(xp) && xp > 0 && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('intellicert:xp-awarded', { detail: { xp, data } }));
  }
  return data as T;
}

export async function postLearningEvent(payload: LearningEventPayload): Promise<void> {
  await api('/study/learning-event', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
