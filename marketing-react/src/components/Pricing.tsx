import SectionHead from './SectionHead';
import Reveal from './Reveal';
import { Check, ShieldCheck, Star } from 'lucide-react';

type Tier = {
  id: 'monthly' | 'sixmonth' | 'annual';
  name: string;
  price: number;
  pricePeriod: string;
  perMonth?: string;
  oldPrice?: number;
  badge?: string;
  featured?: boolean;
  blurb: string;
  features: string[];
};

const TIERS: Tier[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 20,
    pricePeriod: '/ month',
    blurb: 'Perfect to test the platform or prep for an upcoming exam date.',
    features: [
      'Full 7-domain CSP curriculum',
      'Adaptive practice quizzes',
      'Spaced-repetition flashcards',
      'Feynman teach-back mode',
      'Cancel anytime',
    ],
  },
  {
    id: 'sixmonth',
    name: '6-Month',
    price: 100,
    pricePeriod: 'one-time',
    perMonth: '~ $16.67/mo',
    oldPrice: 120,
    badge: 'Most popular',
    blurb: 'The full prep cycle most candidates need — covers the typical 3–6 month study horizon.',
    features: [
      'Everything in Monthly',
      'Full 6-month access',
      'All BCSP & ABIH credentials',
      'Workbook PDF exports',
      'Priority support',
      'Free extension if you fail',
    ],
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 180,
    pricePeriod: '/ year',
    perMonth: '$15/mo · save $60',
    oldPrice: 240,
    badge: 'Best value',
    featured: true,
    blurb: 'Lock in the lowest per-month price — ideal if you have multiple credentials in mind.',
    features: [
      'Everything in 6-Month',
      '12 months full access',
      'Multi-cert sharing across CSP / ASP / OHST / CHST / CIH / SMS / STS',
      'Pass guarantee with extension',
      'New content released continuously',
      'Priority support + 1:1 study check-in',
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-slate-200/60" />
      <div className="mx-auto w-full max-w-[1320px] px-6 sm:px-10">
        <SectionHead
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          desc="Pick the plan that matches your study timeline. All tiers include the full 7-domain curriculum and every learning tool — only the access window differs."
        />

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.06}>
              <div
                className={`relative flex h-full flex-col rounded-3xl border bg-white p-7 transition-all hover:-translate-y-1 ${
                  t.featured
                    ? 'border-2 border-brand-500/40 shadow-glow'
                    : 'border-ink-line shadow-card hover:shadow-cardHover'
                }`}
              >
                {t.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg ${
                      t.featured ? 'bg-brand-600' : 'bg-ink'
                    }`}
                  >
                    {t.featured && <Star size={11} className="mr-1 inline -mt-0.5 fill-white" />}
                    {t.badge}
                  </span>
                )}

                <div className="text-center">
                  <h3 className="font-display text-[20px] font-bold text-ink">{t.name}</h3>
                  <p className="mt-2 min-h-[40px] text-[13px] text-ink-dim">{t.blurb}</p>
                </div>

                <div className="mt-5 text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    {t.oldPrice && (
                      <span className="font-display text-[18px] font-bold text-ink-muted line-through decoration-brand-500/60 decoration-[2px]">
                        ${t.oldPrice}
                      </span>
                    )}
                    <span className="font-display text-5xl font-extrabold text-ink leading-none">${t.price}</span>
                  </div>
                  <div className="mt-1 text-[12.5px] text-ink-body">{t.pricePeriod}</div>
                  {t.perMonth && (
                    <div className="mt-0.5 text-[11px] font-semibold text-brand-600">{t.perMonth}</div>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13.5px] text-ink-body">
                      <Check size={15} className="mt-0.5 shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="/app/login"
                  className={`mt-7 w-full text-center ${
                    t.featured ? 'btn btn-primary btn-lg' : 'btn btn-ghost btn-lg'
                  }`}
                >
                  Choose {t.name}
                </a>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mx-auto mt-10 flex max-w-3xl items-start gap-5 rounded-2xl border border-ink-line bg-white p-6 shadow-card">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/15">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h4 className="font-display text-[16px] font-bold text-ink">Our Pass Guarantee</h4>
              <p className="mt-1 text-[14px] leading-relaxed text-ink-body">
                If you complete the full curriculum and still don't feel ready, we extend your access
                free of charge until you pass. 7-day money-back on any plan, cancel anytime.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
