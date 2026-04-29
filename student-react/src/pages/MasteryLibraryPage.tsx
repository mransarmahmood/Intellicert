import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Award, Lock, Calculator, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

type Topic = {
  id: number;
  mastery_id: string;
  mastery_category_code: string;
  slug: string;
  name: string;
  primary_blueprint_code: string;
  is_calculation_topic: boolean;
  status: string;
};

type Category = {
  id: number;
  code: string;
  name: string;
  short_name: string;
  description: string;
  topic_count_target: number;
  priority: string;
  topics: Topic[];
};

type Resp = { categories: Category[] };

/**
 * Mastery Library — premium-gated entry point.
 *
 * Renders the 9-category overview with topic counts and live/draft status.
 * If the API returns 402 with upgrade_required, we render the paywall card
 * instead of an error banner.
 */
export default function MasteryLibraryPage() {
  const { data, isLoading, error, refetch } = useQuery<Resp, { status?: number; upgrade_required?: boolean; message?: string }>({
    queryKey: ['mastery-categories'],
    queryFn: () => api<Resp>('/mastery/categories'),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center text-ink-dim">
        <Loader2 className="animate-spin" size={20} aria-hidden="true" />
      </div>
    );
  }

  // Premium gate — backend returns 402 with upgrade_required=true
  if (error && (error as any).status === 402) {
    return (
      <div className="wrap py-12">
        <div className="card mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-amber-100 text-amber-700">
            <Lock size={26} aria-hidden="true" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">Mastery Library — Premium</h1>
          <p className="mt-2 text-[14px] text-ink-body">
            65 advanced techniques every CSP must master — Fault Tree Analysis, NIOSH Lifting Equation,
            Control Charts, LOPA, SIL, and 60 more — each with a downloadable Method Card,
            decision tree, and interactive calculation sandbox.
          </p>
          <p className="mt-4 text-[13px] text-ink-dim">
            Available on the 6-month and yearly plans.
          </p>
          <Link to="/pricing" className="btn btn-primary btn-md mt-5 inline-flex">
            Upgrade <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="wrap py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          Failed to load Mastery Library. <button onClick={() => refetch()} className="underline">Retry</button>
        </div>
      </div>
    );
  }

  const cats = data.categories;
  const totalGold = cats.reduce((s, c) => s + c.topics.filter(t => t.status === 'mastery_gold').length, 0);
  const totalTopics = cats.reduce((s, c) => s + c.topics.length, 0);

  return (
    <div className="wrap py-10">
      <header className="mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
          <Award size={11} aria-hidden="true" /> Mastery Library
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">
          Advanced Techniques & Methods
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-body">
          The 65 advanced techniques every CSP must master, each engineered to the 18-element Mastery
          Gold Standard. Method Card · Decision Tree · Calculation Sandbox · GCC-anchored cases.
        </p>
        <div className="mt-3 flex items-center gap-3 text-[12.5px] text-ink-dim">
          <span><strong className="text-ink">{totalGold}</strong> live</span>
          <span>·</span>
          <span><strong className="text-ink">{totalTopics - totalGold}</strong> in SME review</span>
          <span>·</span>
          <span>9 categories</span>
        </div>
      </header>

      <div className="space-y-6">
        {cats.map((cat) => {
          const liveTopics = cat.topics.filter(t => t.status === 'mastery_gold');
          const allTopics = cat.topics;
          return (
            <section key={cat.code} className="card overflow-hidden">
              <div className="flex items-baseline justify-between border-b border-ink-line px-5 py-4">
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-dim">
                    {cat.code} · Priority {cat.priority}
                  </div>
                  <h2 className="mt-0.5 font-display text-lg font-bold text-ink">{cat.name}</h2>
                  <p className="mt-1 text-[12.5px] text-ink-body">{cat.description}</p>
                </div>
                <div className="text-right text-[11.5px] tabular-nums text-ink-dim">
                  <div><span className="font-bold text-ink">{liveTopics.length}</span> / {cat.topic_count_target}</div>
                  <div className="text-[10.5px]">live</div>
                </div>
              </div>
              <ul className="divide-y divide-ink-line">
                {allTopics.map((t) => {
                  const isLive = t.status === 'mastery_gold';
                  const Inner = (
                    <div className={`flex items-center justify-between gap-4 px-5 py-3 ${isLive ? 'transition hover:bg-slate-50' : 'opacity-60'}`}>
                      <div className="flex items-center gap-3">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-ink-dim">
                          {t.mastery_id}
                        </span>
                        <div>
                          <div className="text-[13.5px] font-semibold text-ink">{t.name}</div>
                          <div className="text-[11px] text-ink-dim">
                            Blueprint {t.primary_blueprint_code}
                            {t.is_calculation_topic && (
                              <span className="ml-2 inline-flex items-center gap-1 text-blue-700">
                                <Calculator size={10} aria-hidden="true" /> calc sandbox
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isLive ? (
                        <ArrowRight size={14} className="text-ink-dim" aria-hidden="true" />
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                          {t.status === 'needs_sme' ? 'SME review' : 'draft'}
                        </span>
                      )}
                    </div>
                  );
                  return (
                    <li key={t.mastery_id}>
                      {isLive
                        ? <Link to={`/mastery/${t.mastery_id}`}>{Inner}</Link>
                        : <div aria-disabled="true">{Inner}</div>}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <footer className="mt-10 rounded-2xl border border-ink-line bg-white p-6">
        <div className="flex items-start gap-3">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <h3 className="font-display text-[15px] font-bold text-ink">The 18-element Mastery Gold Standard</h3>
            <p className="mt-1 text-[13px] text-ink-body">
              Every Mastery topic carries the 15 standard learning elements PLUS a 1-page Method Card,
              a Decision Tree (when to use this method vs. alternatives), and either a Calculation Sandbox
              (interactive worksheet) or an Application Workshop (AI-graded scenario).
            </p>
            <p className="mt-2 text-[12px] text-ink-dim">
              Topics in <em>SME review</em> are AI-drafted and being verified against primary sources before
              going live to learners.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
