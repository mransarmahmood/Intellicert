import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Loader2, Calendar, Sparkles, BookOpen, Layers, HelpCircle, RotateCw,
  ArrowRight, Trash2, Clock, Target,
} from 'lucide-react';
import { api } from '../lib/api';
import { safeHtml } from '../lib/sanitize';

type Task = { type: string; topic_id?: number; label: string };
type Week = {
  week: number;
  date_start: string;
  date_end: string;
  focus_domain: { id: string; number: number; name: string; color: string } | null;
  hours_target: number;
  tasks: Task[];
  kind: 'domain' | 'review';
};
type Plan = {
  exam_date: string | null;
  weeks: number;
  hours_per_week: number;
  plan: Week[];
};

const STORAGE_KEY = 'study_plan_completed_v1';

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}
function saveCompleted(s: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(s))); } catch {}
}

export default function StudyPlanPage() {
  const qc = useQueryClient();
  const planQ = useQuery({
    queryKey: ['study-plan'],
    queryFn: () => api<{ plan: Plan | null }>('/study-plan'),
  });

  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 8 * 7);
    return d.toISOString().slice(0, 10);
  });
  const [hours, setHours] = useState(10);
  const [completed, setCompleted] = useState<Set<string>>(loadCompleted());

  const generate = useMutation({
    mutationFn: () => api<{ plan: Plan }>('/study-plan', {
      method: 'POST',
      body: JSON.stringify({ exam_date: examDate, hours_per_week: hours }),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-plan'] }),
  });

  const remove = useMutation({
    mutationFn: () => api('/study-plan', { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-plan'] }),
  });

  const toggleTask = (key: string) => {
    setCompleted((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key); else next.add(key);
      saveCompleted(next);
      return next;
    });
  };

  if (planQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }

  const plan = planQ.data?.plan;

  return (
    <div className="wrap py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 ring-1 ring-emerald-500/20">
          <Calendar size={12} /> Exam prep
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">Study Plan</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-body">
          Generate a personalized week-by-week roadmap based on your exam date and study time. Tasks are weighted by domain importance and finish with full mock exams.
        </p>
      </div>

      {/* Generator card */}
      <div className="card mb-8 p-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-dim">
          <Sparkles size={12} className="text-brand-600" /> {plan ? 'Regenerate plan' : 'Create your plan'}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Exam date</label>
            <input type="date" className="input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Hours / week</label>
            <input type="number" min="1" max="60" className="input" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={() => generate.mutate()} className="btn btn-primary btn-md flex-1" disabled={generate.isPending}>
              {generate.isPending && <Loader2 size={14} className="animate-spin" />}
              {plan ? 'Regenerate' : 'Generate plan'}
            </button>
            {plan && (
              <button
                onClick={() => { if (confirm('Delete your plan?')) { remove.mutate(); setCompleted(new Set()); saveCompleted(new Set()); } }}
                className="btn btn-ghost btn-md"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plan timeline */}
      {!plan ? (
        <div className="card grid place-items-center py-16 text-center">
          <Calendar size={28} className="mb-3 text-ink-muted" />
          <div className="font-display text-[14px] font-semibold text-ink">No plan yet</div>
          <p className="mt-1 max-w-sm text-[13px] text-ink-dim">Pick an exam date and weekly hours above, then click <strong>Generate plan</strong>.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Exam date" value={plan.exam_date ? new Date(plan.exam_date).toLocaleDateString() : '—'} icon={Calendar} color="from-emerald-400 to-emerald-600" />
            <Stat label="Weeks total" value={String(plan.weeks)} icon={Target} color="from-brand-400 to-brand-600" />
            <Stat label="Hours / week" value={`${plan.hours_per_week} hrs`} icon={Clock} color="from-blue-400 to-blue-600" />
          </div>

          <div className="space-y-4">
            {plan.plan.map((w) => {
              const isReview = w.kind === 'review';
              const accent = w.focus_domain?.color || '#10B981';
              return (
                <motion.div
                  key={w.week}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card overflow-hidden"
                >
                  <div
                    className="flex items-center gap-4 px-5 py-4"
                    style={{ borderLeft: `4px solid ${accent}`, background: `linear-gradient(90deg, ${accent}11, transparent)` }}
                  >
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white"
                      style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
                    >
                      <span className="font-display text-[14px] font-extrabold">W{w.week}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-[15px] font-bold text-ink">
                        {isReview ? 'Final review week' : `Domain ${w.focus_domain?.number}: ${w.focus_domain?.name}`}
                      </div>
                      <div className="text-[12px] text-ink-dim">
                        {new Date(w.date_start).toLocaleDateString()} → {new Date(w.date_end).toLocaleDateString()} · {w.hours_target} hrs
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-ink-line">
                    {w.tasks.map((t, i) => {
                      const key = `w${w.week}-t${i}`;
                      const isDone = completed.has(key);
                      const Icon =
                        t.type === 'flashcards' ? Layers
                        : t.type === 'quiz'     ? HelpCircle
                        : t.type === 'topic'    ? BookOpen
                        : RotateCw;
                      return (
                        <div key={i} className={`flex items-center gap-3 px-5 py-3 transition ${i > 0 ? 'border-t border-ink-line' : ''} ${isDone ? 'opacity-50' : ''}`}>
                          <button
                            onClick={() => toggleTask(key)}
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 transition ${
                              isDone ? 'border-green-500 bg-green-500' : 'border-ink-line hover:border-brand-500'
                            }`}
                          >
                            {isDone && <span className="text-[11px] font-bold text-white">✓</span>}
                          </button>
                          <Icon size={14} className="shrink-0 text-ink-dim" />
                          <div className={`flex-1 text-[13px] ${isDone ? 'text-ink-dim line-through' : 'text-ink-body'}`} dangerouslySetInnerHTML={safeHtml(t.label)} />
                          {t.topic_id && t.type === 'topic' && (
                            <Link to={`/topics/${t.topic_id}`} className="btn btn-ghost btn-sm">
                              Open <ArrowRight size={12} />
                            </Link>
                          )}
                          {t.topic_id && t.type === 'flashcards' && w.focus_domain && (
                            <Link to={`/study/flashcards/${w.focus_domain.id}`} className="btn btn-ghost btn-sm">
                              Study <ArrowRight size={12} />
                            </Link>
                          )}
                          {t.topic_id && t.type === 'quiz' && w.focus_domain && (
                            <Link to={`/study/quizzes/${w.focus_domain.id}`} className="btn btn-ghost btn-sm">
                              Take <ArrowRight size={12} />
                            </Link>
                          )}
                          {t.type === 'review' && (
                            <Link to="/exam-simulator" className="btn btn-ghost btn-sm">
                              Open <ArrowRight size={12} />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="card p-4">
      <div className={`mb-2 inline-grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br ${color} text-white`}>
        <Icon size={15} />
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{label}</div>
      <div className="font-display text-2xl font-extrabold text-ink">{value}</div>
    </div>
  );
}
