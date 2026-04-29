import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeDeciduous, Thermometer, Wind, Link as LinkIcon, FlameKindling, RotateCw, RotateCcw } from 'lucide-react';

type FaceKey = 'fuel' | 'heat' | 'oxy' | 'chain';
type Face = { key: FaceKey; label: string; sub: string; color: string; transform: string; Icon: typeof TreeDeciduous };

const FACES: Face[] = [
  { key: 'fuel',  label: 'Fuel',            sub: 'Combustible material',  color: 'linear-gradient(180deg,#92400e,#b45309)', transform: 'rotateY(0deg) translateZ(70px)',   Icon: TreeDeciduous },
  { key: 'heat',  label: 'Heat',            sub: 'Ignition source',        color: 'linear-gradient(180deg,#dc2626,#ef4444)', transform: 'rotateY(120deg) translateZ(70px)', Icon: Thermometer },
  { key: 'oxy',   label: 'Oxygen',          sub: 'Oxidizer (≥16%)',        color: 'linear-gradient(180deg,#0284c7,#0ea5e9)', transform: 'rotateY(240deg) translateZ(70px)', Icon: Wind },
  { key: 'chain', label: 'Chain Reaction',  sub: 'Uninhibited combustion', color: 'linear-gradient(180deg,#7c2d12,#9a3412)', transform: 'rotateX(90deg) translateZ(70px)',  Icon: LinkIcon },
];

const METHOD: Record<FaceKey, { title: string; desc: string }> = {
  fuel:  { title: 'Starvation', desc: 'Remove fuel — cut supply lines, clear vegetation, move combustibles.' },
  heat:  { title: 'Cooling',    desc: 'Remove heat — water absorbs heat until below ignition temperature.' },
  oxy:   { title: 'Smothering', desc: 'Remove oxygen — foam, CO₂, blanket, close the door to starve oxygen.' },
  chain: { title: 'Inhibition', desc: 'Break the chain — dry chemical (ABC), halon replacements interrupt radicals.' },
};

export default function FireTetrahedron() {
  const [removed, setRemoved] = useState<Set<FaceKey>>(new Set());
  const [spinning, setSpinning] = useState(false);

  const toggle = (k: FaceKey) => {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  const lastRemoved = [...removed].pop();
  const method = lastRemoved ? METHOD[lastRemoved] : null;
  const fireOut = removed.size > 0;

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Fire Tetrahedron</h3>
        <p className="mt-1 text-sm text-ink-dim">Click any side to remove that element — fire cannot sustain</p>
      </div>

      <div
        className="relative h-[360px] rounded-2xl overflow-hidden grid place-items-center"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(234,88,12,0.06), transparent 70%)',
          perspective: '1400px',
        }}
      >
        <motion.div
          animate={spinning
            ? { rotateY: [0, 720], rotateX: -15 }
            : { rotateY: [0, 360], rotateX: -15 }}
          transition={spinning
            ? { duration: 2.4, ease: [0.16, 1, 0.3, 1] }
            : { duration: 18, repeat: Infinity, ease: 'linear' }}
          onAnimationComplete={() => spinning && setSpinning(false)}
          className="relative w-[260px] h-[260px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {FACES.map((face) => {
            const isRemoved = removed.has(face.key);
            return (
              <motion.button
                key={face.key}
                onClick={() => toggle(face.key)}
                animate={{
                  opacity: isRemoved ? 0.1 : 1,
                  scale: isRemoved ? 0.6 : 1,
                }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-1/2 left-1/2 w-[180px] h-[180px] flex flex-col items-center justify-center gap-1 text-white text-center cursor-pointer"
                style={{
                  marginTop: -90,
                  marginLeft: -90,
                  clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                  background: face.color,
                  transform: face.transform,
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                <face.Icon size={30} className="mt-10" />
                <span className="font-bold text-sm">{face.label}</span>
                <small className="text-[10px] opacity-90 px-3">{face.sub}</small>
              </motion.button>
            );
          })}
        </motion.div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
          {[48, 42, 56, 36, 50].map((h, i) => (
            <motion.div
              key={i}
              animate={{
                scaleY: fireOut ? 0.3 : [1, 1.25, 1],
                scaleX: fireOut ? 0.4 : [1, 0.9, 1],
                opacity: fireOut ? 0.1 : [0.9, 1, 0.9],
              }}
              transition={{ duration: 1.2 + i * 0.1, repeat: fireOut ? 0 : Infinity, ease: 'easeInOut' }}
              style={{
                width: 24,
                height: h,
                background: 'radial-gradient(circle at 50% 80%, #fef08a 0%, #f97316 30%, #dc2626 70%)',
                borderRadius: '50% 50% 20% 20%',
                filter: `blur(1px) ${fireOut ? 'grayscale(1)' : ''}`,
                transformOrigin: 'bottom',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-center mt-4 flex-wrap">
        <button
          onClick={() => setRemoved(new Set())}
          className="inline-flex items-center gap-2 rounded-lg border border-ink-line bg-white px-4 py-2 text-sm font-semibold text-ink-body hover:bg-surface-alt"
        >
          <RotateCcw size={14} /> Restore All
        </button>
        <button
          onClick={() => setSpinning(true)}
          disabled={spinning}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90 disabled:opacity-60"
        >
          <RotateCw size={14} /> Spin Tetrahedron
        </button>
      </div>

      <AnimatePresence mode="wait">
        {method && (
          <motion.div
            key={lastRemoved}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200/70 px-5 py-3 text-sm text-emerald-900 flex items-start gap-3"
          >
            <FlameKindling size={18} className="shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <strong>{method.title}</strong> — {method.desc}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
