import { motion } from 'framer-motion';
import {
  Zap, Repeat, Sparkles, Bot, Mic, Hash, ArrowRight, Brain,
} from 'lucide-react';
import Badge from './ui/Badge';
import { fadeUp, stagger, inViewOnce, easeStandard } from '../lib/motion';

/**
 * Method section — "Why Brain-Based Beats Brute-Force"
 * Bento grid replacing the previous Science.tsx + PrepMethods.tsx + parts
 * of Features.tsx. 6 pillars of the platform's cognitive method.
 *
 * Layout: 6 cards in a 12-col grid. Hero card spans col-span-7, the next
 * spans col-span-5; row 2 is 4-4-4; row 3 is 12-wide outcome card.
 *
 * Each card: glass-light surface, soft border, hover lift, restrained icon
 * micro-animation on hover (icon scales + rotates 6deg).
 */

const pillars = [
  {
    id: 'recall',
    icon: Zap,
    title: 'Active Recall Blitz',
    body: 'Retrieve, don\'t re-read. The single most-studied effect in memory science. Drives 50–70% better retention than passive review.',
    accent: 'from-brand-500/15 to-amber-500/10',
    span: 'lg:col-span-7',
    stat: { num: '+58%', label: 'Recall vs. re-reading' },
  },
  {
    id: 'spaced',
    icon: Repeat,
    title: 'Spaced Repetition',
    body: 'SM-2 + 7-stage scheduler. Right question, right moment.',
    accent: 'from-amber-500/12 to-brand-500/8',
    span: 'lg:col-span-5',
  },
  {
    id: 'mnemonic',
    icon: Sparkles,
    title: 'Mnemonic Generator',
    body: 'Make abstract concepts unforgettable. Numbers, acronyms, story chains.',
    accent: 'from-amber-500/12 to-amber-500/5',
    span: 'lg:col-span-4',
  },
  {
    id: 'ai',
    icon: Bot,
    title: 'AI Auto-Explainer',
    body: 'Stuck on a concept? Get a custom explanation tuned to your weak nodes.',
    accent: 'from-brand-500/12 to-brand-500/5',
    span: 'lg:col-span-4',
  },
  {
    id: 'voice',
    icon: Mic,
    title: 'Voice Learning',
    body: 'Study hands-free. Active-listening mode pauses for retrieval prompts.',
    accent: 'from-success-500/12 to-success-500/5',
    span: 'lg:col-span-4',
  },
  {
    id: 'numbers',
    icon: Hash,
    title: 'Number Anchor Board',
    body: 'Lock in the OSHA / NIOSH / ACGIH numbers the exam demands. Anchored visually.',
    accent: 'from-navy-700/8 to-navy-600/4',
    span: 'lg:col-span-12',
    stat: { num: '517', label: 'Critical numbers covered' },
  },
];

export default function Method() {
  return (
    <section id="method" className="relative py-24 sm:py-32">
      <div className="wrap">
        {/* Section head */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="brand" icon={<Brain size={11} aria-hidden="true" />}>
            The Method
          </Badge>
          <h2 className="mt-4 font-display text-5xl font-extrabold text-ink">
            Why brain-based beats{' '}
            <span className="editorial text-brand-600">brute-force.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-body">
            Six cognitive pillars — proven by 50 years of memory research — built
            into every flashcard, quiz, and study session. No flashcard apps. No
            re-reading. Just retention that survives exam day.
          </p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mt-16 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 lg:gap-6"
        >
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <motion.article
                key={p.id}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: easeStandard }}
                className={`group relative overflow-hidden rounded-3xl border border-ink-line bg-white p-7 shadow-card transition-shadow hover:shadow-cardHover sm:p-8 ${p.span}`}
              >
                {/* Subtle accent gradient bg */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 bg-gradient-to-br ${p.accent} opacity-60`}
                />
                <div className="relative">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-white shadow-card ring-1 ring-ink-line">
                    <motion.span
                      whileHover={{ rotate: 6, scale: 1.1 }}
                      transition={{ duration: 0.3, ease: easeStandard }}
                      className="text-brand-600"
                    >
                      <Icon size={20} aria-hidden="true" />
                    </motion.span>
                  </div>

                  <h3 className="mt-5 font-display text-2xl font-bold text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 max-w-lg text-base text-ink-body">{p.body}</p>

                  {p.stat && (
                    <div className="mt-6 flex items-baseline gap-3 border-t border-ink-line pt-4">
                      <span className="font-mono text-3xl font-bold text-ink">
                        {p.stat.num}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-ink-dim">
                        {p.stat.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Top-right diagonal arrow on hover (Linear / Stripe move) */}
                <div className="absolute right-5 top-5 opacity-0 transition-opacity duration-300 ease-ease-standard group-hover:opacity-100">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-ink text-white">
                    <ArrowRight size={14} aria-hidden="true" className="-rotate-45" />
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
