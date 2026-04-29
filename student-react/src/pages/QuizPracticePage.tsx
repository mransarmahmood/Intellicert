import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Check, X, ArrowRight, Trophy, RotateCw, Flag } from 'lucide-react';
import { api } from '../lib/api';

type Quiz = {
  id: number;
  quiz_key: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  explanation: string | null;
  domain_id: string;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPracticePage() {
  const { domainId } = useParams();
  const isAll = !domainId || domainId === 'all';

  const quizzesQ = useQuery({
    queryKey: ['practice-quizzes', domainId],
    queryFn: () =>
      api<{ quizzes: Quiz[]; total: number }>('/quizzes', {
        params: isAll ? {} : { domain_id: domainId },
      }),
  });

  const deck = useMemo(() => shuffle(quizzesQ.data?.quizzes ?? []).slice(0, 20), [quizzesQ.data]);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<{ id: number; correct: boolean }[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIdx(0);
    setPicked(null);
    setResults([]);
    setDone(false);
  }, [deck.length]);

  const quiz = deck[idx];
  const showResult = picked !== null;

  const choose = (i: number) => {
    if (showResult) return;
    setPicked(i);
    const isCorrect = i === quiz.correct_index;
    setResults((r) => [...r, { id: quiz.id, correct: isCorrect }]);
    api('/study/quiz-attempt', {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quiz.id, picked_index: i, correct: isCorrect }),
    }).catch(() => {});
  };
  const next = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done || !quiz) return;
      if (showResult) {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'ArrowRight') {
          e.preventDefault();
          next();
        }
        return;
      }
      if (e.code === 'Digit1' || e.code === 'KeyA') choose(0);
      if (e.code === 'Digit2' || e.code === 'KeyB') choose(1);
      if (e.code === 'Digit3' || e.code === 'KeyC') choose(2);
      if (e.code === 'Digit4' || e.code === 'KeyD') choose(3);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz, picked, done]);

  const restart = () => {
    setIdx(0);
    setPicked(null);
    setResults([]);
    setDone(false);
  };

  if (quizzesQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }

  if (!deck.length) {
    return (
      <div className="wrap py-20 text-center">
        <p className="text-[15px] text-ink-dim">No quizzes available in this set.</p>
        <Link to="/study" className="btn btn-ghost btn-md mt-5"><ArrowLeft size={14} /> Back to study hub</Link>
      </div>
    );
  }

  if (done) {
    const total = results.length;
    const correct = results.filter((r) => r.correct).length;
    const pct = Math.round((correct / total) * 100);
    const grade =
      pct >= 90 ? { label: 'Excellent', color: 'from-green-500 to-emerald-600' } :
      pct >= 75 ? { label: 'Great work', color: 'from-blue-500 to-blue-700' } :
      pct >= 60 ? { label: 'Keep going', color: 'from-amber-500 to-amber-600' } :
                  { label: 'Review more', color: 'from-red-500 to-red-700' };

    return (
      <div className="wrap py-16">
        <div className="mx-auto max-w-md text-center">
          <div className={`mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br ${grade.color} text-white shadow-glow`}>
            <Trophy size={36} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">{grade.label}</h1>
          <p className="mt-2 text-[15px] text-ink-body">You got {correct} out of {total} correct.</p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="card p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Correct</div>
              <div className="mt-1 font-display text-3xl font-extrabold text-green-600">{correct}</div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Wrong</div>
              <div className="mt-1 font-display text-3xl font-extrabold text-red-600">{total - correct}</div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Score</div>
              <div className="mt-1 font-display text-3xl font-extrabold text-ink">{pct}%</div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button onClick={restart} className="btn btn-primary btn-md"><RotateCw size={14} /> New session</button>
            <Link to="/study" className="btn btn-ghost btn-md">Back to study hub</Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((idx + (showResult ? 1 : 0)) / deck.length) * 100;
  const options = [quiz.option_a, quiz.option_b, quiz.option_c, quiz.option_d];

  return (
    <div className="wrap py-8">
      <div className="mb-5 flex items-center justify-between">
        <Link to="/study" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Exit</Link>
        <div className="font-display text-[14px] font-bold text-ink">
          {idx + 1} <span className="text-ink-dim">/ {deck.length}</span>
        </div>
        <div className="hidden text-[11px] text-ink-dim sm:block">Press 1-4 or A-D</div>
      </div>

      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={quiz.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl"
        >
          <div className="card p-7">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold leading-snug text-ink sm:text-2xl">{quiz.question}</h2>
              <button
                onClick={() => {
                  api('/flagged', { method: 'POST', body: JSON.stringify({ quiz_id: quiz.id }) })
                    .then(() => alert('Question flagged for later review'))
                    .catch((e) => alert('Failed: ' + e.message));
                }}
                className="btn btn-ghost btn-sm shrink-0"
                title="Flag for later review"
              >
                <Flag size={13} />
              </button>
            </div>

            <div className="mt-6 space-y-2.5">
              {options.map((opt, i) => {
                const isCorrect = i === quiz.correct_index;
                const isPicked = picked === i;

                let cls =
                  'w-full cursor-pointer rounded-xl border bg-white px-5 py-3.5 text-left text-[14.5px] font-medium text-ink-body shadow-sm transition-all hover:border-brand-500/40 hover:bg-brand-50/30 hover:-translate-y-0.5';
                if (showResult) {
                  cls = 'w-full rounded-xl border px-5 py-3.5 text-left text-[14.5px] font-medium shadow-sm cursor-default ';
                  if (isCorrect) cls += 'border-green-400 bg-green-50 text-green-900';
                  else if (isPicked) cls += 'border-red-400 bg-red-50 text-red-900';
                  else cls += 'border-ink-line bg-white text-ink-dim opacity-70';
                } else {
                  cls += ' border-ink-line';
                }

                return (
                  <button
                    key={i}
                    onClick={() => choose(i)}
                    disabled={showResult}
                    className={cls}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-[12px] font-bold ${
                          showResult && isCorrect ? 'bg-green-500 text-white' :
                          showResult && isPicked  ? 'bg-red-500 text-white' :
                          'bg-surface text-ink-body ring-1 ring-ink-line'
                        }`}
                      >
                        {showResult && isCorrect ? <Check size={13} /> :
                         showResult && isPicked  ? <X size={13} /> :
                         String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail Understanding reveal */}
            <AnimatePresence>
              {showResult && quiz.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="rounded-xl border border-ink-line bg-surface p-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Detail Understanding</div>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-body">{quiz.explanation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {showResult && (
              <button onClick={next} className="btn btn-primary btn-md mt-6 w-full">
                {idx + 1 >= deck.length ? 'See results' : 'Next question'}
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
