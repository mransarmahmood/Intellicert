import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Loader2, Layers, HelpCircle, ArrowRight, BookOpen, Wind, GraduationCap } from 'lucide-react';
import { api } from '../lib/api';

type Domain = { id: string; number: number; name: string; weight: number; color_hex: string };
type Counts = { flashcards: number; quizzes: number };
type RecommendationResp = {
  recommendation: {
    pace_mode: 'fast' | 'normal' | 'support';
    due_concepts: number;
    recent_accuracy_14d: number | null;
    weak_domain_id: string | null;
    next_topic: { id: number; name: string; domain_id: string } | null;
    reason: string;
  };
};
type Mission = { id: number; name: string; progress_count: number; target_count: number; status: 'active' | 'completed' | 'claimed'; xp_reward: number };

export default function StudyHubPage() {
  const navigate = useNavigate();
  const [paceMode, setPaceMode] = useState<'fast' | 'normal' | 'support'>('normal');
  const domainsQ = useQuery({
    queryKey: ['domains'],
    queryFn: () => api<{ domains: Domain[] }>('/domains'),
  });
  const flashcardsQ = useQuery({
    queryKey: ['flashcards-all'],
    queryFn: () => api<{ flashcards: { domain_id: string }[]; total: number }>('/flashcards'),
  });
  const quizzesQ = useQuery({
    queryKey: ['quizzes-all'],
    queryFn: () => api<{ quizzes: { domain_id: string }[]; total: number }>('/quizzes'),
  });
  const recQ = useQuery({
    queryKey: ['study-recommendation'],
    queryFn: () => api<RecommendationResp>('/study/recommendation'),
  });
  const missionsQ = useQuery({
    queryKey: ['gamification-missions-widget'],
    queryFn: () => api<{ missions: Mission[] }>('/gamification/missions'),
  });

  useEffect(() => {
    const stored = localStorage.getItem('intellicert_pace_mode') as 'fast' | 'normal' | 'support' | null;
    if (stored) setPaceMode(stored);
  }, []);
  useEffect(() => {
    localStorage.setItem('intellicert_pace_mode', paceMode);
  }, [paceMode]);

  const counts = (domainId: string): Counts => ({
    flashcards: flashcardsQ.data?.flashcards.filter((f) => f.domain_id === domainId).length ?? 0,
    quizzes: quizzesQ.data?.quizzes.filter((q) => q.domain_id === domainId).length ?? 0,
  });

  const totalCards = flashcardsQ.data?.total ?? 0;
  const totalQuizzes = quizzesQ.data?.total ?? 0;

  return (
    <div className="wrap py-10 sm:py-14">
      <div className="mb-10">
        <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">Study hub</h1>
        <p className="mt-3 max-w-2xl text-[16px] text-ink-body">
          Pick a mode to get started. Mix flashcards and quizzes for the best long-term retention.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-700">Adaptive pace mode</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { id: 'support', label: 'Support' },
            { id: 'normal', label: 'Normal' },
            { id: 'fast', label: 'Fast' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setPaceMode(p.id as 'fast' | 'normal' | 'support')}
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
                paceMode === p.id ? 'border-transparent bg-indigo-600 text-white' : 'border-ink-line bg-white text-ink-body'
              }`}
            >
              {p.label}
            </button>
          ))}
          {recQ.data?.recommendation.pace_mode && (
            <span className="ml-1 self-center text-[12px] text-ink-dim">
              AI suggested: <strong>{recQ.data.recommendation.pace_mode}</strong>
            </span>
          )}
        </div>
      </div>

      {recQ.data?.recommendation.next_topic && (
        <Link
          to={`/topics/${recQ.data.recommendation.next_topic.id}/learn`}
          className="group mb-8 flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-emerald-300/50 bg-emerald-50 p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-cardHover"
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">Next best concept</div>
            <div className="mt-1 font-display text-[18px] font-bold text-ink">{recQ.data.recommendation.next_topic.name}</div>
            <div className="mt-1 text-[13px] text-ink-body">{recQ.data.recommendation.reason}</div>
          </div>
          <span className="btn btn-primary btn-sm">
            Start now <ArrowRight size={13} />
          </span>
        </Link>
      )}

      <div className="mb-8 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700">Mission Progress</div>
        <div className="mt-2 space-y-2">
          {(missionsQ.data?.missions ?? []).slice(0, 3).map((m) => {
            const pct = Math.round((m.progress_count / Math.max(1, m.target_count)) * 100);
            return (
              <div key={m.id} className="rounded-lg border border-violet-200 bg-white px-3 py-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-semibold text-ink">{m.name}</span>
                  <span className="text-ink-dim">{m.progress_count}/{m.target_count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All-domains shortcuts */}
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <Link
          to="/study/flashcards/all"
          className="group relative overflow-hidden rounded-2xl border border-ink-line bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-cardHover"
        >
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-purple-500/10 transition-opacity group-hover:bg-purple-500/15" />
          <div className="relative flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-sm">
              <Layers size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-[18px] font-bold text-ink">All flashcards</h3>
              <p className="mt-1 text-[13px] text-ink-body">Mixed deck across all 7 domains</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-display text-[22px] font-extrabold text-ink">{totalCards}</span>
                <span className="flex items-center gap-1 text-[13px] font-semibold text-brand-600 transition-transform group-hover:translate-x-1">
                  Start <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/study/quizzes/all"
          className="group relative overflow-hidden rounded-2xl border border-ink-line bg-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-cardHover"
        >
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-blue-500/10 transition-opacity group-hover:bg-blue-500/15" />
          <div className="relative flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
              <HelpCircle size={22} />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-[18px] font-bold text-ink">All quizzes</h3>
              <p className="mt-1 text-[13px] text-ink-body">Mixed practice from all domains</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-display text-[22px] font-extrabold text-ink">{totalQuizzes}</span>
                <span className="flex items-center gap-1 text-[13px] font-semibold text-brand-600 transition-transform group-hover:translate-x-1">
                  Start <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Special modes */}
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <Link
          to="/feynman"
          className="group flex items-center gap-4 rounded-2xl border border-ink-line bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-cardHover"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-sm">
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[15px] font-bold text-ink">Feynman teach-back</div>
            <div className="text-[12.5px] text-ink-dim">Teach a topic — AI grades your Detail Understanding</div>
          </div>
          <ArrowRight size={16} className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
        </Link>
        <Link
          to="/focus?next=/study"
          className="group flex items-center gap-4 rounded-2xl border border-ink-line bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-cardHover"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-white shadow-sm">
            <Wind size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[15px] font-bold text-ink">Focus mode</div>
            <div className="text-[12.5px] text-ink-dim">60-second breathing ritual before you study</div>
          </div>
          <ArrowRight size={16} className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
        </Link>
      </div>

      <h2 className="mb-5 font-display text-2xl font-extrabold text-ink">By domain</h2>

      {domainsQ.isLoading || flashcardsQ.isLoading || quizzesQ.isLoading ? (
        <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>
      ) : !domainsQ.data?.domains.length ? (
        <div className="card grid place-items-center p-10 text-center">
          <BookOpen size={28} className="mb-3 text-ink-muted" />
          <p className="text-[14px] text-ink-dim">No domains seeded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {domainsQ.data.domains.map((d) => {
            const c = counts(d.id);
            const accent = d.color_hex || '#EA580C';
            return (
              <div
                key={d.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/domains/${d.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/domains/${d.id}`);
                  }
                }}
                className="card group flex cursor-pointer flex-col items-stretch gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-cardHover sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 items-center gap-4">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-[14px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
                  >
                    {String(d.number).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-[16px] font-bold text-ink">{d.name}</div>
                    <div className="text-[12px] text-ink-dim">{d.weight}% of exam</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/study/flashcards/${d.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-ghost btn-sm flex-1 sm:flex-initial"
                  >
                    <Layers size={13} /> {c.flashcards} cards
                  </Link>
                  <Link
                    to={`/study/quizzes/${d.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="btn btn-ghost btn-sm flex-1 sm:flex-initial"
                  >
                    <HelpCircle size={13} /> {c.quizzes} quizzes
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
