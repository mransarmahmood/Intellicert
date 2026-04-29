import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FunctionSquare, ChevronDown } from 'lucide-react';
import { api } from '../lib/api';

type Variable = { symbol?: string; name?: string; description?: string; unit?: string; example?: string | number };
type Formula = {
  id?: string;
  name: string;
  expression: string;
  description?: string;
  variables?: Variable[];
  example?: string;
  examTip?: string;
};
type Category = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  formulas: Formula[];
};
type Resp = { guide: { categories: Category[] } };

function buildSolutionBlock(f: Formula): string | null {
  const expr = f.expression?.trim();
  const ex = f.example?.trim();
  if (!expr && !ex) return null;

  if (expr && ex) {
    return `${expr}\n${ex}`;
  }
  return expr || ex || null;
}

function buildSolutionSteps(f: Formula): string[] {
  const steps: string[] = [];
  if (f.description) steps.push(`What it means: ${f.description}`);
  if (f.expression) steps.push(`Formula to use: ${f.expression}`);
  if (f.variables && f.variables.length > 0) {
    const vars = f.variables
      .map((v) => `${v.symbol ?? v.name ?? 'Var'}${v.unit ? ` (${v.unit})` : ''}`)
      .join(', ');
    steps.push(`Identify variables: ${vars}`);
  }
  if (f.example) {
    const lines = f.example.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) steps.push(`Worked substitution: ${lines[0]}`);
    if (lines.length > 1) steps.push(`Numeric result: ${lines[lines.length - 1]}`);
  }
  if (f.examTip) steps.push(`Exam focus: ${f.examTip}`);
  return steps;
}

export default function FormulaGuidePage() {
  const guideQ = useQuery({
    queryKey: ['formula-guide'],
    queryFn: () => api<Resp>('/formula-guide'),
  });

  const [filter, setFilter] = useState<string>(''); // category id, '' = all
  const [openId, setOpenId] = useState<string | null>(null);

  const cats = guideQ.data?.guide.categories ?? [];
  const visible = useMemo(() => filter ? cats.filter((c) => c.id === filter) : cats, [cats, filter]);

  if (guideQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }
  if (guideQ.error || !guideQ.data) {
    return <div className="wrap py-10"><div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{(guideQ.error as Error)?.message ?? 'Failed to load'}</div></div>;
  }

  return (
    <div className="wrap py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700 ring-1 ring-cyan-500/20">
          <FunctionSquare size={12} /> Exam prep
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">Formula &amp; Equation Guide</h1>
        <p className="mt-2 text-[15px] text-ink-body">
          Complete CSP exam formula reference with step-by-step worked examples. Click any formula to expand.
        </p>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('')}
          className={`rounded-full px-4 py-1.5 text-[12.5px] font-semibold transition ${
            !filter
              ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-sm'
              : 'border border-ink-line bg-white text-ink-body hover:border-slate-300'
          }`}
        >
          All Categories
        </button>
        {cats.map((c) => {
          const isActive = filter === c.id;
          const color = c.color || '#3B82F6';
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={`rounded-full border px-4 py-1.5 text-[12.5px] font-semibold transition ${
                isActive
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-ink-line bg-white text-ink-body hover:border-slate-300'
              }`}
              style={isActive ? { background: `linear-gradient(135deg, ${color}, ${color}CC)` } : { color }}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {visible.map((cat) => {
          const color = cat.color || '#3B82F6';
          return (
            <div key={cat.id} className="card overflow-hidden">
              <div
                className="flex items-center gap-3 border-b border-ink-line px-5 py-4"
                style={{ borderTop: `3px solid ${color}` }}
              >
                <div
                  className="grid h-9 w-9 place-items-center rounded-lg text-white"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
                >
                  <FunctionSquare size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-display text-[16px] font-bold" style={{ color }}>
                    {cat.name}
                  </div>
                </div>
                <span className="badge badge-slate">{cat.formulas.length}</span>
              </div>
              <div className="divide-y divide-ink-line">
                {cat.formulas.map((f, i) => {
                  const id = `${cat.id}-${f.id ?? i}`;
                  const isOpen = openId === id;
                  return (
                    <div key={id}>
                      <button
                        onClick={() => setOpenId(isOpen ? null : id)}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface/50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-display text-[14.5px] font-bold text-ink">{f.name}</div>
                        </div>
                        <code
                          className="rounded-lg px-3 py-1.5 font-mono text-[12px] font-semibold ring-1"
                          style={{ background: `${color}11`, color, borderColor: `${color}33` }}
                        >
                          {f.expression}
                        </code>
                        <ChevronDown size={16} className={`shrink-0 text-ink-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-4 bg-surface/40 px-5 py-5">
                              {f.description && (
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Detail Understanding</div>
                                  <p className="mt-1 text-[13px] leading-relaxed text-ink-body">{f.description}</p>
                                </div>
                              )}
                              {f.variables && f.variables.length > 0 && (
                                <div>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Variables</div>
                                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    {f.variables.map((v, vi) => (
                                      <div key={vi} className="rounded-lg border border-ink-line bg-white px-3 py-2 text-[12.5px]">
                                        {v.symbol && <code className="mr-1.5 rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] font-bold" style={{ color }}>{v.symbol}</code>}
                                        <span className="font-semibold text-ink">{v.name}</span>
                                        {v.unit && <span className="ml-1 text-ink-dim">({v.unit})</span>}
                                        {v.description && <div className="mt-0.5 text-[11.5px] text-ink-body">{v.description}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {f.example && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5">
                                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">Worked example</div>
                                  <p className="whitespace-pre-line text-[12.5px] text-ink-body">{f.example}</p>
                                </div>
                              )}
                              {buildSolutionBlock(f) && (
                                <div className="rounded-xl border border-slate-300 bg-slate-50 p-3.5">
                                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">Solution</div>
                                  <pre className="whitespace-pre-wrap font-mono text-[12.5px] text-ink">{buildSolutionBlock(f)}</pre>
                                </div>
                              )}
                              {buildSolutionSteps(f).length > 0 && (
                                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5">
                                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700">Step-by-step Detail Understanding</div>
                                  <ol className="space-y-1.5">
                                    {buildSolutionSteps(f).map((s, si) => (
                                      <li key={si} className="flex items-start gap-2 text-[12.5px] text-ink-body">
                                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-indigo-600 text-[10px] font-bold text-white">
                                          {si + 1}
                                        </span>
                                        <span>{s}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}
                              {f.examTip && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5">
                                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">Exam tip</div>
                                  <p className="text-[12.5px] text-ink-body">{f.examTip}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
