import {
  Brain,
  Repeat,
  GraduationCap,
  Layers,
  Sparkles,
  Target,
  Zap,
  ShieldCheck,
  BookOpen,
  TrendingUp,
  Compass,
  Trophy,
  FlaskConical,
  Workflow,
} from 'lucide-react';

const rowA = [
  { icon: Brain, label: 'Spaced Repetition (SM-2)' },
  { icon: Repeat, label: 'Active Recall' },
  { icon: GraduationCap, label: 'Feynman Technique' },
  { icon: Layers, label: "Bloom's Taxonomy" },
  { icon: Sparkles, label: 'Memory Anchors' },
  { icon: Target, label: 'Adaptive Difficulty' },
  { icon: Zap, label: 'Focus Mode' },
];

const rowB = [
  { icon: ShieldCheck, label: 'Pass Guarantee' },
  { icon: BookOpen, label: '7 CSP Domains' },
  { icon: TrendingUp, label: 'Progress Analytics' },
  { icon: Compass, label: 'Personal Coach' },
  { icon: Trophy, label: 'Gamified Streaks' },
  { icon: FlaskConical, label: 'Scenario Quizzes' },
  { icon: Workflow, label: 'Confusion Map' },
];

function Pill({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex shrink-0 items-center gap-3 rounded-full border border-ink-line bg-white px-6 py-3.5 text-[15px] font-semibold text-ink shadow-card">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-500/15">
        <Icon size={15} />
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
    <section className="relative w-screen left-1/2 right-1/2 -mx-[50vw] border-y border-ink-line bg-white py-14">
      <div className="wrap mb-8 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
          Built on proven cognitive science
        </div>
        <p className="mt-3 text-[14px] text-ink-body">
          Aligned with how professionals retain complex safety knowledge and perform under exam conditions
        </p>
      </div>

      {/* Row 1 — left */}
      <div className="marquee-mask relative w-full overflow-hidden">
        <div className="flex w-max animate-marquee gap-4 pr-4">
          {trackA.map((it, i) => (
            <Pill key={`a-${i}`} icon={it.icon} label={it.label} />
          ))}
        </div>
      </div>

      {/* Row 2 — right (reversed via animation-direction) */}
      <div className="marquee-mask relative mt-4 w-full overflow-hidden">
        <div
          className="flex w-max animate-marquee gap-4 pr-4"
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
