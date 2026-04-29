import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Loader2, Trophy, RotateCw,
  Zap, HelpCircle, BookOpen, Workflow, Lightbulb,
  Brain, RotateCw as RecallIcon, FlaskConical, GraduationCap, Flag,
  CheckCircle2, ShieldCheck, Bot, ClipboardCheck,
} from 'lucide-react';
import { api, postLearningEvent } from '../lib/api';

type StepType = 'hook' | 'try' | 'core' | 'visual' | 'example' | 'memory' | 'recall' | 'apply' | 'teach' | 'summary';
type Step = {
  id: number | null;
  topic_id: number;
  step_type: StepType;
  order: number;
  content_json: {
    title?: string;
    body?: string;
    image_url?: string;
    question?: string;
    options?: string[];
    correct_index?: number;
    answer?: string;
  } | null;
  authored: boolean;
};
type Resp = {
  topic: { id: number; name: string };
  steps: Step[];
  authored_count: number;
  generated_count?: number;
  total: number;
};
type TopicDetailResp = {
  topic: {
    id: number;
    name: string;
    subtitle?: string | null;
    overview?: string | null;
    concepts?: Array<{ id: number; title: string; description?: string | null }>;
    mastery_threshold?: number;
  };
};
type RevisionItem = {
  topic_id: number;
  concept_id: number;
  concept_title: string;
  topic_name: string;
  mastery_score: number;
  repetitions: number;
  next_review_at?: string | null;
};
type RevisionQueueResp = {
  queue: RevisionItem[];
  total: number;
};
type GamificationResp = {
  gamification: {
    total_xp: number;
    level: number;
    level_progress: number;
    current_streak_days: number;
    best_streak_days: number;
    readiness_score: number;
  };
};

const META: Record<StepType, { label: string; icon: any; color: string; subtitle: string }> = {
  hook:    { label: 'Hook',     icon: Zap,            color: 'from-amber-400 to-orange-500',   subtitle: 'A curiosity trigger' },
  try:     { label: 'Try first', icon: HelpCircle,     color: 'from-blue-400 to-blue-600',      subtitle: 'Attempt before you learn' },
  core:    { label: 'Core',     icon: BookOpen,       color: 'from-brand-500 to-brand-700',    subtitle: 'The micro-lesson' },
  visual:  { label: 'Visual',   icon: Workflow,       color: 'from-purple-400 to-purple-600',  subtitle: 'A diagram that locks it in' },
  example: { label: 'Example',  icon: Lightbulb,      color: 'from-yellow-400 to-amber-600',   subtitle: 'A real-world scenario' },
  memory:  { label: 'Memory',   icon: Brain,          color: 'from-pink-400 to-fuchsia-600',   subtitle: 'A mnemonic anchor' },
  recall:  { label: 'Recall',   icon: RecallIcon,     color: 'from-emerald-400 to-green-600',  subtitle: 'Retrieval practice' },
  apply:   { label: 'Apply',    icon: FlaskConical,   color: 'from-cyan-400 to-blue-600',      subtitle: 'A scenario decision' },
  teach:   { label: 'Teach',    icon: GraduationCap,  color: 'from-violet-400 to-purple-700',  subtitle: 'Feynman teach-back' },
  summary: { label: 'Summary',  icon: Flag,           color: 'from-green-400 to-emerald-600',  subtitle: '3-bullet recap' },
};

const COACH: Record<StepType, { trainer: string; assessor: string; system: string }> = {
  hook: {
    trainer: 'Start with curiosity: name one real scenario where this concept matters.',
    assessor: 'Can the learner explain why this topic is important before studying details?',
    system: 'Priming attention and context before instruction.',
  },
  try: {
    trainer: 'Ask for a quick first attempt before showing the official answer.',
    assessor: 'Did the learner attempt a response (correct or incorrect)?',
    system: 'Activating prior knowledge to improve retention.',
  },
  core: {
    trainer: 'Teach the essential idea in short chunks and concrete language.',
    assessor: 'Can the learner restate the core rule in one clear sentence?',
    system: 'Delivering the minimum complete concept model.',
  },
  visual: {
    trainer: 'Use diagrams and structure to connect terms, causes, and outcomes.',
    assessor: 'Can the learner map the concept flow from memory?',
    system: 'Dual coding via visual and verbal channels.',
  },
  example: {
    trainer: 'Ground the concept in a realistic workplace/safety case.',
    assessor: 'Can the learner identify the rule inside the real scenario?',
    system: 'Bridging theory to applied understanding.',
  },
  memory: {
    trainer: 'Introduce a mnemonic or anchor the learner can recall quickly.',
    assessor: 'Can the learner retrieve the anchor without hints?',
    system: 'Creating fast recall cues for exam pressure.',
  },
  recall: {
    trainer: 'Run retrieval practice without notes, then correct immediately.',
    assessor: 'Did the learner choose an answer and understand why it is right/wrong?',
    system: 'Strengthening retrieval pathways through testing effect.',
  },
  apply: {
    trainer: 'Challenge with a decision-based scenario, not a definition question.',
    assessor: 'Can the learner apply the concept to an unfamiliar case?',
    system: 'Transferring knowledge into action and judgment.',
  },
  teach: {
    trainer: 'Have the learner teach the concept as if training a new teammate.',
    assessor: 'Are there gaps, vague terms, or missing links in your Detail Understanding?',
    system: 'Feynman teach-back for gap discovery and correction.',
  },
  summary: {
    trainer: 'Close with a 3-point recap and explicit next-review target.',
    assessor: 'Can the learner produce a concise, accurate final recap?',
    system: 'Consolidating memory and scheduling reinforcement.',
  },
};

type TopicCtx = {
  topicName: string;
  subtitle?: string;
  overview?: string;
  concepts: Array<{ id: number; title: string; description?: string }>;
  activeConcept?: { id: number; title: string; description?: string };
};

function pickConcepts(ctx: TopicCtx, count = 4): string[] {
  const names = [
    ctx.activeConcept?.title?.trim(),
    ...ctx.concepts.map((c) => c.title?.trim()),
  ].filter(Boolean) as string[];
  if (names.length >= count) return names.slice(0, count);
  const seeds = [ctx.topicName, ctx.subtitle || '', ...names].filter(Boolean);
  while (seeds.length < count) seeds.push(`${ctx.topicName} concept ${seeds.length + 1}`);
  return seeds.slice(0, count);
}

function fallbackContent(stepType: StepType, ctx: TopicCtx) {
  const topicName = ctx.topicName;
  const conceptTitles = pickConcepts(ctx, 4);
  const firstConcept = conceptTitles[0];
  const secondConcept = conceptTitles[1] || topicName;
  const thirdConcept = conceptTitles[2] || topicName;

  switch (stepType) {
    case 'hook':
      return {
        title: `Why ${topicName} matters`,
        body: `Before details, picture a real CSP scenario where ${topicName} directly affects worker safety outcomes.\n\nFocus prompt: where do "${firstConcept}" and "${secondConcept}" show up in real work decisions?`,
      };
    case 'try':
      return {
        title: 'Try first',
        body: 'Take your best attempt before reading the model answer.',
        question: `In one sentence, what is the core purpose of ${topicName}?`,
        answer: `${topicName} helps reduce risk by applying concepts like "${firstConcept}" and "${secondConcept}" in a structured, preventive way before incidents occur.`,
      };
    case 'core':
      return {
        title: 'Core concept',
        body: `Define ${topicName} using your topic concepts: ${conceptTitles.join(', ')}.\nThen explain when each is applied in practice.`,
      };
    case 'visual':
      return {
        title: 'Visual map',
        body: `Map the flow for this exact topic:\n${firstConcept} -> ${secondConcept} -> ${thirdConcept} -> verification.\nUse arrows and one workplace example.`,
      };
    case 'example':
      return {
        title: 'Real example',
        body: `Use one workplace case study and show how ${topicName} changes decisions and outcomes.\nSpecifically reference "${firstConcept}" and "${secondConcept}".`,
      };
    case 'memory':
      return {
        title: 'Memory anchor',
        body: `Create an acronym from your topic concepts (${conceptTitles.join(', ')}) and one vivid mental image to remember them.`,
      };
    case 'recall':
      return {
        title: 'Recall check',
        question: `Which option is a key concept from this topic (${topicName})?`,
        options: [
          firstConcept,
          `${topicName} review policy`,
          `${topicName} archive template`,
          `${topicName} attendance sheet`,
        ],
        correct_index: 0,
      };
    case 'apply':
      return {
        title: 'Apply in scenario',
        question: `A team is handling "${firstConcept}" poorly. What is the best first action using ${topicName}?`,
        options: [
          `Ignore ${firstConcept} and wait for inspection`,
          `Apply ${topicName} by analyzing risks and implementing controls tied to ${firstConcept}`,
          `Only create documentation with no operational changes`,
          `Skip assessment and jump straight to annual retraining`,
        ],
        correct_index: 1,
      };
    case 'teach':
      return {
        title: 'Teach-back',
        body: `Teach ${topicName} to a new safety professional using these topic concepts: ${conceptTitles.join(', ')}.\nUse one practical example from your current topic.`,
      };
    case 'summary':
      return {
        title: 'Summary',
        body: `Write 3 bullet points:\n1) What ${topicName} is\n2) How ${firstConcept}/${secondConcept} are applied\n3) One mistake to avoid in this topic`,
      };
  }
}

export default function LearningFlowPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const topicId = Number(id);

  const stepsQ = useQuery({
    queryKey: ['learning-steps', topicId],
    queryFn: () => api<Resp>(`/topics/${topicId}/learning-steps`),
    enabled: !!topicId,
  });
  const topicDetailQ = useQuery({
    queryKey: ['topic-detail-for-flow', topicId],
    queryFn: () => api<TopicDetailResp>(`/topics/${topicId}`),
    enabled: !!topicId,
  });
  const revisionQ = useQuery({
    queryKey: ['revision-queue-inline', topicId],
    queryFn: () => api<RevisionQueueResp>('/study/revision-queue', { params: { limit: 5 } }),
    enabled: !!topicId,
  });
  const missionsQ = useQuery({
    queryKey: ['gamification-missions-inline'],
    queryFn: () => api<{ missions: { id: number; name: string; progress_count: number; target_count: number }[] }>('/gamification/missions'),
    enabled: !!topicId,
  });
  const gamificationQ = useQuery({
    queryKey: ['gamification-summary'],
    queryFn: () => api<GamificationResp>('/study/gamification'),
    enabled: !!topicId,
  });

  const conceptParam = Number(searchParams.get('concept'));

  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [tryAnswer, setTryAnswer] = useState('');
  const [tryRevealed, setTryRevealed] = useState(false);
  const [recallPick, setRecallPick] = useState<number | null>(null);
  const [applyPick, setApplyPick] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<StepType>>(new Set());
  const [interleaveSeen, setInterleaveSeen] = useState<Set<number>>(new Set());
  const stepStartRef = useRef<number>(Date.now());

  if (stepsQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }
  if (stepsQ.error || !stepsQ.data) {
    return <div className="wrap py-10"><div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-700">{(stepsQ.error as Error)?.message ?? 'Failed to load'}</div></div>;
  }

  const { topic, steps, authored_count, generated_count = 0, total } = stepsQ.data;
  const flowSteps = steps;

  // Done state
  if (done) {
    return (
      <div className="wrap py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <Trophy size={36} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">Flow complete</h1>
          <p className="mt-2 text-[15px] text-ink-body">
            You've worked through all {flowSteps.length} steps for <strong>{topic.name}</strong>.
          </p>
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12.5px] text-emerald-900">
            Memory Engine activated: concept profile initialized, starter flashcards generated, and first review scheduled.
          </div>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => { setStepIdx(0); setDone(false); setCompleted(new Set()); setTryAnswer(''); setTryRevealed(false); setRecallPick(null); setApplyPick(null); }}
              className="btn btn-primary btn-md"
            >
              <RotateCw size={14} /> Restart
            </button>
            <Link to={`/topics/${topicId}`} className="btn btn-ghost btn-md">Back to topic</Link>
          </div>
        </div>
      </div>
    );
  }

  const step = flowSteps[stepIdx];
  const meta = META[step.step_type];
  const coach = COACH[step.step_type];
  const Icon = meta.icon;
  const progress = ((stepIdx + 1) / flowSteps.length) * 100;
  const completionPct = Math.round((completed.size / flowSteps.length) * 100);

  // Track 4 — Mastery gating.
  // The two retrieval checkpoints in the flow are 'recall' and 'apply'.
  // Compute correctness for each and require ≥ topic.mastery_threshold to
  // advance off the 'apply' step. If below threshold, learner is routed
  // into a remediation pass: replay 'recall' and 'apply' with state reset.
  const masteryThreshold = topicDetailQ.data?.topic.mastery_threshold ?? 0.85;
  const recallStep = flowSteps.find((s) => s.step_type === 'recall');
  const applyStep = flowSteps.find((s) => s.step_type === 'apply');
  const recallCorrect =
    recallStep?.content_json?.correct_index !== undefined &&
    recallPick !== null &&
    recallPick === recallStep.content_json.correct_index;
  const applyCorrect =
    applyStep?.content_json?.correct_index !== undefined &&
    applyPick !== null &&
    applyPick === applyStep.content_json.correct_index;
  // Score over checkpoints actually answered.
  const answeredChecks = (recallPick !== null ? 1 : 0) + (applyPick !== null ? 1 : 0);
  const correctChecks = (recallCorrect ? 1 : 0) + (applyCorrect ? 1 : 0);
  const checkpointScore = answeredChecks > 0 ? correctChecks / answeredChecks : 0;

  // Mastery gate fires only when leaving 'apply' and both checkpoints are answered.
  const masteryGateBlocking =
    step.step_type === 'apply' &&
    applyPick !== null &&
    recallPick !== null &&
    checkpointScore < masteryThreshold;

  const canAdvance =
    step.step_type === 'try'
      ? tryRevealed
      : step.step_type === 'recall'
        ? recallPick !== null
        : step.step_type === 'apply'
          ? applyPick !== null && !masteryGateBlocking
          : true;

  const remediate = () => {
    // Replay recall + apply with state reset. Logged as a gating event so
    // we can measure how often gating fires (analytics for the marketing claim).
    trackEvent('mastery_gate_remediation', {
      meta_json: {
        threshold: masteryThreshold,
        score: checkpointScore,
      },
    });
    setRecallPick(null);
    setApplyPick(null);
    const recallIdx = flowSteps.findIndex((s) => s.step_type === 'recall');
    setStepIdx(recallIdx >= 0 ? recallIdx : 0);
  };

  const next = () => {
    const timeSpentMs = Date.now() - stepStartRef.current;
    trackEvent(stepIdx + 1 >= flowSteps.length ? 'flow_completed' : 'step_completed', { time_spent_ms: timeSpentMs });
    void gamificationQ.refetch();
    setCompleted((s) => new Set(s).add(step.step_type));
    if (stepIdx + 1 >= flowSteps.length) {
      setDone(true);
    } else {
      setStepIdx(stepIdx + 1);
      setTryAnswer('');
      setTryRevealed(false);
      setRecallPick(null);
      setApplyPick(null);
    }
  };

  const handleInterleaveDone = (quality: number) => {
    if (!dueInterleave) return;
    trackEvent('interleave_checkpoint_completed', {
      confidence: Math.max(1, Math.min(5, quality)),
      concept_id: dueInterleave.concept_id,
      topic_id: dueInterleave.topic_id,
      meta_json: {
        source: 'inline_flow',
        mastery_score: dueInterleave.mastery_score,
      },
    });
    void gamificationQ.refetch();
    setInterleaveSeen((prev) => new Set(prev).add(dueInterleave.concept_id));
  };

  const topicCtx: TopicCtx = {
    topicName: topic.name,
    subtitle: topicDetailQ.data?.topic.subtitle ?? undefined,
    overview: topicDetailQ.data?.topic.overview ?? undefined,
    concepts: (topicDetailQ.data?.topic.concepts ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description ?? undefined,
    })),
  };

  const selectedConcept =
    topicCtx.concepts.find((c) => c.id === conceptParam) ??
    topicCtx.concepts[0];
  const dueInterleave = (revisionQ.data?.queue ?? []).find((r) => r.concept_id !== selectedConcept?.id && !interleaveSeen.has(r.concept_id));
  const game = gamificationQ.data?.gamification;

  const trackEvent = (eventType: string, extra: Record<string, unknown> = {}) => {
    void postLearningEvent({
      topic_id: topicId,
      concept_id: selectedConcept?.id,
      event_type: eventType,
      step_type: step.step_type,
      step_order: stepIdx + 1,
      ...extra,
    }).catch(() => undefined);
  };

  // Keep URL concept param in sync so deep-links stay concept-specific.
  useEffect(() => {
    if (!selectedConcept) return;
    const current = Number(searchParams.get('concept'));
    if (current === selectedConcept.id) return;
    const next = new URLSearchParams(searchParams);
    next.set('concept', String(selectedConcept.id));
    setSearchParams(next, { replace: true });
  }, [selectedConcept, searchParams, setSearchParams]);

  useEffect(() => {
    stepStartRef.current = Date.now();
    trackEvent('step_viewed');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, topicId, selectedConcept?.id]);

  const conceptAwareCtx: TopicCtx = {
    ...topicCtx,
    activeConcept: selectedConcept,
  };
  const c = (step.content_json ?? fallbackContent(step.step_type, conceptAwareCtx)) as NonNullable<Step['content_json']>;

  return (
    <div className="wrap py-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link to={`/topics/${topicId}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Exit
        </Link>
        <div className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-dim">{topic.name}</div>
          {selectedConcept && (
            <div className="mt-1 text-[11px] font-semibold text-brand-700">
              Concept focus: {selectedConcept.title}
            </div>
          )}
          <div className="mt-0.5 font-display text-[14px] font-bold text-ink">
            Step {stepIdx + 1} <span className="text-ink-dim">/ {flowSteps.length}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-ink-dim">{authored_count} authored · {generated_count} generated</div>
          {game && (
            <div className="mt-1 text-[11px] font-semibold text-ink-body">
              Lv{game.level} · {game.total_xp} XP · {game.current_streak_days}d streak · {game.readiness_score}% ready
            </div>
          )}
        </div>
      </div>

      {/* Integrated flow identity */}
      <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50/70 px-5 py-3">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-700">Learning Panel</div>
        <div className="mt-1 font-display text-[20px] font-extrabold text-ink">10 steps. One mastered concept.</div>
        <div className="mt-1 text-[13px] text-ink-body">
          Trainer-guided practice with assessor checkpoints and system-led reinforcement.
        </div>
        <div className="mt-2 text-[12px] text-ink-dim">
          {authored_count}/{total} steps are admin-authored and {generated_count}/{total} are topic-linked generated baselines.
        </div>
      </div>

      {dueInterleave && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-700">Interleaving Checkpoint</div>
          <div className="mt-1 text-[14px] font-semibold text-ink">Quick recall before continuing</div>
          <p className="mt-1 text-[13px] text-ink-body">
            Re-activate <strong>{dueInterleave.concept_title}</strong> from <strong>{dueInterleave.topic_name}</strong>.
            This prevents forgetting while you master the current concept.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => handleInterleaveDone(2)} className="btn btn-ghost btn-sm">Need help</button>
            <button onClick={() => handleInterleaveDone(3)} className="btn btn-ghost btn-sm">Partial recall</button>
            <button onClick={() => handleInterleaveDone(5)} className="btn btn-primary btn-sm">Strong recall</button>
          </div>
        </div>
      )}

      {/* Concept selector for concept-specific mastery */}
      {topicCtx.concepts.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-dim">Target Concept</div>
          <div className="flex flex-wrap gap-2">
            {topicCtx.concepts.map((concept) => {
              const active = selectedConcept?.id === concept.id;
              return (
                <button
                  key={concept.id}
                  onClick={() => {
                    trackEvent('concept_switched', { meta_json: { to_concept_id: concept.id } });
                    const next = new URLSearchParams(searchParams);
                    next.set('concept', String(concept.id));
                    setSearchParams(next);
                    setStepIdx(0);
                    setDone(false);
                    setCompleted(new Set());
                    setTryAnswer('');
                    setTryRevealed(false);
                    setRecallPick(null);
                    setApplyPick(null);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                    active
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-ink-line bg-white text-ink-body hover:border-slate-300'
                  }`}
                >
                  {concept.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Step pip strip */}
      <div className="mb-7 flex items-center justify-center gap-1.5">
        {flowSteps.map((s, i) => {
          const isActive = i === stepIdx;
          const isDone = completed.has(s.step_type);
          return (
            <button
              key={s.step_type}
              onClick={() => setStepIdx(i)}
              className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-bold transition ${
                isActive ? 'scale-110 bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow' :
                isDone   ? 'bg-green-100 text-green-700 ring-1 ring-green-300' :
                           'bg-surface text-ink-dim ring-1 ring-ink-line hover:ring-slate-300'
              }`}
              title={META[s.step_type].label}
            >
              {isDone && !isActive ? <CheckCircle2 size={12} /> : i + 1}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.step_type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0"
          >
            <div className="card overflow-hidden">
            {/* Header strip */}
            <div className={`relative overflow-hidden p-6 text-white bg-gradient-to-br ${meta.color}`}>
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur">
                  <Icon size={22} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">{meta.subtitle}</div>
                  <div className="mt-0.5 font-display text-2xl font-extrabold leading-none">{meta.label}</div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-7">
              {c.title && <h2 className="font-display text-[20px] font-bold text-ink">{c.title}</h2>}
              {c.body && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-ink-body">{c.body}</p>}
              {c.image_url && (
                <img src={c.image_url} alt={c.title ?? ''} className="mt-5 max-h-72 w-full rounded-xl object-contain ring-1 ring-ink-line" />
              )}

              {/* Try first — open-ended attempt with reveal */}
              {step.step_type === 'try' && c.question && (
                <div className="mt-5 rounded-xl border border-ink-line bg-surface p-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">Try it</div>
                  <p className="mt-1 font-semibold text-ink">{c.question}</p>
                  <textarea
                    value={tryAnswer}
                    onChange={(e) => setTryAnswer(e.target.value)}
                    placeholder="Take a guess — wrong answers boost retention too."
                    className="mt-3 min-h-[80px] w-full resize-y rounded-lg border border-ink-line bg-white px-3 py-2 text-[13.5px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                    disabled={tryRevealed}
                  />
                  {!tryRevealed ? (
                    <button
                      onClick={() => {
                        setTryRevealed(true);
                        trackEvent('try_reveal_answer', { meta_json: { answer_length: tryAnswer.trim().length } });
                      }}
                      className="btn btn-primary btn-sm mt-3"
                    >
                      Reveal answer
                    </button>
                  ) : (
                    c.answer && (
                      <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-[13px] text-green-900">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-green-700">Answer</div>
                        <div className="mt-1">{c.answer}</div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* Recall — quick MCQ */}
              {step.step_type === 'recall' && c.question && c.options && (
                <RecallBlock
                  question={c.question}
                  options={c.options}
                  correctIndex={c.correct_index ?? 0}
                  picked={recallPick}
                  onPick={(i) => {
                    setRecallPick(i);
                    trackEvent('recall_answered', { is_correct: i === (c.correct_index ?? 0) });
                  }}
                />
              )}

              {/* Apply — same MCQ pattern (scenario) */}
              {step.step_type === 'apply' && c.question && c.options && (
                <RecallBlock
                  question={c.question}
                  options={c.options}
                  correctIndex={c.correct_index ?? 0}
                  picked={applyPick}
                  onPick={(i) => {
                    setApplyPick(i);
                    trackEvent('apply_answered', { is_correct: i === (c.correct_index ?? 0) });
                  }}
                  label="Scenario"
                />
              )}

              {/* Teach — link to Feynman page */}
              {step.step_type === 'teach' && (
                <div className="mt-5 rounded-xl border border-purple-200 bg-purple-50 p-5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Feynman teach-back</div>
                  <p className="mt-1 text-[14px] text-ink-body">
                    Now try teaching this concept in your own words. The AI will spot any gaps and give you a grade.
                  </p>
                  <Link to={`/feynman/${topicId}`} className="btn btn-primary btn-sm mt-3">
                    <GraduationCap size={13} /> Open Feynman mode
                  </Link>
                </div>
              )}
            </div>

              {/* Track 4 — Mastery gate remediation banner */}
              {masteryGateBlocking && (
                <div className="mx-6 mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4" role="alert">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={20} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
                    <div className="flex-1">
                      <div className="font-display text-[14px] font-bold text-amber-900">
                        Almost there — one more pass
                      </div>
                      <p className="mt-1 text-[13px] text-amber-800">
                        You answered {Math.round(checkpointScore * 100)}% of the checkpoints correctly.
                        Mastery on this topic requires {Math.round(masteryThreshold * 100)}%.
                        Replay the recall and apply checkpoints to lock the concept in.
                      </p>
                      <button
                        onClick={remediate}
                        className="btn btn-primary btn-sm mt-3"
                      >
                        <RotateCw size={13} /> Re-attempt checkpoints
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-ink-line bg-surface px-6 py-4">
                <button
                  onClick={() => stepIdx > 0 && setStepIdx(stepIdx - 1)}
                  disabled={stepIdx === 0}
                  className="btn btn-ghost btn-sm"
                >
                  <ArrowLeft size={13} /> Previous
                </button>
                <button onClick={next} disabled={!canAdvance} className="btn btn-primary btn-md disabled:opacity-50">
                  {stepIdx + 1 >= flowSteps.length ? 'Finish flow' : 'Next step'}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Trainer / assessor / system panel */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <ClipboardCheck size={15} className="text-brand-600" />
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-dim">Flow status</div>
            </div>
            <div className="font-display text-[22px] font-extrabold text-ink">{completionPct}%</div>
            <div className="mt-1 text-[12px] text-ink-body">
              {completed.size} of {flowSteps.length} steps completed
            </div>
          </div>

          <div className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <GraduationCap size={15} className="text-purple-600" />
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-dim">Trainer guidance</div>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-body">{coach.trainer}</p>
          </div>

          <div className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-600" />
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-dim">Assessor checkpoint</div>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-body">{coach.assessor}</p>
          </div>

          <div className="card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Bot size={15} className="text-blue-600" />
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-dim">Learning engine</div>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-body">{coach.system}</p>
          </div>

          {(missionsQ.data?.missions?.length ?? 0) > 0 && (
            <div className="card p-4">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-dim">Mission progress</div>
              <div className="space-y-2">
                {missionsQ.data!.missions.slice(0, 2).map((m) => {
                  const pct = Math.round((m.progress_count / Math.max(1, m.target_count)) * 100);
                  return (
                    <div key={m.id}>
                      <div className="text-[12px] font-semibold text-ink">{m.name}</div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface">
                        <div className="h-full rounded-full bg-violet-600" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────

function RecallBlock({
  question, options, correctIndex, picked, onPick, label = 'Recall',
}: {
  question: string;
  options: string[];
  correctIndex: number;
  picked: number | null;
  onPick: (i: number) => void;
  label?: string;
}) {
  const showResult = picked !== null;
  return (
    <div className="mt-5 rounded-xl border border-ink-line bg-surface p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">{label}</div>
      <p className="mt-1 font-semibold text-ink">{question}</p>
      <div className="mt-4 space-y-2">
        {options.map((opt, i) => {
          const isCorrect = i === correctIndex;
          const isPicked = picked === i;
          let cls = 'w-full rounded-lg border bg-white px-4 py-2.5 text-left text-[13.5px] font-medium transition cursor-pointer ';
          if (showResult) {
            cls = 'w-full rounded-lg border px-4 py-2.5 text-left text-[13.5px] font-medium cursor-default ';
            if (isCorrect)      cls += 'border-green-400 bg-green-50 text-green-900';
            else if (isPicked)  cls += 'border-red-400 bg-red-50 text-red-900';
            else                cls += 'border-ink-line text-ink-dim opacity-70';
          } else {
            cls += 'border-ink-line text-ink-body hover:border-brand-500/40 hover:bg-brand-50/40';
          }
          return (
            <button key={i} onClick={() => !showResult && onPick(i)} disabled={showResult} className={cls}>
              <span className="mr-2 font-bold text-ink-dim">{String.fromCharCode(65 + i)}.</span> {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
