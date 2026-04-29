import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

type Node = { id: string; x: number; y: number; r: number; delay: number; label: string; color: string };
type Edge = { from: string; to: string; delay: number };

const NODES: Node[] = [
  { id: 'root',       x: 100, y: 160, r: 28, delay: 0, label: 'UNSAFE',  color: '#991b1b' },
  { id: 'nearmiss',   x: 220, y: 80,  r: 22, delay: 1, label: 'NEAR MISS', color: '#dc2626' },
  { id: 'damage',     x: 220, y: 160, r: 22, delay: 1, label: 'DAMAGE',  color: '#dc2626' },
  { id: 'delay',      x: 220, y: 240, r: 22, delay: 1, label: 'DELAY',   color: '#dc2626' },
  { id: 'invest',     x: 380, y: 60,  r: 20, delay: 2, label: 'INVEST',  color: '#ea580c' },
  { id: 'repair',     x: 380, y: 160, r: 20, delay: 2, label: 'REPAIR',  color: '#ea580c' },
  { id: 'morale',     x: 380, y: 260, r: 20, delay: 2, label: 'MORALE',  color: '#ea580c' },
  { id: 'osha',       x: 540, y: 100, r: 18, delay: 3, label: 'OSHA',    color: '#d97706' },
  { id: 'insure',     x: 540, y: 160, r: 18, delay: 3, label: 'INSURE',  color: '#d97706' },
  { id: 'reput',      x: 540, y: 220, r: 18, delay: 3, label: 'REPUTE',  color: '#d97706' },
];

const EDGES: Edge[] = [
  { from: 'root',     to: 'nearmiss', delay: 0 },
  { from: 'root',     to: 'damage',   delay: 0 },
  { from: 'root',     to: 'delay',    delay: 0 },
  { from: 'nearmiss', to: 'invest',   delay: 1 },
  { from: 'damage',   to: 'repair',   delay: 1 },
  { from: 'delay',    to: 'morale',   delay: 1 },
  { from: 'invest',   to: 'osha',     delay: 2 },
  { from: 'repair',   to: 'insure',   delay: 2 },
  { from: 'morale',   to: 'reput',    delay: 2 },
];

function nodeById(id: string) { return NODES.find((n) => n.id === id)!; }

export default function RippleCausal() {
  const [wave, setWave] = useState<number>(-1);

  const play = useCallback(() => {
    setWave(-1);
    [0, 1, 2, 3].forEach((w) => setTimeout(() => setWave(w), (w + 1) * 600));
  }, []);

  useEffect(() => {
    const t = setTimeout(play, 400);
    return () => clearTimeout(t);
  }, [play]);

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Incident Ripple Effect</h3>
        <p className="mt-1 text-sm text-ink-dim">One unsafe act propagates through systems — click Trigger</p>
      </div>

      <div className="rounded-xl p-3" style={{ background: 'linear-gradient(180deg, #f8fafc, #fff)' }}>
        <svg viewBox="0 0 600 320" width="100%" height="320" className="overflow-visible">
          <defs>
            <filter id="rc-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {EDGES.map((e) => {
            const a = nodeById(e.from);
            const b = nodeById(e.to);
            const isLit = wave >= e.delay;
            return (
              <motion.line
                key={`${e.from}-${e.to}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                animate={{
                  stroke: isLit ? '#dc2626' : '#e2e8f0',
                  strokeWidth: isLit ? 3 : 2,
                }}
                transition={{ duration: 0.5 }}
                style={{ strokeDasharray: isLit ? '6 3' : undefined }}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map((n) => {
            const isLit = wave >= n.delay;
            return (
              <g key={n.id}>
                <motion.circle
                  cx={n.x} cy={n.y}
                  animate={{
                    r: isLit ? n.r : n.r * 0.7,
                    fill: isLit ? n.color : '#cbd5e1',
                  }}
                  transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                  filter={isLit ? 'url(#rc-glow)' : undefined}
                />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fontSize={n.r > 22 ? 10 : n.r > 18 ? 9 : 7}
                  fill="#fff"
                  fontWeight="800"
                  className="pointer-events-none select-none"
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="text-center mt-3">
        <button onClick={play} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90">
          <Play size={14} /> Trigger Ripple
        </button>
      </div>
    </div>
  );
}
