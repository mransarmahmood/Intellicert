import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, RotateCcw, Play } from 'lucide-react';

type Node = {
  key: string;
  title: string;
  sub: string;
  color: string;
  detail: string;
};

type Preset = {
  title: string;
  nodes: Node[];
};

const PRESETS: Record<string, Preset> = {
  'incident-investigation': {
    title: 'Incident Investigation Process',
    nodes: [
      { key: 'secure',  title: 'Secure Scene',    sub: 'Preserve evidence',         color: '#dc2626', detail: 'Restrict access, protect physical evidence, ensure medical care for injured, and assess ongoing hazards before any further activity.' },
      { key: 'notify',  title: 'Notify',          sub: 'Internal + regulator',      color: '#ea580c', detail: 'Notify management, safety committee, and regulators per OSHA 29 CFR 1904.39 (in-patient hospitalization within 24h; fatality within 8h).' },
      { key: 'gather',  title: 'Gather Evidence', sub: 'Facts, photos, witnesses',  color: '#d97706', detail: 'Collect physical evidence, photographs, documents, and witness statements. Interview soon — memory fades within 24–72h.' },
      { key: 'analyze', title: 'Analyze Cause',   sub: '5 Whys / Fishbone',         color: '#2563eb', detail: 'Use systematic root-cause analysis. Identify immediate, underlying, and systemic causes.' },
      { key: 'capa',    title: 'CAPA',            sub: 'Corrective + preventive',   color: '#059669', detail: 'Develop Corrective Actions (fix this incident) and Preventive Actions (prevent recurrence). Assign owners and due dates.' },
      { key: 'verify',  title: 'Verify',          sub: 'Confirm effectiveness',     color: '#7c3aed', detail: 'After implementation, verify the controls work. Audit, observation, trending. Close only when effectiveness is confirmed.' },
    ],
  },
  'permit-to-work': {
    title: 'Permit-to-Work Lifecycle',
    nodes: [
      { key: 'request', title: 'Request', sub: 'Job + hazards',         color: '#2563eb', detail: 'Work originator documents scope, location, tools, and known hazards. Submitted to permit authority for review.' },
      { key: 'assess',  title: 'Assess',  sub: 'Hazard + control review', color: '#d97706', detail: 'Permit authority verifies controls match hazards. Isolation, LOTO, hot-work, confined-space requirements are confirmed.' },
      { key: 'issue',   title: 'Issue',   sub: 'Authorize + sign',        color: '#059669', detail: 'Permit is signed by issuer and receiver. Job cannot begin without all listed precautions in place.' },
      { key: 'monitor', title: 'Monitor', sub: 'Supervise + reassess',    color: '#ea580c', detail: 'Supervisor monitors conditions. Any change requires re-assessment or suspension of the permit.' },
      { key: 'close',   title: 'Close',   sub: 'Verify + sign off',       color: '#7c3aed', detail: 'Work complete → verify area is safe. Receiver and issuer sign to close.' },
    ],
  },
  'risk-assessment': {
    title: 'Risk Assessment Workflow',
    nodes: [
      { key: 'identify', title: 'Identify Hazards', sub: 'What can go wrong?',    color: '#dc2626', detail: 'Walk-throughs, task analysis, incident history, SDS review, employee input.' },
      { key: 'assess',   title: 'Assess Risk',      sub: 'Likelihood × Severity', color: '#d97706', detail: 'Rate each hazard on a risk matrix. Consider exposed population, frequency, and existing controls.' },
      { key: 'control',  title: 'Apply Controls',   sub: 'Hierarchy of Controls', color: '#059669', detail: 'Select controls from the Hierarchy: Elimination → Substitution → Engineering → Admin → PPE.' },
      { key: 'record',   title: 'Record',           sub: 'Register + communicate', color: '#2563eb', detail: 'Maintain a risk register with hazard, score, controls, owner, and review date.' },
      { key: 'review',   title: 'Review',           sub: 'When triggers occur',   color: '#7c3aed', detail: 'Review on schedule and after changes: new equipment, process change, incident, regulation update.' },
    ],
  },
};

type Props = { presetKey?: keyof typeof PRESETS };

export default function ProcessFlow({ presetKey = 'incident-investigation' }: Props) {
  const preset = PRESETS[presetKey];
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  const setNext = useCallback(() => {
    setActiveIdx((i) => Math.min(preset.nodes.length - 1, i + 1));
  }, [preset.nodes.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setNext();
      else if (e.key === 'ArrowLeft') setActiveIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setNext]);

  const active = activeIdx >= 0 ? preset.nodes[activeIdx] : null;

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-xl font-extrabold text-ink">{preset.title}</h3>
          <p className="text-sm text-ink-dim">Click a step or use ← → keys. Play for auto-walkthrough.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setActiveIdx(-1);
              preset.nodes.forEach((_, i) =>
                setTimeout(() => setActiveIdx(i), (i + 1) * 700)
              );
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90"
          >
            <Play size={14} /> Play
          </button>
          <button
            onClick={() => setActiveIdx(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-line bg-white px-4 py-2 text-sm font-semibold text-ink-body hover:bg-surface-alt"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-b from-surface-sunken to-white p-6 overflow-x-auto">
        <div className="flex items-stretch min-w-max">
          {preset.nodes.map((n, i) => {
            const isActive = activeIdx === i;
            const isPast = activeIdx > i;
            const isLast = i === preset.nodes.length - 1;
            return (
              <div key={n.key} className="flex items-stretch">
                <motion.button
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 22 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setActiveIdx(i)}
                  className={`w-[180px] flex-shrink-0 rounded-2xl border-2 bg-white p-4 text-left shadow-card cursor-pointer ${
                    isActive
                      ? 'border-blue-500 ring-4 ring-blue-500/15'
                      : isPast
                      ? 'border-emerald-500/50'
                      : 'border-ink-line'
                  }`}
                >
                  <motion.div
                    animate={{ scale: isActive ? 1.05 : 1 }}
                    className="mb-3 grid h-10 w-10 place-items-center rounded-xl text-white"
                    style={{ background: n.color }}
                  >
                    <span className="text-sm font-bold">{i + 1}</span>
                  </motion.div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-muted mb-1">
                    Step {i + 1}
                  </div>
                  <div className="font-bold text-sm text-ink mb-1">{n.title}</div>
                  <div className="text-xs text-ink-dim leading-relaxed">{n.sub}</div>
                </motion.button>
                {!isLast && (
                  <div className="w-10 flex items-center justify-center shrink-0">
                    <motion.div
                      animate={{ opacity: isPast ? 1 : 0.4 }}
                      className={isPast ? 'text-emerald-500' : 'text-ink-muted'}
                    >
                      <ArrowRight size={20} />
                    </motion.div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="mt-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/60 px-5 py-4 border border-blue-200/60"
          >
            <h4 className="font-bold text-base mb-1" style={{ color: active.color }}>
              {active.title}
            </h4>
            <p className="text-sm text-ink-body leading-relaxed">{active.detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
