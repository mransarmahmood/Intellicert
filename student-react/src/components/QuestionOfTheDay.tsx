// Picks a deterministic-but-daily quiz question and lets the student answer
// it inline with feedback + XP reward. Uses localStorage to remember today's
// answer so the question doesn't reset on every page refresh.

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Check, X, Zap, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

type Quiz = {
  id: number;
  domain_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  explanation: string | null;
};

const STORE_KEY = 'qotd_state_v1';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function pickIndex(seed: string, max: number): number {
  // Tiny string-hash for deterministic daily pick
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % Math.max(1, max);
}

export default function QuestionOfTheDay() {
  const quizzesQ = useQuery({
    queryKey: ['qotd-quizzes'],
    queryFn: () => api<{ quizzes: Quiz[]; total: number }>('/quizzes'),
  });

  const today = todayKey();
  const quiz = useMemo(() => {
    const list = quizzesQ.data?.quizzes ?? [];
    if (!list.length) return null;
    return list[pickIndex(today, list.length)];
  }, [quizzesQ.data, today]);

  const [picked, setPicked] = useState<number | null>(null);

  // Restore today's answered state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.date === today && typeof state.picked === 'number') setPicked(state.picked);
    } catch { /* ignore */ }
  }, [today]);

  const choose = (i: number) => {
    if (picked !== null || !quiz) return;
    setPicked(i);
    const correct = i === quiz.correct_index;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ date: today, picked: i, correct }));
    } catch { /* ignore */ }
    api('/study/quiz-attempt', {
      method: 'POST',
      body: JSON.stringify({ quiz_id: quiz.id, picked_index: i, correct }),
    }).catch(() => {});
  };

  if (quizzesQ.isLoading) {
    return (
      <div className="card grid place-items-center py-10 text-ink-dim">
        <Loader2 className="animate-spin" size={18} />
      </div>
    );
  }
  if (!quiz) return null;

  const showResult = picked !== null;
  const opts = [quiz.option_a, quiz.option_b, quiz.option_c, quiz.option_d];
  const isCorrect = picked === quiz.correct_index;

  return (
    <div className="card relative overflow-hidden p-6">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-sm">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="font-display text-[16px] font-bold text-ink">Question of the Day</h3>
              <div className="text-[11px] font-semibold text-purple-700">{quiz.domain_id}</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-500/20">
            <Zap size={11} /> +20 XP
          </span>
        </div>

        <p className="mt-4 text-[14px] font-semibold text-ink">{quiz.question}</p>

        <div className="mt-4 space-y-2">
          {opts.map((opt, i) => {
            const isCorrectOpt = i === quiz.correct_index;
            const isPicked = picked === i;
            let cls = 'flex w-full cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13.5px] font-medium transition ';
            if (showResult) {
              cls = 'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13.5px] font-medium ';
              if (isCorrectOpt)      cls += 'border-green-300 bg-green-50 text-green-900';
              else if (isPicked)     cls += 'border-red-300 bg-red-50 text-red-900';
              else                   cls += 'border-ink-line bg-white text-ink-dim opacity-70';
            } else {
              cls += 'border-ink-line bg-white text-ink-body hover:border-brand-500/40 hover:bg-brand-50/40';
            }
            return (
              <button key={i} disabled={showResult} onClick={() => choose(i)} className={cls}>
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[12px] font-bold ${
                    showResult && isCorrectOpt ? 'bg-green-500 text-white'
                    : showResult && isPicked   ? 'bg-red-500 text-white'
                    : 'bg-surface text-ink-body ring-1 ring-ink-line'
                  }`}
                >
                  {showResult && isCorrectOpt ? <Check size={13} /> :
                   showResult && isPicked    ? <X size={13} /> :
                   String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-4 rounded-xl border border-ink-line bg-surface p-4">
            <div className={`text-[13px] font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
              {isCorrect ? '✓ Correct! +20 XP' : '✗ Not quite — see Detail Understanding below'}
            </div>
            {quiz.explanation && (
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-body">{quiz.explanation}</p>
            )}
            <div className="mt-2 text-[11px] text-ink-dim">Come back tomorrow for a new question.</div>
          </div>
        )}
      </div>
    </div>
  );
}
