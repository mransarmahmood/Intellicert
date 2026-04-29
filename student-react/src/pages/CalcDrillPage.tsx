import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Calculator, ArrowRight, Check, X, Lightbulb, RotateCw, Trophy } from 'lucide-react';
import { api } from '../lib/api';

type Calc = {
  id: number;
  calc_key: string;
  source?: 'db' | 'guide';
  guide_category_id?: string | null;
  category: string;
  difficulty: string;
  title: string;
  problem: string;
  formula: string | null;
  variables: Record<string, { label: string; value: number; unit: string }> | null;
  steps: { instruction: string; calculation: string; result: number | null }[] | null;
  answer: number | null;
  answer_unit: string | null;
  tolerance: number;
  interpretation: string | null;
  exam_tip: string | null;
};
type FormulaVar = { symbol?: string; name?: string; description?: string; unit?: string; example?: string | number };
type Formula = {
  id?: string;
  name: string;
  expression: string;
  description?: string;
  variables?: FormulaVar[];
  example?: string;
  examTip?: string;
};
type FormulaCategory = { id: string; name: string; formulas: Formula[] };
type FormulaGuideResp = { guide: { categories: FormulaCategory[] } };
type TopicExtra = { id: number; topic_id: number; extra_type: string; content_json: any };

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

function extractNumericAnswer(example?: string): { value: number | null; unit: string | null } {
  if (!example) return { value: null, unit: null };
  const m = example.match(/(?:=|equals|result(?:s)? in)\s*(-?\d+(?:\.\d+)?)(?:\s*([a-zA-Z%\/\-\^0-9]+))?/i);
  if (!m) return { value: null, unit: null };
  return {
    value: Number(m[1]),
    unit: m[2] ?? null,
  };
}

function formatSolvedFormula(calc: Calc): string | null {
  if (calc.steps && calc.steps.length > 0) {
    const rendered = calc.steps
      .map((s) => `${s.calculation}${s.result != null ? ` = ${s.result}` : ''}`)
      .filter(Boolean)
      .join('\n');
    if (rendered.trim()) return rendered;
  }

  if (calc.formula && calc.variables) {
    const vars = Object.entries(calc.variables);
    if (vars.length > 0) {
      const substitutions = vars
        .map(([k, v]) => `${k}=${v.value}${v.unit ? ` ${v.unit}` : ''}`)
        .join(', ');
      const result = calc.answer != null ? `\nResult: ${calc.answer}${calc.answer_unit ? ` ${calc.answer_unit}` : ''}` : '';
      return `${calc.formula}\nSubstitute: ${substitutions}${result}`;
    }
  }

  if (calc.formula) {
    return calc.answer != null
      ? `${calc.formula}\nResult: ${calc.answer}${calc.answer_unit ? ` ${calc.answer_unit}` : ''}`
      : calc.formula;
  }

  return null;
}

export default function CalcDrillPage() {
  const calcsQ = useQuery({
    queryKey: ['calculations'],
    queryFn: () => api<{ calculations: Calc[] }>('/calculations'),
  });
  const guideQ = useQuery({
    queryKey: ['formula-guide'],
    queryFn: () => api<FormulaGuideResp>('/formula-guide'),
  });
  const extrasQ = useQuery({
    queryKey: ['topic-extras-formulas'],
    queryFn: () => api<{ extras: TopicExtra[] }>('/topic-extras'),
  });

  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [drillScope, setDrillScope] = useState<'all' | 'conversions'>('all');

  const dbCalcs = calcsQ.data?.calculations ?? [];
  const guideCalcs = useMemo<Calc[]>(() => {
    const cats = guideQ.data?.guide.categories ?? [];
    let seq = 1;
    const out: Calc[] = [];
    for (const cat of cats) {
      for (const f of cat.formulas) {
        const parsed = extractNumericAnswer(f.example);
        out.push({
          id: -1 * seq++,
          calc_key: `guide-${cat.id}-${f.id ?? seq}`,
          source: 'guide',
          guide_category_id: cat.id,
          category: cat.name,
          difficulty: 'guide',
          title: f.name,
          problem: f.description || `Use the formula and worked example to solve this ${cat.name.toLowerCase()} item.`,
          formula: f.expression,
          variables: null,
          steps: f.example ? [{ instruction: 'Worked example', calculation: f.example, result: parsed.value }] : null,
          answer: parsed.value,
          answer_unit: parsed.unit,
          tolerance: parsed.value !== null ? Math.max(0.01, Math.abs(parsed.value) * 0.02) : 0,
          interpretation: f.examTip ?? 'Use the worked example to self-check your method.',
          exam_tip: f.examTip ?? null,
        });
      }
    }
    return out;
  }, [guideQ.data]);
  const extraFormulaCalcs = useMemo<Calc[]>(() => {
    const extras = (extrasQ.data?.extras ?? []).filter((e) => e.extra_type === 'formula');
    let seq = 1;
    const out: Calc[] = [];
    for (const ex of extras) {
      const c = typeof ex.content_json === 'string' ? (() => { try { return JSON.parse(ex.content_json); } catch { return { body: ex.content_json }; } })() : ex.content_json;
      const body = typeof c?.body === 'string' ? c.body : '';
      let parsed: any = null;
      try { parsed = JSON.parse(body); } catch { parsed = null; }
      const formulaExpr = parsed?.expression || parsed?.formula || c?.title || null;
      const vars = Array.isArray(parsed?.variables)
        ? Object.fromEntries(parsed.variables.map((v: any, i: number) => [
            v.symbol || `v${i + 1}`,
            { label: v.desc || v.description || v.name || `Variable ${i + 1}`, value: Number(v.example ?? 0), unit: v.unit || '' },
          ]))
        : null;
      out.push({
        id: -100000 - seq++,
        calc_key: `extra-formula-${ex.id}`,
        source: 'guide',
        guide_category_id: 'topic-formulas',
        category: 'Topic Formulas',
        difficulty: 'guide',
        title: c?.title || parsed?.name || `Formula ${ex.id}`,
        problem: parsed?.desc || parsed?.description || 'Practice this formula from topic resources.',
        formula: formulaExpr,
        variables: vars,
        steps: null,
        answer: null,
        answer_unit: null,
        tolerance: 0,
        interpretation: parsed?.desc || parsed?.description || null,
        exam_tip: null,
      });
    }
    return out;
  }, [extrasQ.data]);
  const all = useMemo(() => [...dbCalcs, ...guideCalcs, ...extraFormulaCalcs], [dbCalcs, guideCalcs, extraFormulaCalcs]);
  const withSource = useMemo(
    () => all.map((c) => ({ ...c, source: c.source ?? 'db', guide_category_id: c.guide_category_id ?? null })),
    [all]
  );
  const conversionOnly = (c: Calc) => {
    const byGuide = c.source === 'guide' && (c.guide_category_id ?? '').toLowerCase() === 'conversions';
    const byName = c.category.toLowerCase().includes('conversion');
    return byGuide || byName;
  };
  const categories = useMemo(() => Array.from(new Set(withSource.map((c) => c.category))).sort(), [withSource]);
  const filtered = useMemo(() => withSource.filter((c) => {
    if (drillScope === 'conversions' && !conversionOnly(c)) return false;
    if (category && c.category !== category) return false;
    if (difficulty && c.difficulty.toLowerCase() !== difficulty.toLowerCase()) return false;
    return true;
  }), [withSource, category, difficulty, drillScope]);

  const deck = useMemo(() => shuffle(filtered), [filtered]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [results, setResults] = useState<{ id: number; correct: boolean }[]>([]);
  const [pendingSelfCheck, setPendingSelfCheck] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIdx(0); setInput(''); setSubmitted(false); setShowSteps(false); setResults([]); setPendingSelfCheck(false); setDone(false);
  }, [deck.length]);

  const guideIdsInDeck = useMemo(() => new Set(deck.filter((c) => c.source === 'guide').map((c) => c.id)), [deck]);
  const attemptedGuide = useMemo(() => results.filter((r) => guideIdsInDeck.has(r.id)), [results, guideIdsInDeck]);
  const attemptedGuideCount = attemptedGuide.length;
  const correctGuideCount = attemptedGuide.filter((r) => r.correct).length;
  const totalGuideCount = guideIdsInDeck.size;

  if (calcsQ.isLoading || guideQ.isLoading || extrasQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }

  if (done) {
    const correct = results.filter((r) => r.correct).length;
    const pct = Math.round((correct / results.length) * 100);
    return (
      <div className="wrap py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <Trophy size={36} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">Drill complete</h1>
          <p className="mt-2 text-[15px] text-ink-body">{correct} / {results.length} correct ({pct}%)</p>
          <button
            onClick={() => { setIdx(0); setInput(''); setSubmitted(false); setShowSteps(false); setResults([]); setDone(false); }}
            className="btn btn-primary btn-md mt-6"
          >
            <RotateCw size={14} /> Restart
          </button>
        </div>
      </div>
    );
  }

  const calc = deck[idx];
  const userValue = parseFloat(input);
  const isCorrect = calc != null && !isNaN(userValue) && calc.answer !== null && Math.abs(userValue - calc.answer) <= calc.tolerance;
  const isGuideNoNumeric = calc != null && calc.answer === null;
  const solvedFormula = calc ? formatSolvedFormula(calc) : null;

  const submit = () => {
    if (!calc || submitted) return;
    if (isGuideNoNumeric) {
      setSubmitted(true);
      setPendingSelfCheck(true);
      return;
    }
    if (isNaN(userValue) || calc.answer === null) return;
    setSubmitted(true);
    setResults((r) => [...r, { id: calc.id, correct: isCorrect }]);
  };
  const selfCheck = (correct: boolean) => {
    if (!calc) return;
    setResults((r) => [...r, { id: calc.id, correct }]);
    setPendingSelfCheck(false);
    if (idx + 1 >= deck.length) { setDone(true); return; }
    setIdx(idx + 1); setInput(''); setSubmitted(false); setShowSteps(false);
  };
  const next = () => {
    if (idx + 1 >= deck.length) { setDone(true); return; }
    setIdx(idx + 1); setInput(''); setSubmitted(false); setShowSteps(false); setPendingSelfCheck(false);
  };

  return (
    <div className="wrap py-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-700 ring-1 ring-orange-500/20">
          <Calculator size={12} /> Calc drill
        </div>
        <div className="font-display text-[14px] font-bold text-ink">
          {deck.length > 0 ? <>{idx + 1} <span className="text-ink-dim">/ {deck.length}</span></> : '0'}
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Book coverage tracker</div>
        <div className="mt-1 text-[13px] text-ink-body">
          Guide formulas attempted: <strong>{attemptedGuideCount}</strong> / <strong>{totalGuideCount}</strong>
          {' '}({totalGuideCount > 0 ? Math.round((attemptedGuideCount / totalGuideCount) * 100) : 0}%).
          Correct: <strong>{correctGuideCount}</strong>.
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setDrillScope('all')}
          className={`rounded-full border px-3.5 py-1 text-[12px] font-semibold transition ${
            drillScope === 'all'
              ? 'border-transparent bg-emerald-600 text-white'
              : 'border-ink-line bg-white text-ink-body hover:border-slate-300'
          }`}
        >
          Full Formula Bank
        </button>
        <button
          onClick={() => setDrillScope('conversions')}
          className={`rounded-full border px-3.5 py-1 text-[12px] font-semibold transition ${
            drillScope === 'conversions'
              ? 'border-transparent bg-emerald-600 text-white'
              : 'border-ink-line bg-white text-ink-body hover:border-slate-300'
          }`}
        >
          Conversion-Only Mode
        </button>
      </div>

      {/* Category + difficulty tabs */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategory('')}
          className={`rounded-full border px-3.5 py-1 text-[12px] font-semibold transition ${
            !category
              ? 'border-transparent bg-blue-600 text-white'
              : 'border-ink-line bg-white text-ink-body hover:border-slate-300'
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => {
          const isActive = category === c;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3.5 py-1 text-[12px] font-semibold transition ${
                isActive
                  ? 'border-transparent bg-blue-600 text-white'
                  : 'border-ink-line bg-white text-ink-body hover:border-slate-300'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {[
          { label: 'All Levels', value: '' },
          { label: 'Easy',       value: 'easy' },
          { label: 'Medium',     value: 'medium' },
          { label: 'Hard',       value: 'hard' },
          { label: 'Guide',      value: 'guide' },
        ].map((d) => {
          const isActive = difficulty === d.value;
          return (
            <button
              key={d.label}
              onClick={() => setDifficulty(d.value)}
              className={`rounded-full border px-3.5 py-1 text-[12px] font-semibold transition ${
                isActive
                  ? 'border-transparent bg-slate-700 text-white'
                  : 'border-ink-line bg-white text-ink-body hover:border-slate-300'
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {!deck.length && (
        <div className="card grid place-items-center py-16 text-center text-[13px] text-ink-dim">
          No calculations match your filters
        </div>
      )}

      {deck.length > 0 && (
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all" style={{ width: `${((idx + 1) / deck.length) * 100}%` }} />
      </div>
      )}

      {deck.length > 0 && calc && (
      <AnimatePresence mode="wait">
        <motion.div
          key={calc.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-2xl"
        >
          <div className="card p-7">
            <div className="flex items-center gap-2">
              <span className="badge badge-slate">{calc.category}</span>
              <span className="badge badge-brand">{calc.difficulty}</span>
            </div>
            <h2 className="mt-3 font-display text-xl font-extrabold text-ink">{calc.title}</h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink-body">{calc.problem}</p>

            {calc.formula && (
              <div className="mt-4 rounded-xl border border-ink-line bg-surface p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Formula</div>
                <pre className="mt-1 overflow-x-auto font-mono text-[14px] text-ink whitespace-pre-wrap">{calc.formula}</pre>
              </div>
            )}

            {calc.variables && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(calc.variables).map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-ink-line bg-white px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{k}</div>
                    <div className="font-display text-[14px] font-bold text-ink">{v.value} <span className="text-[11px] font-normal text-ink-dim">{v.unit}</span></div>
                    <div className="text-[11px] text-ink-body">{v.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5">
              <label className="label">Your answer</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                  className="input flex-1"
                  placeholder="Enter numeric result..."
                  disabled={isGuideNoNumeric || submitted}
                />
                {!submitted ? (
                  <button onClick={submit} className="btn btn-primary btn-md" disabled={!isGuideNoNumeric && !input}>
                    {isGuideNoNumeric ? 'Reveal & self-check' : 'Check'}
                  </button>
                ) : (
                  !pendingSelfCheck && (
                    <button onClick={next} className="btn btn-primary btn-md">
                      {idx + 1 >= deck.length ? 'Finish' : 'Next'} <ArrowRight size={14} />
                    </button>
                  )
                )}
              </div>
            </div>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 rounded-xl border p-4 ${isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}
              >
                <div className="flex items-center gap-2 font-display text-[14px] font-bold">
                  {isGuideNoNumeric ? (
                    <><Lightbulb size={16} className="text-amber-700" /><span className="text-amber-900">Use the worked example below to self-check.</span></>
                  ) : isCorrect ? (
                    <><Check size={16} className="text-green-700" /><span className="text-green-900">Correct!</span></>
                  ) : (
                    <><X size={16} className="text-red-700" /><span className="text-red-900">Not quite — answer is {calc.answer} {calc.answer_unit}</span></>
                  )}
                </div>
                {calc.interpretation && <p className="mt-1 text-[12.5px] text-ink-body">{calc.interpretation}</p>}
                {solvedFormula && (
                  <div className="mt-3 rounded-xl border border-slate-300 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Solved equation</div>
                    <pre className="mt-1 whitespace-pre-wrap font-mono text-[12px] text-ink">{solvedFormula}</pre>
                  </div>
                )}
                {calc.exam_tip && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/70 p-2.5 text-[12px] text-ink-body">
                    <Lightbulb size={13} className="mt-0.5 shrink-0 text-amber-600" />
                    <span><strong>Exam tip: </strong>{calc.exam_tip}</span>
                  </div>
                )}
                {calc.steps && calc.steps.length > 0 && (
                  <button onClick={() => setShowSteps((s) => !s)} className="mt-3 text-[11.5px] font-semibold text-brand-600 hover:underline">
                    {showSteps ? 'Hide' : 'Show'} step-by-step solution
                  </button>
                )}
                {showSteps && calc.steps && (
                  <ol className="mt-3 space-y-1.5">
                    {calc.steps.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12.5px] text-ink-body">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-brand-500 font-bold text-white text-[10px]">{i + 1}</span>
                        <div className="flex-1">
                          <div className="font-semibold text-ink">{s.instruction}</div>
                          <div className="font-mono text-[11.5px] text-ink-dim">{s.calculation}{s.result != null && ` → ${s.result}`}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
                {pendingSelfCheck && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={() => selfCheck(true)} className="btn btn-primary btn-sm">I solved it correctly</button>
                    <button onClick={() => selfCheck(false)} className="btn btn-ghost btn-sm">Need review</button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
      )}
    </div>
  );
}
