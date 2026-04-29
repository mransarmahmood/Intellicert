import { useState, useEffect, useMemo } from 'react';
import { Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

type Fault = 'none' | 'short' | 'ground' | 'open';

export default function ElectricalSchematic() {
  const [voltage, setVoltage] = useState(120);
  const [resistance, setResistance] = useState(60);
  const [gfci, setGfci] = useState(true);
  const [fault, setFault] = useState<Fault>('none');

  // Ohm's law I = V/R
  const baseCurrent = voltage / resistance;
  const current = useMemo(() => {
    if (fault === 'short')  return Math.min(1000, voltage / 0.1); // near short
    if (fault === 'ground') return gfci ? 0.002 : voltage / 1000;
    if (fault === 'open')   return 0;
    return baseCurrent;
  }, [voltage, resistance, fault, baseCurrent, gfci]);

  const power = voltage * current;
  const gfciTrips = gfci && fault === 'ground' && current > 0.005;
  const dangerous = current > 0.5;

  // Animate current flow dots
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (fault === 'open' || gfciTrips) return;
    const t = setInterval(() => setPulse((p) => p + 1), 80);
    return () => clearInterval(t);
  }, [fault, gfciTrips]);

  const flowing = fault !== 'open' && !gfciTrips;

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">Electrical Circuit Simulator</h3>
        <p className="mt-1 text-sm text-ink-dim">Ohm's Law live — I = V / R. Toggle GFCI, inject faults, watch current.</p>
      </div>

      <div className="rounded-xl bg-surface-sunken p-6">
        <svg viewBox="0 0 500 240" width="100%" height="240">
          {/* Wires — top */}
          <line x1="50" y1="50"  x2="450" y2="50"  stroke="#0f172a" strokeWidth="3" />
          <line x1="50" y1="190" x2="450" y2="190" stroke="#0f172a" strokeWidth="3" />
          {/* Left — source */}
          <line x1="50" y1="50" x2="50" y2="80" stroke="#0f172a" strokeWidth="3" />
          <line x1="50" y1="160" x2="50" y2="190" stroke="#0f172a" strokeWidth="3" />
          {/* Battery / source */}
          <g>
            <line x1="35" y1="90"  x2="65" y2="90"  stroke="#0f172a" strokeWidth="4" />
            <line x1="40" y1="105" x2="60" y2="105" stroke="#0f172a" strokeWidth="3" />
            <line x1="35" y1="120" x2="65" y2="120" stroke="#0f172a" strokeWidth="4" />
            <line x1="40" y1="135" x2="60" y2="135" stroke="#0f172a" strokeWidth="3" />
            <line x1="35" y1="150" x2="65" y2="150" stroke="#0f172a" strokeWidth="4" />
            <text x="22" y="100" fontSize="11" fill="#2563eb" fontWeight="700">+{voltage}V</text>
          </g>
          {/* Right — load (resistor) */}
          <line x1="450" y1="50" x2="450" y2="100" stroke="#0f172a" strokeWidth="3" />
          <line x1="450" y1="140" x2="450" y2="190" stroke="#0f172a" strokeWidth="3" />
          <rect x="435" y="100" width="30" height="40" fill="#fff" stroke="#0f172a" strokeWidth="2" />
          <text x="450" y="125" textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="700">
            {resistance}Ω
          </text>

          {/* GFCI — inline at top */}
          <rect x="240" y="32" width="40" height="36" fill={gfci ? (gfciTrips ? '#dc2626' : '#16a34a') : '#94a3b8'} stroke="#0f172a" strokeWidth="2" rx="4" />
          <text x="260" y="55" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="700">GFCI</text>
          <text x="260" y="84" textAnchor="middle" fontSize="9" fill="#64748b">{gfci ? (gfciTrips ? 'TRIPPED' : 'Ready') : 'Disabled'}</text>

          {/* Fault indicators */}
          {fault === 'short' && (
            <g>
              <line x1="340" y1="50" x2="340" y2="190" stroke="#dc2626" strokeWidth="4" strokeDasharray="4 3">
                <animate attributeName="stroke-dashoffset" values="0;-14" dur="0.3s" repeatCount="indefinite" />
              </line>
              <text x="340" y="40" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="800">SHORT</text>
            </g>
          )}
          {fault === 'ground' && (
            <g>
              <line x1="370" y1="190" x2="370" y2="225" stroke={gfciTrips ? '#16a34a' : '#dc2626'} strokeWidth="4" strokeDasharray="3 3">
                <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.4s" repeatCount="indefinite" />
              </line>
              {/* Ground symbol */}
              <line x1="358" y1="225" x2="382" y2="225" stroke="#0f172a" strokeWidth="3" />
              <line x1="362" y1="230" x2="378" y2="230" stroke="#0f172a" strokeWidth="3" />
              <line x1="366" y1="235" x2="374" y2="235" stroke="#0f172a" strokeWidth="3" />
              <text x="395" y="222" fontSize="10" fill={gfciTrips ? '#16a34a' : '#dc2626'} fontWeight="800">
                {gfciTrips ? 'GROUND FAULT — GFCI TRIPPED' : 'GROUND FAULT'}
              </text>
            </g>
          )}
          {fault === 'open' && (
            <g>
              <rect x="335" y="42" width="20" height="16" fill="#fff" stroke="#dc2626" strokeWidth="2" />
              <text x="345" y="38" textAnchor="middle" fontSize="10" fill="#dc2626" fontWeight="800">OPEN</text>
            </g>
          )}

          {/* Flowing current dots */}
          {flowing && [70, 120, 170, 220, 300, 380, 430].map((x, i) => (
            <circle
              key={i}
              cx={x + ((pulse * 4 + i * 60) % 390)}
              cy={50}
              r={4}
              fill={dangerous ? '#dc2626' : '#facc15'}
              opacity={0.85}
            />
          ))}
          {flowing && [70, 120, 170, 220, 300, 380, 430].map((_x, i) => (
            <circle
              key={`b-${i}`}
              cx={450 - ((pulse * 4 + i * 60) % 390)}
              cy={190}
              r={4}
              fill={dangerous ? '#dc2626' : '#facc15'}
              opacity={0.85}
            />
          ))}
        </svg>

        {/* Readout panel */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-xl bg-white border border-ink-line px-4 py-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Current</div>
            <div className={`font-display text-xl font-black tabular-nums mt-1 ${dangerous ? 'text-red-600' : 'text-emerald-600'}`}>
              {current < 0.01 ? current.toFixed(3) : current.toFixed(2)} A
            </div>
          </div>
          <div className="rounded-xl bg-white border border-ink-line px-4 py-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Power</div>
            <div className="font-display text-xl font-black tabular-nums mt-1 text-ink">{power.toFixed(0)} W</div>
          </div>
          <div className="rounded-xl bg-white border border-ink-line px-4 py-3 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-dim">Status</div>
            <div className={`font-bold text-[13px] mt-1 flex items-center justify-center gap-1 ${
              gfciTrips ? 'text-emerald-600' : dangerous ? 'text-red-600' : 'text-ink-body'
            }`}>
              {gfciTrips ? (<><ShieldCheck size={14} /> SAFE</>)
                : dangerous ? (<><AlertTriangle size={14} /> DANGER</>)
                : (<><Zap size={14} /> OK</>)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mt-5">
        <div>
          <div className="flex justify-between text-[12px] font-bold mb-1 text-ink">
            <span>Voltage</span><span className="tabular-nums text-blue-600">{voltage} V</span>
          </div>
          <input type="range" min={12} max={480} step={1} value={voltage}
            onChange={(e) => setVoltage(parseInt(e.target.value, 10))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#2563eb' }} />
        </div>
        <div>
          <div className="flex justify-between text-[12px] font-bold mb-1 text-ink">
            <span>Resistance</span><span className="tabular-nums text-blue-600">{resistance} Ω</span>
          </div>
          <input type="range" min={10} max={1000} step={1} value={resistance}
            onChange={(e) => setResistance(parseInt(e.target.value, 10))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: '#2563eb' }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 items-center">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-body cursor-pointer">
          <input type="checkbox" checked={gfci} onChange={(e) => setGfci(e.target.checked)} />
          GFCI Protection
        </label>
        <span className="text-ink-muted mx-2">|</span>
        <span className="text-[11px] font-bold uppercase text-ink-muted">Inject fault:</span>
        {(['none', 'short', 'ground', 'open'] as Fault[]).map((f) => (
          <button
            key={f}
            onClick={() => setFault(f)}
            className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
              fault === f ? 'bg-ink text-white border-ink' : 'bg-white text-ink-body border-ink-line hover:border-slate-300'
            }`}
          >
            {f === 'none' ? 'None' : f === 'short' ? 'Short circuit' : f === 'ground' ? 'Ground fault' : 'Open'}
          </button>
        ))}
      </div>
    </div>
  );
}
