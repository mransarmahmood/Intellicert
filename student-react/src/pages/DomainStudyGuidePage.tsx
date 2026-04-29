import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpenCheck, Loader2, Printer, Sparkles, Workflow, Calculator, Scale, Lightbulb, Brain } from 'lucide-react';
import { api } from '../lib/api';
import { safeHtml } from '../lib/sanitize';
import TopicVisualMap from '../components/TopicVisualMap';
import TopicFlow from '../components/TopicFlow';
import DiagramRenderer from '../components/DiagramRenderer';
import { useAuth } from '../lib/auth';

type Domain = { id: string; number: number; name: string; description: string | null; weight: number; color_hex: string };
type Topic = { id: number; name: string; subtitle: string | null; overview: string | null; sort_order: number; domain_id: string; concepts?: Concept[]; extras?: Extra[] };
type Concept = { id: number; title: string; description: string | null };
type ExtraType = 'mnemonic' | 'examtip' | 'formula' | 'regulation' | 'chapter' | 'diagram';
type Extra = { id: number; extra_type: ExtraType; content_json: any };

function printGuide() {
  window.print();
}

function safeParse(s: string): { title?: string; body?: string } {
  try { return JSON.parse(s); } catch { return { body: s }; }
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
    return null;
  }
}

export default function DomainStudyGuidePage() {
  const user = useAuth((s) => s.user);
  const { id } = useParams();
  const domainsQ = useQuery({ queryKey: ['domains'], queryFn: () => api<{ domains: Domain[] }>('/domains') });
  const topicsQ = useQuery({
    queryKey: ['guide-topics', id],
    queryFn: () => api<{ topics: Topic[] }>('/topics', { params: { domain_id: id } }),
    enabled: !!id,
  });

  const domain = useMemo(() => (domainsQ.data?.domains ?? []).find((d) => d.id === id), [domainsQ.data, id]);
  const topics = topicsQ.data?.topics ?? [];
  const topicDetailsQ = useQueries({
    queries: topics.map((t) => ({
      queryKey: ['guide-topic-detail', t.id],
      queryFn: () => api<{ topic: Topic }>(`/topics/${t.id}`),
      enabled: topics.length > 0,
    })),
  });
  const detailsLoading = topicDetailsQ.some((q) => q.isLoading);
  const topicsDetailed = useMemo(() => topicDetailsQ.map((q, i) => q.data?.topic ?? topics[i]).filter(Boolean) as Topic[], [topicDetailsQ, topics]);
  const generatedOn = useMemo(
    () => new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }),
    []
  );
  const totals = useMemo(() => {
    let concepts = 0;
    let mnemonics = 0;
    let examTips = 0;
    let formulas = 0;
    let regulations = 0;
    let visuals = 0;
    for (const t of topicsDetailed) {
      concepts += (t.concepts ?? []).length;
      const extras = t.extras ?? [];
      mnemonics += extras.filter((x) => x.extra_type === 'mnemonic').length;
      examTips += extras.filter((x) => x.extra_type === 'examtip').length;
      formulas += extras.filter((x) => x.extra_type === 'formula').length;
      regulations += extras.filter((x) => x.extra_type === 'regulation').length;
      visuals += extras.filter((x) => x.extra_type === 'diagram').length;
    }
    return { concepts, mnemonics, examTips, formulas, regulations, visuals };
  }, [topicsDetailed]);
  const [candidateName, setCandidateName] = useState('');
  useEffect(() => {
    const seed = (user?.name || user?.email || '').trim();
    if (seed) setCandidateName(seed);
  }, [user?.name, user?.email]);

  if (domainsQ.isLoading || topicsQ.isLoading || detailsLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }

  if (!domain) {
    return (
      <div className="wrap py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">Domain not found.</div>
      </div>
    );
  }

  return (
    <div className="wrap study-guide-doc py-10 print:px-0">
      <div className="no-print mb-4 flex items-center justify-between gap-3">
        <Link to={`/domains/${domain.id}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-dim hover:text-ink">
          <ArrowLeft size={14} /> Back to domain
        </Link>
        <button onClick={printGuide} className="btn btn-primary btn-sm">
          <Printer size={14} /> Print PDF
        </button>
      </div>

      <div className="print-only print-footer" aria-hidden />
      <div className="card overflow-hidden print:shadow-none print:border-slate-300">
        <section className="print-cover rounded-none border-b border-ink-line p-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img src="/icons/icon-512.png" alt="IntelliCert" className="h-10 w-10 rounded-xl ring-1 ring-ink-line" />
              <div>
                <div className="font-display text-[15px] font-bold text-ink">IntelliCert / VisualLearn</div>
                <div className="text-[11.5px] text-ink-dim">Certification Learning System</div>
              </div>
            </div>
            <div className="text-right text-[11.5px] text-ink-dim">
              <div>Generated: {generatedOn}</div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 ring-1 ring-brand-500/20">
            <BookOpenCheck size={12} /> Complete Domain Study Guide
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold text-ink">
            Unit {domain.number}: {domain.name}
          </h1>
          <p className="mt-2 max-w-3xl text-[15px] text-ink-body">
            Print-ready certification study guide with conceptual maps, learning roadmap, diagrams, formulas, regulations,
            exam tips, mnemonics, and mastery actions.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-ink-line bg-white px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Generated</div>
              <div className="font-semibold text-ink">{generatedOn}</div>
            </div>
            <div className="rounded-lg border border-ink-line bg-white px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Exam Weight</div>
              <div className="font-semibold text-ink">{domain.weight}%</div>
            </div>
            <div className="rounded-lg border border-ink-line bg-white px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Topics</div>
              <div className="font-semibold text-ink">{topicsDetailed.length}</div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-ink-line bg-white px-3 py-2.5 print-candidate">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Candidate</div>
            <div className="no-print mt-1">
              <input
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter candidate name"
                className="input h-9 py-1.5 text-[13px]"
              />
            </div>
            <div className="print-only mt-1 text-[13px] font-semibold text-ink">
              {candidateName || 'Candidate Name'}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2 text-[12px] text-ink-body">
              <strong>{totals.concepts}</strong> concepts • <strong>{totals.visuals}</strong> visuals
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-[12px] text-ink-body">
              <strong>{totals.examTips}</strong> exam tips • <strong>{totals.mnemonics}</strong> mnemonics
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-[12px] text-ink-body">
              <strong>{totals.formulas}</strong> formulas • <strong>{totals.regulations}</strong> regulations
            </div>
          </div>
        </section>

        <div className="border-b border-ink-line p-7 print:pb-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 ring-1 ring-brand-500/20">
            <BookOpenCheck size={12} /> Study Guide
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">
            Unit {domain.number}: {domain.name}
          </h1>
          <p className="mt-2 text-[14px] text-ink-body">
            Exam weight: <strong>{domain.weight}%</strong>
          </p>
          {domain.description && <p className="mt-2 text-[14px] text-ink-body">{domain.description}</p>}
        </div>

        <div className="p-6 guide-body">
          {topicsDetailed.length > 0 && (
            <section className="rounded-xl border border-ink-line bg-surface/40 p-4 print-guide-toc">
              <h2 className="font-display text-[17px] font-bold text-ink">Table of Contents</h2>
              <p className="mt-1 text-[12.5px] text-ink-dim">
                {topicsDetailed.length} topics included in this domain study guide.
              </p>
              <ol className="mt-3 grid gap-1.5 text-[13px] sm:grid-cols-2">
                {topicsDetailed.map((t, i) => (
                  <li key={t.id} className="rounded-md bg-white px-2.5 py-1.5">
                    <a href={`#guide-topic-${t.id}`} className="font-medium text-ink hover:text-brand-700 hover:underline">
                      {i + 1}. {t.name}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {topicsDetailed.length === 0 ? (
            <div className="text-[13px] text-ink-dim">No topics available for this domain yet.</div>
          ) : (
            <div className="mt-5 space-y-5">
              {topicsDetailed.map((t, i) => {
                const concepts = t.concepts ?? [];
                const extras = t.extras ?? [];
                const mnemonics = extras.filter((x) => x.extra_type === 'mnemonic');
                const examTips = extras.filter((x) => x.extra_type === 'examtip');
                const formulas = extras.filter((x) => x.extra_type === 'formula');
                const regulations = extras.filter((x) => x.extra_type === 'regulation');
                const diagrams = extras.filter((x) => x.extra_type === 'diagram');
                return (
                <section
                  id={`guide-topic-${t.id}`}
                  key={t.id}
                  className="rounded-xl border border-ink-line p-4 print:break-inside-avoid print-guide-topic guide-topic"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-ink-line pb-3">
                    <h2 className="font-display text-[19px] font-bold text-ink">
                      {i + 1}. {t.name}
                    </h2>
                    <Link to={`/topics/${t.id}`} className="no-print text-[12px] font-semibold text-brand-700 hover:underline">
                      Open topic
                    </Link>
                  </div>
                  {t.subtitle && <p className="mt-2 text-[13px] text-ink-dim">{t.subtitle}</p>}
                  {t.overview && (
                    <div className="topic-prose mt-3 rounded-lg border border-slate-200 bg-white p-3.5 text-[13.5px] text-ink-body" dangerouslySetInnerHTML={safeHtml(t.overview)} />
                  )}

                  {/* Core visual + map features requested */}
                  {concepts.length > 0 && (
                    <div className="guide-visuals mt-4 space-y-3">
                      <h3 className="font-display text-[14px] font-bold text-ink">Concept visuals</h3>
                      <TopicVisualMap topicName={t.name} subtitle={t.subtitle} concepts={concepts} />
                      <TopicFlow concepts={concepts} topicId={t.id} />
                    </div>
                  )}

                  {/* 3-layer, 10-step, practice links */}
                  <div className="mt-4 grid gap-2 sm:grid-cols-3 no-print">
                    <Link to={`/topics/${t.id}`} className="rounded-lg border border-ink-line bg-white px-3 py-2 text-[12.5px] font-semibold text-ink hover:bg-surface">
                      <Workflow size={13} className="mr-1 inline" /> 3-Layer Detail Understanding
                    </Link>
                    <Link to={`/topics/${t.id}/learn`} className="rounded-lg border border-ink-line bg-white px-3 py-2 text-[12.5px] font-semibold text-ink hover:bg-surface">
                      <Sparkles size={13} className="mr-1 inline" /> 10-Step Mastery
                    </Link>
                    <Link to={`/study/quizzes/${domain.id}`} className="rounded-lg border border-ink-line bg-white px-3 py-2 text-[12.5px] font-semibold text-ink hover:bg-surface">
                      <Lightbulb size={13} className="mr-1 inline" /> Practice Quiz
                    </Link>
                  </div>

                  {/* Additional visuals */}
                  {diagrams.length > 0 && (
                    <div className="mt-4 space-y-3 guide-diagrams">
                      <h3 className="font-display text-[14px] font-bold text-ink">Visual diagrams</h3>
                      {diagrams.map((x) => {
                        const c = typeof x.content_json === 'string' ? safeParse(x.content_json) : (x.content_json as any);
                        const diag = parseJsonLike<any>(c?.diagram) ?? parseJsonLike<any>(c?.body) ?? c?.diagram ?? c;
                        return (
                          <div key={x.id} className="rounded-lg border border-ink-line bg-white p-3 guide-diagram-item">
                            <div className="mb-2 text-[12px] font-semibold text-ink">{c?.title || diag?.title || 'Diagram'}</div>
                            <DiagramRenderer d={diag} />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Mnemonics + exam tips */}
                  {(mnemonics.length > 0 || examTips.length > 0) && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 guide-grid">
                      {mnemonics.length > 0 && (
                        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-3">
                          <div className="mb-2 text-[12px] font-bold text-purple-800"><Brain size={12} className="mr-1 inline" /> Mnemonics</div>
                          <ul className="space-y-1.5 text-[12.5px] text-ink-body">
                            {mnemonics.slice(0, 8).map((m) => {
                              const c = typeof m.content_json === 'string' ? safeParse(m.content_json) : (m.content_json as any);
                              return <li key={m.id}><strong>{c?.title || 'Mnemonic'}:</strong> {c?.body || '-'}</li>;
                            })}
                          </ul>
                        </div>
                      )}
                      {examTips.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                          <div className="mb-2 text-[12px] font-bold text-amber-800"><Lightbulb size={12} className="mr-1 inline" /> Exam Tips</div>
                          <ul className="space-y-1.5 text-[12.5px] text-ink-body">
                            {examTips.slice(0, 8).map((m) => {
                              const c = typeof m.content_json === 'string' ? safeParse(m.content_json) : (m.content_json as any);
                              return <li key={m.id}>{c?.body || c?.title || '-'}</li>;
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulas + standards/regulations */}
                  {(formulas.length > 0 || regulations.length > 0) && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 guide-grid">
                      {formulas.length > 0 && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                          <div className="mb-2 text-[12px] font-bold text-blue-800"><Calculator size={12} className="mr-1 inline" /> Formulas</div>
                          <ul className="space-y-1.5 text-[12.5px] text-ink-body">
                            {formulas.slice(0, 10).map((f) => {
                              const c = typeof f.content_json === 'string' ? safeParse(f.content_json) : (f.content_json as any);
                              const parsed = parseJsonLike<any>(c?.body);
                              return (
                                <li key={f.id}>
                                  <strong>{c?.title || parsed?.name || 'Formula'}:</strong>{' '}
                                  <code>{parsed?.expression || c?.body || '-'}</code>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                      {regulations.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                          <div className="mb-2 text-[12px] font-bold text-red-800"><Scale size={12} className="mr-1 inline" /> Regulations / Standards</div>
                          <ul className="space-y-1.5 text-[12.5px] text-ink-body">
                            {regulations.slice(0, 10).map((r) => {
                              const c = typeof r.content_json === 'string' ? safeParse(r.content_json) : (r.content_json as any);
                              return <li key={r.id}>{c?.body || c?.title || '-'}</li>;
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

