import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, Play, Star, Brain, Layers, BarChart3,
  Zap, BookOpen, GraduationCap, Sparkles, ShieldCheck, Target,
} from 'lucide-react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import GradientOrb from './effects/GradientOrb';
import NeuralMesh from './effects/NeuralMesh';
import CountUp from './effects/CountUp';
import { heroReveal, heroChild, easeStandard, dur } from '../lib/motion';

// Mockup carousel content
const slides = [
  {
    id: 'study',
    chip: 'Today',
    chipIcon: Brain,
    title: 'Domain 2 · Risk Management',
    sub:   'Active recall · 12 cards due',
    badge: '+23% recall rate',
    accent: 'from-brand-500/30 to-amber-500/15',
    metric: { label: 'Memory Strength', value: 87, suffix: '%' },
    secondary: { label: 'Streak', value: 14, suffix: 'd' },
  },
  {
    id: 'sim',
    chip: 'Exam',
    chipIcon: GraduationCap,
    title: 'Full Simulation Mode',
    sub:   '200 items · 5h 30m · BCSP-rules',
    badge: 'Locked nav after item 25',
    accent: 'from-amber-500/25 to-brand-500/15',
    metric: { label: 'Pass Probability', value: 78, suffix: '%' },
    secondary: { label: 'Last attempt', value: 72, suffix: '%' },
  },
  {
    id: 'feyn',
    chip: 'AI',
    chipIcon: Sparkles,
    title: 'Feynman Teach-Back',
    sub:   'Explain it. Get graded. Find the gaps.',
    badge: 'Powered by your weak nodes',
    accent: 'from-success-500/25 to-amber-500/15',
    metric: { label: 'Domain Mastery', value: 74, suffix: '%' },
    secondary: { label: 'Confusion map', value: 9, suffix: ' tagged' },
  },
] as const;

const navItems = [
  { icon: Brain,        label: 'Dashboard',   active: true },
  { icon: BookOpen,     label: 'Study' },
  { icon: Layers,       label: 'Flashcards' },
  { icon: GraduationCap, label: 'Feynman' },
  { icon: Zap,          label: 'Focus' },
  { icon: BarChart3,    label: 'Stats' },
];

export default function Hero() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const t = window.setInterval(() => setActive((i) => (i + 1) % slides.length), 4200);
    return () => window.clearInterval(t);
  }, [reduced]);

  const slide = slides[active];

  return (
    <section className="relative overflow-hidden bg-grad-hero text-white">
      {/* Ambient orbs */}
      <GradientOrb size={620} color="brand-500" className="-left-20 -top-32" duration={16} blur={120} opacity={0.35} />
      <GradientOrb size={480} color="navy-500" className="-right-24 top-40" duration={20} blur={100} opacity={0.5} />
      <GradientOrb size={520} color="amber-500" className="bottom-0 left-1/2 -translate-x-1/2" duration={18} blur={140} opacity={0.18} />

      {/* Neural mesh — restrained, just enough to hint at "brain-based" */}
      <div className="absolute inset-0 opacity-40">
        <NeuralMesh variant="dark" />
      </div>

      {/* Subtle grid noise */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 800px 600px at 50% 30%, #000 30%, transparent 80%)',
        }}
      />

      <div className="wrap relative pb-24 pt-40 sm:pb-32 sm:pt-44">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr,0.95fr] lg:gap-16">
          {/* ─── Left: Editorial copy ─── */}
          <motion.div
            variants={heroReveal}
            initial="hidden"
            animate="show"
            className="relative"
          >
            <motion.div variants={heroChild}>
              <Badge variant="glass" icon={<Sparkles size={12} aria-hidden="true" />}>
                Brain-Based Learning · CSP / ASP / CIH
              </Badge>
            </motion.div>

            <motion.h1
              variants={heroChild}
              className="mt-5 font-display text-hero font-extrabold tracking-tightest text-white"
            >
              Pass the CSP.
              <br />
              Powered by{' '}
              <span className="editorial text-amber-400">how your brain actually learns.</span>
            </motion.h1>

            <motion.p
              variants={heroChild}
              className="mt-6 max-w-xl text-lg text-white/75"
            >
              Active recall. Spaced repetition. AI voice tutoring. Built by safety
              professionals, engineered on the cognitive science that makes hard
              material stick.
            </motion.p>

            <motion.div variants={heroChild} className="mt-8 flex flex-wrap items-center gap-3">
              <a href="/app/register">
                <Button
                  variant="primary"
                  size="lg"
                  shimmer
                  trailingIcon={<ArrowRight size={16} aria-hidden="true" />}
                >
                  Start Free Trial
                </Button>
              </a>
              <a href="#method">
                <Button
                  variant="ghost-dark"
                  size="lg"
                  leadingIcon={<Play size={14} aria-hidden="true" />}
                >
                  See the Method
                </Button>
              </a>
            </motion.div>

            <motion.div
              variants={heroChild}
              className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-white/60"
            >
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <span><span className="font-mono text-white">4.9</span> avg rating</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-success-500" aria-hidden="true" />
                <span><span className="font-mono text-white">94%</span> first-attempt pass</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={14} className="text-brand-400" aria-hidden="true" />
                <span><CountUp to={12000} suffix="+" className="text-white" /> safety pros</span>
              </div>
            </motion.div>
          </motion.div>

          {/* ─── Right: Floating product mockup ─── */}
          <motion.div
            variants={heroChild}
            initial="hidden"
            animate="show"
            transition={{ duration: dur.hero, delay: 0.4, ease: easeStandard }}
            className="relative mx-auto w-full max-w-xl lg:ml-auto"
          >
            <HeroMockup slide={slide} navItems={navItems} active={active} setActive={setActive} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Floating mockup card — glass-dark surface with realistic chrome,
// auto-rotating slide content, and 3 dot indicators.
// ─────────────────────────────────────────────────────────────────────
type HeroMockupProps = {
  slide: typeof slides[number];
  navItems: typeof navItems;
  active: number;
  setActive: (i: number) => void;
};

function HeroMockup({ slide, navItems, active, setActive }: HeroMockupProps) {
  const ChipIcon = slide.chipIcon;
  return (
    <div className="relative">
      {/* Glow under the card */}
      <div className="absolute -inset-8 -z-10 rounded-3xl bg-brand-500/20 blur-3xl" aria-hidden="true" />

      {/* Card */}
      <div className="rounded-2xl border border-white/10 bg-navy-950/80 shadow-[0_40px_100px_-40px_rgba(0,0,0,.8)] backdrop-blur-xl">
        {/* Chrome */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success-500/70" />
          </div>
          <div className="ml-auto rounded-md bg-white/5 px-3 py-1 text-2xs font-mono text-white/40">
            intellicert.app/app
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-[120px,1fr] gap-0">
          {/* Sidebar */}
          <div className="border-r border-white/5 p-3">
            <ul className="space-y-1">
              {navItems.map((item, i) => {
                const Icon = item.icon;
                const isActive = item.active;
                return (
                  <li key={i}>
                    <div
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium ${
                        isActive ? 'bg-brand-600/20 text-brand-400' : 'text-white/40'
                      }`}
                    >
                      <Icon size={12} aria-hidden="true" />
                      <span>{item.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Main */}
          <div className="relative min-h-[360px] p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: easeStandard }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-pill bg-white/10 px-2.5 py-0.5 text-2xs font-semibold text-white">
                    <ChipIcon size={10} aria-hidden="true" />
                    {slide.chip}
                  </span>
                  <span className="text-2xs font-semibold text-amber-400">{slide.badge}</span>
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold text-white">{slide.title}</h3>
                  <p className="mt-0.5 text-xs text-white/50">{slide.sub}</p>
                </div>

                {/* Hero metric */}
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${slide.accent} p-4 ring-1 ring-white/10`}>
                  <div className="text-2xs font-semibold uppercase tracking-widest text-white/60">
                    {slide.metric.label}
                  </div>
                  <div className="mt-1 font-display text-4xl font-extrabold text-white">
                    <CountUp to={slide.metric.value} suffix={slide.metric.suffix} />
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${slide.metric.value}%` }}
                      transition={{ duration: 1.4, ease: easeStandard, delay: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-amber-500"
                    />
                  </div>
                </div>

                {/* Secondary stat row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/5">
                    <div className="text-2xs uppercase tracking-wider text-white/50">{slide.secondary.label}</div>
                    <div className="mt-0.5 font-mono text-lg font-bold text-white">
                      <CountUp to={slide.secondary.value} suffix={slide.secondary.suffix} />
                    </div>
                  </div>
                  <div className="flex items-center justify-center rounded-lg bg-white/5 p-3 ring-1 ring-white/5">
                    <Sparkles size={16} className="text-amber-400" aria-hidden="true" />
                    <span className="ml-2 text-xs text-white/70">AI Auto-Explainer</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex items-center justify-center gap-2 border-t border-white/5 py-3">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}: ${s.title}`}
              className={`h-1.5 rounded-full transition-all duration-300 ease-ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-navy-950 ${
                i === active ? 'w-8 bg-brand-500' : 'w-1.5 bg-white/20 hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating accent cards */}
      <motion.div
        initial={{ opacity: 0, x: -20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6, ease: easeStandard }}
        className="absolute -left-6 top-20 hidden rounded-xl border border-white/10 bg-navy-900/90 p-3 shadow-2xl backdrop-blur-md sm:block animate-float"
      >
        <div className="flex items-center gap-2 text-xs">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-amber-500/20">
            <Sparkles size={12} className="text-amber-400" aria-hidden="true" />
          </div>
          <div>
            <div className="font-semibold text-white">Mnemonic ready</div>
            <div className="font-mono text-2xs text-white/50">"HALT" → 4 hazards</div>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 20, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6, ease: easeStandard }}
        className="absolute -bottom-4 -right-4 hidden rounded-xl border border-white/10 bg-navy-900/90 p-3 shadow-2xl backdrop-blur-md sm:block animate-float"
        style={{ animationDelay: '1s' }}
      >
        <div className="flex items-center gap-2 text-xs">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-success-500/20">
            <ShieldCheck size={12} className="text-success-500" aria-hidden="true" />
          </div>
          <div>
            <div className="font-semibold text-white">Pass guarantee</div>
            <div className="font-mono text-2xs text-white/50">94% first-try rate</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
