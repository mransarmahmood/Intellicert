import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck, Brain } from 'lucide-react';
import Button from './ui/Button';
import GradientOrb from './effects/GradientOrb';
import NeuralMesh from './effects/NeuralMesh';
import { fadeUp, inViewOnce, easeStandard } from '../lib/motion';

/**
 * Final CTA — full-bleed gradient section.
 *
 * Mirrors the Hero gradient palette so the page bookends with a coherent
 * dark theatre. Single dominant CTA + trust microcopy below.
 */
export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-grad-hero py-28 text-white sm:py-36">
      <GradientOrb size={620} color="brand-500" className="-left-20 top-1/4" duration={20} blur={130} opacity={0.3} />
      <GradientOrb size={500} color="amber-500" className="-right-32 bottom-0" duration={18} blur={120} opacity={0.2} />
      <div className="absolute inset-0 opacity-30">
        <NeuralMesh variant="dark" />
      </div>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
        className="wrap relative mx-auto max-w-3xl text-center"
      >
        <div className="inline-flex items-center gap-1.5 rounded-pill border border-white/15 bg-white/10 px-3 py-1 text-2xs font-bold uppercase tracking-widest text-amber-400 backdrop-blur">
          <Sparkles size={11} aria-hidden="true" /> Free 7-day trial · No credit card
        </div>

        <h2 className="mt-6 font-display text-6xl font-extrabold leading-[1.05] tracking-tightest text-white">
          Your exam day,{' '}
          <span className="editorial text-amber-400">reimagined.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
          Stop re-reading. Start remembering. Join 12,000+ safety professionals
          who pass the CSP on the first try with brain-based study.
        </p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.4, ease: easeStandard, delay: 0.1 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a href="/app/register">
            <Button
              variant="primary"
              size="lg"
              shimmer
              trailingIcon={<ArrowRight size={16} aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              Start Free Trial
            </Button>
          </a>
          <a href="#pricing">
            <Button variant="ghost-dark" size="lg" className="w-full sm:w-auto">
              See pricing
            </Button>
          </a>
        </motion.div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.4, ease: easeStandard, delay: 0.2 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-success-500" aria-hidden="true" />
            <span>Pass guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-brand-400" aria-hidden="true" />
            <span>Brain-based learning</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" aria-hidden="true" />
            <span>Cancel anytime</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
