import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, BarChart3, Workflow, Flame, Triangle, Volume2, Dices,
  Sparkles, RotateCw, Clock, Shield, Lock, Biohazard, Waves, HardHat,
  Diamond, Zap, Wind, GitBranch,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  HierarchyVisualizer,
  RiskMatrix,
  ProcessFlow,
  FireTetrahedron,
  HeinrichTriangle,
  DoseCalculator,
  DominoTheory,
  LifecycleWheel,
  TimelineExplainer,
  DefenseLayers,
  LotoSequence,
  HazardParticles,
  RippleCausal,
  PpeSequence,
  NfpaDiamond,
  ElectricalSchematic,
  VentilationFlow,
  FaultTree,
} from '../components/visuals';

type Entry = {
  id: string;
  title: string;
  cat: string;
  Icon: LucideIcon;
  render: () => JSX.Element;
};

const ENTRIES: Entry[] = [
  // Risk
  { id: 'hoc',   title: 'Hierarchy of Controls',   cat: 'Risk',          Icon: Layers,    render: () => <HierarchyVisualizer presetKey="hierarchy-of-controls" /> },
  { id: 'rm',    title: 'Risk Matrix',             cat: 'Risk',          Icon: BarChart3, render: () => <RiskMatrix /> },
  { id: 'def',   title: 'Defense in Depth',        cat: 'Risk',          Icon: Shield,    render: () => <DefenseLayers /> },
  { id: 'ft-anal', title: 'Fault Tree Analysis',   cat: 'Risk',          Icon: GitBranch, render: () => <FaultTree /> },

  // Process
  { id: 'ra',    title: 'Risk Assessment Flow',    cat: 'Process',       Icon: Workflow,  render: () => <ProcessFlow presetKey="risk-assessment" /> },
  { id: 'inv',   title: 'Incident Investigation',  cat: 'Process',       Icon: Workflow,  render: () => <ProcessFlow presetKey="incident-investigation" /> },
  { id: 'ptw',   title: 'Permit-to-Work',          cat: 'Process',       Icon: Workflow,  render: () => <ProcessFlow presetKey="permit-to-work" /> },
  { id: 'loto',  title: 'LOTO Walkthrough',        cat: 'Process',       Icon: Lock,      render: () => <LotoSequence /> },

  // Investigation
  { id: 'dt',    title: 'Domino Theory',           cat: 'Investigation', Icon: Dices,     render: () => <DominoTheory /> },
  { id: 'ht',    title: 'Heinrich Triangle',       cat: 'Investigation', Icon: Triangle,  render: () => <HeinrichTriangle /> },
  { id: 'rc',    title: 'Incident Ripple Effect',  cat: 'Investigation', Icon: Waves,     render: () => <RippleCausal /> },

  // Fire / Exposure
  { id: 'ft',     title: 'Fire Tetrahedron',        cat: 'Fire',          Icon: Flame,     render: () => <FireTetrahedron /> },
  { id: 'nfpa',   title: 'NFPA 704 Fire Diamond',   cat: 'Fire',          Icon: Diamond,   render: () => <NfpaDiamond /> },
  { id: 'dc',     title: 'Noise Dose Calculator',   cat: 'Exposure',      Icon: Volume2,   render: () => <DoseCalculator /> },
  { id: 'hp',     title: 'Exposure Containment',    cat: 'Exposure',      Icon: Biohazard, render: () => <HazardParticles /> },
  { id: 'vent',   title: 'Industrial Ventilation',  cat: 'Exposure',      Icon: Wind,      render: () => <VentilationFlow /> },
  { id: 'elec',   title: 'Electrical Circuit',      cat: 'Electrical',    Icon: Zap,       render: () => <ElectricalSchematic /> },
  { id: 'ppe',    title: 'PPE Donning Order',       cat: 'PPE',           Icon: HardHat,   render: () => <PpeSequence /> },

  // Management cycle
  { id: 'pdca',  title: 'PDCA Cycle',              cat: 'Management',    Icon: RotateCw,  render: () => <LifecycleWheel presetKey="pdca" /> },
  { id: 'vpp',   title: 'OSHA VPP Elements',       cat: 'Management',    Icon: RotateCw,  render: () => <LifecycleWheel presetKey="osha-vpp" /> },

  // Emergency
  { id: 'tl',    title: 'Emergency Response',      cat: 'Emergency',     Icon: Clock,     render: () => <TimelineExplainer presetKey="emergency-response" /> },

  // Training
  { id: 'bloom', title: "Bloom's Taxonomy",        cat: 'Training',      Icon: Layers,    render: () => <HierarchyVisualizer presetKey="blooms-taxonomy" /> },
  { id: 'waste', title: 'Waste Hierarchy',         cat: 'Environment',   Icon: Layers,    render: () => <HierarchyVisualizer presetKey="waste-hierarchy" /> },
];

const CATEGORIES = Array.from(new Set(ENTRIES.map((e) => e.cat)));

export default function VisualLibraryPage() {
  const [filter, setFilter] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>('hoc');
  const active = ENTRIES.find((e) => e.id === activeId)!;

  const visible = filter ? ENTRIES.filter((e) => e.cat === filter) : ENTRIES;

  return (
    <div className="min-h-screen bg-surface">
      <div className="relative overflow-hidden bg-mesh-light border-b border-ink-line">
        <div className="wrap py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <span className="eyebrow mb-3"><Sparkles size={13} /> Visual Library</span>
            <h1 className="font-display text-4xl font-extrabold text-ink leading-tight">
              Interactive Concept Explorer
            </h1>
            <p className="mt-3 text-ink-body leading-relaxed">
              Click any diagram in the catalog to explore. Every visualization is built for active learning —
              click elements, play sequences, and discover how safety concepts connect.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-ink-line px-3 py-1 text-[11px] font-semibold text-ink-body">
                <Sparkles size={11} className="text-brand-600" /> {ENTRIES.length} visualizations
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-ink-line px-3 py-1 text-[11px] font-semibold text-ink-body">
                Powered by Framer Motion
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="wrap py-8">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setFilter(null)}
                className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all ${
                  !filter ? 'bg-ink text-white border-ink' : 'bg-white text-ink-body border-ink-line hover:border-slate-300'
                }`}
              >
                All ({ENTRIES.length})
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all ${
                    filter === c ? 'bg-ink text-white border-ink' : 'bg-white text-ink-body border-ink-line hover:border-slate-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-ink-line bg-white shadow-card p-2 max-h-[620px] overflow-y-auto">
              {visible.map((e) => {
                const isActive = e.id === activeId;
                return (
                  <motion.button
                    key={e.id}
                    onClick={() => setActiveId(e.id)}
                    whileHover={{ x: 2 }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-50 to-transparent text-ink ring-1 ring-brand-500/30'
                        : 'text-ink-body hover:bg-surface-sunken'
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-lg shrink-0 ${
                        isActive ? 'bg-brand-500 text-white' : 'bg-surface-sunken text-ink-dim'
                      }`}
                    >
                      <e.Icon size={16} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13px] truncate">{e.title}</div>
                      <div className="text-[11px] text-ink-muted uppercase tracking-wide">{e.cat}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </aside>

          <main>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {active.render()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
