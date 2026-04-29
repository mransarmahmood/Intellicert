import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Sticky top-of-page ribbon that appears when the current student session was
 * minted by an admin via /admin/users/{id}/impersonate. The marker is set in
 * localStorage by the admin panel:
 *   localStorage['csp_impersonation'] = JSON.stringify({email, expires})
 *
 * Clicking "Stop impersonating" revokes the token by calling /api/auth/logout
 * (which invalidates the session row) and redirects back to the admin panel.
 */
export default function ImpersonationBanner() {
  const [info, setInfo] = useState<{ email: string; expires: number } | null>(null);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('csp_impersonation');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // expired? clear the marker silently
      if (parsed.expires && parsed.expires < Date.now()) {
        localStorage.removeItem('csp_impersonation');
        return;
      }
      setInfo(parsed);
    } catch { /* ignore */ }
  }, []);

  if (!info) return null;

  const stop = async () => {
    setStopping(true);
    const apiBase = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://127.0.0.1:8000/api';
    const tok = localStorage.getItem('csp_auth_token') || localStorage.getItem('intellicert_student_token');
    try {
      // Best-effort revoke
      await fetch(apiBase + '/auth/logout', {
        method: 'POST',
        headers: tok ? { Authorization: 'Bearer ' + tok } : {},
      });
    } catch { /* ignore */ }

    localStorage.removeItem('csp_impersonation');
    localStorage.removeItem('csp_auth_token');
    localStorage.removeItem('intellicert_student_token');
    // Send back to the admin panel users page
    window.location.replace('/admin/#/users');
  };

  const minsLeft = Math.max(0, Math.floor((info.expires - Date.now()) / 60000));

  return (
    <div
      className="sticky top-0 z-50 border-b border-amber-300 px-4 py-2 text-amber-900"
      style={{ backgroundImage: 'repeating-linear-gradient(135deg, #FEF3C7 0 12px, #FDE68A 12px 24px)' }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 text-[13px] font-semibold">
        <AlertTriangle size={15} className="shrink-0" />
        <span className="flex-1">
          You are <strong className="font-extrabold">impersonating {info.email}</strong> as the admin.
          Anything you do is recorded and attributed to this user.
          {minsLeft > 0 && <span className="ml-2 font-mono text-[11px] opacity-80">expires in {minsLeft}m</span>}
        </span>
        <button
          onClick={stop}
          disabled={stopping}
          className="inline-flex items-center gap-1 rounded-md bg-amber-900 px-3 py-1 text-[12px] font-bold text-amber-50 hover:bg-amber-950 disabled:opacity-50"
        >
          <X size={13} /> {stopping ? 'Stopping…' : 'Stop impersonating'}
        </button>
      </div>
    </div>
  );
}
