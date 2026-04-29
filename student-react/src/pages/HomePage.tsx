import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowRight, Sparkles, Layers, Flame, Target } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import QuestionOfTheDay from '../components/QuestionOfTheDay';
import WelcomeHero from '../components/WelcomeHero';
import MemoryDashboardWidgets from '../components/memory/MemoryDashboardWidgets';
import ReviewDuePanel from '../components/memory/ReviewDuePanel';
import WeakConceptWarnings from '../components/memory/WeakConceptWarnings';
import GamificationDashboardWidgets from '../components/gamification/GamificationDashboardWidgets';
import StreakBanner from '../components/gamification/StreakBanner';
import ReadinessPanel from '../components/ReadinessPanel';

type Domain = {
  id: string;
  number: number;
  name: string;
  short_name: string;
  weight: number;
  color_hex: string;
  description: string | null;
};
type Topic = { id: number; name: string; subtitle: string | null; domain_id: string };
type GamificationResp = {
  gamification: {
    total_xp: number;
    level: number;
    readiness_score: number;
    current_streak_days: number;
  };
};

export default function HomePage() {
  const { user } = useAuth();

  const domainsQ = useQuery({
    queryKey: ['domains'],
    queryFn: () => api<{ domains: Domain[] }>('/domains'),
  });
  const topicsQ = useQuery({
    queryKey: ['topics-all'],
    queryFn: () => api<{ topics: Topic[] }>('/topics'),
  });

  const statsQ = useQuery({
    queryKey: ['study-stats'],
    queryFn: () => api<{ stats: { due_now: number; streak_days: number; mastered: number; at_risk_24h?: number } }>('/study/stats'),
  });
  const gameQ = useQuery({
    queryKey: ['gamification-summary'],
    queryFn: () => api<GamificationResp>('/study/gamification'),
  });

  const counts = (domainId: string) =>
    topicsQ.data?.topics.filter((t) => t.domain_id === domainId).length ?? 0;

  const dueNow  = statsQ.data?.stats.due_now ?? 0;
  const atRisk24h = statsQ.data?.stats.at_risk_24h ?? 0;
  const streak  = gameQ.data?.gamification.current_streak_days ?? statsQ.data?.stats.streak_days ?? 0;
  const mastered = statsQ.data?.stats.mastered ?? 0;
  const totalXp = gameQ.data?.gamification.total_xp ?? 0;
  const level = gameQ.data?.gamification.level ?? 1;
  const readiness = gameQ.data?.gamification.readiness_score ?? 0;

  return (
    <div className="wrap py-8 sm:py-10">
      {/* Animated hero banner */}
      <div className="mb-8">
        <WelcomeHero
          name={user?.name}
          streakDays={streak}
          readinessScore={readiness}
          dueNow={dueNow}
        />
      </div>

      <div className="mb-6">
        <ReadinessPanel />
      </div>

      <ReviewDuePanel />
      <WeakConceptWarnings />
      <StreakBanner />
      <div className="mb-8">
        <GamificationDashboardWidgets />
      </div>
      <div className="mb-8">
        <MemoryDashboardWidgets />
      </div>

      {/* Due-today CTA */}
      {dueNow > 0 && (
        <Link
          to="/study/flashcards/due"
          className="group mb-8 flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-brand-500/40 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              <Target size={20} />
            </div>
            <div>
              <div className="font-display text-[18px] font-bold text-ink">{dueNow} cards due today</div>
              <div className="text-[13px] text-ink-body">Spaced repetition is ready for your next review.</div>
            </div>
          </div>
          <span className="btn btn-primary btn-md">
            Review now <ArrowRight size={14} />
          </span>
        </Link>
      )}

      {atRisk24h > 0 && (
        <Link
          to="/stats"
          className="group mb-8 flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-amber-400/40 bg-amber-50 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
        >
          <div>
            <div className="font-display text-[17px] font-bold text-ink">{atRisk24h} concepts at risk in next 24h</div>
            <div className="text-[13px] text-ink-body">Review now to prevent forgetting and protect your readiness score.</div>
          </div>
          <span className="btn btn-ghost btn-sm">
            Open memory dashboard <ArrowRight size={14} />
          </span>
        </Link>
      )}

      {/* Quick stat tiles */}
      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatTile icon={Flame} label="Streak" value={`${streak}d`} accent="text-orange-600" />
        <StatTile icon={Sparkles} label={`Level ${level}`} value={`${totalXp} XP`} accent="text-brand-600" />
        <StatTile icon={Target} label="Readiness" value={`${readiness}%`} accent="text-green-600" />
        <StatTile icon={Layers} label="Topics" value={topicsQ.data?.topics.length ?? mastered ?? '—'} accent="text-purple-600" />
      </div>

      {/* Question of the Day */}
      <div className="mb-10">
        <QuestionOfTheDay />
      </div>

      <h2 className="mb-5 font-display text-2xl font-extrabold text-ink">All 7 CSP domains</h2>

      {domainsQ.isLoading ? (
        <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>
      ) : !domainsQ.data?.domains.length ? (
        <div className="card p-10 text-center text-[14px] text-ink-dim">
          No domains seeded yet. An admin needs to create them first.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {domainsQ.data.domains.map((d) => {
            const accent = d.color_hex || '#EA580C';
            const topicCount = counts(d.id);
            return (
              <Link
                key={d.id}
                to={`/domains/${d.id}`}
                className="group relative overflow-hidden rounded-2xl border border-ink-line bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-cardHover hover:border-slate-200"
              >
                {/* Accent corner */}
                <div
                  className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-10 transition-opacity group-hover:opacity-20"
                  style={{ background: accent }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-xl font-display text-[14px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
                    >
                      {String(d.number).padStart(2, '0')}
                    </span>
                    <span className="badge badge-slate">{d.weight}% weight</span>
                  </div>
                  <h3 className="mt-4 font-display text-[18px] font-bold text-ink">{d.name}</h3>
                  {d.description && (
                    <p className="mt-1.5 text-[13px] text-ink-body line-clamp-2">{d.description}</p>
                  )}
                  <div className="mt-5 flex items-center justify-between text-[12.5px]">
                    <span className="text-ink-dim">{topicCount} topics</span>
                    <span className="flex items-center gap-1 font-semibold text-brand-600 transition-transform group-hover:translate-x-0.5">
                      Open <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon, label, value, accent,
}: { icon: any; label: string; value: number | string; accent: string }) {
  return (
    <div className="card flex items-center gap-3 p-4 sm:p-5">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface ring-1 ring-ink-line ${accent}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{label}</div>
        <div className="font-display text-xl font-extrabold text-ink">{value}</div>
      </div>
    </div>
  );
}
