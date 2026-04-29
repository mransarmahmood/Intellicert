import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Zap, Trophy, RotateCw, ArrowLeft, Check, X } from 'lucide-react';
import { api } from '../lib/api';

type Card = { id: number; front: string; back: string; domain_id: string };

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

const SECONDS_PER_CARD = 8;
const TOTAL_CARDS = 20;

export default function BlitzModePage() {
  const cardsQ = useQuery({
    queryKey: ['blitz-cards'],
    queryFn: () => api<{ flashcards: Card[]; total: number }>('/flashcards'),
  });

  const deck = useMemo(() => shuffle(cardsQ.data?.flashcards ?? []).slice(0, TOTAL_CARDS), [cardsQ.data]);

  const [idx, setIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_CARD);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ id: number; correct: boolean }[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIdx(0); setSecondsLeft(SECONDS_PER_CARD); setRevealed(false); setResults([]); setDone(false);
  }, [deck.length]);

  useEffect(() => {
    if (done || !deck.length) return;
    if (secondsLeft <= 0) { rate(false); return; }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, done, deck.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done) return;
      if (e.code === 'Space') { e.preventDefault(); setRevealed(true); }
      if (e.code === 'ArrowRight' || e.code === 'KeyJ') rate(true);
      if (e.code === 'ArrowLeft' || e.code === 'KeyF') rate(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done]);

  const rate = (correct: boolean) => {
    if (!deck[idx]) return;
    setResults((r) => [...r, { id: deck[idx].id, correct }]);
    api('/study/review', { method: 'POST', body: JSON.stringify({ card_id: deck[idx].id, quality: correct ? 4 : 2 }) }).catch(() => {});
    if (idx + 1 >= deck.length) { setDone(true); return; }
    setIdx(idx + 1); setSecondsLeft(SECONDS_PER_CARD); setRevealed(false);
  };

  if (cardsQ.isLoading) return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  if (!deck.length) return <div className="wrap py-10 text-center text-[14px] text-ink-dim">No flashcards available.</div>;

  if (done) {
    const correct = results.filter((r) => r.correct).length;
    const pct = Math.round((correct / results.length) * 100);
    return (
      <div className="wrap py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-glow">
            <Trophy size={36} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">Blitz complete</h1>
          <p className="mt-2 text-[15px] text-ink-body">{correct} / {results.length} correct ({pct}%)</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button onClick={() => { setIdx(0); setSecondsLeft(SECONDS_PER_CARD); setRevealed(false); setResults([]); setDone(false); }} className="btn btn-primary btn-md"><RotateCw size={14} /> Again</button>
            <Link to="/study" className="btn btn-ghost btn-md">Back to study hub</Link>
          </div>
        </div>
      </div>
    );
  }

  const card = deck[idx];
  const timePct = (secondsLeft / SECONDS_PER_CARD) * 100;

  return (
    <div className="wrap py-8">
      <div className="mb-5 flex items-center justify-between">
        <Link to="/study" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Exit</Link>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700 ring-1 ring-amber-500/20">
          <Zap size={12} /> Blitz mode
        </div>
        <div className="font-display text-[14px] font-bold text-ink">
          {idx + 1} <span className="text-ink-dim">/ {deck.length}</span>
        </div>
      </div>

      {/* Time bar */}
      <div className="mb-2 h-2 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            secondsLeft <= 2 ? 'bg-red-500' : secondsLeft <= 4 ? 'bg-amber-500' : 'bg-gradient-to-r from-brand-500 to-brand-600'
          }`}
          style={{ width: `${timePct}%` }}
        />
      </div>
      <div className="mb-6 text-center text-[10px] font-bold uppercase tracking-wider text-ink-dim">{secondsLeft}s</div>

      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="mx-auto max-w-2xl"
        >
          <div className="card cursor-pointer p-10 text-center" onClick={() => setRevealed(true)}>
            {!revealed ? (
              <>
                <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Quick! Recall</div>
                <p className="mt-3 font-display text-2xl font-bold text-ink leading-snug">{card.front}</p>
                <p className="mt-6 text-[11px] text-ink-muted">Tap or press <kbd className="rounded bg-surface px-1 ring-1 ring-ink-line">Space</kbd> to flip</p>
              </>
            ) : (
              <>
                <div className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Answer</div>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-body">{card.back}</p>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mx-auto mt-6 flex max-w-2xl gap-3">
        <button
          onClick={() => rate(false)}
          className="flex-1 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 font-semibold text-red-800 transition hover:-translate-y-0.5 hover:border-red-400 hover:bg-red-100"
        >
          <X className="mx-auto mb-1" size={16} />
          Missed
        </button>
        <button
          onClick={() => rate(true)}
          className="flex-1 rounded-xl border-2 border-green-300 bg-green-50 px-4 py-3 font-semibold text-green-800 transition hover:-translate-y-0.5 hover:border-green-400 hover:bg-green-100"
        >
          <Check className="mx-auto mb-1" size={16} />
          Got it
        </button>
      </div>
    </div>
  );
}
