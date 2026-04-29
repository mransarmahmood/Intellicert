import {
  Brain, Repeat, GraduationCap, Layers, Sparkles, Target, Zap,
  ShieldCheck, BookOpen, TrendingUp, Compass, Trophy, FlaskConical, Workflow,
} from 'lucide-react';

// Honest framing: we don't have a logo cloud of customer brands yet, but we
// DO have the methodology cloud — the proven cognitive-science techniques the
// platform implements. Per brief: "trust strip" on hero handles social proof
// numerically; this strip handles methodological credibility.
const rowA = [
  { icon: Brain,         label: 'Spaced Repetition (SM-2)' },
  { icon: Repeat,        label: 'Active Recall' },
  { icon: GraduationCap, label: 'Feynman Technique' },
  { icon: Layers,        label: "Bloom's Taxonomy" },
  { icon: Sparkles,      label: 'Memory Anchors' },
  { icon: Target,        label: 'Adaptive Difficulty' },
  { icon: Zap,           label: 'Focus Mode' },
];

const rowB = [
  { icon: ShieldCheck,   label: 'Pass Guarantee' },
  { icon: BookOpen,      label: '7 CSP Domains' },
  { icon: TrendingUp,    label: 'Progress Analytics' },
  { icon: Compass,       label: 'Personal Coach' },
  { icon: Trophy,        label: 'Gamified Streaks' },
  { icon: FlaskConical,  label: 'Scenario Quizzes' },
  { icon: Workflow,      label: 'Confusion Map' },
];

function Pill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="group flex shrink-0 items-center gap-3 rounded-pill border border-ink-line bg-white px-5 py-3 text-sm font-semibold text-ink-dim shadow-card transition-all duration-300 ease-ease-standard hover:border-brand-500/40 hover:bg-white hover:text-ink">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-sunken text-ink-muted ring-1 ring-ink-line transition-all duration-300 ease-ease-standard group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:ring-brand-500/30">
        <Icon size={14} aria-hidden="true" />
      </span>
      {label}
    </div>
  );
}

export default function Marquee() {
  // Duplicate so the -50% translateX keyframe creates a seamless loop
  const trackA = [...rowA, ...rowA];
  const trackB = [...rowB, ...rowB];

  return (
    <section
      aria-label="Methodologies"
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-y border-ink-line bg-surface-card py-14"
    >
      <div className="wrap mb-8 text-center">
        <div className="text-2xs font-semibold uppercase tracking-[0.18em] text-ink-dim">
          Built on proven cognitive science
        </div>
        <p className="mt-3 text-sm text-ink-body">
          Aligned with how professionals retain complex safety knowledge and
          perform under exam pressure.
        </p>
      </div>

      {/* Row 1 — left-drifting */}
      <div className="marquee-mask relative w-full overflow-hidden">
        <div className="flex w-max animate-marquee gap-3 pr-3">
          {trackA.map((it, i) => (
            <Pill key={`a-${i}`} icon={it.icon} label={it.label} />
          ))}
        </div>
      </div>

      {/* Row 2 — right-drifting (reversed) */}
      <div className="marquee-mask relative mt-3 w-full overflow-hidden">
        <div
          className="flex w-max animate-marquee gap-3 pr-3"
          style={{ animationDirection: 'reverse', animationDuration: '46s' }}
        >
          {trackB.map((it, i) => (
            <Pill key={`b-${i}`} icon={it.icon} label={it.label} />
          ))}
        </div>
      </div>
    </section>
  );
}
