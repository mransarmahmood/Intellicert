import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShieldCheck, AlertTriangle, RotateCcw, Play } from 'lucide-react';

type Layer = { key: string; label: string; strong: boolean };

const DEFAULT_LAYERS: Layer[] = [
  { key: 'eng',  label: 'Engineering Controls',  strong: false },
  { key: 'proc', label: 'Procedures & Training', strong: false },
  { key: 'sup',  label: 'Supervision',           strong: false },
  { key: 'ppe',  label: 'PPE',                   strong: false },
];

type ArrowState = 'idle' | 'blocked' | 'through';

export default function DefenseLayers() {
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [arrow, setArrow] = useState<ArrowState>('idle');
  const [msg, setMsg] = useState<{ good: boolean; text: string } | null>(null);

  const toggle = (key: string) => {
    setLayers((prev) => prev.map((l) => (l.key === key ? { ...l, strong: !l.strong } : l)));
  };

  const launch = () => {
    setArrow('idle');
    setMsg(null);
    const strongCount = layers.filter((l) => l.strong).length;
    setTimeout(() => {
      if (strongCount >= 3) {
        setArrow('blocked');
        setMsg({ good: true, text: `Hazard blocked! ${strongCount}/${layers.length} layers strong.` });
      } else {
        setArrow('through');
        setMsg({ good: false, text: `Hazard passed through. Only ${strongCount}/${layers.length} layers strong — incident occurs.` });
      }
    }, 80);
  };

  const strengthenAll = () => {
    setLayers((prev) => prev.map((l) => ({ ...l, strong: true })));
    setMsg({ good: true, text: 'All layers reinforced. Try launching the hazard now.' });
  };

  const reset = () => {
    setLayers(DEFAULT_LAYERS);
    setArrow('idle');
    setMsg(null);
  };

  const arrowX = arrow === 'idle' ? 0 : arrow === 'blocked' ? 45 : 95;
  const arrowBg = arrow === 'blocked' ? '#16a34a' : '#dc2626';

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Defense in Depth (Swiss Cheese)</h3>
        <p className="mt-1 text-sm text-ink-dim">Strengthen controls (click a layer) to block the hazard pathway</p>
      </div>

      <div className="rounded-2xl p-6 border border-orange-500/10" style={{ background: 'linear-gradient(180deg, #fff7ed, #fff)' }}>
        <div className="relative h-[260px] flex items-center justify-center overflow-hidden" style={{ perspective: '1200px' }}>
          {layers.map((l, i) => (
            <motion.button
              key={l.key}
              onClick={() => toggle(l.key)}
              animate={{
                backgroundColor: l.strong ? 'rgba(34, 197, 94, 0.85)' : 'rgba(250, 204, 21, 0.9)',
              }}
              transition={{ duration: 0.4 }}
              style={{
                width: 220, height: 150,
                borderRadius: 18,
                position: 'absolute',
                left: `calc(50% - 110px)`,
                transform: `translateX(${(i - (layers.length - 1) / 2) * 72}px) translateZ(${i * 4}px)`,
                boxShadow: '0 6px 16px rgba(15,23,42,0.15)',
                cursor: 'pointer',
              }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-ink text-white px-2.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap">
                {l.label}
              </div>
              {/* Holes */}
              <div className="absolute inset-0 rounded-[18px] pointer-events-none" style={{
                backgroundImage: l.strong
                  ? 'radial-gradient(circle at 25% 30%, transparent 6px, rgba(34,197,94,0.85) 8px), radial-gradient(circle at 70% 65%, transparent 8px, rgba(34,197,94,0.85) 10px)'
                  : 'radial-gradient(circle at 25% 30%, transparent 10px, rgba(250,204,21,0.9) 12px), radial-gradient(circle at 70% 25%, transparent 14px, rgba(250,204,21,0.9) 16px), radial-gradient(circle at 55% 65%, transparent 8px, rgba(250,204,21,0.9) 10px), radial-gradient(circle at 20% 75%, transparent 12px, rgba(250,204,21,0.9) 14px), radial-gradient(circle at 85% 70%, transparent 10px, rgba(250,204,21,0.9) 12px)',
              }} />
            </motion.button>
          ))}

          <motion.div
            animate={{ left: `${arrowX}%`, backgroundColor: arrowBg }}
            transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
            className="absolute top-1/2 w-10 h-10 rounded-full grid place-items-center text-white text-lg z-10"
            style={{
              marginTop: -20,
              boxShadow: '0 8px 20px rgba(15,23,42,0.2)',
            }}
          >
            <Zap size={20} />
          </motion.div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <button onClick={launch} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90">
            <Play size={14} /> Launch Hazard
          </button>
          <button onClick={strengthenAll} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            <ShieldCheck size={14} /> Strengthen All
          </button>
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-ink-line bg-white px-4 py-2 text-sm font-semibold text-ink-body hover:bg-surface-alt">
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`mt-3 text-center text-sm flex items-center justify-center gap-2 ${
                msg.good ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {msg.good ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
