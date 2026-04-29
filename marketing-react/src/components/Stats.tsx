import { motion } from 'framer-motion';
import { TrendingUp, Globe, Users, Repeat } from 'lucide-react';
import CountUp from './effects/CountUp';
import Badge from './ui/Badge';
import GradientOrb from './effects/GradientOrb';
import { fadeUp, stagger, inViewOnce } from '../lib/motion';

/**
 * Stats — "The Numbers"
 * Big mono numbers, count-up on scroll. Background: ink-950 with subtle grid
 * (per brief: "Bloomberg terminal married to a museum poster").
 */

const stats = [
  { icon: Users,      to: 12000,   suffix: '+',  label: 'Safety professionals', sub: 'Across 47 countries' },
  { icon: TrendingUp, to: 94,      suffix: '%',  label: 'First-attempt pass',   sub: 'Industry avg: ~60%' },
  { icon: Repeat,     to: 1.2,     suffix: 'M',  decimals: 1, label: 'Cards reviewed',  sub: 'Aggregated lifetime' },
  { icon: Globe,      to: 47,      suffix: '',   label: 'Countries served',     sub: 'GCC + EU + APAC + AMER' },
];

export default function Stats() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 text-white sm:py-32">
      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <GradientOrb size={500} color="brand-500" className="-left-32 top-1/2 -translate-y-1/2" duration={20} blur={130} opacity={0.15} />
      <GradientOrb size={400} color="amber-500" className="right-0 top-0" duration={18} blur={120} opacity={0.12} />

      <div className="wrap relative">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="glass" icon={<TrendingUp size={11} aria-hidden="true" />}>
            The Numbers
          </Badge>
          <h2 className="mt-4 font-display text-5xl font-extrabold text-white">
            Receipts, not{' '}
            <span className="editorial text-amber-400">marketing claims.</span>
          </h2>
          <p className="mt-5 text-lg text-white/65">
            Aggregated across all learners since launch. Updated nightly.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 lg:grid-cols-4"
        >
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className="group relative bg-navy-950 p-7 transition-colors hover:bg-navy-900/80 sm:p-8"
              >
                <div className="mb-4 inline-flex items-center gap-2 text-2xs font-bold uppercase tracking-widest text-white/40">
                  <Icon size={12} aria-hidden="true" /> {s.label}
                </div>
                <div className="font-mono text-6xl font-bold tracking-tightest text-white">
                  <CountUp to={s.to} suffix={s.suffix} decimals={s.decimals ?? 0} />
                </div>
                <div className="mt-2 text-xs text-white/50">{s.sub}</div>
                {/* Bottom accent line, animates in */}
                <motion.span
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-brand-500 via-amber-500 to-transparent"
                />
              </motion.div>
            );
          })}
        </motion.div>

        {/* Sub-strip — context line */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-white/50"
        >
          <span>1,800+ practice items</span>
          <span aria-hidden="true">·</span>
          <span>517 critical numbers covered</span>
          <span aria-hidden="true">·</span>
          <span>105 hand-illustrated diagrams</span>
          <span aria-hidden="true">·</span>
          <span>Updated weekly</span>
        </motion.div>
      </div>
    </section>
  );
}
