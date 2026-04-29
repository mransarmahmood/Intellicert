import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Loader2,
  Printer,
  Brain,
  Lightbulb,
  Calculator,
  Scale,
  BookMarked,
  Workflow,
  Layers,
  HelpCircle,
} from 'lucide-react';
// Note: Scale already imported above; this comment is just to mark it's used by the regulation tile.
import { api } from '../lib/api';
import { safeHtml } from '../lib/sanitize';
import DiagramRenderer from '../components/DiagramRenderer';
import RichContent, { MnemonicTiles } from '../components/RichContent';
import ConceptIcon from '../components/ConceptIcon';
import TopicStatsStrip from '../components/TopicStatsStrip';
import AudioListener from '../components/AudioListener';
import KeyTerms from '../components/KeyTerms';
import TopicFlow from '../components/TopicFlow';
import SmartStudyTools from '../components/SmartStudyTools';
import ConceptMemoryBadge from '../components/memory/ConceptMemoryBadge';
import TopicVisualMap from '../components/TopicVisualMap';
import NotesPanel from '../components/NotesPanel';

type Domain = { id: string; number: number; name: string; color_hex: string };
type Concept = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};
type ExtraType = 'mnemonic' | 'examtip' | 'formula' | 'regulation' | 'chapter' | 'diagram';
type Extra = {
  id: number;
  extra_type: ExtraType;
  content_json: { title?: string; body?: string } | string;
};
type Topic = {
  id: number;
  name: string;
  subtitle: string | null;
  overview: string | null;
  image_url: string | null;
  topic_key: string;
  domain_id: string;
  domain?: Domain;
  concepts?: Concept[];
  extras?: Extra[];
};

const EXTRA_META: Record<ExtraType, { label: string; icon: any; color: string }> = {
  mnemonic:   { label: 'Mnemonic',   icon: Brain,      color: 'from-purple-400 to-purple-600' },
  examtip:    { label: 'Exam Tip',   icon: Lightbulb,  color: 'from-amber-400 to-amber-600' },
  formula:    { label: 'Formula',    icon: Calculator, color: 'from-blue-400 to-blue-600' },
  regulation: { label: 'Regulation', icon: Scale,      color: 'from-red-400 to-red-600' },
  chapter:    { label: 'Chapter',    icon: BookMarked, color: 'from-emerald-400 to-emerald-600' },
  diagram:    { label: 'Diagram',    icon: Workflow,   color: 'from-indigo-400 to-indigo-600' },
};

function safeParse(s: string): { title?: string; body?: string } {
  try { return JSON.parse(s); } catch { return { body: s }; }
}

function decodeUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function parseJsonLike<T = any>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    try {
      return JSON.parse(decodeUnicodeEscapes(raw)) as T;
    } catch {
      return null;
    }
  }
}

function extractFormulaFallback(bodyText: string): { expression: string | null; vars: { symbol: string; desc: string }[] } {
  const expressionMatch = bodyText.match(/"expression"\s*:\s*"([^"]+)"/i);
  const expression = expressionMatch ? expressionMatch[1] : null;
  const vars: { symbol: string; desc: string }[] = [];
  const varRegex = /"symbol"\s*:\s*"([^"]+)"\s*,\s*"desc"\s*:\s*"([^"]+)"/gi;
  let m: RegExpExecArray | null = null;
  while ((m = varRegex.exec(bodyText)) !== null) {
    vars.push({ symbol: m[1], desc: m[2] });
  }
  return { expression, vars };
}

export default function TopicPage() {
  const { id } = useParams();
  const topicQ = useQuery({
    queryKey: ['topic', id],
    queryFn: () => api<{ topic: Topic }>(`/topics/${id}`),
    enabled: !!id,
  });

  const flashcardsQ = useQuery({
    queryKey: ['topic-flashcards', topicQ.data?.topic.domain_id],
    queryFn: () =>
      api<{ flashcards: any[]; total: number }>('/flashcards', { params: { domain_id: topicQ.data?.topic.domain_id } }),
    enabled: !!topicQ.data?.topic.domain_id,
  });
  const quizzesQ = useQuery({
    queryKey: ['topic-quizzes', topicQ.data?.topic.domain_id],
    queryFn: () =>
      api<{ quizzes: any[]; total: number }>('/quizzes', { params: { domain_id: topicQ.data?.topic.domain_id } }),
    enabled: !!topicQ.data?.topic.domain_id,
  });

  if (topicQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }
  if (topicQ.error || !topicQ.data?.topic) {
    return (
      <div className="wrap py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
          {(topicQ.error as Error)?.message ?? 'Topic not found'}
        </div>
      </div>
    );
  }

  const topic = topicQ.data.topic;
  const concepts = topic.concepts ?? [];
  const extras = topic.extras ?? [];
  const printTopicPdf = () => window.print();

  return (
    <div className="wrap py-10">
      <Link
        to={topic.domain ? `/domains/${topic.domain.id}` : '/'}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-dim hover:text-ink"
      >
        <ArrowLeft size={14} /> Back to {topic.domain?.name ?? 'home'}
      </Link>
      <div className="no-print mb-4">
        <button onClick={printTopicPdf} className="btn btn-ghost btn-sm">
          <Printer size={13} /> Print Topic PDF
        </button>
      </div>

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-br from-brand-50 via-white to-white p-7">
          {topic.image_url && (
            <img src={topic.image_url} alt={topic.name} className="absolute right-6 top-6 h-24 w-24 rounded-xl object-cover ring-1 ring-ink-line" />
          )}
          <div className="flex items-center gap-2">
            {topic.domain && <span className="badge badge-brand">{topic.domain.number}. {topic.domain.name}</span>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">{topic.name}</h1>
          {topic.subtitle && <p className="mt-2 max-w-2xl text-[15px] text-ink-body">{topic.subtitle}</p>}
          {/* Audio listener — uses the browser's TTS to read the overview aloud */}
          {(topic.overview || topic.subtitle) && (
            <div className="mt-4">
              <AudioListener
                text={(topic.overview || '') + ' ' + (topic.subtitle || '')}
                label="Listen to this topic"
              />
            </div>
          )}
        </div>
        {topic.overview && (
          <div className="border-t border-ink-line bg-white p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">Overview</h3>
            {/* Overview is admin-authored HTML — sanitized to strip script/style/event handlers */}
            <div
              className="topic-prose mt-2 text-[14.5px] leading-relaxed text-ink-body"
              dangerouslySetInnerHTML={safeHtml(topic.overview)}
            />
            <TopicVisualMap topicName={topic.name} subtitle={topic.subtitle} concepts={concepts} />
          </div>
        )}
      </div>

      {/* Topic stats infographic strip */}
      <TopicStatsStrip
        concepts={concepts.length}
        diagrams={extras.filter((x) => x.extra_type === 'diagram').length}
        mnemonics={extras.filter((x) => x.extra_type === 'mnemonic').length}
        examTips={extras.filter((x) => x.extra_type === 'examtip').length}
        regulations={extras.filter((x) => x.extra_type === 'regulation').length}
        formulas={extras.filter((x) => x.extra_type === 'formula').length}
        flashcards={flashcardsQ.data?.total ?? 0}
        quizzes={quizzesQ.data?.total ?? 0}
      />

      {/* Smart Study Tools — AI actions */}
      <SmartStudyTools topicId={topic.id} />

      {/* Primary CTA — 10-step learning flow */}
      <Link
        to={`/topics/${topic.id}/learn`}
        className="group mt-8 flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-brand-500/40 bg-gradient-to-br from-brand-50 via-white to-white p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-cardHover"
      >
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="font-display text-[18px] font-bold text-ink">10 steps. One mastered concept.</div>
            <div className="text-[13px] text-ink-body">Open the integrated training panel: Hook → Summary with guided trainer + assessor checkpoints.</div>
          </div>
        </div>
        <ArrowRight size={18} className="shrink-0 text-brand-600 transition-transform group-hover:translate-x-1" />
      </Link>

      {/* Secondary action tiles */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ActionTile
          to={`/study/flashcards/${topic.domain_id}`}
          icon={Layers}
          title="Study flashcards"
          desc={`${flashcardsQ.data?.total ?? 0} cards in this domain`}
          color="from-purple-500 to-purple-700"
        />
        <ActionTile
          to={`/study/quizzes/${topic.domain_id}`}
          icon={HelpCircle}
          title="Practice quiz"
          desc={`${quizzesQ.data?.total ?? 0} questions in this domain`}
          color="from-blue-500 to-blue-700"
        />
      </div>

      {/* Concepts */}
      {/* Topic-level Key concepts chip cloud — clickable for definitions */}
      {concepts.length > 0 && (
        <KeyTerms
          terms={concepts.map((c) => ({
            id: c.id,
            term: c.title,
            definition: c.description,
          }))}
          title="Key concepts in this topic"
        />
      )}

      {/* Visual learning roadmap — icon flow of all concepts */}
      {concepts.length > 0 && <TopicFlow concepts={concepts} topicId={topic.id} />}

      <div className="mt-12">
        <h2 className="mb-5 font-display text-2xl font-extrabold text-ink">Core concepts</h2>
        {concepts.length === 0 ? (
          <div className="card grid place-items-center py-12 text-[13px] text-ink-dim">
            No concepts yet in this topic
          </div>
        ) : (
          <div className="space-y-4">
            {concepts.map((c, i) => {
              const palette = ['#EA580C', '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];
              const accent = palette[i % palette.length];
              return (
                <div id={`concept-${c.id}`} key={c.id} className="card overflow-hidden scroll-mt-24">
                  {/* Colored header strip */}
                  <div
                    className="flex items-center gap-3 border-b border-ink-line px-5 py-3"
                    style={{ background: `linear-gradient(90deg, ${accent}12, transparent 50%)` }}
                  >
                    <ConceptIcon title={c.title} size={18} />
                    <span className="font-display text-[11px] font-bold text-ink-dim">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="flex-1 font-display text-[16px] font-bold text-ink">{c.title}</h3>
                    <ConceptMemoryBadge conceptId={c.id} />
                    {/* Per-concept audio listener */}
                    {c.description && (
                      <AudioListener
                        text={`${c.title}. ${c.description}`}
                        label="Listen"
                      />
                    )}
                  </div>
                  {/* Body */}
                  <div className="flex flex-col gap-5 p-5 sm:flex-row">
                    {c.image_url ? (
                      <img src={c.image_url} alt={c.title} className="h-32 w-32 shrink-0 rounded-xl object-cover ring-1 ring-ink-line" />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {c.description && <RichContent text={c.description} accent={accent} />}
                      <div className="mt-4">
                        <Link
                          to={`/topics/${topic.id}/learn?concept=${c.id}`}
                          className="btn btn-primary btn-sm"
                        >
                          Master this concept in 10 steps
                        </Link>
                        <div className="mt-2 text-[11px] font-semibold text-emerald-700">
                          Reward indicator: +40 XP on concept completion
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Diagrams */}
      {(() => {
        const diagrams = extras.filter((x) => x.extra_type === 'diagram');
        if (diagrams.length === 0) return null;
        return (
          <div className="mt-12">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-extrabold text-ink">Visual breakdown</h2>
              <AudioListener
                text={diagrams
                  .map((x) => {
                    const c = typeof x.content_json === 'string' ? safeParse(x.content_json) : (x.content_json as any);
                    return c?.title || c?.diagram?.title || 'Diagram';
                  })
                  .join('. ')}
                label={`Listen (${diagrams.length})`}
              />
            </div>
            <div className="space-y-6">
              {diagrams.map((x) => {
                const c = typeof x.content_json === 'string' ? safeParse(x.content_json) : (x.content_json as any);
                const parsedBody = parseJsonLike<any>(c?.body);
                const diag = parseJsonLike<any>(c?.diagram) ?? parsedBody ?? c?.diagram ?? c;
                return (
                  <div key={x.id} className="card overflow-hidden">
                    <div className="border-b border-ink-line bg-gradient-to-br from-brand-50/40 to-white px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Workflow size={14} className="text-brand-600" />
                        <span className="font-display text-[14px] font-bold text-ink">{c?.title || diag?.title || 'Diagram'}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <DiagramRenderer d={diag} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Memory boosters — grouped by type into separate sections */}
      {(() => {
        const groups: Record<string, typeof extras> = {};
        for (const x of extras) {
          if (x.extra_type === 'diagram' || x.extra_type === 'chapter') continue;
          (groups[x.extra_type] ||= []).push(x);
        }
        const order: ExtraType[] = ['mnemonic', 'examtip', 'formula', 'regulation'];
        const sections = order.filter((t) => groups[t]?.length);
        if (sections.length === 0) return null;

        return sections.map((type) => {
          const meta = EXTRA_META[type];
          const Icon = meta.icon;
          const items = groups[type];
          const sectionTitleMap: Partial<Record<ExtraType, string>> = {
            mnemonic:   'Mnemonic anchors',
            examtip:    'Exam tips & action items',
            formula:    'Formulas',
            regulation: 'Regulations & standards',
          };
          const sectionTitle = sectionTitleMap[type] ?? 'Study resources';

          return (
            <div key={type} className="mt-12">
              <div className="mb-5 flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${meta.color} text-white shadow-sm`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-2xl font-extrabold text-ink">{sectionTitle}</h2>
                  <div className="text-[12px] text-ink-dim">{items.length} item{items.length === 1 ? '' : 's'}</div>
                </div>
                {/* Audio for the entire section — concatenates all items */}
                <AudioListener
                  text={items
                    .map((x) => {
                      const c = (typeof x.content_json === 'string' ? safeParse(x.content_json) : (x.content_json as any));
                      return [c?.title, c?.body].filter(Boolean).join('. ');
                    })
                    .join('. ')}
                  label={`Listen (${items.length})`}
                />
              </div>

              {/* Mnemonics get their own special grid (with letter tiles) */}
              {type === 'mnemonic' && (
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((x) => {
                    const c = (typeof x.content_json === 'string' ? safeParse(x.content_json) : x.content_json) as any;
                    return (
                      <div key={x.id} className="card p-5">
                        {c?.title && <MnemonicTiles text={c.title} />}
                        {c?.title && <div className="font-display text-[15px] font-bold text-ink">{c.title}</div>}
                        {c?.body && <p className="mt-2 text-[13px] leading-relaxed text-ink-body">{c.body}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Exam tips get a numbered action-card grid */}
              {type === 'examtip' && (
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((x, i) => {
                    const c = (typeof x.content_json === 'string' ? safeParse(x.content_json) : x.content_json) as any;
                    return (
                      <div key={x.id} className="card flex items-start gap-3 p-5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 font-display text-[12px] font-bold text-white shadow-sm">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Exam tip</div>
                          {c?.body && <p className="mt-1 text-[13px] leading-relaxed text-ink-body">{c.body}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Formulas */}
              {type === 'formula' && (
                <div className="grid gap-3 md:grid-cols-2">
                  {items.map((x) => {
                    const c = (typeof x.content_json === 'string' ? safeParse(x.content_json) : x.content_json) as any;
                    const bodyText = typeof c?.body === 'string' ? decodeUnicodeEscapes(c.body) : '';
                    const bodyJson = parseJsonLike<any>(bodyText);
                    const fallback = extractFormulaFallback(bodyText);
                    const expression = bodyJson?.expression || bodyJson?.formula || bodyJson?.name || fallback.expression || null;
                    const variables: any[] = Array.isArray(bodyJson?.variables) ? bodyJson.variables : fallback.vars;
                    const desc = bodyJson?.desc || bodyJson?.description || null;
                    return (
                      <div key={x.id} className="card p-5">
                        {c?.title && <div className="font-display text-[14px] font-bold text-ink">{c.title}</div>}
                        {expression && (
                          <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Expression</div>
                            <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-[12.5px] text-ink">{String(expression)}</pre>
                          </div>
                        )}
                        {variables.length > 0 && (
                          <div className="mt-2 grid gap-2">
                            {variables.map((v, i) => (
                              <div key={i} className="rounded-lg border border-ink-line bg-white px-3 py-2 text-[12px]">
                                <span className="font-mono font-bold text-brand-700">{v.symbol ?? v.name ?? `Var ${i + 1}`}</span>
                                {v.desc || v.description ? <span className="ml-1 text-ink-body">- {v.desc ?? v.description}</span> : null}
                              </div>
                            ))}
                          </div>
                        )}
                        {desc && (
                          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-[12px] text-ink-body">
                            <span className="font-semibold text-emerald-800">Interpretation: </span>{String(desc)}
                          </div>
                        )}
                        {c?.body && !bodyJson && (
                          <pre className="mt-2 overflow-x-auto rounded-lg border border-ink-line bg-surface p-3 font-mono text-[12.5px] leading-relaxed text-ink-body whitespace-pre-wrap">
                            {bodyText}
                          </pre>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Regulations */}
              {type === 'regulation' && (
                <div className="grid gap-2 md:grid-cols-2">
                  {items.map((x) => {
                    const c = (typeof x.content_json === 'string' ? safeParse(x.content_json) : x.content_json) as any;
                    return (
                      <div key={x.id} className="card flex items-center gap-3 p-4">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-500/20">
                          <Scale size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          {c?.body && <div className="font-mono text-[13px] font-semibold text-ink line-clamp-2">{c.body}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        });
      })()}

      {/* Floating notes panel — auto-saves the user's private notes for this topic */}
      <NotesPanel refType="topic" refId={topic.topic_key} label={topic.name} />
    </div>
  );
}

function ActionTile({
  to,
  icon: Icon,
  title,
  desc,
  color,
}: {
  to: string;
  icon: any;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-ink-line bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:border-slate-200 hover:shadow-cardHover"
    >
      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${color} text-white shadow-sm`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[15px] font-bold text-ink">{title}</div>
        <div className="text-[12.5px] text-ink-dim">{desc}</div>
      </div>
      <ArrowRight size={16} className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
    </Link>
  );
}
