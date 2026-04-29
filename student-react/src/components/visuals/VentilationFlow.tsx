import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function VentilationFlow() {
  const [cfm, setCfm] = useState(800);   // Volumetric flow rate (CFM)
  const [hoodArea, setHoodArea] = useState(1.5); // ft^2
  const [distance, setDistance] = useState(12);  // inches from source

  // V = Q / (10·X² + A)  — ACGIH capture velocity formula
  const captureVelocity = useMemo(() => {
    const xFt = distance / 12;
    return cfm / (10 * xFt * xFt + hoodArea);
  }, [cfm, hoodArea, distance]);

  // Typical target: 100+ FPM for dusts & light fumes; 200+ for high-velocity operations
  const meets = captureVelocity >= 100;

  const particleCount = 18;
  const particles = useMemo(() => Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    delay: (i * 0.15) % 2.5,
    startX: 170 + ((i * 17) % 40) - 20,
    startY: 180 + ((i * 11) % 30) - 15,
  })), []);

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Industrial Ventilation — Local Exhaust</h3>
        <p className="mt-1 text-sm text-ink-dim">ACGIH capture velocity formula live — adjust CFM, hood, distance.</p>
      </div>

      <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#f8fafc,#e2e8f0)' }}>
        <svg viewBox="0 0 500 260" width="100%" height="260">
          {/* Source / worker */}
          <g>
            <rect x="150" y="200" width="40" height="45" fill="#94a3b8" />
            <rect x="148" y="195" width="44" height="8" fill="#64748b" />
          </g>
          <g transform="translate(90, 170)">
            <circle cx="10" cy="12" r="10" fill="#0f172a" />
            <rect x="4" y="22" width="12" height="30" fill="#0f172a" rx="3" />
            <rect x="0" y="52" width="8" height="28" fill="#0f172a" rx="3" />
            <rect x="12" y="52" width="8" height="28" fill="#0f172a" rx="3" />
            <text x="10" y="95" textAnchor="middle" fontSize="9" fill="#334155" fontWeight="700">Worker</text>
          </g>

          {/* Exhaust hood at top right */}
          <g>
            <polygon points="360,100 440,100 460,30 340,30" fill="#3b82f6" opacity="0.8" />
            <line x1="440" y1="100" x2="360" y2="100" stroke="#1d4ed8" strokeWidth="2" />
            <text x="400" y="70" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="800">HOOD</text>
            <text x="400" y="85" textAnchor="middle" fontSize="9" fill="#fff">{hoodArea} ft²</text>
            {/* Duct */}
            <rect x="390" y="0" width="20" height="30" fill="#64748b" />
            <text x="460" y="20" fontSize="10" fill="#334155" fontWeight="700">to fan →</text>
          </g>

          {/* Capture distance indicator */}
          <g>
            <line x1="170" y1="195" x2="400" y2="100" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4 3" />
            <rect x="275" y="140" width="55" height="16" fill="#fff" stroke="#94a3b8" />
            <text x="302" y="152" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="700">{distance}"</text>
          </g>

          {/* Airflow streamlines */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = 210 - i * 25;
            return (
              <motion.path
                key={i}
                d={`M 170 ${y} Q 280 ${y - 20} 400 100`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                opacity={0.35}
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: -18 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              />
            );
          })}

          {/* Particles */}
          {particles.map((p) => (
            <motion.circle
              key={p.id}
              r="3.5"
              fill="#ea580c"
              opacity={0.8}
              animate={{
                cx: meets ? [p.startX, 400] : [p.startX, p.startX + 60],
                cy: meets ? [p.startY, 100] : [p.startY, p.startY - 30],
                opacity: [0, 0.85, meets ? 0 : 0.5],
              }}
              transition={{
                duration: meets ? 2 : 3.5,
                repeat: Infinity,
                delay: p.delay,
                ease: meets ? 'easeInOut' : 'linear',
              }}
            />
          ))}

          {/* Velocity readout */}
          <g>
            <rect x="10" y="10" width="130" height="50" fill="#fff" stroke="#e2e8f0" rx="6" />
            <text x="18" y="25" fontSize="10" fill="#64748b" fontWeight="700">CAPTURE VELOCITY</text>
            <text x="18" y="48" fontSize="22" fill={meets ? '#16a34a' : '#dc2626'} fontWeight="900" className="tabular-nums">
              {Math.round(captureVelocity)}
              <tspan fontSize="12" fill="#64748b" dx="4">FPM</tspan>
            </text>
          </g>
        </svg>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mt-5">
        <div>
          <div className="flex justify-between text-[12px] font-bold mb-1 text-ink">
            <span>Flow Rate</span><span className="tabular-nums text-blue-600">{cfm} CFM</span>
          </div>
          <input type="range" min={100} max={3000} step={50} value={cfm}
            onChange={(e) => setCfm(parseInt(e.target.value, 10))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#2563eb' }} />
        </div>
        <div>
          <div className="flex justify-between text-[12px] font-bold mb-1 text-ink">
            <span>Hood Area</span><span className="tabular-nums text-blue-600">{hoodArea.toFixed(1)} ft²</span>
          </div>
          <input type="range" min={0.5} max={8} step={0.1} value={hoodArea}
            onChange={(e) => setHoodArea(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#2563eb' }} />
        </div>
        <div>
          <div className="flex justify-between text-[12px] font-bold mb-1 text-ink">
            <span>Distance X</span><span className="tabular-nums text-blue-600">{distance}"</span>
          </div>
          <input type="range" min={3} max={36} step={1} value={distance}
            onChange={(e) => setDistance(parseInt(e.target.value, 10))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#2563eb' }} />
        </div>
      </div>

      <motion.div
        animate={{
          backgroundColor: meets ? '#f0fdf4' : '#fef2f2',
          borderLeftColor: meets ? '#16a34a' : '#dc2626',
          color: meets ? '#15803d' : '#7f1d1d',
        }}
        className="mt-4 rounded-xl border-l-4 px-4 py-3 text-sm flex items-start gap-3"
      >
        {meets ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
        <div>
          <strong>{meets ? 'Adequate capture' : 'Inadequate capture'}</strong>
          {meets
            ? ' — velocity meets typical 100 FPM target for dusts and light fumes. Contaminants are drawn into the hood before reaching the worker.'
            : ` — below 100 FPM target. Increase CFM, reduce hood-to-source distance, or relocate the hood. Contaminants escape toward the worker.`}
        </div>
      </motion.div>

      <div className="mt-3 rounded-xl bg-surface-sunken px-4 py-3 text-xs text-ink-dim leading-relaxed">
        <strong className="text-ink-body">ACGIH formula:</strong> V = Q / (10·X² + A)
        &nbsp;where V = capture velocity (FPM), Q = airflow (CFM), X = distance (ft), A = hood face area (ft²).
        Typical capture targets: 50–100 FPM for low-velocity operations; 200–500 for grinding; 500–2,000 for abrasive blasting.
      </div>
    </div>
  );
}
