import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@certcore.com');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (e: any) {
      setErr(e.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-surface px-4">
      {/* Ambient mesh */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(251,146,60,.18),transparent_60%),radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(59,130,246,.12),transparent_60%)]" />

      <div className="relative w-full max-w-md">
        <div className="card p-8">
          <div className="mb-7 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
              <ShieldCheck className="text-white" size={22} />
            </span>
            <div>
              <div className="font-display text-[20px] font-bold text-ink">IntelliCert</div>
              <div className="text-[12px] text-ink-dim">Admin panel</div>
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold text-ink">Welcome back</h1>
          <p className="mt-1 text-[14px] text-ink-dim">Sign in to manage your platform.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {err}
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-md w-full" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" size={16} /> : null}
              {busy ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-surface p-3 text-[12px] text-ink-dim">
            <strong className="text-ink-body">Default credentials:</strong> admin@certcore.com / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
