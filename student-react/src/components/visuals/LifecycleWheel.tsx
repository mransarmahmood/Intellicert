import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Segment = { key: string; label: string; color: string; detail: string };
type Preset = { title: string; center: string; segments: Segment[] };

const PRESETS: Record<string, Preset> = {
  pdca: {
    title: 'PDCA — Continual Improvement',
    center: 'PDCA',
    segments: [
      { key: 'plan',  label: 'Plan',  color: '#2563eb', detail: 'Establish objectives and processes to deliver results aligned with policy. Identify risks and opportunities.' },
      { key: 'do',    label: 'Do',    color: '#059669', detail: 'Implement the plan. Execute the process. Collect data for analysis.' },
      { key: 'check', label: 'Check', color: '#d97706', detail: 'Monitor and measure actual results against expected results. Report the findings.' },
      { key: 'act',   label: 'Act',   color: '#7c3aed', detail: 'Take action to continually improve process performance. Standardize successful changes.' },
    ],
  },
  'osha-vpp': {
    title: 'OSHA VPP Elements',
    center: 'VPP',
    segments: [
      { key: 'leadership', label: 'Leadership', color: '#2563eb', detail: 'Management leadership and commitment visible at every level.' },
      { key: 'worksite',   label: 'Worksite',   color: '#059669', detail: 'Systematic worksite analysis — baseline surveys, change analysis, hazard reporting.' },
      { key: 'hazard',     label: 'Hazards',    color: '#d97706', detail: 'Hazard prevention and control using the Hierarchy of Controls.' },
      { key: 'training',   label: 'Training',   color: '#7c3aed', detail: 'Safety and health training for employees, supervisors, and managers.' },
    ],
  },
};

type Props = { presetKey?: keyof typeof PRESETS };

export default function LifecycleWheel({ presetKey = 'pdca' }: Props) {
  const preset = PRESETS[presetKey];
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const cx = 160, cy = 160, r = 130, rIn = 58;
  const n = preset.segments.length;

  const buildPath = (i: number) => {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2;
    const a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi1 = cx + rIn * Math.cos(a1), yi1 = cy + rIn * Math.sin(a1);
    const xi0 = cx + rIn * Math.cos(a0), yi0 = cy + rIn * Math.sin(a0);
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${rIn} ${rIn} 0 ${large} 0 ${xi0} ${yi0} Z`;
  };

  const labelPos = (i: number) => {
    const a = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
    const rm = (r + rIn) / 2;
    return { x: cx + rm * Math.cos(a), y: cy + rm * Math.sin(a) };
  };

  const active = activeIdx != null ? preset.segments[activeIdx] : null;

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">{preset.title}</h3>
        <p className="mt-1 text-sm text-ink-dim">Click any segment to learn more</p>
      </div>

      <div className="mx-auto relative" style={{ width: 320, height: 320 }}>
        <svg viewBox="0 0 320 320" width="100%" height="100%">
          {preset.segments.map((seg, i) => {
            const isActive = activeIdx === i;
            const isDim = activeIdx != null && !isActive;
            const lp = labelPos(i);
            return (
              <g key={seg.key}>
                <motion.path
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: isDim ? 0.35 : 1, scale: isActive ? 1.03 : 1 }}
                  transition={{ delay: i * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                  whileHover={{ opacity: 0.88 }}
                  style={{ transformOrigin: `${cx}px ${cy}px`, cursor: 'pointer' }}
                  d={buildPath(i)}
                  fill={seg.color}
                  onClick={() => setActiveIdx(isActive ? null : i)}
                />
                <text
                  x={lp.x}
                  y={lp.y + 5}
                  textAnchor="middle"
                  className="font-bold text-white pointer-events-none select-none"
                  fontSize="15"
                  fill="#fff"
                >
                  {seg.label}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={rIn - 4} fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
          <text x={cx} y={cy + 7} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0F172A">
            {preset.center}
          </text>
        </svg>
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mt-4 rounded-xl bg-white border border-ink-line px-5 py-4 max-w-md mx-auto shadow-card"
          >
            <h4 className="font-bold text-[15px] mb-1.5" style={{ color: active.color }}>{active.label}</h4>
            <p className="text-[13px] text-ink-body leading-relaxed">{active.detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
