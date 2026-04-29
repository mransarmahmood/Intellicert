import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, UserPlus, CreditCard, DollarSign, TrendingUp, BookOpen, Layers, HelpCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

type Resp = {
  headline: {
    total_users: number;
    new_users_7d: number;
    new_users_30d: number;
    active_subscribers: number;
    total_revenue: number;
    month_revenue: number;
  };
  signup_series: { date: string; count: number }[];
  revenue_series: { date: string; amount: number }[];
  plan_dist: { plan: string; count: number }[];
  content_totals: { topics: number; flashcards: number; quizzes: number; concepts: number };
};

const headline = [
  { key: 'total_users', label: 'Total Users', icon: Users, color: 'from-brand-400 to-brand-600' },
  { key: 'new_users_7d', label: 'New (7d)', icon: UserPlus, color: 'from-blue-400 to-blue-600' },
  { key: 'new_users_30d', label: 'New (30d)', icon: UserPlus, color: 'from-indigo-400 to-indigo-600' },
  { key: 'active_subscribers', label: 'Active Subs', icon: CreditCard, color: 'from-green-400 to-green-600' },
  { key: 'month_revenue', label: 'This Month', icon: TrendingUp, color: 'from-purple-400 to-purple-600', money: true },
  { key: 'total_revenue', label: 'All Time', icon: DollarSign, color: 'from-emerald-400 to-emerald-600', money: true },
] as const;

const contentCards = [
  { key: 'topics', label: 'Topics', icon: BookOpen },
  { key: 'concepts', label: 'Concepts', icon: Sparkles },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
  { key: 'quizzes', label: 'Quizzes', icon: HelpCircle },
] as const;

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api<Resp>('/analytics/overview'),
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-ink">Analytics</h1>
        <p className="mt-1 text-[14px] text-ink-dim">Platform health and growth metrics.</p>
      </div>

      {isLoading && <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{(error as Error).message}</div>}

      {data && (
        <>
          {/* Headline */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {headline.map((c) => {
              const raw = (data.headline as any)[c.key] as number;
              const value = (c as any).money ? `$${Number(raw || 0).toLocaleString()}` : Number(raw || 0).toLocaleString();
              return (
                <div key={c.key} className="card group p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-cardHover">
                  <div className={`mb-3 inline-grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${c.color} text-white`}>
                    <c.icon size={15} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{c.label}</div>
                  <div className="mt-1 font-display text-2xl font-extrabold text-ink">{value}</div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <BarChart title="Sign-ups · last 14 days" series={data.signup_series.map(s => ({ label: s.date.slice(5), value: s.count }))} accent="#EA580C" />
            <BarChart title="Revenue · last 14 days" series={data.revenue_series.map(s => ({ label: s.date.slice(5), value: s.amount }))} accent="#10B981" money />
          </div>

          {/* Plan distribution */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h3 className="font-display text-[15px] font-bold text-ink">Active plan distribution</h3>
              {data.plan_dist.length === 0 ? (
                <div className="mt-6 text-center text-[13px] text-ink-dim">No active subscriptions</div>
              ) : (
                <div className="mt-5 space-y-3">
                  {data.plan_dist.map((p) => {
                    const total = data.plan_dist.reduce((s, x) => s + x.count, 0);
                    const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
                    return (
                      <div key={p.plan}>
                        <div className="mb-1.5 flex justify-between text-[12.5px]">
                          <span className="font-semibold text-ink capitalize">{p.plan}</span>
                          <span className="text-ink-dim">{p.count} · {pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface">
                          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-display text-[15px] font-bold text-ink">Content totals</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {contentCards.map((c) => (
                  <div key={c.key} className="rounded-xl border border-ink-line bg-surface p-4">
                    <c.icon size={18} className="mb-2 text-brand-600" />
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{c.label}</div>
                    <div className="mt-1 font-display text-2xl font-extrabold text-ink">
                      {(data.content_totals as any)[c.key]}
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

function BarChart({ title, series, accent, money }: {
  title: string;
  series: { label: string; value: number }[];
  accent: string;
  money?: boolean;
}) {
  const max = Math.max(1, ...series.map(s => s.value));
  return (
    <div className="card p-6">
      <h3 className="font-display text-[15px] font-bold text-ink">{title}</h3>
      <div className="mt-5 flex h-40 items-end gap-1.5">
        {series.map((s, i) => {
          const h = (s.value / max) * 100;
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-80"
                style={{ height: `${Math.max(3, h)}%`, background: `linear-gradient(180deg, ${accent}, ${accent}AA)` }}
                title={`${s.label}: ${money ? '$' : ''}${s.value}`}
              />
              <div className="absolute -top-6 hidden whitespace-nowrap rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:block">
                {money ? '$' : ''}{s.value.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-ink-muted">
        <span>{series[0]?.label}</span>
        <span>{series[series.length - 1]?.label}</span>
      </div>
    </div>
  );
}
