import { useQuery } from '@tanstack/react-query';
import { Users, CreditCard, Sparkles, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

type Stats = {
  total_users: number;
  active_subscribers: number;
  demo_users: number;
  total_revenue: number;
  month_revenue: number;
};
type RecentUser = { id: number; email: string; name: string | null; role: string; created_at: string };
type RecentSub = {
  id: number;
  plan: string;
  status: string;
  amount_paid: number | null;
  email: string;
  name: string | null;
  started_at: string;
};
type Resp = { stats: Stats; recent_users: RecentUser[]; recent_subscriptions: RecentSub[] };

type CardDef = { key: string; label: string; icon: typeof Users; color: string; money?: boolean };

const cards: readonly CardDef[] = [
  { key: 'total_users', label: 'Total Users', icon: Users, color: 'from-brand-400 to-brand-600' },
  { key: 'active_subscribers', label: 'Active Subscribers', icon: CreditCard, color: 'from-green-400 to-green-600' },
  { key: 'demo_users', label: 'Demo Users', icon: Sparkles, color: 'from-blue-400 to-blue-600' },
  { key: 'total_revenue', label: 'Total Revenue', icon: DollarSign, color: 'from-emerald-400 to-emerald-600', money: true },
  { key: 'month_revenue', label: 'This Month', icon: TrendingUp, color: 'from-purple-400 to-purple-600', money: true },
];

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api<Resp>('/admin/dashboard-stats'),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-ink">Dashboard</h1>
        <p className="mt-1 text-[14px] text-ink-dim">Platform overview and recent activity.</p>
      </div>

      {isLoading && (
        <div className="grid place-items-center py-20 text-ink-dim">
          <Loader2 className="animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          {(error as Error).message}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map((c) => {
              const raw = (data.stats as any)[c.key] as number;
              const value = c.money ? `$${Number(raw || 0).toLocaleString()}` : Number(raw || 0).toLocaleString();
              return (
                <div key={c.key} className="card group p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardHover">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">{c.label}</div>
                    <div className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${c.color} text-white`}>
                      <c.icon size={15} />
                    </div>
                  </div>
                  <div className="mt-3 font-display text-3xl font-extrabold text-ink">{value}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card overflow-hidden">
              <div className="border-b border-ink-line px-5 py-4">
                <h3 className="font-display text-[15px] font-bold text-ink">Recent Users</h3>
              </div>
              <div className="divide-y divide-ink-line">
                {data.recent_users.length === 0 && (
                  <div className="px-5 py-8 text-center text-[13px] text-ink-dim">No users yet</div>
                )}
                {data.recent_users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-display text-[12px] font-bold text-white">
                      {(u.name || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-ink">{u.name || u.email}</div>
                      <div className="truncate text-[12px] text-ink-dim">{u.email}</div>
                    </div>
                    <span
                      className={`badge ${
                        u.role === 'superadmin' ? 'badge-brand' : u.role === 'admin' ? 'badge-green' : 'badge-slate'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-ink-line px-5 py-4">
                <h3 className="font-display text-[15px] font-bold text-ink">Recent Subscriptions</h3>
              </div>
              <div className="divide-y divide-ink-line">
                {data.recent_subscriptions.length === 0 && (
                  <div className="px-5 py-8 text-center text-[13px] text-ink-dim">No paid subscriptions yet</div>
                )}
                {data.recent_subscriptions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-ink">{s.name || s.email}</div>
                      <div className="truncate text-[12px] text-ink-dim">{s.email}</div>
                    </div>
                    <span className="badge badge-brand">{s.plan}</span>
                    <div className="font-display text-[14px] font-bold text-ink">
                      {s.amount_paid ? `$${Number(s.amount_paid).toFixed(0)}` : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
