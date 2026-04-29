import { useState } from 'react';
import { motion } from 'framer-motion';

type Category = 'health' | 'fire' | 'reactivity' | 'special';
type SpecialSymbol = '' | 'W' | 'OX' | 'SA';

const CATEGORIES: Record<Category, {
  label: string;
  color: string;
  position: string;
  levels: { value: number; label: string; description: string }[];
}> = {
  health: {
    label: 'Health',
    color: '#3b82f6',
    position: 'left',
    levels: [
      { value: 0, label: 'No Hazard', description: 'Normal material; poses no health hazard beyond ordinary combustible material.' },
      { value: 1, label: 'Slightly Hazardous', description: 'Causes mild transient irritation or injury.' },
      { value: 2, label: 'Moderate Hazard', description: 'Temporary incapacitation or residual injury possible without PPE.' },
      { value: 3, label: 'Serious Hazard', description: 'Serious temporary or moderate residual injury on short exposure.' },
      { value: 4, label: 'Deadly', description: 'Very short exposure can cause death or major residual injury.' },
    ],
  },
  fire: {
    label: 'Flammability',
    color: '#ef4444',
    position: 'top',
    levels: [
      { value: 0, label: 'Will Not Burn', description: 'Materials that will not burn (e.g., water, concrete).' },
      { value: 1, label: 'Flash > 200°F', description: 'Must be preheated before ignition (e.g., motor oil).' },
      { value: 2, label: 'Flash 100–200°F', description: 'Must be heated moderately to ignite (e.g., diesel fuel).' },
      { value: 3, label: 'Flash < 100°F', description: 'Liquids and solids that ignite under almost all ambient temperatures (e.g., gasoline).' },
      { value: 4, label: 'Flash < 73°F, BP < 100°F', description: 'Rapidly or completely vaporize at atmospheric pressure (e.g., propane).' },
    ],
  },
  reactivity: {
    label: 'Instability',
    color: '#eab308',
    position: 'right',
    levels: [
      { value: 0, label: 'Stable', description: 'Normally stable, even under fire conditions, non-reactive with water.' },
      { value: 1, label: 'Unstable at Heat', description: 'Normally stable, but can become unstable at elevated temperatures and pressures.' },
      { value: 2, label: 'Violent Reaction', description: 'Undergoes violent chemical change at elevated temperatures or reacts violently with water.' },
      { value: 3, label: 'Detonation w/ Initiator', description: 'Capable of detonation or explosive decomposition with strong initiating source or heated confinement.' },
      { value: 4, label: 'Detonates', description: 'Readily capable of detonation or explosive decomposition at normal temperatures and pressures.' },
    ],
  },
  special: {
    label: 'Special',
    color: '#ffffff',
    position: 'bottom',
    levels: [],
  },
};

const SPECIAL_META: Record<SpecialSymbol, { label: string; description: string }> = {
  '':    { label: '(none)',               description: 'No special hazards specified.' },
  'W':   { label: 'W̶ — Water Reactive',  description: 'Reacts violently or explosively with water (e.g., lithium, sodium).' },
  'OX':  { label: 'OX — Oxidizer',        description: 'Can accelerate combustion of other materials (e.g., hydrogen peroxide, bleach).' },
  'SA':  { label: 'SA — Simple Asphyxiant', description: 'Displaces oxygen (e.g., nitrogen, helium, argon).' },
};

type Ratings = { health: number; fire: number; reactivity: number; special: SpecialSymbol };

const PRESETS: { name: string; ratings: Ratings }[] = [
  { name: 'Gasoline',          ratings: { health: 1, fire: 3, reactivity: 0, special: '' } },
  { name: 'Acetylene',          ratings: { health: 1, fire: 4, reactivity: 3, special: '' } },
  { name: 'Liquid Nitrogen',   ratings: { health: 3, fire: 0, reactivity: 0, special: 'SA' } },
  { name: 'Hydrogen Peroxide', ratings: { health: 3, fire: 0, reactivity: 1, special: 'OX' } },
  { name: 'Lithium metal',      ratings: { health: 3, fire: 1, reactivity: 2, special: 'W' } },
];

export default function NfpaDiamond() {
  const [r, setR] = useState<Ratings>({ health: 2, fire: 3, reactivity: 1, special: '' });
  const [active, setActive] = useState<Category | null>(null);

  const value = (k: Category) => k === 'special' ? r.special as any : (r as any)[k];
  const activeDetail = active
    ? active === 'special'
      ? { label: 'Special Hazards', description: SPECIAL_META[r.special].description }
      : CATEGORIES[active].levels.find((l) => l.value === (r as any)[active])
    : null;

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">NFPA 704 Fire Diamond</h3>
        <p className="mt-1 text-sm text-ink-dim">Click a quadrant to see what the rating means. Use sliders to change values.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px] items-center">
        <div className="relative mx-auto" style={{ width: 240, height: 240 }}>
          <div className="absolute inset-0" style={{ transform: 'rotate(45deg)' }}>
            {/* FIRE (top) */}
            <motion.button
              onClick={() => setActive('fire')}
              whileHover={{ scale: 1.04 }}
              className="absolute bg-red-500 border-2 border-white flex items-center justify-center text-white text-5xl font-black shadow-md cursor-pointer"
              style={{ width: '50%', height: '50%', top: 0, left: '25%' }}
            >
              <span style={{ transform: 'rotate(-45deg)' }}>{r.fire}</span>
            </motion.button>
            {/* REACT (right) */}
            <motion.button
              onClick={() => setActive('reactivity')}
              whileHover={{ scale: 1.04 }}
              className="absolute bg-yellow-400 border-2 border-white flex items-center justify-center text-ink text-5xl font-black shadow-md cursor-pointer"
              style={{ width: '50%', height: '50%', top: '25%', left: '50%' }}
            >
              <span style={{ transform: 'rotate(-45deg)' }}>{r.reactivity}</span>
            </motion.button>
            {/* HEALTH (left) */}
            <motion.button
              onClick={() => setActive('health')}
              whileHover={{ scale: 1.04 }}
              className="absolute bg-blue-500 border-2 border-white flex items-center justify-center text-white text-5xl font-black shadow-md cursor-pointer"
              style={{ width: '50%', height: '50%', top: '25%', left: 0 }}
            >
              <span style={{ transform: 'rotate(-45deg)' }}>{r.health}</span>
            </motion.button>
            {/* SPECIAL (bottom) */}
            <motion.button
              onClick={() => setActive('special')}
              whileHover={{ scale: 1.04 }}
              className="absolute bg-white border-2 border-ink flex items-center justify-center text-ink text-2xl font-black shadow-md cursor-pointer"
              style={{ width: '50%', height: '50%', top: '50%', left: '25%' }}
            >
              <span style={{ transform: 'rotate(-45deg)' }}>{r.special || '—'}</span>
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {(['health', 'fire', 'reactivity'] as const).map((k) => (
            <div key={k}>
              <div className="flex justify-between items-center text-[12px] font-bold mb-1" style={{ color: CATEGORIES[k].color }}>
                <span>{CATEGORIES[k].label}</span>
                <span className="tabular-nums">{value(k)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={value(k)}
                onChange={(e) => setR((p) => ({ ...p, [k]: parseInt(e.target.value, 10) }))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer nfpa-range"
                style={{ accentColor: CATEGORIES[k].color }}
              />
            </div>
          ))}
          <div>
            <div className="text-[12px] font-bold mb-1 text-ink-body">Special Symbol</div>
            <select
              value={r.special}
              onChange={(e) => setR((p) => ({ ...p, special: e.target.value as SpecialSymbol }))}
              className="w-full rounded-lg border border-ink-line bg-white px-3 py-2 text-sm"
            >
              <option value="">(none)</option>
              <option value="W">W̶ — Water Reactive</option>
              <option value="OX">OX — Oxidizer</option>
              <option value="SA">SA — Simple Asphyxiant</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-ink-line">
            <div className="text-[10px] font-bold uppercase tracking-wide text-ink-muted w-full mb-1">Quick presets</div>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => setR(p.ratings)}
                className="text-[11px] px-2 py-1 rounded-full bg-surface-sunken text-ink-body hover:bg-ink hover:text-white transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeDetail && (
        <motion.div
          key={active + String(value(active!))}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-xl px-4 py-3 text-sm"
          style={{
            background: active === 'fire' ? '#fef2f2' : active === 'health' ? '#eff6ff' : active === 'reactivity' ? '#fefce8' : '#f1f5f9',
            borderLeft: `4px solid ${active === 'special' ? '#64748b' : CATEGORIES[active!].color}`,
          }}
        >
          <div className="font-bold text-ink mb-1">
            {active !== 'special' && <><span className="text-2xl mr-1">{value(active!)}</span> — </>}
            {(activeDetail as any).label}
          </div>
          <div className="text-ink-body leading-relaxed">{activeDetail.description}</div>
        </motion.div>
      )}
    </div>
  );
}
