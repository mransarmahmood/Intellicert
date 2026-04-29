import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserX, AlertTriangle, Flame, UserMinus, Play, Hand, RotateCcw, ShieldCheck } from 'lucide-react';

const DOMINOES = [
  { label: 'Ancestry &\nSocial Env.',   color: '#64748b', Icon: Users },
  { label: 'Fault of Person',            color: '#8b5cf6', Icon: UserX },
  { label: 'Unsafe Act /\nCondition',    color: '#f97316', Icon: AlertTriangle },
  { label: 'Accident',                   color: '#dc2626', Icon: Flame },
  { label: 'Injury',                     color: '#991b1b', Icon: UserMinus },
];

export default function DominoTheory() {
  const [fallState, setFallState] = useState<{ fallen: boolean[]; removed: number | null }>({
    fallen: [false, false, false, false, false],
    removed: null,
  });
  const [msg, setMsg] = useState<{ good: boolean; text: string } | null>(null);

  function play(skipIdx?: number) {
    const fallen = [false, false, false, false, false];
    setFallState({ fallen, removed: skipIdx ?? null });
    setMsg(null);
    DOMINOES.forEach((_, i) => {
      if (skipIdx != null && i === skipIdx) return;
      if (skipIdx != null && i > skipIdx) return;
      setTimeout(() => {
        setFallState((s) => {
          const next = s.fallen.slice();
          next[i] = true;
          return { ...s, fallen: next };
        });
      }, i * 450);
    });
    setTimeout(() => {
      if (skipIdx != null) {
        setMsg({ good: true, text: 'Chain broken! Removing unsafe acts/conditions prevents the accident (#4) and injury (#5).' });
      } else {
        setMsg({ good: false, text: 'Injury occurred. The entire causal chain propagated. Eliminate any one domino to prevent it.' });
      }
    }, (skipIdx ?? DOMINOES.length) * 450 + 300);
  }

  function reset() {
    setFallState({ fallen: [false, false, false, false, false], removed: null });
    setMsg(null);
  }

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Heinrich's Domino Theory</h3>
        <p className="mt-1 text-sm text-ink-dim">Remove the unsafe act domino (#3) to break the causal chain</p>
      </div>

      <div className="flex items-end justify-center gap-4 flex-wrap py-10 px-4 bg-gradient-to-b from-transparent to-surface-sunken rounded-2xl min-h-[220px]">
        {DOMINOES.map((d, i) => {
          const isFallen = fallState.fallen[i];
          const isSkipped = fallState.removed === i;
          return (
            <motion.div
              key={i}
              animate={{
                rotate: isFallen ? -75 : 0,
                y: isFallen ? 60 : 0,
                opacity: isSkipped ? 0.15 : 1,
                scale: isSkipped ? 0.9 : 1,
                filter: isSkipped ? 'saturate(0.3)' : 'saturate(1)',
              }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{
                background: d.color,
                transformOrigin: 'bottom left',
                width: 92, height: 160,
              }}
              className="relative rounded-xl text-white p-3 flex flex-col items-center justify-center gap-2 shadow-lg"
            >
              <div className="absolute top-1.5 left-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/30 text-[11px] font-black">
                {i + 1}
              </div>
              <d.Icon size={22} />
              <div className="text-[10px] font-bold text-center leading-tight whitespace-pre-line">
                {d.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-center mt-6 flex-wrap">
        <button onClick={() => play()} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90">
          <Play size={14} /> Let It Fall
        </button>
        <button onClick={() => play(2)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
          <Hand size={14} /> Remove Domino #3
        </button>
        <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-ink-line bg-white px-4 py-2 text-sm font-semibold text-ink-body hover:bg-surface-alt">
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      <AnimatePresence mode="wait">
        {msg && (
          <motion.div
            key={msg.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mt-4 rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
              msg.good
                ? 'bg-emerald-50 border border-emerald-200/70 text-emerald-900'
                : 'bg-red-50 border border-red-200/70 text-red-900'
            }`}
          >
            {msg.good ? <ShieldCheck size={18} className="shrink-0 mt-0.5 text-emerald-600" />
                      : <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />}
            <span>{msg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
