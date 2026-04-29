import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play } from 'lucide-react';

type Step = { t: string; label: string; detail: string };
type Preset = { title: string; steps: Step[] };

const PRESETS: Record<string, Preset> = {
  'emergency-response': {
    title: 'Emergency Response Timeline',
    steps: [
      { t: '0s',      label: 'Detect',     detail: 'Event detected — alarm, observation, sensor. Earliest warning drives everything that follows.' },
      { t: '0–30s',   label: 'Alert',      detail: 'Public alarm activated. Supervisors notified. Automated systems engage (sprinklers, shutdowns).' },
      { t: '1–3 min', label: 'Evacuate',   detail: 'Occupants move to rally points. Wardens sweep areas. Disabled-person assistance procedures engaged.' },
      { t: '3–5 min', label: 'First Aid',  detail: 'Trained responders provide first aid, CPR, AED. Triage if mass-casualty.' },
      { t: '5–10 min',label: 'Account',    detail: 'Roll call at rally points. Missing persons reported to incident commander.' },
      { t: '10+ min', label: 'Extinguish', detail: 'Fire brigade arrives. Incident command transferred. Facility team supports.' },
      { t: 'Post',    label: 'Investigate',detail: 'Scene secured. Root-cause investigation. Debrief. Lessons learned fed into ERP update.' },
    ],
  },
};

type Props = { presetKey?: keyof typeof PRESETS };

export default function TimelineExplainer({ presetKey = 'emergency-response' }: Props) {
  const preset = PRESETS[presetKey];
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const playingRef = useRef(false);

  function play() {
    if (playingRef.current) return;
    playingRef.current = true;
    setActiveIdx(-1);
    preset.steps.forEach((_, i) => {
      setTimeout(() => {
        setActiveIdx(i);
        if (i === preset.steps.length - 1) playingRef.current = false;
      }, (i + 1) * 1400);
    });
  }

  const n = preset.steps.length;
  const progressPct = activeIdx >= 0 && n > 1 ? (activeIdx / (n - 1)) * 100 : 0;
  const active = activeIdx >= 0 ? preset.steps[activeIdx] : null;

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-xl font-extrabold text-ink">{preset.title}</h3>
          <p className="text-sm text-ink-dim">Click a step or use Play to walk through the sequence</p>
        </div>
        <button onClick={play} className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-ink/90">
          <Play size={14} /> Play Sequence
        </button>
      </div>

      <div className="relative py-14">
        <div className="relative h-1 rounded-full bg-ink-line mx-6 my-4">
          <motion.div
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #2563eb, #7c3aed)' }}
          />
          {preset.steps.map((s, i) => {
            const isActive = activeIdx === i;
            const isComplete = activeIdx > i;
            const pos = (i / (n - 1)) * 100;
            return (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="absolute -top-3.5 -translate-x-1/2 cursor-pointer flex flex-col items-center gap-2"
                style={{ left: `${pos}%` }}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.2 : 1,
                    backgroundColor: isComplete ? '#16a34a' : isActive ? '#2563eb' : '#fff',
                    borderColor: isComplete ? '#16a34a' : isActive ? '#2563eb' : '#cbd5e1',
                    color: isComplete || isActive ? '#fff' : '#64748b',
                  }}
                  transition={{ duration: 0.3 }}
                  className="grid h-7 w-7 place-items-center rounded-full border-[3px] text-[11px] font-black"
                >
                  {i + 1}
                </motion.div>
                <div className={`absolute top-9 whitespace-nowrap text-[10px] font-semibold leading-tight text-center ${
                  isActive ? 'text-blue-600' : 'text-ink-dim'
                }`} style={{ maxWidth: 90 }}>
                  {s.t}<br />{s.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {active ? (
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mt-6 rounded-xl bg-white border border-ink-line px-5 py-4 shadow-card min-h-[90px]"
          >
            <div className="font-bold text-ink text-base mb-1">
              <span className="text-blue-600">{active.t}</span> — {active.label}
            </div>
            <div className="text-sm text-ink-body leading-relaxed">{active.detail}</div>
          </motion.div>
        ) : (
          <div className="mt-6 rounded-xl bg-surface-sunken px-5 py-4 text-sm text-ink-muted italic min-h-[90px]">
            Select a step to see the details.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
