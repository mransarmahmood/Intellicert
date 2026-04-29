import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ShieldCheck, Star, ArrowRight, Sparkles } from 'lucide-react';
import Badge from './ui/Badge';
import Button from './ui/Button';
import { fadeUp, stagger, inViewOnce, easeStandard, dur } from '../lib/motion';

type BillingCycle = 'monthly' | 'sixmonth';

type Tier = {
  id: 'free' | 'pro' | 'pro-plus';
  name: string;
  blurb: string;
  /** Monthly price in SAR */
  priceMonthly: number;
  /** 6-month price in SAR (one-time) */
  priceSixMonth: number;
  badge?: string;
  featured?: boolean;
  features: string[];
  cta: { label: string; href: string };
};

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    blurb: 'Explore the platform. Perfect for testing the brain-based method on a slice of the curriculum.',
    priceMonthly: 0,
    priceSixMonth: 0,
    features: [
      'Sample of 50 flashcards',
      'Domain 1 free preview',
      '1 practice quiz per week',
      'Limited Voice Mode',
      'No credit card required',
    ],
    cta: { label: 'Start Free', href: '/app/register' },
  },
  {
    id: 'pro',
    name: 'Pro',
    blurb: 'The full prep cycle most candidates need. Cancel anytime; pause if life happens.',
    priceMonthly: 99,
    priceSixMonth: 449,
    badge: 'Most popular',
    featured: true,
    features: [
      'Full 7-domain CSP curriculum',
      '1,800+ adaptive practice items',
      'SM-2 spaced repetition',
      'AI Auto-Explainer (unlimited)',
      'Voice Mode + commute playlists',
      'Mnemonic & Number Anchor library',
      'Full simulation exam (200q)',
      'Pass guarantee',
    ],
    cta: { label: 'Start Free Trial', href: '/app/register' },
  },
  {
    id: 'pro-plus',
    name: 'Pro+ Mastery',
    blurb: 'Pro plus the 65-topic Mastery Library — advanced techniques every CSP must know.',
    priceMonthly: 149,
    priceSixMonth: 649,
    badge: 'Cert-grade',
    features: [
      'Everything in Pro',
      '65-topic Mastery Library',
      '18-element gold standard topics',
      'Method Cards (PDF downloads)',
      'Decision trees + selection logic',
      'Calculation sandboxes',
      'Multi-cert: ASP / CHST / OHST / CIH',
      '1:1 study check-in (per quarter)',
    ],
    cta: { label: 'Start Free Trial', href: '/app/register' },
  },
];

export default function Pricing() {
  const [cycle, setCycle] = useState<BillingCycle>('sixmonth');

  return (
    <section id="pricing" className="relative bg-surface-alt py-24 sm:py-32">
      <div className="wrap">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mx-auto max-w-2xl text-center"
        >
          <Badge variant="brand" icon={<Sparkles size={11} aria-hidden="true" />}>
            Simple Pricing · SAR
          </Badge>
          <h2 className="mt-4 font-display text-5xl font-extrabold text-ink">
            Choose your{' '}
            <span className="editorial text-brand-600">brain plan.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-body">
            All paid plans include the full curriculum and every learning tool.
            Pick the access window that matches your exam date.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <span className={`text-sm font-semibold transition-colors ${cycle === 'monthly' ? 'text-ink' : 'text-ink-dim'}`}>
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={cycle === 'sixmonth'}
            aria-label="Toggle billing cycle"
            onClick={() => setCycle((c) => (c === 'monthly' ? 'sixmonth' : 'monthly'))}
            className="relative h-7 w-14 rounded-pill bg-ink-line transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-brand-600 shadow-card ${
                cycle === 'sixmonth' ? 'left-[30px]' : 'left-0.5'
              }`}
            />
          </button>
          <span className={`text-sm font-semibold transition-colors ${cycle === 'sixmonth' ? 'text-ink' : 'text-ink-dim'}`}>
            6-month
          </span>
          <Badge variant="amber" className="ml-1">
            Save 24%
          </Badge>
        </motion.div>

        {/* Tiers */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3"
        >
          {TIERS.map((t) => {
            const price = cycle === 'monthly' ? t.priceMonthly : t.priceSixMonth;
            const isFree = price === 0;
            const monthlyEquivalent = cycle === 'sixmonth' && !isFree ? Math.round(t.priceSixMonth / 6) : null;
            return (
              <motion.article
                key={t.id}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: easeStandard }}
                className={`relative flex flex-col rounded-3xl bg-white p-7 transition-shadow ${
                  t.featured
                    ? 'border-2 border-brand-500/40 shadow-glow'
                    : 'border border-ink-line shadow-card hover:shadow-cardHover'
                }`}
              >
                {t.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill px-3 py-1 text-2xs font-bold uppercase tracking-wider text-white shadow-lg ${
                      t.featured ? 'bg-brand-600' : 'bg-ink'
                    }`}
                  >
                    {t.featured && <Star size={11} className="mr-1 inline -mt-0.5 fill-white" />}
                    {t.badge}
                  </span>
                )}

                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{t.name}</h3>
                  <p className="mt-2 min-h-[48px] text-sm text-ink-dim">{t.blurb}</p>
                </div>

                {/* Price block — animates on cycle change */}
                <div className="mt-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${t.id}-${cycle}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: dur.standard, ease: easeStandard }}
                    >
                      <div className="flex items-baseline gap-1.5">
                        {!isFree && <span className="font-mono text-base font-bold text-ink-dim">SAR</span>}
                        <span className="font-display text-5xl font-extrabold text-ink leading-none">
                          {isFree ? '0' : price}
                        </span>
                        {!isFree && (
                          <span className="text-sm text-ink-dim">
                            {cycle === 'monthly' ? '/ month' : 'one-time'}
                          </span>
                        )}
                      </div>
                      {monthlyEquivalent && (
                        <div className="mt-1 text-xs font-semibold text-brand-600">
                          ≈ SAR {monthlyEquivalent}/mo · save {Math.round((1 - t.priceSixMonth / (t.priceMonthly * 6)) * 100)}%
                        </div>
                      )}
                      {isFree && <div className="mt-1 text-xs text-ink-dim">Forever free</div>}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ink-body">
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                        <Check size={11} strokeWidth={3} aria-hidden="true" />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a href={t.cta.href} className="mt-7">
                  <Button
                    variant={t.featured ? 'primary' : 'ghost'}
                    size="lg"
                    shimmer={t.featured}
                    className="w-full"
                    trailingIcon={<ArrowRight size={14} aria-hidden="true" />}
                  >
                    {t.cta.label}
                  </Button>
                </a>
              </motion.article>
            );
          })}
        </motion.div>

        {/* Pass guarantee */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mx-auto mt-12 flex max-w-3xl items-start gap-5 rounded-2xl border border-ink-line bg-white p-6 shadow-card"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-success-500/10 text-success-500 ring-1 ring-success-500/30">
            <ShieldCheck size={22} aria-hidden="true" />
          </div>
          <div>
            <h4 className="font-display text-base font-bold text-ink">Pass Guarantee</h4>
            <p className="mt-1 text-sm leading-relaxed text-ink-body">
              Complete the full curriculum and still don't feel ready? We extend
              your access free of charge until you pass. 7-day money-back on any
              paid plan. Cancel anytime.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
