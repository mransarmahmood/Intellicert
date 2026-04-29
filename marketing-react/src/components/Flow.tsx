import { motion } from 'framer-motion';
import { Compass, Sparkles, Brain, Trophy, ArrowRight } from 'lucide-react';
import Badge from './ui/Badge';
import { fadeUp, stagger, inViewOnce, easeStandard } from '../lib/motion';

/**
 * How It Works — 4-step horizontal timeline.
 * Connected line with animated progress dot.
 *
 * On large screens: horizontal layout with the line spanning all 4 cards.
 * On mobile: vertical stack (the line goes from top to bottom).
 */

const steps = [
  {
    icon: Compass,
    title: 'Diagnostic',
    body: '15-minute assessment maps your weak nodes across all 7 CSP domains.',
    timing: 'Day 1',
  },
  {
    icon: Sparkles,
    title: 'Personalized Plan',
    body: 'Adaptive schedule built from your gaps, exam date, and available study time.',
    timing: 'Day 1',
  },
  {
    icon: Brain,
    title: 'Daily Brain Sessions',
    body: '20–30 minute sessions: spaced reps, scenario quizzes, voice-mode commute review.',
    timing: 'Day 2 – exam',
  },
  {
    icon: Trophy,
    title: 'Exam-Ready',
    body: 'Full simulation, confusion map cleared, mastery threshold passed in every domain.',
    timing: 'Exam day',
  },
];

export default function Flow() {
  return (
    <section id="flow" className="relative py-24 sm:py-32">
      <div className="wrap">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="brand" icon={<Compass size={11} aria-hidden="true" />}>
            How It Works
          </Badge>
          <h2 className="mt-4 font-display text-5xl font-extrabold text-ink">
            Diagnostic to{' '}
            <span className="editorial text-brand-600">exam-ready confidence.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-body">
            Four phases, each calibrated to where your brain currently sits and
            where it needs to be on exam day.
          </p>
        </motion.div>

        {/* Timeline */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="relative mt-16"
        >
          {/* Connector line — desktop only (horizontal) */}
          <div
            aria-hidden="true"
            className="absolute left-[10%] right-[10%] top-12 hidden h-px lg:block"
          >
            <div className="h-full w-full bg-ink-line" />
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: easeStandard, delay: 0.2 }}
              className="absolute inset-0 h-full w-full bg-gradient-to-r from-brand-500 via-amber-500 to-success-500"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} variants={fadeUp} className="relative">
                  <div className="relative z-10 mb-6 mx-auto grid h-24 w-24 place-items-center rounded-2xl bg-white shadow-cardHover ring-1 ring-ink-line">
                    <div className="grid h-16 w-16 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-amber-500 text-white shadow-glowSoft">
                      <Icon size={24} aria-hidden="true" strokeWidth={1.75} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-ink-line bg-white p-6 text-center shadow-card">
                    <div className="text-2xs font-bold uppercase tracking-wider text-brand-600">
                      Step {i + 1} · {s.timing}
                    </div>
                    <h3 className="mt-2 font-display text-xl font-bold text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm text-ink-body">{s.body}</p>
                  </div>

                  {i < steps.length - 1 && (
                    <div aria-hidden="true" className="my-4 flex items-center justify-center lg:hidden">
                      <ArrowRight className="rotate-90 text-ink-muted" size={18} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
