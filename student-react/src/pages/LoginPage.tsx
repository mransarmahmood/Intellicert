import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (e: any) {
      setErr(e.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-surface px-4">
      <div className="pointer-events-none absolute inset-0 bg-mesh-light" />

      <div className="relative w-full max-w-md">
        <div className="card p-8">
          <div className="mb-7 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
              <ShieldCheck className="text-white" size={22} />
            </span>
            <div>
              <div className="font-display text-[20px] font-bold text-ink">IntelliCert</div>
              <div className="text-[12px] text-ink-dim">Pass the CSP exam</div>
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold text-ink">Welcome back</h1>
          <p className="mt-1 text-[14px] text-ink-dim">Sign in to keep studying.</p>

          <form onSubmit={submit} className="mt-7 space-y-4" aria-label="Sign in">
            <div>
              <label htmlFor="login-email" className="label">Email</label>
              <input id="login-email" name="email" type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
            </div>
            <div>
              <label htmlFor="login-password" className="label">Password</label>
              <input id="login-password" name="password" type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {err && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</div>
            )}
            <button type="submit" className="btn btn-primary btn-md w-full" disabled={busy} aria-busy={busy}>
              {busy && <Loader2 className="animate-spin" size={16} aria-hidden="true" />}
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-ink-dim">
            Access is managed by your training administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
