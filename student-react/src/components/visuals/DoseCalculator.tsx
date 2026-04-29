import { useMemo } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertOctagon, Ban, Volume2, Clock } from 'lucide-react';

type Zone = {
  level: 'Safe' | 'Action Level' | 'PEL Exceeded' | 'Hazardous';
  color: string;
  bg: string;
  text: string;
  Icon: typeof CheckCircle2;
  message: string;
};

function zoneFor(dose: number): Zone {
  if (dose < 50)  return { level: 'Safe',         color: '#16a34a', bg: '#f0fdf4', text: '#15803d', Icon: CheckCircle2,
    message: 'Below OSHA Action Level. No monitoring required.' };
  if (dose < 100) return { level: 'Action Level', color: '#ca8a04', bg: '#fefce8', text: '#713f12', Icon: AlertTriangle,
    message: 'Action Level (50%+). Hearing conservation program required: monitoring, audiometry, training.' };
  if (dose < 200) return { level: 'PEL Exceeded', color: '#ea580c', bg: '#fff7ed', text: '#7c2d12', Icon: AlertOctagon,
    message: 'PEL Exceeded. Engineering/administrative controls feasible. Hearing protection mandatory.' };
  return          { level: 'Hazardous',      color: '#dc2626', bg: '#fef2f2', text: '#7f1d1d', Icon: Ban,
    message: 'STOP. Dose exceeds 200%. Immediate control required. 115 dBA ceiling for 15 min max.' };
}

export default function DoseCalculator() {
  const [dBA, setDBA] = useState(85);
  const [hours, setHours] = useState(8);

  const { dose, pct, zone } = useMemo(() => {
    const T = 8 / Math.pow(2, (dBA - 90) / 5);
    const d = Math.min(300, (hours / T) * 100);
    return { dose: d, pct: Math.min(100, d), zone: zoneFor(d) };
  }, [dBA, hours]);

  const ARC_LEN = 251.33;
  const offset = ARC_LEN - (pct / 100) * ARC_LEN;

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-5">
        <h3 className="font-display text-xl font-extrabold text-ink">Noise Dose Calculator</h3>
        <p className="mt-1 text-sm text-ink-dim">Adjust sliders for live OSHA dose — 100% = max allowable 8-hr exposure</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_220px] items-center">
        <div className="flex flex-col gap-5">
          <div>
            <label className="flex items-center justify-between mb-1.5 text-[13px] font-bold text-ink">
              <span className="flex items-center gap-2"><Volume2 size={14} /> Noise Level</span>
              <span className="text-brand-600 text-base tabular-nums">{dBA} dBA</span>
            </label>
            <input
              type="range"
              min={80}
              max={115}
              step={1}
              value={dBA}
              onChange={(e) => setDBA(parseInt(e.target.value, 10))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer range-input"
              style={{
                background: 'linear-gradient(90deg,#16a34a 0%,#ca8a04 33%,#ea580c 66%,#dc2626 100%)',
              }}
            />
            <div className="flex justify-between text-[10px] text-ink-muted mt-1 font-medium">
              <span>80 dBA</span><span>115 dBA</span>
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between mb-1.5 text-[13px] font-bold text-ink">
              <span className="flex items-center gap-2"><Clock size={14} /> Duration</span>
              <span className="text-brand-600 text-base tabular-nums">{hours.toFixed(1)} hrs</span>
            </label>
            <input
              type="range"
              min={0.5}
              max={12}
              step={0.5}
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer range-input"
              style={{
                background: 'linear-gradient(90deg,#16a34a 0%,#ca8a04 33%,#ea580c 66%,#dc2626 100%)',
              }}
            />
            <div className="flex justify-between text-[10px] text-ink-muted mt-1 font-medium">
              <span>0.5 hr</span><span>12 hr</span>
            </div>
          </div>
        </div>

        <div>
          <svg viewBox="0 0 200 120" className="w-full max-w-[220px] mx-auto">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e2e8f0" strokeWidth="16" strokeLinecap="round" />
            <motion.path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={zone.color}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={ARC_LEN}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
            <text x="100" y="88" textAnchor="middle" fontSize="28" fontWeight="800" fill="#0F172A">
              {Math.round(dose)}%
            </text>
            <text x="100" y="108" textAnchor="middle" fontSize="11" fill="#64748B" fontWeight="600">
              OSHA Dose
            </text>
          </svg>
        </div>
      </div>

      <motion.div
        animate={{ background: zone.bg, borderLeftColor: zone.color, color: zone.text }}
        transition={{ duration: 0.25 }}
        className="mt-5 rounded-xl border-l-4 px-4 py-3 text-sm flex items-start gap-3"
      >
        <zone.Icon size={18} className="shrink-0 mt-0.5" />
        <div><strong>{zone.level}</strong> — {zone.message}</div>
      </motion.div>

      <div className="mt-4 rounded-xl bg-surface-sunken px-4 py-3 text-xs text-ink-dim leading-relaxed">
        <strong className="text-ink-body">OSHA formula:</strong> D = 100 × C/T, where T = 8 / 2
        <sup>(L-90)/5</sup> hours at level L dBA. PEL = 90 dBA TWA for 8 hrs. AL = 85 dBA TWA. Doubling every +5 dBA.
      </div>

      <style>{`
        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #2563eb;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(37,99,235,0.3);
        }
        .range-input::-moz-range-thumb {
          width: 22px; height: 22px;
          border-radius: 50%;
          background: #fff;
          border: 3px solid #2563eb;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
