import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Award, Calculator, Workflow, BookOpen, AlertTriangle, Target } from 'lucide-react';
import { api } from '../lib/api';
import { safeHtml } from '../lib/sanitize';

type LearningObjective = { verb: string; statement: string; bloom_level: number; sub_domain_code?: string };
type Concept = { title: string; definition: string; distinguishing?: string };
type WorkedExample = { problem: string; steps: string[]; answer: string; distractor_traps?: string[] };
type FieldApp = { industry: string; scenario: string; decision_prompt: string };
type Mnemonic = { type: string; fact: string; meaning: string };
type CrossLink = { domain_id: string; topic: string; note: string };
type Citation = { title: string; authority: string; year: string; url?: string; note?: string };
type MethodCard = {
  definition: string;
  when_to_use: string[];
  when_not_to_use: string[];
  inputs: string[];
  procedure: string[];
  output: string;
  formulas?: Array<{ name: string; expr: string; units?: string }>;
  pitfalls: string[];
  reference: string;
};
type DecisionTree = {
  root_question: string;
  branches: Array<{ question: string; yes: string; no?: string }>;
  alternatives: Array<{ name: string; use_when: string }>;
  rationale: string;
};
type CalcSandbox = {
  inputs: Array<{ name: string; label: string; type: string; min?: number; max?: number; units?: string; default?: any }>;
  formula: string;
  sample_data: Record<string, any>;
  sample_answer: { value: number; units: string; rounded_to?: number };
  variant_challenge?: { prompt: string; expected_answer: number; expected_concept: string };
};

type MasteryTopic = {
  id: number;
  mastery_id: string;
  name: string;
  subtitle: string | null;
  primary_blueprint_code: string;
  secondary_blueprint_code: string | null;
  hook_text: string | null;
  learning_objectives_json: LearningObjective[] | null;
  overview_html: string | null;
  concepts_json: Concept[] | null;
  worked_example_json: WorkedExample | null;
  field_application_json: FieldApp | null;
  mnemonics_json: Mnemonic[] | null;
  common_pitfalls_json: string[] | null;
  cross_domain_links_json: CrossLink[] | null;
  citations_json: Citation[] | null;
  method_card_json: MethodCard | null;
  decision_tree_json: DecisionTree | null;
  calculation_sandbox_json: CalcSandbox | null;
  application_workshop_json: any;
  mastery_threshold: number;
  is_calculation_topic: boolean;
  category?: { code: string; name: string };
};

export default function MasteryTopicPage() {
  const { masteryId } = useParams();
  const { data, isLoading, error } = useQuery<{ topic: MasteryTopic }>({
    queryKey: ['mastery-topic', masteryId],
    queryFn: () => api(`/mastery/topics/${masteryId}`),
    enabled: !!masteryId,
  });

  if (isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }
  if (error || !data?.topic) {
    return (
      <div className="wrap py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          {(error as any)?.message ?? 'Mastery topic not found or not yet released.'}
        </div>
      </div>
    );
  }

  const t = data.topic;
  return (
    <div className="wrap py-10">
      <Link to="/mastery" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-dim hover:text-ink">
        <ArrowLeft size={14} aria-hidden="true" /> Back to Mastery Library
      </Link>

      <header className="card overflow-hidden">
        <div className="bg-gradient-to-br from-amber-50 via-white to-white p-7">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-amber-700">
              <Award size={10} className="inline -mt-0.5" aria-hidden="true" /> {t.mastery_id} · Mastery Gold
            </span>
            <span className="text-[11.5px] text-ink-dim">Blueprint {t.primary_blueprint_code}{t.secondary_blueprint_code ? ` / ${t.secondary_blueprint_code}` : ''}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">{t.name}</h1>
          {t.subtitle && <p className="mt-2 max-w-2xl text-[15px] text-ink-body">{t.subtitle}</p>}
        </div>
      </header>

      {/* 1. Hook */}
      {t.hook_text && (
        <section className="mt-6 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-5">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-amber-700">Hook</div>
          <p className="mt-2 text-[14px] text-ink-body">{t.hook_text}</p>
        </section>
      )}

      {/* 2. Learning Objectives */}
      {t.learning_objectives_json && t.learning_objectives_json.length > 0 && (
        <section className="mt-6 card p-5">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-dim">Learning objectives</div>
          <ul className="mt-3 space-y-2">
            {t.learning_objectives_json.map((lo, i) => (
              <li key={i} className="flex items-start gap-2 text-[13.5px] text-ink-body">
                <Target size={14} className="mt-0.5 shrink-0 text-brand-700" aria-hidden="true" />
                <span><strong className="text-ink">{lo.verb}.</strong> {lo.statement} <span className="text-[11px] text-ink-dim">[Bloom {lo.bloom_level}{lo.sub_domain_code ? ` · ${lo.sub_domain_code}` : ''}]</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. Overview */}
      {t.overview_html && (
        <section className="mt-6 card p-5">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-dim">Overview</div>
          <div className="topic-prose mt-3 text-[14px] leading-relaxed text-ink-body" dangerouslySetInnerHTML={safeHtml(t.overview_html)} />
        </section>
      )}

      {/* 4. Concepts */}
      {t.concepts_json && t.concepts_json.length > 0 && (
        <section className="mt-6 card p-5">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-dim">Core concepts</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {t.concepts_json.map((c, i) => (
              <div key={i} className="rounded-lg border border-ink-line bg-slate-50 p-3">
                <div className="font-display text-[13.5px] font-bold text-ink">{c.title}</div>
                <p className="mt-1 text-[12.5px] text-ink-body">{c.definition}</p>
                {c.distinguishing && <p className="mt-1 text-[11.5px] italic text-ink-dim"><strong>Distinguishing:</strong> {c.distinguishing}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. Worked Example */}
      {t.worked_example_json && (
        <section className="mt-6 card p-5">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-dim">Worked example</div>
          <p className="mt-2 text-[13.5px] font-semibold text-ink">{t.worked_example_json.problem}</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] text-ink-body">
            {t.worked_example_json.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-900">
            ✓ Answer: {t.worked_example_json.answer}
          </div>
          {t.worked_example_json.distractor_traps && (
            <div className="mt-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-red-700">Distractor traps</div>
              <ul className="mt-1 list-disc pl-5 text-[12.5px] text-ink-body">
                {t.worked_example_json.distractor_traps.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 16. Method Card */}
      {t.method_card_json && (
        <section className="mt-6 rounded-2xl border-2 border-amber-300 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-amber-700" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-ink">Method Card</h2>
            <span className="ml-auto text-[10.5px] font-semibold uppercase tracking-wider text-ink-dim">1-page reference</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">Definition</h3>
              <p className="mt-1 text-[13px] text-ink-body">{t.method_card_json.definition}</p>
              <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wider text-emerald-700">When to use</h3>
              <ul className="mt-1 list-disc pl-5 text-[12.5px] text-ink-body">
                {t.method_card_json.when_to_use.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
              <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wider text-red-700">When NOT to use</h3>
              <ul className="mt-1 list-disc pl-5 text-[12.5px] text-ink-body">
                {t.method_card_json.when_not_to_use.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">Procedure</h3>
              <ol className="mt-1 list-decimal pl-5 text-[12.5px] text-ink-body">
                {t.method_card_json.procedure.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              {t.method_card_json.formulas && t.method_card_json.formulas.length > 0 && (
                <>
                  <h3 className="mt-3 text-[11px] font-bold uppercase tracking-wider text-ink-dim">Formulas</h3>
                  <ul className="mt-1 space-y-1 text-[12.5px]">
                    {t.method_card_json.formulas.map((f, i) => (
                      <li key={i}>
                        <span className="font-semibold text-ink">{f.name}:</span>
                        <code className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[12px] text-ink">{f.expr}</code>
                        {f.units && <span className="ml-1 text-[11px] text-ink-dim">[{f.units}]</span>}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 border-t border-ink-line pt-3 text-[11px] text-ink-dim">
            <strong>Reference:</strong> {t.method_card_json.reference}
          </div>
        </section>
      )}

      {/* 17. Decision Tree */}
      {t.decision_tree_json && (
        <section className="mt-6 card p-5">
          <div className="flex items-center gap-2">
            <Workflow size={18} className="text-purple-700" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-ink">Decision Tree — When to use this method</h2>
          </div>
          <p className="mt-2 text-[13px] font-semibold text-ink">{t.decision_tree_json.root_question}</p>
          <ol className="mt-3 space-y-2 text-[13px] text-ink-body">
            {t.decision_tree_json.branches.map((b, i) => (
              <li key={i} className="rounded-lg border border-ink-line bg-slate-50 p-2.5">
                <div><strong>Q{i + 1}:</strong> {b.question}</div>
                <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-2 text-[12px]">
                  <div className="text-emerald-700">→ Yes: {b.yes}</div>
                  {b.no && <div className="text-ink-dim">→ No: {b.no}</div>}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {t.decision_tree_json.alternatives.map((a, i) => (
              <div key={i} className="rounded-lg border border-purple-200 bg-purple-50 p-2.5 text-[12px]">
                <strong className="text-purple-900">{a.name}</strong> — use when: {a.use_when}
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-[12px] italic text-ink-body">
            {t.decision_tree_json.rationale}
          </div>
        </section>
      )}

      {/* 18. Calculation Sandbox */}
      {t.calculation_sandbox_json && (
        <section className="mt-6 card p-5">
          <div className="flex items-center gap-2">
            <Calculator size={18} className="text-blue-700" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold text-ink">Calculation Sandbox</h2>
          </div>
          <div className="mt-3 rounded-lg bg-slate-50 p-3 font-mono text-[12px] text-ink">
            {t.calculation_sandbox_json.formula}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {t.calculation_sandbox_json.inputs.map((inp, i) => (
              <div key={i} className="rounded-lg border border-ink-line p-2.5 text-[12.5px]">
                <div className="font-semibold text-ink">{inp.label}</div>
                <div className="text-[11px] text-ink-dim">
                  {inp.type}{inp.units ? ` (${inp.units})` : ''}{inp.min !== undefined ? ` · min ${inp.min}` : ''}{inp.max !== undefined ? ` · max ${inp.max}` : ''}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-[13px]">
            <strong className="text-emerald-900">Sample answer:</strong> {t.calculation_sandbox_json.sample_answer.value} {t.calculation_sandbox_json.sample_answer.units}
          </div>
          {t.calculation_sandbox_json.variant_challenge && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px]">
              <strong className="text-amber-900">Variant challenge:</strong> {t.calculation_sandbox_json.variant_challenge.prompt}
              <div className="mt-1 text-[12px] text-ink-dim italic">{t.calculation_sandbox_json.variant_challenge.expected_concept}</div>
            </div>
          )}
        </section>
      )}

      {/* 8. Common Pitfalls + 9. Cross-domain links */}
      {t.common_pitfalls_json && t.common_pitfalls_json.length > 0 && (
        <section className="mt-6 card p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-700" aria-hidden="true" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-red-700">Common pitfalls</h2>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-ink-body">
            {t.common_pitfalls_json.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </section>
      )}

      {/* 10. Citations */}
      {t.citations_json && t.citations_json.length > 0 && (
        <section className="mt-6 card p-5">
          <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-dim">Primary sources</div>
          <ul className="mt-3 space-y-1.5 text-[12.5px]">
            {t.citations_json.map((c, i) => (
              <li key={i}>
                <strong className="text-ink">{c.title}</strong>
                <span className="text-ink-dim"> — {c.authority}, {c.year}</span>
                {c.url && <a className="ml-2 text-brand-700 hover:underline" href={c.url} target="_blank" rel="noreferrer">link</a>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
