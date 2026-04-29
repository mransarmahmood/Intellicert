import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, FileCheck, Clock, Flag, ChevronLeft, ChevronRight,
  Trophy, RotateCw, BarChart3, Target, Lock, Sparkles,
} from 'lucide-react';
import { api } from '../lib/api';
import CalculatorOverlay from '../components/CalculatorOverlay';
import ReferenceSheetDrawer from '../components/ReferenceSheetDrawer';

type Quiz = {
  id: number;
  domain_id: string;
  question: string;
  option_a: string; option_b: string; option_c: string; option_d: string;
  correct_index: number;
  explanation: string | null;
};
type Domain = { id: string; number: number; name: string; weight: number; color_hex: string };

type Phase = 'setup' | 'running' | 'finished';

// Track 4b — three named exam modes.
//   diagnostic    — 50 items / 75 min, free navigation, no lock. For first-time
//                   users to set a baseline pass-probability.
//   domain        — Configurable per-domain practice, no lock.
//   full_sim      — 200 items / 5h30m, BCSP-style locked nav after first 25.
type ExamMode = 'diagnostic' | 'domain' | 'full_sim';
const MODE_PRESETS: Record<ExamMode, { count: number; minutes: number; lockedAfter: number; label: string }> = {
  diagnostic: { count: 50,  minutes: 75,  lockedAfter: Infinity, label: 'Diagnostic'  },
  domain:     { count: 25,  minutes: 30,  lockedAfter: Infinity, label: 'Domain practice' },
  full_sim:   { count: 200, minutes: 330, lockedAfter: 25,       label: 'Full simulation' },
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DEFAULTS = { questions: 50, minutes: 60 };

export default function ExamSimulatorPage() {
  const quizzesQ = useQuery({ queryKey: ['exam-quizzes'], queryFn: () => api<{ quizzes: Quiz[] }>('/quizzes') });
  const domainsQ  = useQuery({ queryKey: ['domains'],     queryFn: () => api<{ domains: Domain[] }>('/domains') });

  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(DEFAULTS.questions);
  const [minutes, setMinutes] = useState(DEFAULTS.minutes);
  const [deck, setDeck] = useState<Quiz[]>([]);
  const [answers, setAnswers] = useState<Record<number, number | null>>({}); // quizId -> picked index
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [idx, setIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sessionLabel, setSessionLabel] = useState<string>('Full simulation');
  const [mode, setMode] = useState<ExamMode>('diagnostic');
  const [furthestIdx, setFurthestIdx] = useState(0);  // For locked-nav: can't go before this in full_sim past lockedAfter.

  // Timer
  useEffect(() => {
    if (phase !== 'running') return;
    if (secondsLeft <= 0) { finish(); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  const buildDeck = (requestedCount: number, domainOnly?: string): Quiz[] => {
    const all = quizzesQ.data?.quizzes ?? [];
    if (all.length === 0) return [];
    // Build deck weighted by domain weight (BCSP-style mix)
    const domains = domainsQ.data?.domains ?? [];
    const totalWeight = Math.max(1, domains.reduce((s, d) => s + d.weight, 0));
    const built: Quiz[] = [];
    for (const d of domains) {
      if (domainOnly && d.id !== domainOnly) continue;
      const want = domainOnly ? requestedCount : Math.max(1, Math.round((d.weight / totalWeight) * requestedCount));
      const pool = all.filter((q) => q.domain_id === d.id);
      built.push(...shuffle(pool).slice(0, want));
    }
    // Top up or trim to exact count
    const finalDeck = shuffle(built).slice(0, requestedCount);
    while (finalDeck.length < requestedCount && all.length > finalDeck.length) {
      const candidate = all[Math.floor(Math.random() * all.length)];
      if (domainOnly && candidate.domain_id !== domainOnly) continue;
      if (!finalDeck.includes(candidate)) finalDeck.push(candidate);
    }
    return finalDeck;
  };

  const startDeck = (nextDeck: Quiz[], label: string, nextMinutes?: number) => {
    if (!nextDeck.length) return;
    setDeck(nextDeck);
    setAnswers({});
    setFlagged(new Set());
    setIdx(0);
    setFurthestIdx(0);
    setSecondsLeft((nextMinutes ?? minutes) * 60);
    setSessionLabel(label);
    setPhase('running');
  };

  const start = () => {
    const finalDeck = buildDeck(count);
    startDeck(finalDeck, 'Full simulation');
  };

  /** Track 4b — Start a named mode with its preset. */
  const startMode = (m: ExamMode, domainOnly?: string) => {
    const preset = MODE_PRESETS[m];
    setMode(m);
    setCount(preset.count);
    setMinutes(preset.minutes);
    const newDeck = buildDeck(preset.count, domainOnly);
    startDeck(newDeck, preset.label, preset.minutes);
  };

  const finish = () => {
    setPhase('finished');
    // Persist answers as quiz_attempts
    Object.entries(answers).forEach(([qid, picked]) => {
      const id = Number(qid);
      const q = deck.find((x) => x.id === id);
      if (!q || picked === null || picked === undefined) return;
      api('/study/quiz-attempt', {
        method: 'POST',
        body: JSON.stringify({ quiz_id: id, picked_index: picked, correct: picked === q.correct_index }),
      }).catch(() => {});
    });
    const total = deck.length || 1;
    const correct = deck.filter((qq) => answers[qq.id] === qq.correct_index).length;
    const score = Math.round((correct / total) * 100);
    api('/gamification/activity', {
      method: 'POST',
      body: JSON.stringify({ event_type: 'mock_exam_completion', meta_json: { score, total, correct } }),
    }).catch(() => {});
    // Track 3 — emit a learning event the readiness calculator picks up.
    api('/study/learning-event', {
      method: 'POST',
      body: JSON.stringify({
        event_type: 'exam_simulation_completed',
        meta_json: {
          mode,
          score_pct: score,
          total,
          correct,
          locked_nav_used: mode === 'full_sim',
        },
      }),
    }).catch(() => {});
  };

  const choose = (i: number) => {
    if (phase !== 'running') return;
    const q = deck[idx];
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: i }));
  };
  const toggleFlag = () => {
    const q = deck[idx];
    if (!q) return;
    setFlagged((s) => {
      const n = new Set(s);
      if (n.has(q.id)) n.delete(q.id); else n.add(q.id);
      return n;
    });
  };
  const goto = (i: number) => {
    const target = Math.max(0, Math.min(deck.length - 1, i));
    // Track 4b — Locked navigation in full_sim past the threshold:
    // once you've moved past item 25, you can't go backward into earlier items.
    const lockBoundary = MODE_PRESETS[mode].lockedAfter;
    if (mode === 'full_sim' && furthestIdx >= lockBoundary && target < furthestIdx) {
      return; // ignore — locked
    }
    setIdx(target);
    if (target > furthestIdx) setFurthestIdx(target);
  };

  // ─── SETUP ──────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="wrap py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700 ring-1 ring-red-500/20">
            <FileCheck size={12} /> Exam prep
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">Exam Simulator</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-ink-body">
            A timed full-length practice exam built from the same domain mix as the real BCSP CSP exam. Flag questions, jump around, and finish to see your score.
          </p>
        </div>

        {/* Track 4b — Three named modes */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <button
            onClick={() => startMode('diagnostic')}
            disabled={quizzesQ.isLoading || domainsQ.isLoading}
            className="card p-5 text-left transition hover:border-blue-300 hover:shadow-md disabled:opacity-50"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-blue-700">
              <Target size={11} aria-hidden="true" /> Baseline
            </div>
            <h3 className="mt-2 font-display text-[16px] font-bold text-ink">Diagnostic</h3>
            <p className="mt-1 text-[12.5px] text-ink-dim">50 items · 75 min · free navigation</p>
            <p className="mt-2 text-[12px] text-ink-body">Set your starting pass-probability. Recommended on first visit.</p>
          </button>

          <button
            onClick={() => startMode('domain', domainsQ.data?.domains[0]?.id)}
            disabled={quizzesQ.isLoading || domainsQ.isLoading}
            className="card p-5 text-left transition hover:border-emerald-300 hover:shadow-md disabled:opacity-50"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-emerald-700">
              <Sparkles size={11} aria-hidden="true" /> Practice
            </div>
            <h3 className="mt-2 font-display text-[16px] font-bold text-ink">Domain practice</h3>
            <p className="mt-1 text-[12.5px] text-ink-dim">25 items · 30 min · free navigation</p>
            <p className="mt-2 text-[12px] text-ink-body">Drill a single domain. Use the dropdown below to pick.</p>
          </button>

          <button
            onClick={() => startMode('full_sim')}
            disabled={quizzesQ.isLoading || domainsQ.isLoading}
            className="card p-5 text-left transition hover:border-red-300 hover:shadow-md disabled:opacity-50"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-red-700">
              <Lock size={11} aria-hidden="true" /> Real exam
            </div>
            <h3 className="mt-2 font-display text-[16px] font-bold text-ink">Full simulation</h3>
            <p className="mt-1 text-[12.5px] text-ink-dim">200 items · 5h 30m · locked nav after item 25</p>
            <p className="mt-2 text-[12px] text-ink-body">Mirrors BCSP rules. Calculator and reference sheet available.</p>
          </button>
        </div>

        <div className="card p-6">
          <h2 className="mb-3 font-display text-[14px] font-bold text-ink">Custom session</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Number of questions</label>
              <input type="number" min="10" max="200" className="input" value={count} onChange={(e) => setCount(Number(e.target.value))} />
              <div className="mt-1 text-[11px] text-ink-dim">Real CSP exam: 200 questions / 5.5 hours</div>
            </div>
            <div>
              <label className="label">Time (minutes)</label>
              <input type="number" min="5" max="360" className="input" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
              <div className="mt-1 text-[11px] text-ink-dim">Roughly {Math.round((minutes * 60) / count)}s per question</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { label: 'Quick (20 q · 20 min)', q: 20, m: 20 },
              { label: 'Half exam (50 q · 60 min)', q: 50, m: 60 },
              { label: 'Full simulation (100 q · 165 min)', q: 100, m: 165 },
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => { setCount(p.q); setMinutes(p.m); }}
                className="rounded-full border border-ink-line bg-white px-3.5 py-1 text-[12px] font-semibold text-ink-body hover:border-slate-300"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Full exam sets (3)</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {[
                { label: 'Full Exam 1', q: 200, m: 330 },
                { label: 'Full Exam 2', q: 200, m: 330 },
                { label: 'Full Exam 3', q: 200, m: 330 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setCount(p.q);
                    setMinutes(p.m);
                    const fullDeck = buildDeck(p.q);
                    startDeck(fullDeck, `${p.label} · 200q`, p.m);
                  }}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-[12px] font-semibold text-ink hover:border-blue-400"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={start}
            disabled={quizzesQ.isLoading || domainsQ.isLoading || (quizzesQ.data?.quizzes.length ?? 0) === 0}
            className="btn btn-primary btn-lg mt-6 w-full sm:w-auto"
          >
            {(quizzesQ.isLoading || domainsQ.isLoading) && <Loader2 size={16} className="animate-spin" />}
            <FileCheck size={16} /> Start exam
          </button>
        </div>
      </div>
    );
  }

  // ─── FINISHED ───────────────────────────────────────
  if (phase === 'finished') {
    const total = deck.length;
    const correct = deck.filter((q) => answers[q.id] === q.correct_index).length;
    const wrong = deck.filter((q) => answers[q.id] != null && answers[q.id] !== q.correct_index).length;
    const blank = total - correct - wrong;
    const pct = Math.round((correct / total) * 100);
    const passing = pct >= 70;

    // Per-domain breakdown
    const byDom: Record<string, { correct: number; total: number }> = {};
    deck.forEach((q) => {
      byDom[q.domain_id] ||= { correct: 0, total: 0 };
      byDom[q.domain_id].total++;
      if (answers[q.id] === q.correct_index) byDom[q.domain_id].correct++;
    });

    const worstDomainId = Object.entries(byDom)
      .sort((a, b) => {
        const ap = a[1].total > 0 ? a[1].correct / a[1].total : 1;
        const bp = b[1].total > 0 ? b[1].correct / b[1].total : 1;
        return ap - bp;
      })[0]?.[0];
    const wrongDeck = deck.filter((qq) => answers[qq.id] != null && answers[qq.id] !== qq.correct_index);

    return (
      <div className="wrap py-10">
        <div className="mx-auto max-w-3xl">
          <div className="card overflow-hidden">
            <div className={`p-8 text-center text-white ${passing ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-amber-500 to-orange-600'}`}>
              <Trophy size={48} className="mx-auto" />
              <h1 className="mt-4 font-display text-4xl font-extrabold">{pct}%</h1>
              <p className="mt-1 text-[14px] opacity-90">{passing ? 'Passing score!' : 'Below passing threshold (70%)'}</p>
            </div>
            <div className="grid grid-cols-3 divide-x divide-ink-line border-b border-ink-line">
              <ResultStat label="Correct"   value={correct} accent="text-green-700" />
              <ResultStat label="Wrong"     value={wrong}   accent="text-red-700" />
              <ResultStat label="Blank"     value={blank}   accent="text-ink-dim" />
            </div>

            <div className="p-6">
              <h3 className="font-display text-[15px] font-bold text-ink">By domain</h3>
              <div className="mt-3 space-y-3">
                {(domainsQ.data?.domains ?? []).map((d) => {
                  const stats = byDom[d.id];
                  if (!stats) return null;
                  const pp = Math.round((stats.correct / stats.total) * 100);
                  return (
                    <div key={d.id}>
                      <div className="mb-1 flex justify-between text-[12px]">
                        <span className="font-semibold text-ink">{d.number}. {d.name}</span>
                        <span className="text-ink-dim">{stats.correct}/{stats.total} · {pp}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface">
                        <div className="h-full rounded-full" style={{ width: `${pp}%`, background: `linear-gradient(90deg, ${d.color_hex}, ${d.color_hex}AA)` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button onClick={() => setPhase('setup')} className="btn btn-primary btn-md flex-1"><RotateCw size={14} /> Take another</button>
                {wrongDeck.length > 0 && (
                  <button
                    onClick={() => startDeck(shuffle(wrongDeck), `Smart Retest: ${wrongDeck.length} mistakes`, Math.max(10, Math.ceil(wrongDeck.length * 1.2)))}
                    className="btn btn-ghost btn-md flex-1"
                  >
                    <Target size={14} /> Retest mistakes
                  </button>
                )}
                {worstDomainId && (
                  <button
                    onClick={() => {
                      const domainDeck = buildDeck(Math.min(30, count), worstDomainId);
                      const dom = (domainsQ.data?.domains ?? []).find((d) => d.id === worstDomainId);
                      startDeck(domainDeck, `Weak Domain Focus: ${dom?.name ?? worstDomainId}`, Math.max(15, Math.ceil(domainDeck.length * 1.5)));
                    }}
                    className="btn btn-ghost btn-md flex-1"
                  >
                    <BarChart3 size={14} /> Retest weakest domain
                  </button>
                )}
                <Link to="/confusion-map" className="btn btn-ghost btn-md flex-1"><BarChart3 size={14} /> Confusion Map</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RUNNING ────────────────────────────────────────
  const q = deck[idx];
  if (!q) return null;
  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  const minutesLeft = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const answeredCount = Object.values(answers).filter((v) => v != null).length;

  // Track 4b — Locked nav banner trigger
  const lockBoundary = MODE_PRESETS[mode].lockedAfter;
  const isLockedNav = mode === 'full_sim' && furthestIdx >= lockBoundary;

  return (
    <div className="wrap py-6">
      {/* Top bar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="font-display text-[14px] font-bold text-ink">
          Question {idx + 1} <span className="text-ink-dim">/ {deck.length}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-ink-dim">
          <span>{sessionLabel}</span>
          {isLockedNav && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-red-700 ring-1 ring-red-200" title="Navigation locked — you can't go back to earlier items.">
              <Lock size={10} aria-hidden="true" /> Locked
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ${
            secondsLeft < 60 ? 'bg-red-100 text-red-700' :
            secondsLeft < 300 ? 'bg-amber-100 text-amber-700' : 'bg-surface text-ink-body'
          }`} role="timer" aria-label={`${minutesLeft} minutes ${secs} seconds remaining`}>
            <Clock size={12} aria-hidden="true" /> {String(minutesLeft).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <button onClick={finish} className="btn btn-ghost btn-sm">Finish exam</button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all" style={{ width: `${(answeredCount / deck.length) * 100}%` }} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-[18px] font-extrabold leading-snug text-ink">{q.question}</h2>
              <button
                onClick={toggleFlag}
                className={`btn btn-ghost btn-sm shrink-0 ${flagged.has(q.id) ? '!border-amber-300 !bg-amber-50 !text-amber-700' : ''}`}
                title="Flag for review"
              >
                <Flag size={13} />
              </button>
            </div>
            <div className="mt-5 space-y-2">
              {opts.map((opt, i) => {
                const isPicked = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[14px] font-medium transition ${
                      isPicked
                        ? 'border-brand-500 bg-brand-50 text-ink shadow-sm'
                        : 'border-ink-line bg-white text-ink-body hover:border-brand-500/40 hover:bg-brand-50/40'
                    }`}
                  >
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold ${
                      isPicked ? 'bg-brand-600 text-white' : 'bg-surface text-ink-body ring-1 ring-ink-line'
                    }`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex justify-between">
              <button
                onClick={() => goto(idx - 1)}
                disabled={idx === 0 || (isLockedNav && idx <= furthestIdx)}
                className="btn btn-ghost btn-md disabled:opacity-50"
                title={isLockedNav && idx <= furthestIdx ? 'Navigation locked — you can\'t return to earlier items in full simulation mode.' : ''}
              >
                {isLockedNav && idx <= furthestIdx ? <Lock size={13} aria-hidden="true" /> : <ChevronLeft size={14} aria-hidden="true" />} Previous
              </button>
              {idx + 1 >= deck.length ? (
                <button onClick={finish} className="btn btn-primary btn-md">Finish exam</button>
              ) : (
                <button onClick={() => goto(idx + 1)} className="btn btn-primary btn-md">
                  Next <ChevronRight size={14} />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Question grid sidebar */}
        <div className="card sticky top-4 h-fit p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Questions</div>
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {deck.map((dq, i) => {
              const isAnswered = answers[dq.id] != null;
              const isCurrent = i === idx;
              const isFlagged = flagged.has(dq.id);
              return (
                <button
                  key={dq.id}
                  onClick={() => goto(i)}
                  className={`relative grid h-7 w-7 place-items-center rounded text-[10px] font-bold transition ${
                    isCurrent
                      ? 'bg-brand-600 text-white ring-2 ring-brand-300'
                      : isAnswered
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-surface text-ink-body ring-1 ring-ink-line hover:bg-slate-100'
                  }`}
                >
                  {i + 1}
                  {isFlagged && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-500" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 border-t border-ink-line pt-3 text-[11px] text-ink-dim">
            <div className="flex justify-between"><span>Answered</span><span className="font-bold text-ink">{answeredCount}/{deck.length}</span></div>
            <div className="flex justify-between"><span>Flagged</span><span className="font-bold text-ink">{flagged.size}</span></div>
          </div>
        </div>
      </div>

      {/* Track 4 — On-screen calculator + reference sheet, available during exam mode. */}
      <CalculatorOverlay />
      <ReferenceSheetDrawer />
    </div>
  );
}

function ResultStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="p-5 text-center">
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{label}</div>
      <div className={`mt-1 font-display text-3xl font-extrabold ${accent}`}>{value}</div>
    </div>
  );
}
