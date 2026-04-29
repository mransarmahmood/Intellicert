import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, X, Check, RotateCcw, Trophy, RotateCw, KeyRound } from 'lucide-react';
import { api } from '../lib/api';

type Card = {
  id: number;
  card_key: string;
  front: string;
  back: string;
  image_url: string | null;
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

export default function FlashcardStudyPage() {
  const { domainId } = useParams();
  const isAll = !domainId || domainId === 'all';
  const isDue = domainId === 'due';

  const cardsQ = useQuery({
    queryKey: ['study-flashcards', domainId],
    queryFn: () => {
      if (isDue) {
        return api<{ flashcards: Card[]; total: number }>('/study/due', {
          params: { limit: 30 },
        });
      }
      return api<{ flashcards: Card[]; total: number }>('/flashcards', {
        params: isAll ? {} : { domain_id: domainId },
      });
    },
  });

  const deck = useMemo(() => shuffle(cardsQ.data?.flashcards ?? []), [cardsQ.data]);

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [unknown, setUnknown] = useState<Set<number>>(new Set());
  const [done, setDone] = useState(false);

  // Reset when deck changes
  useEffect(() => {
    setIdx(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setDone(false);
  }, [deck.length]);

  const card = deck[idx];

  const advance = () => {
    if (idx + 1 >= deck.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setFlipped(false);
    }
  };
  const logReview = (cardId: number, quality: number) => {
    api('/study/review', {
      method: 'POST',
      body: JSON.stringify({ card_id: cardId, quality }),
    }).catch(() => {});
  };
  const markKnown = () => {
    if (!card) return;
    setKnown((s) => new Set(s).add(card.id));
    logReview(card.id, 4);
    advance();
  };
  const markUnknown = () => {
    if (!card) return;
    setUnknown((s) => new Set(s).add(card.id));
    logReview(card.id, 2);
    advance();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (done) return;
      if (e.code === 'Space') { e.preventDefault(); setFlipped((f) => !f); }
      if (e.code === 'ArrowRight' || e.code === 'KeyJ') markKnown();
      if (e.code === 'ArrowLeft'  || e.code === 'KeyF') markUnknown();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, done]);

  const restart = () => {
    setIdx(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setDone(false);
  };

  if (cardsQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }

  if (!deck.length) {
    return (
      <div className="wrap py-20 text-center">
        <p className="text-[15px] text-ink-dim">No flashcards available in this set.</p>
        <Link to="/study" className="btn btn-ghost btn-md mt-5"><ArrowLeft size={14} /> Back to study hub</Link>
      </div>
    );
  }

  if (done) {
    const total = deck.length;
    const correct = known.size;
    const pct = Math.round((correct / total) * 100);
    return (
      <div className="wrap py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
            <Trophy size={36} />
          </div>
          <h1 className="mt-6 font-display text-3xl font-extrabold text-ink">Session complete</h1>
          <p className="mt-2 text-[15px] text-ink-body">You reviewed all {total} cards.</p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="card p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Known</div>
              <div className="mt-1 font-display text-3xl font-extrabold text-green-600">{correct}</div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Review</div>
              <div className="mt-1 font-display text-3xl font-extrabold text-amber-600">{unknown.size}</div>
            </div>
            <div className="card p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Score</div>
              <div className="mt-1 font-display text-3xl font-extrabold text-ink">{pct}%</div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button onClick={restart} className="btn btn-primary btn-md"><RotateCw size={14} /> Restart</button>
            <Link to="/study" className="btn btn-ghost btn-md">Back to study hub</Link>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((idx + 1) / deck.length) * 100;

  return (
    <div className="wrap py-8">
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between">
        <Link to="/study" className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Exit</Link>
        <div className="font-display text-[14px] font-bold text-ink">
          {idx + 1} <span className="text-ink-dim">/ {deck.length}</span>
        </div>
        <div className="hidden items-center gap-1 text-[11px] text-ink-dim sm:flex">
          <KeyRound size={12} /> Space · ←/→
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      <div className="mx-auto max-w-2xl" style={{ perspective: '1500px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={card?.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setFlipped((f) => !f)}
            className="relative h-[380px] cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-ink-line bg-white p-10 text-center shadow-cardHover"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <span className="badge badge-slate mb-5">Question</span>
                <p className="font-display text-2xl font-bold text-ink leading-snug">{card?.front}</p>
                <p className="mt-6 text-[12px] text-ink-muted">Click or press <kbd className="rounded bg-surface px-1.5 py-0.5 ring-1 ring-ink-line">Space</kbd> to flip</p>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-50 to-white p-10 text-center shadow-cardHover"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <span className="badge badge-brand mb-5">Answer</span>
                <p className="text-[15.5px] leading-relaxed text-ink-body">{card?.back}</p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="mx-auto mt-8 flex max-w-2xl gap-3">
        <button
          onClick={markUnknown}
          className="flex-1 rounded-xl border-2 border-amber-300 bg-amber-50 px-5 py-4 font-semibold text-amber-800 transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-100 hover:shadow-card"
        >
          <X className="mx-auto mb-1" size={18} />
          Still learning
          <div className="mt-0.5 text-[10px] font-normal opacity-70">← or F</div>
        </button>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="rounded-xl border border-ink-line bg-white px-5 py-4 font-semibold text-ink-body transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-card"
          title="Flip"
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={markKnown}
          className="flex-1 rounded-xl border-2 border-green-300 bg-green-50 px-5 py-4 font-semibold text-green-800 transition hover:-translate-y-0.5 hover:border-green-400 hover:bg-green-100 hover:shadow-card"
        >
          <Check className="mx-auto mb-1" size={18} />
          I know it
          <div className="mt-0.5 text-[10px] font-normal opacity-70">→ or J</div>
        </button>
      </div>
    </div>
  );
}
