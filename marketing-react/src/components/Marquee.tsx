import { motion } from 'framer-motion';
import {
  Brain, Repeat, GraduationCap, Layers, Sparkles, Target, Zap,
  ShieldCheck, BookOpen, TrendingUp, Compass, Trophy, FlaskConical, Workflow,
} from 'lucide-react';
import { fadeUp, inViewOnce } from '../lib/motion';

/**
 * Methodology cloud — replaces the previous flat marquee with richer
 * pill cards that have:
 *   - Icon in a colored container (color = category accent)
 *   - Label
 *   - Sub-label (the "why" — what the technique does)
 *   - Hover lift + icon micro-rotation
 *   - Categorical color coding (cognitive / coverage / outcome)
 */

type Color = 'brand' | 'amber' | 'success' | 'navy';

type Pill = {
  icon: any;
  label: string;
  sub?: string;
  color: Color;
};

const cognitive: Pill[] = [
  { icon: Brain,        label: 'Spaced Repetition',   sub: 'SM-2 algorithm',           color: 'brand' },
  { icon: Repeat,       label: 'Active Recall',       sub: "Retrieve, don't re-read",  color: 'brand' },
  { icon: GraduationCap, label: 'Feynman Technique',   sub: 'Teach to truly know',      color: 'amber' },
  { icon: Layers,       label: "Bloom's Taxonomy",    sub: 'Calibrated difficulty',    color: 'amber' },
  { icon: Sparkles,     label: 'Memory Anchors',      sub: 'Mnemonic + visual',        color: 'amber' },
  { icon: Target,       label: 'Adaptive Difficulty', sub: 'Tunes to weak nodes',      color: 'brand' },
  { icon: Zap,          label: 'Focus Mode',          sub: 'Pomodoro × neuroscience',  color: 'brand' },
];

const coverage: Pill[] = [
  { icon: BookOpen,      label: '7 CSP Domains',       sub: 'Full BCSP blueprint',     color: 'navy' },
  { icon: FlaskConical,  label: 'Scenario Quizzes',    sub: '1,800+ items',            color: 'navy' },
  { icon: Workflow,      label: 'Confusion Map',       sub: 'Tracks misconceptions',   color: 'navy' },
  { icon: Compass,       label: 'Personal Coach',      sub: 'AI study sherpa',         color: 'amber' },
  { icon: Trophy,        label: 'Gamified Streaks',    sub: 'Habit, not grind',        color: 'amber' },
  { icon: TrendingUp,    label: 'Progress Analytics',  sub: 'Per-domain mastery',      color: 'brand' },
  { icon: ShieldCheck,   label: 'Pass Guarantee',      sub: 'Or extended access',      color: 'success' },
];

function Pill({ icon: Icon, label, sub, color }: Pill) {
  const colors: Record<Color, { bg: string; ring: string; iconBg: string; iconText: string; subText: string }> = {
    brand:   { bg: 'bg-white', ring: 'ring-brand-500/15',   iconBg: 'bg-brand-50',       iconText: 'text-brand-600',  subText: 'text-brand-700/70' },
    amber:   { bg: 'bg-white', ring: 'ring-amber-500/15',   iconBg: 'bg-amber-500/10',   iconText: 'text-amber-600',  subText: 'text-amber-700/70' },
    success: { bg: 'bg-white', ring: 'ring-success-500/15', iconBg: 'bg-success-500/10', iconText: 'text-success-500',subText: 'text-success-500/70' },
    navy:    { bg: 'bg-white', ring: 'ring-navy-700/15',    iconBg: 'bg-navy-900/5',     iconText: 'text-navy-700',   subText: 'text-navy-700/70' },
  };
  const c = colors[color];
  return (
    <div
      className={`group relative flex shrink-0 items-center gap-3 rounded-2xl ${c.bg} px-4 py-3 shadow-card ring-1 ${c.ring} transition-all duration-300 ease-ease-standard hover:-translate-y-1 hover:shadow-cardHover`}
      style={{ minWidth: 240 }}
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${c.iconBg} ${c.iconText} transition-transform duration-300 ease-ease-standard group-hover:scale-110 group-hover:rotate-3`}>
        <Icon size={18} aria-hidden="true" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[13.5px] font-bold text-ink">{label}</span>
        {sub && <span className={`mt-0.5 text-[11.5px] font-medium ${c.subText}`}>{sub}</span>}
      </div>
    </div>
  );
}

export default function Marquee() {
  // Duplicate so the -50% translateX keyframe creates a seamless loop.
  const trackA = [...cognitive, ...cognitive];
  const trackB = [...coverage, ...coverage];

  return (
    <section
      aria-label="Methodologies and coverage"
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-hidden border-y border-ink-line bg-surface-card py-20"
    >
      {/* Ambient gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 700px 320px at 20% 50%, rgba(251,146,60,0.07), transparent 60%), radial-gradient(ellipse 700px 320px at 80% 50%, rgba(245,158,11,0.06), transparent 60%)',
        }}
      />

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
        className="wrap relative mb-12 text-center"
      >
        <div className="inline-flex items-center gap-1.5 rounded-pill border border-brand-500/20 bg-brand-50 px-3 py-1 text-2xs font-bold uppercase tracking-[0.18em] text-brand-700">
          <Brain size={11} aria-hidden="true" /> The toolkit
        </div>
        <h2 className="mt-4 font-display text-4xl font-extrabold text-ink sm:text-5xl">
          Every technique that actually{' '}
          <span className="editorial text-brand-600">moves the needle.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-ink-body">
          Built into the product — not pasted on the marketing page. Each one
          has decades of cognitive-science evidence behind it.
        </p>
      </motion.div>

      {/* Row 1 — cognitive techniques (drift left) */}
      <div className="marquee-mask relative w-full overflow-hidden">
        <div className="flex w-max animate-marquee gap-4 pr-4">
          {trackA.map((it, i) => (
            <Pill key={`a-${i}`} {...it} />
          ))}
        </div>
      </div>

      {/* Row 2 — coverage + outcomes (drift right) */}
      <div className="marquee-mask relative mt-4 w-full overflow-hidden">
        <div
          className="flex w-max animate-marquee gap-4 pr-4"
          style={{ animationDirection: 'reverse', animationDuration: '46s' }}
        >
          {trackB.map((it, i) => (
            <Pill key={`b-${i}`} {...it} />
          ))}
        </div>
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
        className="wrap relative mt-12 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-dim">
          14 modalities · 1 coherent system · Zero busywork
        </p>
      </motion.div>
    </section>
  );
}
