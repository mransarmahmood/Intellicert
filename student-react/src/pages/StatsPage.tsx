import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Flame, Brain, CheckCircle2, Layers, HelpCircle, Target, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import RetentionAnalyticsWidgets from '../components/memory/RetentionAnalyticsWidgets';
import ReadinessPanel from '../components/ReadinessPanel';

type Stats = {
  total_reviewed: number;
  total_cards: number;
  due_now: number;
  mastered: number;
  streak_days: number;
  quiz_attempts_30d: number;
  quiz_accuracy_30d: number;
  due_concepts_now?: number;
  at_risk_24h?: number;
};
type DomainStat = {
  domain_id: string;
  total: number;
  reviewed: number;
  mastered: number;
  mastery_pct: number;
};
type Resp = {
  stats: Stats;
  review_series: { date: string; count: number }[];
  domains: DomainStat[];
};
type Domain = { id: string; number: number; name: string; color_hex: string };

export default function StatsPage() {
  const statsQ = useQuery({
    queryKey: ['study-stats'],
    queryFn: () => api<Resp>('/study/stats'),
  });
  const domainsQ = useQuery({
    queryKey: ['domains'],
    queryFn: () => api<{ domains: Domain[] }>('/domains'),
  });

  const domainsById = Object.fromEntries((domainsQ.data?.domains ?? []).map((d) => [d.id, d]));

  if (statsQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }
  if (statsQ.error || !statsQ.data) {
    return (
      <div className="wrap py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          {(statsQ.error as Error)?.message ?? 'Failed to load stats'}
        </div>
      </div>
    );
  }

  const { stats, review_series, domains } = statsQ.data;
  const max = Math.max(1, ...review_series.map((r) => r.count));

  return (
    <div className="wrap py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Your progress</h1>
          <p className="mt-2 text-[15px] text-ink-body">Spaced repetition keeps your hardest cards on top.</p>
        </div>
        {stats.due_now > 0 && (
          <Link to="/study/flashcards/due" className="btn btn-primary btn-md">
            Review {stats.due_now} due <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* Track 3 — calibrated readiness with per-domain breakdown */}
      <div className="mb-8">
        <ReadinessPanel />
      </div>

      {/* Headline cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Flame} label="Streak" value={`${stats.streak_days}d`} color="from-orange-400 to-red-500" />
        <StatCard icon={Brain} label="Reviewed" value={stats.total_reviewed} color="from-purple-400 to-purple-600" />
        <StatCard icon={CheckCircle2} label="Mastered" value={stats.mastered} color="from-green-400 to-green-600" />
        <StatCard icon={Target} label="Due now" value={stats.due_now} color="from-brand-400 to-brand-600" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Concepts due now</div>
          <div className="mt-1 font-display text-2xl font-extrabold text-ink">{stats.due_concepts_now ?? 0}</div>
          <div className="mt-1 text-[12px] text-ink-body">Immediate concept refreshes waiting in revision queue.</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">At risk in 24h</div>
          <div className="mt-1 font-display text-2xl font-extrabold text-ink">{stats.at_risk_24h ?? 0}</div>
          <div className="mt-1 text-[12px] text-ink-body">Concepts approaching forgetting window soon.</div>
        </div>
      </div>

      {/* Review activity chart */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h3 className="font-display text-[15px] font-bold text-ink">Review activity · last 14 days</h3>
          <div className="mt-5 flex h-32 items-end gap-1.5">
            {review_series.map((s, i) => {
              const h = (s.count / max) * 100;
              return (
                <div key={i} className="group relative flex flex-1 flex-col items-center">
                  <div
                    className="w-full rounded-t-md bg-gradient-to-b from-brand-500 to-brand-600 transition-all group-hover:opacity-80"
                    style={{ height: `${Math.max(3, h)}%` }}
                    title={`${s.date}: ${s.count}`}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-ink-muted">
            <span>{review_series[0]?.date.slice(5)}</span>
            <span>{review_series[review_series.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-display text-[15px] font-bold text-ink">Quizzes (30d)</h3>
          <div className="mt-5">
            <div className="flex items-baseline gap-2">
              <div className="font-display text-4xl font-extrabold text-ink">{stats.quiz_accuracy_30d}%</div>
              <div className="text-[12px] text-ink-dim">accuracy</div>
            </div>
            <div className="mt-2 text-[12px] text-ink-body">
              {stats.quiz_attempts_30d} attempts in the last 30 days
            </div>
            <Link to="/study/quizzes/all" className="btn btn-ghost btn-sm mt-5 w-full">
              <HelpCircle size={13} /> Practice quiz
            </Link>
          </div>
        </div>
      </div>

      {/* Mastery per domain */}
      <div className="mt-8">
        <RetentionAnalyticsWidgets />
      </div>

      <div className="mt-8">
        <h2 className="mb-5 font-display text-2xl font-extrabold text-ink">Mastery by domain</h2>
        {domains.length === 0 ? (
          <div className="card grid place-items-center py-12 text-center">
            <Layers size={28} className="mb-3 text-ink-muted" />
            <p className="text-[14px] text-ink-dim">Start reviewing flashcards to see your mastery per domain.</p>
            <Link to="/study/flashcards/all" className="btn btn-primary btn-md mt-5">Start studying</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((d) => {
              const meta = domainsById[d.domain_id];
              const accent = meta?.color_hex ?? '#EA580C';
              return (
                <div key={d.domain_id} className="card p-5">
                  <div className="flex items-center gap-4">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-[12px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
                    >
                      {String(meta?.number ?? '?').padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[15px] font-bold text-ink">{meta?.name ?? d.domain_id}</div>
                      <div className="text-[12px] text-ink-dim">
                        {d.mastered} mastered · {d.reviewed} reviewed · {d.total} total
                      </div>
                    </div>
                    <div className="font-display text-[20px] font-extrabold text-ink">{d.mastery_pct}%</div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.mastery_pct}%`,
                        background: `linear-gradient(90deg, ${accent}, ${accent}AA)`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="card p-5">
      <div className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${color} text-white shadow-sm`}>
        <Icon size={18} />
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{label}</div>
      <div className="mt-1 font-display text-3xl font-extrabold text-ink">{value}</div>
    </div>
  );
}
