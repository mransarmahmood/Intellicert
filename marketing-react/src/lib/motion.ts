// Shared Framer Motion variants and easings for the marketing site.
//
// Design commandment: "Every animation has purpose."
// All variants here are scoped to four uses:
//   1. Section reveal on scroll (fadeUp + scale)
//   2. Staggered children inside a section (stagger + each)
//   3. Hero-specific staggered headline + sub + cta (heroReveal)
//   4. Micro-interactions on hover/tap (lift, press)
//
// `prefers-reduced-motion` users get instant transitions via the `useReducedMotion`
// hook + `respectMotionPreference` helper below.
import type { Transition, Variants } from 'framer-motion';

// ─── Easings ────────────────────────────────────────────────────────────
// Linear/Vercel-style "premium snap" — fast start, soft settle.
export const easeStandard = [0.16, 1, 0.3, 1] as const;
// Material-style — predictable acceleration, smooth deceleration.
export const easeSnappy   = [0.4, 0, 0.2, 1] as const;
// Long, gentle reveal for hero / above-the-fold theatre.
export const easeHero     = [0.22, 1, 0.36, 1] as const;

// ─── Durations ─────────────────────────────────────────────────────────
export const dur = {
  micro:    0.2,   // hover/press state changes
  standard: 0.4,   // section reveal, card slide
  hero:     0.8,   // hero choreography
  drift:    14,    // ambient orb drift
} as const;

// ─── Reusable variants ─────────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show:   {
    opacity: 1,
    y: 0,
    transition: { duration: dur.standard, ease: easeStandard },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: dur.standard, ease: easeStandard } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show:   { opacity: 1, scale: 1, transition: { duration: dur.standard, ease: easeStandard } },
};

export const stagger: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerFast: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.04 } },
};

// Hero choreography — long gentle stagger for the title → sub → cta → trust strip.
export const heroReveal: Variants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

export const heroChild: Variants = {
  hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
  show:   {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: dur.hero, ease: easeHero },
  },
};

// ─── Micro-interactions ────────────────────────────────────────────────
export const liftOnHover = {
  rest:  { y: 0 },
  hover: { y: -4 },
  transition: { duration: dur.micro, ease: easeStandard } as Transition,
};

export const pressOnTap = {
  rest:  { scale: 1 },
  tap:   { scale: 0.97 },
  transition: { duration: 0.1 } as Transition,
};

// ─── Reduced motion helper ─────────────────────────────────────────────
// Pass through any variant unchanged unless reducedMotion=true, in which
// case strip the transform/opacity transitions and snap into the final state.
export function respectMotionPreference<T extends Variants>(
  v: T,
  reduced: boolean,
): T | Variants {
  if (!reduced) return v;
  // Collapse all variants to instant final-state, no transition.
  return Object.fromEntries(
    Object.entries(v).map(([k, val]) => {
      if (typeof val === 'object' && val !== null) {
        const next = { ...val };
        if ('transition' in next) (next as any).transition = { duration: 0 };
        return [k, next];
      }
      return [k, val];
    }),
  ) as Variants;
}

// ─── Default viewport prop for `whileInView` ───────────────────────────
// once: animate on first scroll-in (don't replay), margin pulls the trigger
// up slightly so animations fire just before the section is fully on-screen.
export const inViewOnce = { once: true, margin: '-80px' } as const;
