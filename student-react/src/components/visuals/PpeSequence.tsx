import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, Footprints, HardHat, Glasses, Shell, Hand, Trophy, AlertTriangle, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ItemKey = 'coverall' | 'boots' | 'respirator' | 'goggles' | 'hood' | 'gloves';

const ITEMS: Record<ItemKey, { label: string; Icon: LucideIcon }> = {
  coverall:   { label: 'Coverall / Suit',          Icon: Shirt },
  boots:      { label: 'Boot Covers',               Icon: Footprints },
  respirator: { label: 'Respirator',                Icon: HardHat },
  goggles:    { label: 'Safety Goggles',            Icon: Glasses },
  hood:       { label: 'Hood',                      Icon: Shell },
  gloves:     { label: 'Gloves (inner+outer)',      Icon: Hand },
};

const CORRECT: ItemKey[] = ['coverall', 'boots', 'respirator', 'goggles', 'hood', 'gloves'];

function shuffle<T>(arr: T[]) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function PpeSequence() {
  const [reshuffleKey, setReshuffleKey] = useState(0);
  const [chosen, setChosen] = useState<ItemKey[]>([]);
  const shuffled = useMemo(() => shuffle(CORRECT), [reshuffleKey]);

  const complete = chosen.length === CORRECT.length;
  const correctOrder = complete && chosen.every((k, i) => k === CORRECT[i]);

  function reset() {
    setChosen([]);
    setReshuffleKey((k) => k + 1);
  }

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">PPE Donning Sequence</h3>
        <p className="mt-1 text-sm text-ink-dim">Click items in the correct donning order</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {shuffled.map((k) => {
          const used = chosen.includes(k);
          const item = ITEMS[k];
          return (
            <motion.button
              key={k}
              onClick={() => { if (!used) setChosen((c) => [...c, k]); }}
              whileHover={!used ? { y: -3, scale: 1.02 } : {}}
              animate={{ opacity: used ? 0.25 : 1, scale: used ? 0.95 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              disabled={used}
              className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-ink-line rounded-xl text-ink text-xs font-bold cursor-pointer disabled:cursor-not-allowed hover:border-blue-500"
            >
              <item.Icon size={26} className="text-blue-600" />
              <span className="text-center">{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-dim mt-5 mb-2">
        Your sequence
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {Array.from({ length: CORRECT.length }).map((_, i) => {
          const filled = chosen[i];
          const item = filled ? ITEMS[filled] : null;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={filled ? { scale: [0.9, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className={`relative min-h-[80px] p-3 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center text-[11px] font-semibold ${
                filled ? 'border-2 border-emerald-500 bg-emerald-50 text-ink' : 'border-2 border-dashed border-ink-line bg-surface-sunken text-ink-muted'
              }`}
            >
              <div className="absolute top-1 left-1.5 text-[10px] font-black">
                {i + 1}
              </div>
              {item ? (
                <>
                  <item.Icon size={22} className="text-emerald-600" />
                  <span>{item.label}</span>
                </>
              ) : (
                <span className="opacity-40">?</span>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {complete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
              correctOrder
                ? 'bg-emerald-50 border border-emerald-200/70 text-emerald-900'
                : 'bg-orange-50 border border-orange-200/70 text-orange-900'
            }`}
          >
            {correctOrder
              ? <Trophy size={18} className="shrink-0 mt-0.5 text-emerald-600" />
              : <AlertTriangle size={18} className="shrink-0 mt-0.5 text-orange-600" />}
            <span>
              {correctOrder
                ? <><strong>Correct!</strong> Outer gloves last — so you can remove them without contaminating inner glove.</>
                : <><strong>Not quite.</strong> Correct order: {CORRECT.map((k) => ITEMS[k].label).join(' → ')}</>}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-3">
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-ink-line bg-white px-4 py-2 text-sm font-semibold text-ink-body hover:bg-surface-alt">
          <RotateCcw size={14} /> Reset
        </button>
      </div>
    </div>
  );
}
