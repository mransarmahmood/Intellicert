import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Skull, UserMinus, Bandage, AlertTriangle, Play } from 'lucide-react';

const LAYERS = [
  { label: 'Fatality',               count: 1,   color: '#7f1d1d', width: 15, Icon: Skull },
  { label: 'Serious Injury',         count: 10,  color: '#dc2626', width: 37, Icon: UserMinus },
  { label: 'Minor Injury',           count: 30,  color: '#ea580c', width: 59, Icon: Bandage },
  { label: 'Near Miss / Close Call', count: 600, color: '#d97706', width: 81, Icon: AlertTriangle },
];

function AnimatedCount({ value, visible }: { value: number; visible: boolean }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    if (!visible) { mv.set(0); return; }
    const ctl = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => ctl.stop();
  }, [value, visible, mv]);
  return <motion.span>{display}</motion.span>;
}

export default function HeinrichTriangle() {
  const [playKey, setPlayKey] = useState(0);

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Heinrich's Accident Ratio</h3>
        <p className="mt-1 text-sm text-ink-dim">For every 1 fatality, studies show 10 : 30 : 600 lesser events</p>
      </div>

      <div className="flex flex-col items-center gap-1.5 py-4">
        {LAYERS.map((l, i) => (
          <motion.div
            key={`${l.label}-${playKey}`}
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.22, type: 'spring', stiffness: 200, damping: 24 }}
            style={{ width: `${l.width}%`, maxWidth: 560 }}
            className="relative"
          >
            <div
              className="rounded-xl px-5 py-3.5 text-white shadow-md flex items-center gap-3"
              style={{ background: l.color }}
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20 shrink-0">
                <l.Icon size={17} />
              </div>
              <div className="flex-1 font-bold text-[13px]">{l.label}</div>
              <div className="text-2xl font-black tabular-nums drop-shadow">
                <AnimatedCount value={l.count} visible={true} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center mt-5">
        <button
          onClick={() => setPlayKey((k) => k + 1)}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90"
        >
          <Play size={14} /> Replay Animation
        </button>
      </div>

      <div className="mt-5 rounded-xl bg-red-50 border-l-4 border-red-500 px-4 py-3 text-sm text-red-900/90 leading-relaxed">
        <strong>Key insight:</strong> For every fatal injury, there are hundreds of near-misses.
        Investigate near-misses — they're free lessons that reveal systemic gaps before someone gets hurt.
      </div>
    </div>
  );
}
