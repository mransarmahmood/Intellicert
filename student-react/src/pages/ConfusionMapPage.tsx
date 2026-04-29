import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Workflow, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { api } from '../lib/api';

type DomainStat = {
  domain_id: string;
  number: number;
  name: string;
  color: string;
  attempts: number;
  wrong: number;
  wrong_pct: number;
  mastery_pct: number;
};
type WorstQuiz = {
  id: number;
  domain_id: string;
  question: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_index: number;
  explanation: string | null;
  attempts: number;
  wrong: number;
};
type Resp = { domains: DomainStat[]; worst_quizzes: WorstQuiz[]; total_attempts: number };

export default function ConfusionMapPage() {
  const dataQ = useQuery({
    queryKey: ['confusion-map'],
    queryFn: () => api<Resp>('/confusion-map'),
  });

  if (dataQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }
  if (dataQ.error || !dataQ.data) {
    return <div className="wrap py-10"><div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{(dataQ.error as Error)?.message ?? 'Failed to load'}</div></div>;
  }

  const { domains, worst_quizzes, total_attempts } = dataQ.data;

  return (
    <div className="wrap py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700 ring-1 ring-rose-500/20">
          <Workflow size={12} /> Memory tools
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">Confusion Map</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-body">
          Where you're losing points. The bigger the slice, the more you've gotten wrong in that domain. Drill these areas first.
        </p>
      </div>

      {total_attempts === 0 ? (
        <div className="card grid place-items-center py-16 text-center">
          <AlertTriangle size={28} className="mb-3 text-ink-muted" />
          <div className="font-display text-[14px] font-semibold text-ink">No quiz history yet</div>
          <p className="mt-1 max-w-sm text-[13px] text-ink-dim">
            Take some practice quizzes or run an exam simulation, then come back here for a personalized weakness map.
          </p>
          <Link to="/study/quizzes/all" className="btn btn-primary btn-md mt-5">Practice quizzes</Link>
        </div>
      ) : (
        <>
          {/* SVG donut + legend */}
          <div className="mb-8 grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="card grid place-items-center p-6">
              <ConfusionDonut domains={domains} />
            </div>
            <div className="space-y-3">
              {domains.map((d) => (
                <div key={d.domain_id} className="card p-5">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-[12px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${d.color}, ${d.color}CC)` }}
                    >
                      {String(d.number).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-[14.5px] font-bold text-ink">{d.name}</div>
                      <div className="text-[12px] text-ink-dim">
                        {d.attempts} attempts · {d.wrong} wrong · {d.mastery_pct}% mastery
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-extrabold text-red-600">{d.wrong_pct}%</div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">wrong</div>
                    </div>
                  </div>
                  {/* Mastery bar */}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                    <div className="h-full rounded-full" style={{ width: `${d.mastery_pct}%`, background: `linear-gradient(90deg, ${d.color}, ${d.color}AA)` }} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/study/quizzes/${d.domain_id}`} className="btn btn-ghost btn-sm">Practice this domain <ArrowRight size={12} /></Link>
                    <Link to={`/study/flashcards/${d.domain_id}`} className="btn btn-ghost btn-sm">Flashcards</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Most-missed questions */}
          {worst_quizzes.length > 0 && (
            <div>
              <h2 className="mb-4 font-display text-2xl font-extrabold text-ink">Most-missed questions</h2>
              <div className="space-y-3">
                {worst_quizzes.map((q) => {
                  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
                  return (
                    <div key={q.id} className="card p-5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-ink">{q.question}</p>
                        <div className="text-right">
                          <div className="font-display text-lg font-extrabold text-red-600">{q.wrong}</div>
                          <div className="text-[9px] font-bold uppercase tracking-wider text-ink-dim">missed</div>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {opts.map((opt, i) => {
                          const isCorrect = i === q.correct_index;
                          return (
                            <div
                              key={i}
                              className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[12px] ${
                                isCorrect ? 'bg-green-50 text-green-800 ring-1 ring-green-500/20' : 'text-ink-body'
                              }`}
                            >
                              {isCorrect && <Check size={11} className="mt-0.5 shrink-0 text-green-600" />}
                              <span className="font-bold uppercase text-ink-dim">{String.fromCharCode(65 + i)}.</span>
                              <span className="line-clamp-2">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <div className="mt-3 rounded-lg border border-ink-line bg-surface p-3 text-[12.5px] text-ink-body">
                          <strong className="text-ink">Why: </strong>{q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SVG donut chart of wrong-percentage per domain

function ConfusionDonut({ domains }: { domains: DomainStat[] }) {
  const total = domains.reduce((s, d) => s + d.wrong, 0);
  if (total === 0) {
    return <div className="text-center text-[13px] text-ink-dim">All correct so far!</div>;
  }
  const W = 240;
  const cx = W / 2;
  const cy = W / 2;
  const R = 100;
  const stroke = 28;

  let acc = 0;
  return (
    <svg viewBox={`0 0 ${W} ${W}`} className="w-full max-w-[240px]">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      {domains.map((d) => {
        if (d.wrong === 0) return null;
        const frac = d.wrong / total;
        const start = acc;
        const end = acc + frac;
        acc += frac;

        const a1 = start * Math.PI * 2 - Math.PI / 2;
        const a2 = end * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + R * Math.cos(a1);
        const y1 = cy + R * Math.sin(a1);
        const x2 = cx + R * Math.cos(a2);
        const y2 = cy + R * Math.sin(a2);
        const largeArc = frac > 0.5 ? 1 : 0;

        return (
          <path
            key={d.domain_id}
            d={`M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`}
            fill="none"
            stroke={d.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="800" fontSize="32" fill="#0F172A">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="9" letterSpacing="2" fill="#94A3B8">
        WRONG TOTAL
      </text>
    </svg>
  );
}
