import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Plus, Trash2, Wand2, Save, Eye, Info,
  BookOpen, Calculator, Lightbulb, Briefcase, ArrowRight,
  Library, FileText, Bot, Zap, Loader2, CheckCircle2, X,
} from 'lucide-react';
import { useEffect } from 'react';
import { api } from '../lib/api';
import {
  generateSuite,
  detectVisual,
  VISUAL_META,
  type TopicInput,
  type Concept,
  type Formula,
  type GeneratedSuite,
} from '../lib/auto-gen';

const EMPTY_CONCEPT: Concept = { term: '', definition: '' };
const EMPTY_FORMULA: Formula = { name: '', formula: '', description: '' };

const DOMAIN_OPTIONS = [
  { id: 'domain1', label: 'I. Advanced Application of Safety Principles' },
  { id: 'domain2', label: 'II. Program Management' },
  { id: 'domain3', label: 'III. Risk Management' },
  { id: 'domain4', label: 'IV. Emergency Management' },
  { id: 'domain5', label: 'V. Environmental Management' },
  { id: 'domain6', label: 'VI. Occupational Health & Applied Science' },
  { id: 'domain7', label: 'VII. Training' },
];

const DEMO: TopicInput = {
  title: 'Hierarchy of Controls',
  subtitle: 'The 5-tier system for managing workplace hazards',
  overview: 'The Hierarchy of Controls is OSHA\'s preferred order for managing workplace hazards. It ranks controls from most effective (elimination) to least effective (PPE). Engineering controls isolate workers from the hazard; administrative controls change how people work; PPE is the last line of defense.',
  concepts: [
    { term: 'Elimination', definition: 'Physically remove the hazard — the only way to achieve 100% protection.' },
    { term: 'Substitution', definition: 'Replace the hazard with a safer alternative, such as water-based paint instead of solvent-based.' },
    { term: 'Engineering Controls', definition: 'Isolate people from the hazard using guards, ventilation, interlocks, or barriers.' },
    { term: 'Administrative Controls', definition: 'Change the way people work — training, procedures, signs, rotation, permits.' },
    { term: 'PPE', definition: 'Protect the worker as a last line of defense — hard hats, respirators, gloves. Relies on user compliance.' },
  ],
  formulas: [],
  examTips: [
    { tip: 'Always choose the highest level of the hierarchy that is feasible. PPE is the last resort, not the first choice.' },
    { tip: 'On exam questions, if multiple controls are feasible, pick elimination or substitution over engineering controls.' },
  ],
  scenarios: [
    { title: 'Noise reduction in a factory', description: 'Instead of only providing earplugs (PPE), install a noise-reducing enclosure around the press (engineering control) — more effective and doesn\'t rely on worker compliance.' },
  ],
  domainId: 'domain2',
};

export default function TopicAuthoringPage() {
  const [input, setInput] = useState<TopicInput>(DEMO);
  const [showPreview, setShowPreview] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const suite: GeneratedSuite = useMemo(() => generateSuite(input), [input]);
  const visual = useMemo(() => detectVisual(input), [input]);

  // AI generation state
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUseLibrary, setAiUseLibrary] = useState(true);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  async function runAI() {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await api<any>('/admin/topics/generate-with-ai', {
        method: 'POST',
        body: JSON.stringify({
          title: input.title,
          subtitle: input.subtitle,
          domain_id: input.domainId,
          use_library: aiUseLibrary,
        }),
      });
      if (res.success === false && res.error) setAiError(res.error);
      setAiResult(res);
    } catch (e: any) {
      setAiError(e?.message || 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  }

  function applyAI() {
    if (!aiResult?.generated) return;
    const g = aiResult.generated;
    setInput((p) => ({
      ...p,
      overview: g.overview || p.overview,
      concepts: (g.concepts || []).map((c: any) => ({ term: c.term || '', definition: c.definition || '' })),
      formulas: (g.formulas || []).map((f: any) => ({ name: f.name || '', formula: f.formula || '', description: f.description || '' })),
      examTips: (g.exam_tips || []).map((t: any) => ({ tip: t.tip || '' })),
      scenarios: (g.scenarios || []).map((s: any) => ({ title: s.title || '', description: s.description || '' })),
    }));
    setSaved(false);
    setAiOpen(false);
  }

  // Live content library search — debounced
  const [libMatches, setLibMatches] = useState<any[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  useEffect(() => {
    const q = (input.title + ' ' + input.subtitle).trim();
    if (q.length < 4) { setLibMatches([]); return; }
    const t = setTimeout(async () => {
      setLibLoading(true);
      try {
        const res = await api<{ matches: any[] }>('/admin/content/search', { params: { q, limit: 6 } });
        setLibMatches(res.matches || []);
      } catch { setLibMatches([]); }
      finally { setLibLoading(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [input.title, input.subtitle]);

  function update<K extends keyof TopicInput>(key: K, value: TopicInput[K]) {
    setInput((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function addConcept()  { update('concepts', [...input.concepts, { ...EMPTY_CONCEPT }]); }
  function addFormula()  { update('formulas', [...input.formulas, { ...EMPTY_FORMULA }]); }
  function addTip()      { update('examTips', [...input.examTips, { tip: '' }]); }
  function addScenario() { update('scenarios', [...input.scenarios, { title: '', description: '' }]); }

  async function handleSave() {
    setSaving(true);
    // In production this POSTs to Laravel /api/admin/topics/generate
    try {
      await new Promise((r) => setTimeout(r, 800));
      // Example payload:
      const payload = {
        domain_id: input.domainId,
        topic: { title: input.title, subtitle: input.subtitle, overview: input.overview },
        concepts: input.concepts.filter((c) => c.term),
        formulas: input.formulas.filter((f) => f.name),
        exam_tips: input.examTips.filter((t) => t.tip),
        scenarios: input.scenarios.filter((s) => s.title),
        visual_type: suite.visual.type,
        generated: {
          flashcards: suite.flashcards,
          quiz_questions: suite.quizQuestions,
          mnemonics: suite.mnemonics,
        },
      };
      console.log('Would POST to /api/admin/topics/generate:', payload);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-mesh-light border-b border-ink-line">
        <div className="wrap py-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <span className="eyebrow mb-3"><Wand2 size={13} /> Content Authoring</span>
              <h1 className="font-display text-3xl font-extrabold text-ink leading-tight">
                Add a Topic — Auto-Generate Visuals, Flashcards & Quizzes
              </h1>
              <p className="mt-2 text-ink-body">
                Enter your content below, or use AI to draft everything. AI pulls from your uploaded reference books when available, or generates from scratch.
              </p>
            </div>
            <button
              onClick={() => { setAiOpen(true); setAiResult(null); setAiError(null); }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-500 to-brand-600 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_28px_-10px_rgba(234,88,12,0.55)] hover:-translate-y-0.5 transition-transform"
              title="Draft the topic with AI"
            >
              <Bot size={16} /> Generate with AI
            </button>
          </motion.div>
        </div>
      </div>

      <div className="wrap py-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* ---------- LEFT: authoring form ---------- */}
        <div className="space-y-5">
          <Section title="Topic Info" Icon={BookOpen}>
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <Field label="Title">
                <input className="input" value={input.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Hot Work Hazards and Controls" />
              </Field>
              <Field label="Domain">
                <select className="input" value={input.domainId} onChange={(e) => update('domainId', e.target.value)}>
                  {DOMAIN_OPTIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Subtitle / one-liner">
              <input className="input" value={input.subtitle} onChange={(e) => update('subtitle', e.target.value)} placeholder="A short one-line description" />
            </Field>
            <Field label="Overview (1-3 paragraphs)">
              <textarea
                className="input min-h-[120px] leading-relaxed"
                value={input.overview}
                onChange={(e) => update('overview', e.target.value)}
                placeholder="What the topic covers, why it matters, key OSHA/ANSI/NFPA references…"
              />
            </Field>
          </Section>

          <Section title="Key Concepts" Icon={Lightbulb} action={<AddBtn onClick={addConcept} />}>
            {input.concepts.map((c, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[200px_1fr_auto] items-start">
                <input className="input" placeholder="Term" value={c.term}
                  onChange={(e) => {
                    const next = input.concepts.slice(); next[i] = { ...next[i], term: e.target.value };
                    update('concepts', next);
                  }} />
                <textarea className="input min-h-[44px]" placeholder="Definition" value={c.definition}
                  onChange={(e) => {
                    const next = input.concepts.slice(); next[i] = { ...next[i], definition: e.target.value };
                    update('concepts', next);
                  }} />
                <DelBtn onClick={() => update('concepts', input.concepts.filter((_, j) => j !== i))} />
              </div>
            ))}
            {input.concepts.length === 0 && <EmptyHint>Add key concepts that define this topic.</EmptyHint>}
          </Section>

          <Section title="Formulas" Icon={Calculator} action={<AddBtn onClick={addFormula} />}>
            {input.formulas.map((f, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[150px_1fr_auto]">
                <input className="input" placeholder="Name (e.g. TRIR)" value={f.name}
                  onChange={(e) => {
                    const next = input.formulas.slice(); next[i] = { ...next[i], name: e.target.value };
                    update('formulas', next);
                  }} />
                <div className="flex flex-col gap-1">
                  <input className="input font-mono" placeholder="Formula (e.g. (Incidents × 200,000) / Hours)" value={f.formula}
                    onChange={(e) => {
                      const next = input.formulas.slice(); next[i] = { ...next[i], formula: e.target.value };
                      update('formulas', next);
                    }} />
                  <input className="input" placeholder="Short description" value={f.description || ''}
                    onChange={(e) => {
                      const next = input.formulas.slice(); next[i] = { ...next[i], description: e.target.value };
                      update('formulas', next);
                    }} />
                </div>
                <DelBtn onClick={() => update('formulas', input.formulas.filter((_, j) => j !== i))} />
              </div>
            ))}
            {input.formulas.length === 0 && <EmptyHint>Add formulas with their symbols and brief descriptions.</EmptyHint>}
          </Section>

          <Section title="Exam Tips" Icon={Lightbulb} action={<AddBtn onClick={addTip} />}>
            {input.examTips.map((t, i) => (
              <div key={i} className="grid gap-2 grid-cols-[1fr_auto]">
                <textarea className="input min-h-[44px]" placeholder="Exam tip" value={t.tip}
                  onChange={(e) => {
                    const next = input.examTips.slice(); next[i] = { ...next[i], tip: e.target.value };
                    update('examTips', next);
                  }} />
                <DelBtn onClick={() => update('examTips', input.examTips.filter((_, j) => j !== i))} />
              </div>
            ))}
            {input.examTips.length === 0 && <EmptyHint>Tips that are commonly tested.</EmptyHint>}
          </Section>

          <Section title="Real-World Scenarios" Icon={Briefcase} action={<AddBtn onClick={addScenario} />}>
            {input.scenarios.map((s, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
                <input className="input" placeholder="Scenario title" value={s.title}
                  onChange={(e) => {
                    const next = input.scenarios.slice(); next[i] = { ...next[i], title: e.target.value };
                    update('scenarios', next);
                  }} />
                <textarea className="input min-h-[44px]" placeholder="Scenario description" value={s.description}
                  onChange={(e) => {
                    const next = input.scenarios.slice(); next[i] = { ...next[i], description: e.target.value };
                    update('scenarios', next);
                  }} />
                <DelBtn onClick={() => update('scenarios', input.scenarios.filter((_, j) => j !== i))} />
              </div>
            ))}
            {input.scenarios.length === 0 && <EmptyHint>Real applications help pattern-matching on the exam.</EmptyHint>}
          </Section>

          <div className="flex flex-wrap gap-2 items-center pt-4 sticky bottom-4 bg-surface/80 backdrop-blur-sm py-3 rounded-2xl border border-ink-line px-4 shadow-card z-10">
            <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-md">
              {saving ? 'Saving…' : saved ? <><Save size={14} /> Saved</> : <><Save size={14} /> Save & Generate</>}
            </button>
            <button onClick={() => setShowPreview((v) => !v)} className="btn btn-ghost btn-md">
              <Eye size={14} /> {showPreview ? 'Hide' : 'Show'} Preview
            </button>
            <div className="ml-auto text-[12px] text-ink-dim flex items-center gap-1">
              <Info size={12} /> Everything regenerates live as you type.
            </div>
          </div>
        </div>

        {/* ---------- RIGHT: live preview ---------- */}
        <AnimatePresence>
          {showPreview && (
            <motion.aside
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="lg:sticky lg:top-4 lg:self-start space-y-4"
            >
              {/* Visualization */}
              <div className="card p-5">
                <div className="eyebrow mb-2"><Sparkles size={11} /> Detected Visualization</div>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{VISUAL_META[suite.visual.type].previewEmoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink text-[15px]">{VISUAL_META[suite.visual.type].label}</div>
                    <div className="text-[13px] text-ink-dim">{VISUAL_META[suite.visual.type].description}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-ink-line overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.round(visual.confidence * 100)}%` }}
                      className="h-full bg-gradient-to-r from-brand-500 to-brand-700"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-ink-dim tabular-nums">{Math.round(visual.confidence * 100)}%</span>
                </div>
                <div className="mt-2 text-[12px] text-ink-body italic">→ {visual.reason}</div>

                {visual.alternatives.length > 0 && (
                  <details className="mt-3 text-[12px]">
                    <summary className="cursor-pointer text-ink-dim hover:text-ink">Alternative choices</summary>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {visual.alternatives.map((a) => (
                        <span key={a.type} className="inline-flex items-center gap-1.5 rounded-full bg-surface-sunken px-2.5 py-0.5 text-[11px] font-medium text-ink-body">
                          {VISUAL_META[a.type].previewEmoji} {VISUAL_META[a.type].label}
                        </span>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              {/* Flashcards */}
              <PreviewCard
                icon={<Sparkles size={13} />}
                title="Auto-Generated Flashcards"
                count={suite.flashcards.length}
              >
                {suite.flashcards.slice(0, 4).map((c, i) => (
                  <div key={i} className="rounded-lg bg-surface-sunken px-3 py-2 text-[13px]">
                    <div className="font-semibold text-ink">Q · {c.front}</div>
                    <div className="text-ink-dim mt-0.5 line-clamp-2">A · {c.back}</div>
                  </div>
                ))}
                {suite.flashcards.length === 0 && <EmptyHint>Add concepts or formulas to generate flashcards.</EmptyHint>}
                {suite.flashcards.length > 4 && (
                  <div className="text-[11px] text-ink-dim text-center pt-1">+{suite.flashcards.length - 4} more…</div>
                )}
              </PreviewCard>

              {/* Quiz questions */}
              <PreviewCard
                icon={<Lightbulb size={13} />}
                title="Auto-Generated Quiz Questions"
                count={suite.quizQuestions.length}
              >
                {suite.quizQuestions.slice(0, 2).map((q, i) => (
                  <div key={i} className="rounded-lg bg-surface-sunken px-3 py-2 text-[13px]">
                    <div className="font-semibold text-ink">{q.question}</div>
                    <ol className="mt-1.5 space-y-0.5">
                      {q.options.map((o, j) => (
                        <li key={j} className={`pl-2 ${j === q.correctIndex ? 'text-emerald-700 font-semibold' : 'text-ink-dim'}`}>
                          {String.fromCharCode(65 + j)}. {o}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
                {suite.quizQuestions.length === 0 && <EmptyHint>Needs 4+ concepts to generate MCQs with distractors.</EmptyHint>}
                {suite.quizQuestions.length > 2 && (
                  <div className="text-[11px] text-ink-dim text-center pt-1">+{suite.quizQuestions.length - 2} more…</div>
                )}
              </PreviewCard>

              {/* Mnemonics */}
              <PreviewCard
                icon={<Wand2 size={13} />}
                title="Suggested Mnemonics"
                count={suite.mnemonics.length}
              >
                {suite.mnemonics.map((m, i) => (
                  <div key={i} className="rounded-lg bg-purple-50 border border-purple-200/60 px-3 py-2">
                    <div className="font-black text-purple-900 text-base tracking-wide">{m.phrase}</div>
                    <div className="text-[12px] text-purple-800/80 mt-1">{m.explanation}</div>
                  </div>
                ))}
                {suite.mnemonics.length === 0 && <EmptyHint>No preset match — the system will build an acronym if you have 3-7 concepts.</EmptyHint>}
              </PreviewCard>

              {/* Content Library matches */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="eyebrow"><Library size={11} /> Reference Library Matches</div>
                  <span className="text-[11px] font-bold tabular-nums text-ink-dim">{libMatches.length}</span>
                </div>
                {libLoading && <div className="text-[12px] text-ink-dim">Searching uploaded reference books…</div>}
                {!libLoading && libMatches.length === 0 && (
                  <div className="text-[12px] text-ink-muted italic">
                    No matching content yet. Upload reference books, PDFs, or notes in{' '}
                    <a href="#/content" className="text-brand-600 font-semibold">Content Library</a> and they'll appear here.
                  </div>
                )}
                {!libLoading && libMatches.length > 0 && (
                  <div className="space-y-1.5">
                    {libMatches.map((m: any) => (
                      <div key={m.chunk_id} className="rounded-lg bg-surface-sunken px-3 py-2">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileText size={11} className="text-ink-dim shrink-0" />
                            <span className="text-[11px] font-bold text-ink truncate">{m.source_title}</span>
                          </div>
                          {m.page_number && (
                            <span className="text-[10px] text-ink-dim shrink-0">p.{m.page_number}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-body leading-relaxed line-clamp-3">
                          {m.snippet}…
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-4 text-[12px] text-ink-body leading-relaxed">
                <div className="font-bold text-ink mb-1 flex items-center gap-2">
                  <ArrowRight size={12} /> What happens when you save
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-ink-dim">
                  <li>Topic row created in <code>topics</code> table under the selected domain</li>
                  <li>All concepts/formulas/tips/scenarios persisted</li>
                  <li>Visualization kind attached so student app renders the right component</li>
                  <li>Auto-generated flashcards + quiz questions saved (admin can still edit)</li>
                  <li>Student sees new topic immediately in the sidebar tree</li>
                </ul>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* AI generation modal */}
      <AnimatePresence>
        {aiOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => !aiLoading && setAiOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-extrabold text-ink flex items-center gap-2">
                  <Bot className="text-brand-600" size={22} /> Generate topic content with AI
                </h2>
                <button onClick={() => !aiLoading && setAiOpen(false)} className="grid place-items-center h-8 w-8 rounded hover:bg-slate-100">
                  <X size={16} />
                </button>
              </div>

              <div className="card p-4 mb-4 bg-surface-sunken">
                <div className="label mb-1">Topic</div>
                <div className="font-bold text-ink">{input.title || '(no title — enter a title first)'}</div>
                {input.subtitle && <div className="text-[13px] text-ink-dim mt-0.5">{input.subtitle}</div>}
                <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-dim uppercase tracking-wide">
                  Domain: {input.domainId}
                </div>
              </div>

              {/* Mode toggle */}
              <div className="grid gap-2 mb-5">
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  aiUseLibrary ? 'border-brand-500 bg-brand-50/40' : 'border-ink-line hover:border-slate-300'
                }`}>
                  <input type="radio" checked={aiUseLibrary} onChange={() => setAiUseLibrary(true)}
                    className="mt-1 accent-brand-500" />
                  <div>
                    <div className="font-bold text-ink flex items-center gap-2">
                      <Library size={14} /> Extract from Content Library + refine with AI
                    </div>
                    <div className="text-[12.5px] text-ink-body mt-0.5">
                      AI searches your uploaded reference books for relevant excerpts, then uses them as the
                      primary source of truth. <strong>Recommended</strong> when you've uploaded references.
                    </div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  !aiUseLibrary ? 'border-brand-500 bg-brand-50/40' : 'border-ink-line hover:border-slate-300'
                }`}>
                  <input type="radio" checked={!aiUseLibrary} onChange={() => setAiUseLibrary(false)}
                    className="mt-1 accent-brand-500" />
                  <div>
                    <div className="font-bold text-ink flex items-center gap-2">
                      <Zap size={14} /> AI-only (no reference material)
                    </div>
                    <div className="text-[12.5px] text-ink-body mt-0.5">
                      AI generates content from general CSP exam knowledge (OSHA / NIOSH / ANSI / NFPA references).
                      Use when no reference book is uploaded for this topic.
                    </div>
                  </div>
                </label>
              </div>

              {!aiResult && !aiLoading && !aiError && (
                <div className="flex justify-end gap-2">
                  <button onClick={() => setAiOpen(false)} className="btn btn-ghost btn-md">Cancel</button>
                  <button
                    onClick={runAI}
                    disabled={!input.title}
                    className="btn btn-primary btn-md"
                  >
                    <Bot size={15} /> Generate
                  </button>
                </div>
              )}

              {aiLoading && (
                <div className="flex items-center justify-center gap-3 py-6 text-ink-dim">
                  <Loader2 className="animate-spin" size={22} />
                  <span>Generating content with AI… (may take 10-30 seconds)</span>
                </div>
              )}

              {aiError && !aiLoading && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800 mb-3">
                  <strong>Error:</strong> {aiError}
                  <div className="mt-3 flex gap-2 justify-end">
                    <button onClick={() => setAiError(null)} className="btn btn-ghost btn-sm">Dismiss</button>
                    <button onClick={runAI} className="btn btn-primary btn-sm">Try again</button>
                  </div>
                </div>
              )}

              {aiResult?.generated && !aiLoading && (
                <div>
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200/70 p-3 mb-4 text-[13px] text-emerald-900">
                    <div className="flex items-center gap-2 mb-1 font-bold">
                      <CheckCircle2 size={16} /> Generated via <span className="uppercase tracking-wide">{aiResult.provider}</span>
                      {aiResult.used_library && (
                        <span className="ml-auto text-[11px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          LIBRARY-GROUNDED
                        </span>
                      )}
                    </div>
                    {aiResult.used_library && aiResult.sources_used?.length ? (
                      <div className="text-[12px] opacity-85">
                        <strong>Sources used:</strong> {aiResult.sources_used.join(', ')}
                      </div>
                    ) : (
                      <div className="text-[12px] opacity-85">Generated from general CSP knowledge (no library matches).</div>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 mb-3">
                    {aiResult.generated.overview && (
                      <PreviewBlock title="Overview" count={1}>
                        <div className="text-[13px] text-ink-body leading-relaxed">{aiResult.generated.overview}</div>
                      </PreviewBlock>
                    )}
                    {aiResult.generated.concepts?.length > 0 && (
                      <PreviewBlock title="Concepts" count={aiResult.generated.concepts.length}>
                        {aiResult.generated.concepts.map((c: any, i: number) => (
                          <div key={i} className="text-[12.5px]">
                            <strong className="text-ink">{c.term}</strong>
                            <span className="text-ink-body"> — {c.definition}</span>
                          </div>
                        ))}
                      </PreviewBlock>
                    )}
                    {aiResult.generated.formulas?.length > 0 && (
                      <PreviewBlock title="Formulas" count={aiResult.generated.formulas.length}>
                        {aiResult.generated.formulas.map((f: any, i: number) => (
                          <div key={i} className="text-[12.5px]">
                            <strong>{f.name}:</strong> <code className="bg-white px-1.5 rounded">{f.formula}</code>
                          </div>
                        ))}
                      </PreviewBlock>
                    )}
                    {aiResult.generated.exam_tips?.length > 0 && (
                      <PreviewBlock title="Exam Tips" count={aiResult.generated.exam_tips.length}>
                        {aiResult.generated.exam_tips.map((t: any, i: number) => (
                          <div key={i} className="text-[12.5px] text-ink-body">• {t.tip}</div>
                        ))}
                      </PreviewBlock>
                    )}
                    {aiResult.generated.scenarios?.length > 0 && (
                      <PreviewBlock title="Scenarios" count={aiResult.generated.scenarios.length}>
                        {aiResult.generated.scenarios.map((s: any, i: number) => (
                          <div key={i} className="text-[12.5px]">
                            <strong>{s.title}:</strong> <span className="text-ink-body">{s.description}</span>
                          </div>
                        ))}
                      </PreviewBlock>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <button onClick={() => setAiOpen(false)} className="btn btn-ghost btn-md">Cancel</button>
                    <button onClick={runAI} className="btn btn-ghost btn-md">
                      <Bot size={14} /> Regenerate
                    </button>
                    <button onClick={applyAI} className="btn btn-primary btn-md">
                      <CheckCircle2 size={14} /> Accept & Fill Form
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PreviewBlock({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="card p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="font-bold text-[12px] uppercase tracking-wide text-ink-dim">{title}</div>
        <span className="text-[10px] font-bold tabular-nums text-ink-muted">{count}</span>
      </div>
      <div className="space-y-1 text-ink-body">{children}</div>
    </div>
  );
}

/* ---------- small layout helpers ---------- */

function Section({ title, Icon, action, children }: { title: string; Icon: typeof BookOpen; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-700"><Icon size={14} /></span>
          {title}
        </h3>
        {action}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="label">{label}</div>
      {children}
    </label>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg bg-ink-line/40 hover:bg-ink-line px-3 py-1.5 text-[12px] font-semibold text-ink-body">
      <Plus size={13} /> Add
    </button>
  );
}
function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="grid place-items-center h-9 w-9 rounded-lg text-ink-dim hover:bg-red-50 hover:text-red-600 transition-colors">
      <Trash2 size={14} />
    </button>
  );
}
function EmptyHint({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed border-ink-line bg-surface-sunken/40 px-3 py-2 text-[12px] text-ink-muted italic">{children}</div>;
}

function PreviewCard({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="eyebrow">{icon}{title}</div>
        <span className="text-[11px] font-bold tabular-nums text-ink-dim">{count}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
