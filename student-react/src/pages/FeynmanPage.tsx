import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Loader2,
  GraduationCap,
  Sparkles,
  Check,
  AlertCircle,
  Lightbulb,
  RotateCw,
} from 'lucide-react';
import { api } from '../lib/api';

type Topic = { id: number; name: string; subtitle: string | null; domain_id: string };
type Result = {
  topic: string;
  grade: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  suggestion: string;
};

export default function FeynmanPage() {
  const { topicId } = useParams();
  const idNum = topicId ? Number(topicId) : null;

  const topicsQ = useQuery({
    queryKey: ['topics-all'],
    queryFn: () => api<{ topics: Topic[] }>('/topics'),
  });

  const [selectedId, setSelectedId] = useState<number | null>(idNum);
  const [explanation, setExplanation] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () =>
      api<Result & { success: boolean }>('/ai/feynman', {
        method: 'POST',
        body: JSON.stringify({ topic_id: selectedId, explanation }),
      }),
    onSuccess: (r) => setResult(r),
    onError: (e: Error) => setErr(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setResult(null);
    if (!selectedId) { setErr('Pick a topic first'); return; }
    if (explanation.trim().length < 20) { setErr('Write at least 20 characters'); return; }
    m.mutate();
  };

  const reset = () => {
    setResult(null);
    setExplanation('');
  };

  const selected = topicsQ.data?.topics.find((t) => t.id === selectedId);

  return (
    <div className="wrap py-10">
      <Link to="/study" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-dim hover:text-ink">
        <ArrowLeft size={14} /> Back to study hub
      </Link>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-700 ring-1 ring-purple-500/20">
          <GraduationCap size={12} /> Feynman teach-back
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">Teach to learn.</h1>
        <p className="mt-2 max-w-2xl text-[15px] text-ink-body">
          Pick a topic and write your Detail Understanding as if you were teaching a colleague. The AI will spot gaps
          and tell you exactly what to review next — that's the Feynman technique.
        </p>
      </div>

      {!result ? (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-body">Topic</label>
            <select
              value={selectedId ?? ''}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-xl border border-ink-line bg-white px-4 py-3 text-[14.5px] text-ink shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              required
            >
              <option value="">— Choose a topic —</option>
              {topicsQ.data?.topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-body">Your Detail Understanding</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="min-h-[260px] w-full resize-y rounded-xl border border-ink-line bg-white px-4 py-3 text-[14.5px] text-ink shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              placeholder={`Explain "${selected?.name ?? 'this topic'}" in your own words. Pretend you're teaching a coworker who has never heard of it. Don't quote the textbook — use simple language.`}
              required
            />
            <div className="mt-1.5 flex justify-between text-[11.5px] text-ink-dim">
              <span>{explanation.length} characters · 20 min</span>
              <span>The longer, the better the feedback.</span>
            </div>
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{err}</div>
          )}

          <button type="submit" className="btn btn-primary btn-md w-full sm:w-auto" disabled={m.isPending}>
            {m.isPending && <Loader2 size={16} className="animate-spin" />}
            <Sparkles size={16} /> {m.isPending ? 'Grading your Detail Understanding...' : 'Grade my Detail Understanding'}
          </button>
        </form>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Grade card */}
            <div className="card overflow-hidden">
              <div className={`relative p-7 ${
                result.grade >= 90 ? 'bg-gradient-to-br from-green-50 to-white' :
                result.grade >= 75 ? 'bg-gradient-to-br from-blue-50 to-white' :
                result.grade >= 60 ? 'bg-gradient-to-br from-amber-50 to-white' :
                                     'bg-gradient-to-br from-red-50 to-white'
              }`}>
                <div className="flex items-center gap-5">
                  <div className={`grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-white shadow-lg ${
                    result.grade >= 90 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    result.grade >= 75 ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                    result.grade >= 60 ? 'bg-gradient-to-br from-amber-500 to-amber-600' :
                                         'bg-gradient-to-br from-red-500 to-red-700'
                  }`}>
                    <div className="text-center">
                      <div className="font-display text-3xl font-extrabold leading-none">{result.grade}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">/ 100</div>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">{result.topic}</div>
                    <h2 className="mt-1 font-display text-[20px] font-bold text-ink">{result.summary}</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                  <Check size={16} className="text-green-600" /> What you got right
                </h3>
                <ul className="mt-3 space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] text-ink-body">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
                        <Check size={10} />
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Gaps */}
            {result.gaps.length > 0 && (
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                  <AlertCircle size={16} className="text-amber-600" /> Gaps to close
                </h3>
                <ul className="mt-3 space-y-2">
                  {result.gaps.map((g, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[14px] text-ink-body">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
                        <AlertCircle size={10} />
                      </span>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestion */}
            {result.suggestion && (
              <div className="card border-brand-500/30 bg-gradient-to-br from-brand-50 to-white p-6">
                <h3 className="flex items-center gap-2 font-display text-[15px] font-bold text-ink">
                  <Lightbulb size={16} className="text-brand-600" /> Next action
                </h3>
                <p className="mt-2 text-[14.5px] text-ink-body">{result.suggestion}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={reset} className="btn btn-primary btn-md flex-1">
                <RotateCw size={14} /> Try another topic
              </button>
              {selected && (
                <Link to={`/study/flashcards/${selected.domain_id}`} className="btn btn-ghost btn-md flex-1">
                  Study {selected.name} flashcards
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
