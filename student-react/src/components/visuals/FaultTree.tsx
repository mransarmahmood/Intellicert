import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type Gate = 'AND' | 'OR';
type Node = {
  id: string;
  label: string;
  gate?: Gate;
  children?: string[];
  probability?: number; // leaf event
};

// Example: Fire in warehouse
const TREE: Record<string, Node> = {
  top:       { id: 'top',       label: 'Warehouse Fire',          gate: 'AND', children: ['ignition', 'fuel-oxygen'] },
  ignition:  { id: 'ignition',  label: 'Ignition Source Present', gate: 'OR',  children: ['elec-fault', 'hot-work', 'smoking'] },
  'fuel-oxygen': { id: 'fuel-oxygen', label: 'Fuel + Oxygen',     gate: 'AND', children: ['combustible', 'oxygen'] },
  'elec-fault': { id: 'elec-fault', label: 'Electrical Fault',   probability: 0.08 },
  'hot-work':   { id: 'hot-work',   label: 'Hot Work w/o Permit', probability: 0.03 },
  'smoking':    { id: 'smoking',    label: 'Smoking in Area',     probability: 0.02 },
  'combustible':{ id: 'combustible',label: 'Combustible Storage', probability: 0.95 },
  'oxygen':     { id: 'oxygen',     label: 'Atmospheric O₂',      probability: 0.99 },
};

function computeProb(nodeId: string, overrides: Record<string, number>): number {
  const node = TREE[nodeId];
  if (node.probability !== undefined) return overrides[nodeId] ?? node.probability;
  const childProbs = (node.children || []).map((c) => computeProb(c, overrides));
  if (node.gate === 'AND') return childProbs.reduce((a, b) => a * b, 1);
  // OR: 1 - product of (1 - p)
  return 1 - childProbs.reduce((a, b) => a * (1 - b), 1);
}

export default function FaultTree() {
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const prob = useMemo(() => computeProb('top', overrides), [overrides]);

  const setOverride = (id: string, v: number) => setOverrides((o) => ({ ...o, [id]: v }));

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Fault Tree Analysis</h3>
        <p className="mt-1 text-sm text-ink-dim">Top event: Warehouse Fire. Adjust base events — top probability recomputes.</p>
      </div>

      <div className="rounded-xl bg-surface-sunken p-6 overflow-x-auto">
        <svg viewBox="0 0 720 360" width="100%" height="380" className="min-w-[720px]">
          {/* Top event box */}
          <TopEvent x={280} y={20} width={160} height={50} label={TREE.top.label} prob={prob} highlight />

          {/* Edges from top */}
          <EdgeGroup from={[360, 70]} to={[200, 120]} />
          <EdgeGroup from={[360, 70]} to={[520, 120]} />

          {/* AND gate on top */}
          <GateShape x={340} y={80} gate="AND" />

          {/* Layer 2 */}
          <TopEvent x={120} y={120} width={160} height={46} label="Ignition Source" prob={computeProb('ignition', overrides)} />
          <TopEvent x={440} y={120} width={160} height={46} label="Fuel + Oxygen"    prob={computeProb('fuel-oxygen', overrides)} />

          {/* Gates below layer 2 */}
          <GateShape x={180} y={176} gate="OR" />
          <GateShape x={500} y={176} gate="AND" />

          {/* Edges layer 2 -> leaves */}
          <EdgeGroup from={[200, 166]} to={[80,  240]} />
          <EdgeGroup from={[200, 166]} to={[200, 240]} />
          <EdgeGroup from={[200, 166]} to={[320, 240]} />
          <EdgeGroup from={[520, 166]} to={[440, 240]} />
          <EdgeGroup from={[520, 166]} to={[600, 240]} />

          {/* Leaves */}
          <LeafEvent x={20}  y={240} label="Electrical Fault" prob={overrides['elec-fault'] ?? TREE['elec-fault'].probability!} onChange={(v) => setOverride('elec-fault', v)} />
          <LeafEvent x={140} y={240} label="Hot Work w/o Permit" prob={overrides['hot-work'] ?? TREE['hot-work'].probability!} onChange={(v) => setOverride('hot-work', v)} />
          <LeafEvent x={260} y={240} label="Smoking" prob={overrides['smoking'] ?? TREE['smoking'].probability!} onChange={(v) => setOverride('smoking', v)} />
          <LeafEvent x={380} y={240} label="Combustible Storage" prob={overrides['combustible'] ?? TREE['combustible'].probability!} onChange={(v) => setOverride('combustible', v)} />
          <LeafEvent x={540} y={240} label="Atmospheric O₂" prob={overrides['oxygen'] ?? TREE['oxygen'].probability!} onChange={(v) => setOverride('oxygen', v)} />
        </svg>
      </div>

      <div className="mt-5 rounded-xl bg-red-50 border-l-4 border-red-500 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-red-900">Top Event Probability</div>
          <motion.div
            key={prob.toFixed(4)}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="font-display text-2xl font-black tabular-nums text-red-700"
          >
            {(prob * 100).toFixed(2)}%
          </motion.div>
        </div>
        <div className="text-[12px] text-red-900/80 leading-relaxed">
          AND gates multiply child probabilities (all must occur). OR gates use 1 − ∏(1 − pᵢ) (any can occur).
          Drag the sliders on each base event to see how the top probability changes.
        </div>
      </div>
    </div>
  );
}

function GateShape({ x, y, gate }: { x: number; y: number; gate: Gate }) {
  const fill = gate === 'AND' ? '#f59e0b' : '#3b82f6';
  return (
    <g>
      {gate === 'AND' ? (
        <path d={`M ${x} ${y} a 20 20 0 0 1 40 0 v 18 h -40 v -18 z`} fill={fill} stroke="#0f172a" strokeWidth="1.5" />
      ) : (
        <path d={`M ${x} ${y} q 20 -5 40 0 v 18 q -20 -10 -40 0 v -18 z`} fill={fill} stroke="#0f172a" strokeWidth="1.5" />
      )}
      <text x={x + 20} y={y + 13} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0f172a">
        {gate}
      </text>
    </g>
  );
}

function TopEvent({ x, y, width, height, label, prob, highlight }: {
  x: number; y: number; width: number; height: number; label: string; prob: number; highlight?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={highlight ? '#fef2f2' : '#fff'} stroke={highlight ? '#dc2626' : '#0f172a'} strokeWidth={highlight ? 2 : 1.5} rx="4" />
      <text x={x + width / 2} y={y + 22} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{label}</text>
      <text x={x + width / 2} y={y + 38} textAnchor="middle" fontSize="12" fontWeight="900" fill={highlight ? '#dc2626' : '#2563eb'} className="tabular-nums">
        {(prob * 100).toFixed(1)}%
      </text>
    </g>
  );
}

function LeafEvent({ x, y, label, prob, onChange }: { x: number; y: number; label: string; prob: number; onChange: (v: number) => void }) {
  return (
    <g>
      <circle cx={x + 60} cy={y + 25} r="26" fill="#fff" stroke="#0f172a" strokeWidth="1.5" />
      <text x={x + 60} y={y + 21} textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f172a">{label.length > 14 ? label.slice(0, 12) + '…' : label}</text>
      <text x={x + 60} y={y + 35} textAnchor="middle" fontSize="11" fontWeight="900" fill="#2563eb" className="tabular-nums">{(prob * 100).toFixed(0)}%</text>
      <foreignObject x={x + 10} y={y + 58} width="100" height="28">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(prob * 100)}
          onChange={(e) => onChange(parseInt(e.target.value, 10) / 100)}
          style={{ width: '100%', accentColor: '#2563eb' }}
        />
      </foreignObject>
    </g>
  );
}

function EdgeGroup({ from, to }: { from: [number, number]; to: [number, number] }) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const midY = (y1 + y2) / 2;
  return (
    <g>
      <path d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`} fill="none" stroke="#64748b" strokeWidth="1.5" />
    </g>
  );
}
