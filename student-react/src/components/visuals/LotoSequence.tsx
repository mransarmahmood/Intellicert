import { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Power, Unplug, Lock, Zap, CheckCheck, Wrench, RotateCw, Play } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Step = { label: string; icon: LucideIcon; detail: string };

const STEPS: Step[] = [
  { label: 'Notify Employees',      icon: Megaphone, detail: 'Announce shutdown — affected employees must know.' },
  { label: 'Shutdown Equipment',    icon: Power,     detail: 'Normal stop procedure — follow OEM process.' },
  { label: 'Isolate Energy',        icon: Unplug,    detail: 'Disconnect ALL energy sources — electrical, pneumatic, hydraulic, gravity, stored.' },
  { label: 'Apply Lock & Tag',      icon: Lock,      detail: 'Each authorized worker applies own lock. One worker, one lock, one key.' },
  { label: 'Dissipate Stored',      icon: Zap,       detail: 'Bleed, block, ground, discharge capacitors. No residual energy allowed.' },
  { label: 'Verify Zero Energy',    icon: CheckCheck,detail: 'TEST the start button. Use meters on electrical circuits. Confirm zero before work.' },
  { label: 'Perform Work',          icon: Wrench,    detail: 'Safe to service. Lock stays on throughout entire maintenance window.' },
  { label: 'Remove & Restart',      icon: RotateCw,  detail: 'Reverse order: clear tools, warn employees, remove own lock, re-energize.' },
];

export default function LotoSequence() {
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  function play() {
    setActiveIdx(-1);
    STEPS.forEach((_, i) => setTimeout(() => setActiveIdx(i), (i + 1) * 1100));
  }

  const active = activeIdx >= 0 ? STEPS[activeIdx] : null;
  const lockEngaged = activeIdx === 3 || activeIdx === 6;

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-xl font-extrabold text-ink">LOTO — 29 CFR 1910.147</h3>
          <p className="text-sm text-ink-dim">Lockout / Tagout sequence walkthrough</p>
        </div>
        <button onClick={play} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90">
          <Play size={14} /> Walk Through
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 my-4">
        {STEPS.map((s, i) => {
          const isActive = activeIdx === i;
          const isDone = activeIdx > i;
          return (
            <motion.button
              key={i}
              onClick={() => setActiveIdx(i)}
              whileHover={{ y: -3 }}
              animate={{
                scale: isActive ? 1.04 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              className={`relative rounded-xl border-2 bg-white p-3 text-center cursor-pointer transition-colors ${
                isActive ? 'border-blue-500 bg-blue-50 shadow-[0_8px_20px_rgba(37,99,235,0.25)]'
                : isDone  ? 'border-emerald-500 bg-emerald-50/60'
                           : 'border-ink-line'
              }`}
            >
              <div className="absolute top-1.5 right-2 text-[10px] font-black text-ink-muted">
                {i + 1}
              </div>
              <motion.div
                animate={{
                  backgroundColor: isActive ? '#2563eb' : isDone ? '#16a34a' : '#f1f5f9',
                  color: isActive || isDone ? '#fff' : '#64748b',
                }}
                className="mx-auto grid h-9 w-9 place-items-center rounded-lg mb-1.5"
              >
                <s.icon size={16} />
              </motion.div>
              <div className="text-[10px] font-bold text-ink leading-tight">{s.label}</div>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-surface-sunken border border-ink-line px-5 py-4 min-h-[88px]">
        {active ? (
          <div className="flex items-start gap-3">
            <motion.div
              key={`lock-${activeIdx}`}
              animate={lockEngaged ? { rotate: [0, -8, 6, -4, 3, -2, 0] } : {}}
              transition={{ duration: 0.7 }}
              className={`grid h-11 w-11 place-items-center rounded-xl shrink-0 ${
                lockEngaged ? 'bg-red-50 text-red-600' : 'bg-ink-line/60 text-ink-dim'
              }`}
            >
              <Lock size={18} />
            </motion.div>
            <div>
              <div className="font-extrabold text-ink text-[15px]">{active.label}</div>
              <div className="text-sm text-ink-body leading-relaxed mt-1">{active.detail}</div>
            </div>
          </div>
        ) : (
          <em className="text-ink-muted text-sm">Click a step or press Walk Through to see the procedure.</em>
        )}
      </div>
    </div>
  );
}
