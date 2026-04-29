import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  GripVertical,
  Image as ImageIcon,
  Brain,
  Lightbulb,
  Calculator,
  Scale,
  BookMarked,
  Workflow,
  Zap,
  HelpCircle,
  BookOpen,
  RotateCw,
  FlaskConical,
  GraduationCap,
  Flag,
  Check,
} from 'lucide-react';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import ImagePicker from '../components/ImagePicker';

type Domain = { id: string; number: number; name: string };
type Concept = {
  id: number;
  topic_id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};
type StepType = 'hook' | 'try' | 'core' | 'visual' | 'example' | 'memory' | 'recall' | 'apply' | 'teach' | 'summary';
type StepContent = {
  title?: string;
  body?: string;
  image_url?: string;
  question?: string;
  answer?: string;
  options?: string[];
  correct_index?: number;
};
type LearningStepRow = {
  id: number | null;
  topic_id: number;
  step_type: StepType;
  order: number;
  content_json: StepContent | null;
  authored: boolean;
};
type LearningStepsResp = {
  topic: { id: number; name: string };
  steps: LearningStepRow[];
  authored_count: number;
  total: number;
};

const STEP_META: Record<StepType, { label: string; icon: any; color: string }> = {
  hook:    { label: 'Hook',     icon: Zap,           color: 'from-amber-400 to-orange-500' },
  try:     { label: 'Try first', icon: HelpCircle,    color: 'from-blue-400 to-blue-600' },
  core:    { label: 'Core',     icon: BookOpen,      color: 'from-brand-500 to-brand-700' },
  visual:  { label: 'Visual',   icon: Workflow,      color: 'from-purple-400 to-purple-600' },
  example: { label: 'Example',  icon: Lightbulb,     color: 'from-yellow-400 to-amber-600' },
  memory:  { label: 'Memory',   icon: Brain,         color: 'from-pink-400 to-fuchsia-600' },
  recall:  { label: 'Recall',   icon: RotateCw,      color: 'from-emerald-400 to-green-600' },
  apply:   { label: 'Apply',    icon: FlaskConical,  color: 'from-cyan-400 to-blue-600' },
  teach:   { label: 'Teach',    icon: GraduationCap, color: 'from-violet-400 to-purple-700' },
  summary: { label: 'Summary',  icon: Flag,          color: 'from-green-400 to-emerald-600' },
};

type ExtraType = 'mnemonic' | 'examtip' | 'formula' | 'regulation' | 'chapter' | 'diagram';
type TopicExtra = {
  id: number;
  topic_id: number;
  extra_type: ExtraType;
  content_json: { title?: string; body?: string } | string;
  sort_order: number;
};
type Topic = {
  id: number;
  topic_key: string;
  domain_id: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  overview: string | null;
  image_url: string | null;
  sort_order: number;
  domain?: Domain;
  concepts?: Concept[];
  extras?: TopicExtra[];
};

const EXTRA_META: Record<ExtraType, { label: string; icon: any; color: string }> = {
  mnemonic:   { label: 'Mnemonic',   icon: Brain,      color: 'from-purple-400 to-purple-600' },
  examtip:    { label: 'Exam Tip',   icon: Lightbulb,  color: 'from-amber-400 to-amber-600' },
  formula:    { label: 'Formula',    icon: Calculator, color: 'from-blue-400 to-blue-600' },
  regulation: { label: 'Regulation', icon: Scale,      color: 'from-red-400 to-red-600' },
  chapter:    { label: 'Chapter',    icon: BookMarked, color: 'from-emerald-400 to-emerald-600' },
  diagram:    { label: 'Diagram',    icon: Workflow,   color: 'from-indigo-400 to-indigo-600' },
};

export default function TopicDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const topicId = Number(id);

  const topicQ = useQuery({
    queryKey: ['topic', topicId],
    queryFn: () => api<{ topic: Topic }>(`/topics/${topicId}`),
  });

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Concept | null>(null);
  const [deleting, setDeleting] = useState<Concept | null>(null);

  const [creatingExtra, setCreatingExtra] = useState(false);
  const [editingExtra, setEditingExtra] = useState<TopicExtra | null>(null);
  const [deletingExtra, setDeletingExtra] = useState<TopicExtra | null>(null);

  const [editingStep, setEditingStep] = useState<LearningStepRow | null>(null);
  const stepsQ = useQuery({
    queryKey: ['learning-steps', topicId],
    queryFn: () => api<LearningStepsResp>(`/topics/${topicId}/learning-steps`),
    enabled: !!topicId,
  });
  const refreshSteps = () => qc.invalidateQueries({ queryKey: ['learning-steps', topicId] });

  const refresh = () => qc.invalidateQueries({ queryKey: ['topic', topicId] });

  if (topicQ.isLoading) {
    return <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }
  if (topicQ.error || !topicQ.data?.topic) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">
        {(topicQ.error as Error)?.message ?? 'Topic not found'}
      </div>
    );
  }

  const topic = topicQ.data.topic;
  const concepts = topic.concepts ?? [];
  const extras = topic.extras ?? [];

  return (
    <div>
      <Link to="/topics" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-dim hover:text-ink">
        <ArrowLeft size={14} /> Back to topics
      </Link>

      {/* Topic header card */}
      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-br from-brand-50 via-white to-white p-7">
          {topic.image_url && (
            <img src={topic.image_url} alt={topic.name} className="absolute right-6 top-6 h-24 w-24 rounded-xl object-cover ring-1 ring-ink-line" />
          )}
          <div className="flex items-center gap-2">
            {topic.domain && <span className="badge badge-brand">{topic.domain.number}. {topic.domain.name}</span>}
            <code className="rounded bg-white px-1.5 py-0.5 text-[11px] text-ink-dim ring-1 ring-ink-line">{topic.topic_key}</code>
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">{topic.name}</h1>
          {topic.subtitle && <p className="mt-1.5 max-w-2xl text-[14px] text-ink-body">{topic.subtitle}</p>}
        </div>
        {topic.overview && (
          <div className="border-t border-ink-line bg-white p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">Overview</h3>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-ink-body">{topic.overview}</p>
          </div>
        )}
      </div>

      {/* Concepts section */}
      <div className="mt-8 mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-ink">Concepts</h2>
          <p className="mt-0.5 text-[13px] text-ink-dim">{concepts.length} total · ordered by sort_order</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn btn-primary btn-md">
          <Plus size={16} /> Add concept
        </button>
      </div>

      {concepts.length === 0 ? (
        <div className="card grid place-items-center py-16">
          <div className="text-center">
            <div className="text-[14px] font-semibold text-ink">No concepts yet</div>
            <p className="mt-1 text-[13px] text-ink-dim">Add your first concept to start building this topic.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {concepts.map((c) => (
            <div key={c.id} className="card group flex items-start gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-cardHover">
              <div className="flex flex-col items-center gap-2 pt-1">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 font-display text-[12px] font-bold text-brand-700 ring-1 ring-brand-500/15">
                  {c.sort_order}
                </div>
                <GripVertical size={14} className="text-ink-muted opacity-50" />
              </div>
              {c.image_url ? (
                <img src={c.image_url} alt={c.title} className="h-20 w-20 shrink-0 rounded-lg object-cover ring-1 ring-ink-line" />
              ) : (
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-surface text-ink-muted ring-1 ring-ink-line">
                  <ImageIcon size={20} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-display text-[16px] font-bold text-ink">{c.title}</div>
                {c.description && (
                  <p className="mt-1 text-[13px] text-ink-body line-clamp-3 whitespace-pre-line">{c.description}</p>
                )}
              </div>
              <div className="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => setEditing(c)} className="btn btn-ghost btn-sm">
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => setDeleting(c)}
                  className="btn btn-ghost btn-sm hover:!border-red-300 hover:!bg-red-50 hover:!text-red-700"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── 10-step learning flow section ─── */}
      <div className="mt-12 mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-extrabold text-ink">10-step learning flow</h2>
            <p className="mt-0.5 text-[13px] text-ink-dim">
              {stepsQ.data ? `${stepsQ.data.authored_count} of ${stepsQ.data.total} steps authored` : 'Loading...'}
            </p>
          </div>
          {stepsQ.data && stepsQ.data.authored_count > 0 && (
            <div className="hidden text-[11px] text-ink-dim sm:block">
              Click any step to author or edit
            </div>
          )}
        </div>
      </div>

      {stepsQ.isLoading ? (
        <div className="grid place-items-center py-10 text-ink-dim"><Loader2 className="animate-spin" /></div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {stepsQ.data?.steps.map((s) => {
            const meta = STEP_META[s.step_type];
            const Icon = meta.icon;
            return (
              <button
                key={s.step_type}
                onClick={() => setEditingStep(s)}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-cardHover ${
                  s.authored ? 'border-brand-500/30' : 'border-ink-line border-dashed'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${meta.color} text-white`}>
                    <Icon size={16} />
                  </div>
                  {s.authored ? (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-green-100 text-green-700">
                      <Check size={11} />
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">empty</span>
                  )}
                </div>
                <div className="mt-3 font-display text-[10px] font-bold uppercase tracking-wider text-ink-dim">
                  Step {s.order}
                </div>
                <div className="font-display text-[14px] font-bold text-ink">{meta.label}</div>
                {s.content_json?.title && (
                  <div className="mt-1 truncate text-[11px] text-ink-body">{s.content_json.title}</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {editingStep && (
        <LearningStepEditor
          step={editingStep}
          topicId={topicId}
          onClose={() => setEditingStep(null)}
          onSuccess={() => { setEditingStep(null); refreshSteps(); }}
        />
      )}

      {/* ─── Topic extras section ─── */}
      <div className="mt-12 mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold text-ink">Extras</h2>
          <p className="mt-0.5 text-[13px] text-ink-dim">{extras.length} total · mnemonics, exam tips, formulas, regulations…</p>
        </div>
        <button onClick={() => setCreatingExtra(true)} className="btn btn-primary btn-md">
          <Plus size={16} /> Add extra
        </button>
      </div>

      {extras.length === 0 ? (
        <div className="card grid place-items-center py-14">
          <div className="text-center">
            <div className="text-[14px] font-semibold text-ink">No extras yet</div>
            <p className="mt-1 text-[13px] text-ink-dim">Add mnemonics, exam tips, formulas, or regulations to enrich this topic.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {extras.map((x) => {
            const meta = EXTRA_META[x.extra_type];
            const content = typeof x.content_json === 'string' ? safeParse(x.content_json) : x.content_json;
            const Icon = meta.icon;
            return (
              <div key={x.id} className="card group p-5 transition-all hover:-translate-y-0.5 hover:shadow-cardHover">
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.color} text-white shadow-sm`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge badge-slate">{meta.label}</span>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => setEditingExtra(x)} className="btn btn-ghost btn-sm"><Pencil size={12} /></button>
                        <button onClick={() => setDeletingExtra(x)} className="btn btn-ghost btn-sm hover:!border-red-300 hover:!bg-red-50 hover:!text-red-700"><Trash2 size={12} /></button>
                      </div>
                    </div>
                    {content?.title && <div className="mt-2 font-display text-[15px] font-bold text-ink">{content.title}</div>}
                    {content?.body && <p className="mt-1 whitespace-pre-line text-[13px] text-ink-body line-clamp-4">{content.body}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(creatingExtra || editingExtra) && (
        <ExtraForm
          mode={creatingExtra ? 'create' : 'edit'}
          extra={editingExtra ?? undefined}
          topicId={topicId}
          nextSort={extras.length}
          onClose={() => { setCreatingExtra(false); setEditingExtra(null); }}
          onSuccess={() => { setCreatingExtra(false); setEditingExtra(null); refresh(); }}
        />
      )}
      {deletingExtra && (
        <DeleteExtraModal
          extra={deletingExtra}
          onClose={() => setDeletingExtra(null)}
          onSuccess={() => { setDeletingExtra(null); refresh(); }}
        />
      )}

      {(creating || editing) && (
        <ConceptForm
          mode={creating ? 'create' : 'edit'}
          concept={editing ?? undefined}
          topicId={topicId}
          nextSort={concepts.length}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSuccess={() => { setCreating(false); setEditing(null); refresh(); }}
        />
      )}
      {deleting && (
        <DeleteConceptModal
          concept={deleting}
          onClose={() => setDeleting(null)}
          onSuccess={() => { setDeleting(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────

function ConceptForm({
  mode, concept, topicId, nextSort, onClose, onSuccess,
}: {
  mode: 'create' | 'edit';
  concept?: Concept;
  topicId: number;
  nextSort: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    topic_id: topicId,
    title: concept?.title ?? '',
    description: concept?.description ?? '',
    image_url: concept?.image_url ?? '',
    sort_order: concept?.sort_order ?? nextSort,
  });
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () =>
      mode === 'create'
        ? api('/concepts', { method: 'POST', body: JSON.stringify(form) })
        : api(`/concepts/${concept!.id}`, { method: 'PATCH', body: JSON.stringify(form) }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Modal title={mode === 'create' ? 'New concept' : `Edit: ${concept?.title}`} onClose={onClose} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); m.mutate(); }} className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input min-h-[140px] resize-y"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Image</label>
            <ImagePicker
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
            />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input
              type="number"
              className="input"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>
        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            {mode === 'create' ? 'Create concept' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function LearningStepEditor({
  step, topicId, onClose, onSuccess,
}: {
  step: LearningStepRow;
  topicId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const meta = STEP_META[step.step_type];
  const initial = step.content_json ?? {};
  const [title, setTitle] = useState(initial.title ?? '');
  const [body, setBody] = useState(initial.body ?? '');
  const [imageUrl, setImageUrl] = useState(initial.image_url ?? '');
  const [question, setQuestion] = useState(initial.question ?? '');
  const [answer, setAnswer] = useState(initial.answer ?? '');
  const [options, setOptions] = useState<string[]>(initial.options ?? ['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number>(initial.correct_index ?? 0);
  const [err, setErr] = useState('');

  const needsQA = step.step_type === 'try';
  const needsMcq = step.step_type === 'recall' || step.step_type === 'apply';

  const m = useMutation({
    mutationFn: () => {
      const content_json: StepContent = { title, body };
      if (imageUrl) content_json.image_url = imageUrl;
      if (needsQA)  { content_json.question = question; content_json.answer = answer; }
      if (needsMcq) {
        content_json.question = question;
        content_json.options = options;
        content_json.correct_index = correctIndex;
      }
      return api(`/topics/${topicId}/learning-steps/${step.step_type}`, {
        method: 'PUT',
        body: JSON.stringify({ content_json }),
      });
    },
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  const del = useMutation({
    mutationFn: () => api(`/topics/${topicId}/learning-steps/${step.step_type}`, { method: 'DELETE' }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  const Icon = meta.icon;

  return (
    <Modal title={`Step ${step.order}: ${meta.label}`} onClose={onClose} size="xl">
      <div className={`mb-5 -mt-2 flex items-center gap-3 rounded-xl bg-gradient-to-br ${meta.color} px-4 py-3 text-white`}>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/20 ring-1 ring-white/30">
          <Icon size={18} />
        </div>
        <div className="text-[12.5px] opacity-90">
          {step.step_type === 'hook' && 'Curiosity trigger that primes the brain to pay attention.'}
          {step.step_type === 'try' && 'A question students attempt before they learn the answer.'}
          {step.step_type === 'core' && 'The main micro-lesson — chunked content.'}
          {step.step_type === 'visual' && 'A diagram or image that encodes the concept dual-channel.'}
          {step.step_type === 'example' && 'A real-world scenario that builds a mental model.'}
          {step.step_type === 'memory' && 'A mnemonic or memory anchor.'}
          {step.step_type === 'recall' && 'A quick MCQ to retrieve what was just learned.'}
          {step.step_type === 'apply' && 'A scenario MCQ that simulates an exam question.'}
          {step.step_type === 'teach' && 'A prompt for the student to teach the concept (Feynman).'}
          {step.step_type === 'summary' && 'A 3-bullet recap to lock it in.'}
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setErr(''); m.mutate(); }}
        className="space-y-4"
      >
        <div>
          <label className="label">Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Body</label>
          <textarea
            className="input min-h-[140px] resize-y"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Image URL (optional)</label>
          <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>

        {needsQA && (
          <div className="rounded-xl border border-ink-line bg-surface p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-dim">Try-it question</div>
            <div>
              <label className="label">Question</label>
              <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} />
            </div>
            <div className="mt-3">
              <label className="label">Answer (revealed after attempt)</label>
              <textarea className="input min-h-[80px] resize-y" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            </div>
          </div>
        )}

        {needsMcq && (
          <div className="rounded-xl border border-ink-line bg-surface p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-ink-dim">Multiple choice</div>
            <div>
              <label className="label">Question</label>
              <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D'] as const).map((letter, i) => (
                <div key={letter}>
                  <label className="label flex items-center gap-2">
                    <input
                      type="radio"
                      checked={correctIndex === i}
                      onChange={() => setCorrectIndex(i)}
                      className="cursor-pointer accent-brand-600"
                    />
                    Option {letter} {correctIndex === i && <span className="text-green-600">(correct)</span>}
                  </label>
                  <input
                    className="input"
                    value={options[i] ?? ''}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div>
            {step.authored && (
              <button
                type="button"
                onClick={() => { if (confirm('Delete this step?')) del.mutate(); }}
                className="btn btn-ghost btn-md text-red-700 hover:!bg-red-50 hover:!border-red-300"
                disabled={del.isPending}
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
            <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
              {m.isPending && <Loader2 size={14} className="animate-spin" />}
              {step.authored ? 'Save changes' : 'Create step'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function safeParse(s: string): { title?: string; body?: string } {
  try { return JSON.parse(s); } catch { return { body: s }; }
}

function ExtraForm({
  mode, extra, topicId, nextSort, onClose, onSuccess,
}: {
  mode: 'create' | 'edit';
  extra?: TopicExtra;
  topicId: number;
  nextSort: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const initialContent = extra
    ? typeof extra.content_json === 'string' ? safeParse(extra.content_json) : extra.content_json
    : { title: '', body: '' };
  const [type, setType] = useState<ExtraType>(extra?.extra_type ?? 'mnemonic');
  const [title, setTitle] = useState(initialContent.title ?? '');
  const [body, setBody] = useState(initialContent.body ?? '');
  const [sortOrder, setSortOrder] = useState(extra?.sort_order ?? nextSort);
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () => {
      const payload = {
        topic_id: topicId,
        extra_type: type,
        content_json: { title, body },
        sort_order: sortOrder,
      };
      return mode === 'create'
        ? api('/topic-extras', { method: 'POST', body: JSON.stringify(payload) })
        : api(`/topic-extras/${extra!.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    },
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Modal title={mode === 'create' ? 'New extra' : `Edit ${EXTRA_META[type].label.toLowerCase()}`} onClose={onClose} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); m.mutate(); }} className="space-y-4">
        <div>
          <label className="label">Type *</label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {(Object.keys(EXTRA_META) as ExtraType[]).map((t) => {
              const meta = EXTRA_META[t];
              const Icon = meta.icon;
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-[11px] font-semibold transition ${
                    active
                      ? 'border-brand-500/50 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-ink-line bg-white text-ink-body hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={16} /> {meta.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === 'mnemonic' ? 'PASS the fire extinguisher' :
              type === 'formula' ? 'TWA noise calculation' :
              type === 'regulation' ? 'OSHA 1910.147' : ''
            }
          />
        </div>
        <div>
          <label className="label">Body *</label>
          <textarea
            className="input min-h-[140px] resize-y font-mono text-[13px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Sort order</label>
          <input
            type="number"
            className="input max-w-[120px]"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </div>
        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            {mode === 'create' ? 'Create extra' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteExtraModal({
  extra, onClose, onSuccess,
}: {
  extra: TopicExtra;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: () => api(`/topic-extras/${extra.id}`, { method: 'DELETE' }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });
  const meta = EXTRA_META[extra.extra_type];
  return (
    <Modal title={`Delete ${meta.label.toLowerCase()}?`} onClose={onClose}>
      <p className="text-[14px] text-ink-body">This will permanently delete this extra. Continue?</p>
      {err && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
        <button onClick={() => m.mutate()} className="btn btn-danger btn-md" disabled={m.isPending}>
          {m.isPending && <Loader2 size={14} className="animate-spin" />} Delete
        </button>
      </div>
    </Modal>
  );
}

function DeleteConceptModal({
  concept, onClose, onSuccess,
}: {
  concept: Concept;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: () => api(`/concepts/${concept.id}`, { method: 'DELETE' }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });
  return (
    <Modal title="Delete concept?" onClose={onClose}>
      <p className="text-[14px] text-ink-body">
        Permanently delete <strong className="text-ink">{concept.title}</strong>?
      </p>
      {err && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
        <button onClick={() => m.mutate()} className="btn btn-danger btn-md" disabled={m.isPending}>
          {m.isPending && <Loader2 size={14} className="animate-spin" />} Delete
        </button>
      </div>
    </Modal>
  );
}
