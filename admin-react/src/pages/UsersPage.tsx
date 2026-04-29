import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Plus, Search, X, UserCog, Upload, Pencil, KeyRound, CreditCard, Trash2, LogIn,
} from 'lucide-react';
import ImportModal from '../components/ImportModal';
import { api } from '../lib/api';

type UserRow = {
  id: number;
  email: string;
  name: string | null;
  role: 'user' | 'admin' | 'superadmin';
  created_at: string;
  plan: string | null;
  sub_status: string | null;
  sub_expires: string | null;
};
type ListResp = { users: UserRow[]; total: number; page: number; limit: number };

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [roleEdit, setRoleEdit] = useState<UserRow | null>(null);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserRow | null>(null);
  const [subUser, setSubUser] = useState<UserRow | null>(null);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebounced(search);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['users', debounced],
    queryFn: () => api<ListResp>('/admin/users', { params: { search: debounced } }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Users</h1>
          <p className="mt-1 text-[14px] text-ink-dim">
            {data ? `${data.total} total` : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn btn-ghost btn-md">
            <Upload size={16} /> Import CSV
          </button>
          <button onClick={() => setShowAdd(true)} className="btn btn-primary btn-md">
            <Plus size={16} /> Add user
          </button>
        </div>
      </div>

      <form onSubmit={onSearchSubmit} className="mb-5 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn btn-ghost btn-md">
          Search
        </button>
      </form>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="grid place-items-center py-16 text-ink-dim">
            <Loader2 className="animate-spin" />
          </div>
        ) : data?.users.length ? (
          <table className="w-full text-left text-[13.5px]">
            <thead className="border-b border-ink-line bg-surface text-[11px] font-bold uppercase tracking-wider text-ink-dim">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {data.users.map((u) => (
                <tr key={u.id} className="hover:bg-surface">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-display text-[12px] font-bold text-white">
                        {(u.name || u.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-ink">{u.name || '—'}</div>
                        <div className="truncate text-[12px] text-ink-dim">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`badge ${
                        u.role === 'superadmin' ? 'badge-brand' : u.role === 'admin' ? 'badge-green' : 'badge-slate'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.plan ? (
                      <span className="badge badge-slate">{u.plan}</span>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-ink-dim">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditUser(u)} className="action-btn" title="Edit name/email"><Pencil size={13} /></button>
                      <button onClick={() => setPasswordUser(u)} className="action-btn" title="Reset password"><KeyRound size={13} /></button>
                      <button onClick={() => setSubUser(u)} className="action-btn" title="Subscription"><CreditCard size={13} /></button>
                      <button onClick={() => setRoleEdit(u)} className="action-btn" title="Change role"><UserCog size={13} /></button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Open the student app as ${u.email}?\n\nA short-lived (2h) impersonation session will open in a new tab. Your admin login is preserved here.`)) return;
                          try {
                            const res = await api<{ token: string; user: { id: number; email: string; name: string | null } }>(
                              `/admin/users/${u.id}/impersonate`,
                              { method: 'POST' }
                            );
                            // Stash the impersonation token in localStorage so the student app picks it up
                            const w = window.open('about:blank', '_blank');
                            if (w) {
                              w.document.write(`<!doctype html><html><head><title>Impersonating…</title></head><body style="font:14px system-ui;padding:24px">
                                <p>Logging in as <strong>${(res.user.name || res.user.email).replace(/[<>]/g, '')}</strong>…</p>
                                <script>
                                  localStorage.setItem('csp_auth_token', ${JSON.stringify(res.token)});
                                  localStorage.setItem('intellicert_student_token', ${JSON.stringify(res.token)});
                                  localStorage.setItem('csp_impersonation', JSON.stringify({email: ${JSON.stringify(res.user.email)}, expires: ${JSON.stringify(Date.now() + 2 * 3600 * 1000)}}));
                                  setTimeout(function(){ window.location.href = '/app/'; }, 200);
                                </script></body></html>`);
                            }
                          } catch (e: any) {
                            alert('Impersonation failed: ' + e.message);
                          }
                        }}
                        className="action-btn"
                        title="Open student app as this user (impersonate)"
                      >
                        <LogIn size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`Delete user ${u.email}?\n\nThis removes the account, all sessions, and all subscriptions. Irreversible.`)) return;
                          api(`/admin/users/${u.id}`, { method: 'DELETE' })
                            .then(() => {
                              qc.invalidateQueries({ queryKey: ['users'] });
                              qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
                            })
                            .catch((e) => alert('Delete failed: ' + e.message));
                        }}
                        className="action-btn action-btn-danger"
                        title="Delete user"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-[13px] text-ink-dim">No users found</div>
        )}
      </div>

      {showImport && (
        <ImportModal
          config={{
            title: 'Import users from CSV',
            importPath: '/bulk-import/users',
            requiredColumns: ['email', 'password', 'name (optional)', 'plan (optional)'],
            hint: 'Required columns:',
            templateRows: 'name,email,password,plan\nJohn Doe,john@example.com,secret123,demo',
          }}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
          }}
        />
      )}
      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
          }}
        />
      )}
      {roleEdit && (
        <RoleModal
          user={roleEdit}
          onClose={() => setRoleEdit(null)}
          onSuccess={() => {
            setRoleEdit(null);
            qc.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            qc.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
      {passwordUser && (
        <PasswordResetModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onSuccess={() => {
            setPasswordUser(null);
          }}
        />
      )}
      {subUser && (
        <SubscriptionModal
          user={subUser}
          onClose={() => setSubUser(null)}
          onSuccess={() => {
            setSubUser(null);
            qc.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
      <style>{`
        .action-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid rgba(15,23,42,0.08);
          background: #fff; color: #475569; display: inline-grid; place-items: center;
          cursor: pointer; transition: all 160ms;
        }
        .action-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
        .action-btn-danger:hover { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () =>
      api('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Modal title="Add new user" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErr('');
          if (password.length < 6) {
            setErr('Password must be at least 6 characters');
            return;
          }
          m.mutate();
        }}
        className="space-y-4"
      >
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className="label">Email *</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Password *</label>
          <input
            type="text"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
          />
        </div>
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-md">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            Create user
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RoleModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [role, setRole] = useState<UserRow['role']>(user.role);
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () =>
      api('/admin/users/role', {
        method: 'PATCH',
        body: JSON.stringify({ user_id: user.id, role }),
      }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Modal title={`Change role: ${user.name || user.email}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as any)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
          </select>
        </div>
        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-ghost btn-md">
            Cancel
          </button>
          <button onClick={() => m.mutate()} className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            Save role
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────
function EditUserModal({ user, onClose, onSuccess }: { user: UserRow; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email);
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () => api(`/admin/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: name.trim() || null, email: email.trim() }),
    }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Modal title={`Edit: ${user.email}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); m.mutate(); }} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="(optional)" />
        </div>
        <div>
          <label className="label">Email *</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />} Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────
function PasswordResetModal({ user, onClose, onSuccess }: { user: UserRow; onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const gen = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p = '';
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPassword(p);
    setShow(true);
  };

  const m = useMutation({
    mutationFn: () => api(`/admin/users/${user.id}/password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
    onSuccess: () => setDone(true),
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Modal title={`Reset password: ${user.email}`} onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-[13px] text-emerald-900">
            <div className="font-bold mb-1">✓ Password reset · existing sessions revoked</div>
            <div className="mb-2">New password:</div>
            <div className="font-mono text-[15px] p-2 bg-white rounded border border-emerald-300 select-all">{password}</div>
            <div className="text-[11px] opacity-80 mt-2">Copy and share securely. This won't be shown again.</div>
          </div>
          <div className="flex justify-end">
            <button onClick={onSuccess} className="btn btn-primary btn-md">Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setErr(''); if (password.length < 8) { setErr('Min 8 characters'); return; } m.mutate(); }} className="space-y-4">
          <div>
            <label className="label flex items-center justify-between">
              <span>New password *</span>
              <button type="button" onClick={gen} className="text-[11px] font-bold uppercase tracking-wide text-brand-600 hover:text-brand-700">Generate</button>
            </label>
            <input
              type={show ? 'text' : 'password'}
              className="input font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
            />
            <label className="mt-2 flex items-center gap-2 text-[12px] text-ink-dim cursor-pointer">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
              Show password
            </label>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11.5px] text-amber-900">
            Resetting will <strong>revoke all active sessions</strong> for this user. They'll be forced to log back in.
          </div>
          {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
            <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
              {m.isPending && <Loader2 size={14} className="animate-spin" />} Reset password
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────
function SubscriptionModal({ user, onClose, onSuccess }: { user: UserRow; onClose: () => void; onSuccess: () => void }) {
  const [plan, setPlan] = useState<'demo' | 'monthly' | 'sixmonth' | 'annual'>(user.plan as any || 'demo');
  const initDays = user.plan === 'monthly' ? '30' : user.plan === 'sixmonth' ? '180' : user.plan === 'annual' ? '365' : '7';
  const [days, setDays] = useState<string>(initDays);
  const initAmt = user.plan === 'sixmonth' ? '100' : user.plan === 'monthly' ? '20' : user.plan === 'annual' ? '180' : '0';
  const [amount, setAmount] = useState(initAmt);
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () => api(`/admin/users/${user.id}/subscription`, {
      method: 'POST',
      body: JSON.stringify({
        plan,
        status: 'active',
        duration_days: parseInt(days, 10) || 0,
        amount_paid: parseFloat(amount) || 0,
      }),
    }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  const presets = [
    { plan: 'demo',     label: 'Free Trial · 7d',  days: '7',   amount: '0' },
    { plan: 'monthly',  label: 'Monthly · $20',    days: '30',  amount: '20' },
    { plan: 'sixmonth', label: '6-Month · $100',   days: '180', amount: '100' },
    { plan: 'annual',   label: 'Annual · $180',    days: '365', amount: '180' },
  ] as const;

  return (
    <Modal title={`Subscription: ${user.email}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); m.mutate(); }} className="space-y-4">
        <div className="text-[12px] text-ink-dim">
          Current: <strong className="text-ink">{user.plan || 'none'}</strong>
          {user.sub_expires && ` (expires ${new Date(user.sub_expires).toLocaleDateString()})`}
        </div>

        <div>
          <div className="label">Quick presets</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.plan}
                type="button"
                onClick={() => { setPlan(p.plan); setDays(p.days); setAmount(p.amount); }}
                className={`text-[11.5px] font-semibold py-2 px-2 rounded-lg border transition ${
                  plan === p.plan ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-ink-line hover:border-slate-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Plan *</label>
            <select className="input" value={plan} onChange={(e) => setPlan(e.target.value as any)}>
              <option value="demo">demo</option>
              <option value="monthly">monthly</option>
              <option value="sixmonth">sixmonth</option>
              <option value="annual">annual</option>
            </select>
          </div>
          <div>
            <label className="label">Duration (days)</label>
            <input type="number" className="input" value={days} onChange={(e) => setDays(e.target.value)} min="0" />
          </div>
        </div>
        <div>
          <label className="label">Amount paid (USD)</label>
          <input type="number" step="0.01" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} min="0" />
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-[11.5px] text-blue-900">
          Any existing subscription will be cancelled and replaced.
        </div>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />} Save subscription
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="card w-full max-w-md p-6">
        <div className="mb-5 flex items-start justify-between">
          <h3 className="font-display text-[18px] font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
