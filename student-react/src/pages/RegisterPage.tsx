import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (password.length < 6) { setErr('Password must be at least 6 characters'); return; }
    setBusy(true);
    try {
      await register(email, password, name);
      navigate('/');
    } catch (e: any) {
      setErr(e.message || 'Registration failed');
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
              <div className="font-display text-[20px] font-bold text-ink">Start your free trial</div>
              <div className="text-[12px] text-ink-dim">7 days · no credit card</div>
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold text-ink">Create your account</h1>

          <ul className="mt-4 space-y-1.5 text-[13px] text-ink-body">
            {['Full 7-domain CSP curriculum', 'Spaced repetition flashcards', 'Adaptive quizzes', 'Pass guarantee'].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check size={14} className="text-brand-600" /> {t}
              </li>
            ))}
          </ul>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
              />
            </div>
            {err && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</div>
            )}
            <button type="submit" className="btn btn-primary btn-md w-full" disabled={busy}>
              {busy && <Loader2 className="animate-spin" size={16} />}
              {busy ? 'Creating account...' : 'Create account · start free trial'}
            </button>
          </form>

          <p className="mt-6 text-center text-[13px] text-ink-dim">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
