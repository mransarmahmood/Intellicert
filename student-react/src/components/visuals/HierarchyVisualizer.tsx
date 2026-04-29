import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ban, ArrowLeftRight, Cog, ClipboardList, HardHat,
  GraduationCap, Scale, Microscope, Wrench, Lightbulb, Brain,
  ShieldCheck, Minimize, Rotate3d, Recycle, Flame, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Layer = {
  key: string;
  label: string;
  color: string;
  note: string;
  Icon: LucideIcon;
};

type Preset = {
  title: string;
  subtitle: string;
  topLabel: string;
  bottomLabel: string;
  layers: Layer[];
};

const PRESETS: Record<string, Preset> = {
  'hierarchy-of-controls': {
    title: 'Hierarchy of Controls',
    subtitle: 'Most effective at the top — PPE is the last line of defense',
    topLabel: 'Most Effective',
    bottomLabel: 'Least Effective',
    layers: [
      { key: 'elim', label: 'Elimination',            color: '#047857', note: 'Physically remove the hazard. The only way to achieve 100% protection.', Icon: Ban },
      { key: 'sub',  label: 'Substitution',           color: '#059669', note: 'Replace the hazard with a safer alternative (e.g., water-based vs. solvent paint).', Icon: ArrowLeftRight },
      { key: 'eng',  label: 'Engineering Controls',   color: '#d97706', note: 'Isolate people from the hazard with guards, ventilation, interlocks, barriers.', Icon: Cog },
      { key: 'adm',  label: 'Administrative Controls',color: '#ea580c', note: 'Change how people work — training, procedures, signs, rotation, permits.', Icon: ClipboardList },
      { key: 'ppe',  label: 'PPE',                    color: '#dc2626', note: 'Protect the worker — hard hats, respirators, gloves. Last line, relies on compliance.', Icon: HardHat },
    ],
  },
  'blooms-taxonomy': {
    title: "Bloom's Taxonomy",
    subtitle: 'Progressive mastery — from recall to creation',
    topLabel: 'Highest Order',
    bottomLabel: 'Foundation',
    layers: [
      { key: 'create',     label: 'Create',     color: '#7c3aed', note: 'Design, construct, plan, produce new ideas.',      Icon: Lightbulb },
      { key: 'evaluate',   label: 'Evaluate',   color: '#2563eb', note: 'Justify, critique, argue based on criteria.',     Icon: Scale },
      { key: 'analyze',    label: 'Analyze',    color: '#0891b2', note: 'Differentiate, organize, compare parts.',         Icon: Microscope },
      { key: 'apply',      label: 'Apply',      color: '#16a34a', note: 'Use information in new situations.',              Icon: Wrench },
      { key: 'understand', label: 'Understand', color: '#ca8a04', note: 'Explain ideas or concepts.',                      Icon: GraduationCap },
      { key: 'remember',   label: 'Remember',   color: '#dc2626', note: 'Recall facts and basic concepts.',                Icon: Brain },
    ],
  },
  'waste-hierarchy': {
    title: 'Waste Hierarchy',
    subtitle: 'EPA preferred order — prevent first, dispose last',
    topLabel: 'Most Preferred',
    bottomLabel: 'Least Preferred',
    layers: [
      { key: 'prev',   label: 'Prevention',      color: '#065f46', note: 'Avoid producing waste in the first place.', Icon: ShieldCheck },
      { key: 'min',    label: 'Minimization',    color: '#047857', note: 'Reduce quantity and toxicity at source.',    Icon: Minimize },
      { key: 'reuse',  label: 'Reuse',           color: '#059669', note: 'Use again without reprocessing.',           Icon: Rotate3d },
      { key: 'recy',   label: 'Recycling',       color: '#f59e0b', note: 'Reprocess into new materials.',             Icon: Recycle },
      { key: 'energy', label: 'Energy Recovery', color: '#ea580c', note: 'Incinerate with energy capture.',           Icon: Flame },
      { key: 'disp',   label: 'Disposal',        color: '#dc2626', note: 'Landfill — last resort.',                   Icon: Trash2 },
    ],
  },
};

type Props = { presetKey?: keyof typeof PRESETS; custom?: Preset };

export default function HierarchyVisualizer({ presetKey = 'hierarchy-of-controls', custom }: Props) {
  const preset: Preset = custom ?? PRESETS[presetKey];
  const [activeKey, setActiveKey] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-ink-line bg-white p-6 shadow-card">
      <div className="text-center mb-4">
        <h3 className="font-display text-xl font-extrabold text-ink">{preset.title}</h3>
        <p className="mt-1 text-sm text-ink-dim">{preset.subtitle}</p>
      </div>

      <div className="flex flex-col items-center gap-2 py-4">
        {preset.layers.map((layer, i) => {
          const width = Math.max(42, 100 - i * 11);
          const isActive = activeKey === layer.key;
          return (
            <motion.button
              key={layer.key}
              initial={{ opacity: 0, y: 20, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: isActive ? 1.03 : 1 }}
              transition={{ delay: i * 0.08, type: 'spring', stiffness: 200, damping: 22 }}
              whileHover={{ scale: isActive ? 1.04 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveKey(isActive ? null : layer.key)}
              style={{ background: layer.color, width: `${width}%`, maxWidth: 480 }}
              className={`relative block w-full rounded-xl px-6 py-4 text-left font-bold text-white shadow-lg ${
                isActive ? 'ring-4 ring-offset-2 ring-brand-500/60' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 text-[15px]">
                  <layer.Icon size={18} />
                  {layer.label}
                </span>
                <span className="text-[11px] uppercase tracking-[0.1em] opacity-85">
                  Level {i + 1}
                </span>
              </div>
              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 0.95, height: 'auto', marginTop: 10 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden text-[13px] font-normal leading-relaxed"
                  >
                    {layer.note}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted mt-4 max-w-[480px] mx-auto">
        <span>↑ {preset.topLabel}</span>
        <span>{preset.bottomLabel} ↓</span>
      </div>
    </div>
  );
}
