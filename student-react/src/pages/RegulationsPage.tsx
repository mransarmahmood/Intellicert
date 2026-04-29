import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Scale, Search, ChevronDown, GitBranch, ShieldCheck, Ban, CheckCircle2, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { api } from '../lib/api';

type Reg = {
  id: number;
  code: string;
  short_name: string;
  category: string;
  domain_id: string | null;
  covers: string | null;
  key_numbers: string[];
  common_exam_questions: string[];
};

type StructuredRule = {
  required: string[];
  allowed: string[];
  restricted: string[];
  minimum: string[];
  maximum: string[];
  limits: string[];
  applicability: string[];
  keyDetails: string[];
};

function parseStructuredRules(r: Reg): StructuredRule {
  const lines = [...(r.key_numbers ?? []), ...(r.common_exam_questions ?? [])].map((x) => x.trim()).filter(Boolean);
  const out: StructuredRule = { required: [], allowed: [], restricted: [], minimum: [], maximum: [], limits: [], applicability: [], keyDetails: [] };

  for (const line of lines) {
    const l = line.toLowerCase();
    if (/applies to|applicable|scope|covered|for workplaces|for facilities|for employers/.test(l)) out.applicability.push(line);
    if (/must|required|shall|need to|required to/.test(l)) out.required.push(line);
    if (/may|allowed|permitted|acceptable/.test(l)) out.allowed.push(line);
    if (/prohibit|forbidden|not allowed|cannot|must not|no\s+/.test(l)) out.restricted.push(line);
    if (/minimum|min\.?|at least|not less than|>=/.test(l)) out.minimum.push(line);
    if (/maximum|max\.?|no more than|at most|<=|up to/.test(l)) out.maximum.push(line);
    if (/\b\d+(\.\d+)?\s*(ppm|ppb|mg\/m3|dba|db|ft|in|mm|psi|hours?|days?|years?|%|°f|°c|lb|kg)\b/i.test(line) || /29 cfr|1910|1926|nfpa|ansi|asme|api/i.test(l)) {
      out.limits.push(line);
    }
    if (!out.required.includes(line) && !out.allowed.includes(line) && !out.restricted.includes(line)) {
      out.keyDetails.push(line);
    }
  }

  const uniq = (arr: string[]) => Array.from(new Set(arr));
  return {
    required: uniq(out.required),
    allowed: uniq(out.allowed),
    restricted: uniq(out.restricted),
    minimum: uniq(out.minimum),
    maximum: uniq(out.maximum),
    limits: uniq(out.limits),
    applicability: uniq(out.applicability),
    keyDetails: uniq(out.keyDetails),
  };
}

export default function RegulationsPage() {
  const regsQ = useQuery({
    queryKey: ['regulations'],
    queryFn: () => api<{ regulations: Reg[]; total: number }>('/regulations'),
  });

  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);
  const [category, setCategory] = useState('');

  const filtered = useMemo(() => {
    const all = regsQ.data?.regulations ?? [];
    return all.filter((r) => {
      if (category && r.category !== category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return r.code.toLowerCase().includes(q)
        || r.short_name.toLowerCase().includes(q)
        || (r.covers ?? '').toLowerCase().includes(q);
    });
  }, [regsQ.data, search, category]);

  const cats = useMemo(() => Array.from(new Set((regsQ.data?.regulations ?? []).map((r) => r.category))), [regsQ.data]);
  const totals = regsQ.data?.regulations.length ?? 0;

  return (
    <div className="wrap py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-700 ring-1 ring-red-500/20">
          <Scale size={12} /> Exam prep
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">Regulations</h1>
        <p className="mt-2 text-[15px] text-ink-body">
          Every OSHA, EPA, ANSI, NFPA standard the CSP exam draws from — with the key numbers and most-asked questions per regulation.
        </p>
        <div className="mt-3 text-[12px] font-semibold text-ink-dim">
          Showing {filtered.length} of {totals} regulations
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code, name or topic..."
            className="input pl-9"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input max-w-xs">
          <option value="">All categories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {regsQ.isLoading ? (
        <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => {
            const isOpen = openId === r.id;
            const s = parseStructuredRules(r);
            return (
              <div key={r.id} className={`card overflow-hidden transition-colors ${isOpen ? 'border-brand-500/30' : ''}`}>
                <button
                  onClick={() => setOpenId(isOpen ? null : r.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-50 text-red-700 ring-1 ring-red-500/20">
                    <Scale size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-[15px] font-bold text-ink">{r.short_name}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-dim">{r.code}</code>
                      <span className="badge badge-slate">{r.category}</span>
                    </div>
                  </div>
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
                      <div className="space-y-4 border-t border-ink-line bg-surface/50 px-5 py-5">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-ink-dim">
                            <GitBranch size={12} /> Regulation concept map
                          </div>
                          <div className="grid gap-2 text-[12px] sm:grid-cols-4">
                            <div className="rounded-lg border border-ink-line bg-surface px-3 py-2">
                              <div className="font-bold text-ink">Scope</div>
                              <div className="mt-0.5 text-ink-body">{r.covers ?? 'General compliance scope'}</div>
                            </div>
                            <div className="grid place-items-center text-ink-dim"><ArrowRight size={14} /></div>
                            <div className="rounded-lg border border-ink-line bg-surface px-3 py-2">
                              <div className="font-bold text-ink">Critical limits</div>
                              <div className="mt-0.5 text-ink-body">
                                Min: {s.minimum.length} · Max: {s.maximum.length}
                              </div>
                            </div>
                            <div className="rounded-lg border border-ink-line bg-surface px-3 py-2">
                              <div className="font-bold text-ink">Action focus</div>
                              <div className="mt-0.5 text-ink-body">
                                Required: {s.required.length} · Restricted: {s.restricted.length}
                              </div>
                            </div>
                          </div>
                        </div>

                        {r.covers && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Covers</div>
                            <p className="mt-1 text-[13.5px] text-ink-body">{r.covers}</p>
                          </div>
                        )}
                        {(s.required.length > 0 || s.allowed.length > 0 || s.restricted.length > 0 || s.minimum.length > 0 || s.maximum.length > 0 || s.limits.length > 0 || s.applicability.length > 0) && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <RuleBox title="Required" icon={ShieldCheck} tone="emerald" items={s.required} />
                            <RuleBox title="Allowed" icon={CheckCircle2} tone="blue" items={s.allowed} />
                            <RuleBox title="Restricted" icon={Ban} tone="red" items={s.restricted} />
                            <RuleBox title="Minimum / Maximum" icon={Scale} tone="amber" items={[...s.minimum, ...s.maximum]} />
                            <RuleBox title="Applicable values / limits" icon={Scale} tone="amber" items={s.limits} />
                            <RuleBox title="Applicability scope" icon={GitBranch} tone="blue" items={s.applicability.length ? s.applicability : [r.covers ?? 'General regulatory scope']} />
                          </div>
                        )}
                        {s.keyDetails.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Key details</div>
                            <ul className="mt-1.5 space-y-1.5">
                              {s.keyDetails.slice(0, 8).map((d, i) => (
                                <li key={i} className="rounded-lg border border-ink-line bg-white px-3 py-2 text-[12.5px] text-ink-body">
                                  {d}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {r.key_numbers.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Key numbers & rules</div>
                            <ul className="mt-1.5 space-y-1.5">
                              {r.key_numbers.map((kn, i) => (
                                <li key={i} className="flex items-start gap-2 text-[13px] text-ink-body">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                                  {kn}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {r.common_exam_questions.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Most-asked exam questions</div>
                            <ul className="mt-1.5 space-y-1.5">
                              {r.common_exam_questions.map((q, i) => (
                                <li key={i} className="flex items-start gap-2 rounded-lg border border-ink-line bg-white px-3 py-2 text-[12.5px] text-ink-body">
                                  <span className="font-bold text-brand-600">Q{i + 1}.</span>
                                  {q}
                                </li>
                              ))}
                            </ul>
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
      )}
    </div>
  );
}

function RuleBox({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  icon: any;
  items: string[];
  tone: 'emerald' | 'blue' | 'red' | 'amber';
}) {
  const toneClasses: Record<string, string> = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    red: 'border-red-200 bg-red-50 text-red-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
  };
  const cls = toneClasses[tone] ?? toneClasses.blue;
  return (
    <div className={`rounded-xl border p-3 ${cls}`}>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        <Icon size={12} /> {title}
      </div>
      {items.length === 0 ? (
        <div className="text-[12px] opacity-80">No explicit items detected in current dataset.</div>
      ) : (
        <ul className="space-y-1.5">
          {items.slice(0, 6).map((x, i) => (
            <li key={i} className="text-[12px] leading-relaxed">{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
