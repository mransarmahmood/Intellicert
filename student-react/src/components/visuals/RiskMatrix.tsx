import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LIKELIHOOD = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'] as const;
const SEVERITY   = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'] as const;

function classify(score: number) {
  if (score <= 4)  return { level: 'Low',     bg: '#16a34a', ring: '#16a34a',
    title: 'Low Risk',      body: 'Acceptable. Maintain current controls. Monitor periodically.' };
  if (score <= 9)  return { level: 'Moderate', bg: '#ca8a04', ring: '#ca8a04',
    title: 'Moderate Risk', body: 'Reasonably practicable measures required. Assign ownership. Review quarterly.' };
  if (score <= 14) return { level: 'High',     bg: '#ea580c', ring: '#ea580c',
    title: 'High Risk',     body: 'Immediate management attention. Additional controls needed before proceeding.' };
  return            { level: 'Extreme',  bg: '#dc2626', ring: '#dc2626',
    title: 'Extreme Risk',  body: 'STOP WORK. Activity cannot proceed until risk is reduced. Executive sign-off required.' };
}

export default function RiskMatrix() {
  const [active, setActive] = useState<{ l: number; s: number } | null>(null);
  const activeInfo = active ? classify(active.l * active.s) : null;

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Risk Assessment Matrix</h3>
        <p className="mt-1 text-sm text-ink-dim">Click any cell to see the risk classification & response</p>
      </div>

      <div
        className="mx-auto grid max-w-[560px] gap-1 p-2"
        style={{ gridTemplateColumns: 'auto repeat(5, 1fr)' }}
      >
        <div className="grid place-items-center text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-dim [writing-mode:vertical-rl] rotate-180 row-span-5">
          Severity →
        </div>
        {Array.from({ length: 5 }).flatMap((_, si) => {
          const s = 5 - si;
          return Array.from({ length: 5 }).map((_, li) => {
            const l = li + 1;
            const c = classify(l * s);
            const isActive = active?.l === l && active?.s === s;
            return (
              <motion.button
                key={`${l}-${s}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: isActive ? 1.08 : 1 }}
                transition={{ delay: (si * 5 + li) * 0.015, type: 'spring', stiffness: 240, damping: 20 }}
                whileHover={{ scale: isActive ? 1.1 : 1.05 }}
                onClick={() => setActive({ l, s })}
                style={{ background: c.bg }}
                className={`aspect-square rounded-lg font-bold text-white text-xs grid place-items-center border-2 ${
                  isActive ? 'border-ink ring-[3px] ring-brand-500/50 z-10' : 'border-transparent'
                }`}
                aria-label={`${LIKELIHOOD[l-1]} × ${SEVERITY[s-1]} = ${c.level}`}
              >
                {l * s}
              </motion.button>
            );
          });
        })}
        <div />
        {LIKELIHOOD.map((lab) => (
          <div key={lab} className="grid place-items-center text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-dim py-1">
            {lab}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-5 pt-5 border-t border-ink-line">
        {[
          { level: 'Low (1–4)',      bg: '#16a34a' },
          { level: 'Moderate (5–9)', bg: '#ca8a04' },
          { level: 'High (10–14)',   bg: '#ea580c' },
          { level: 'Extreme (15–25)',bg: '#dc2626' },
        ].map((l) => (
          <div key={l.level} className="flex items-center gap-2 text-xs font-medium text-ink-body">
            <span className="h-3.5 w-3.5 rounded" style={{ background: l.bg }} />
            {l.level}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeInfo ? `${active!.l}-${active!.s}` : 'empty'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-4 rounded-xl bg-surface-sunken px-5 py-4 min-h-[68px] text-sm text-ink-body"
        >
          {activeInfo ? (
            <>
              <div className="flex items-center gap-3 mb-1.5">
                <span className="h-3.5 w-3.5 rounded" style={{ background: activeInfo.bg }} />
                <strong className="text-ink">{activeInfo.title} — Score {active!.l * active!.s}</strong>
              </div>
              <div className="leading-relaxed">{activeInfo.body}</div>
            </>
          ) : (
            <em className="text-ink-muted">Select a cell above to see the recommended response.</em>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
