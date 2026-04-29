import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

type Props = {
  /** Target number to count to */
  to: number;
  /** Optional starting number (default 0) */
  from?: number;
  /** Duration in ms */
  duration?: number;
  /** Decimals to display (default 0) */
  decimals?: number;
  /** Prefix (e.g. "$") */
  prefix?: string;
  /** Suffix (e.g. "+", "%", "k") */
  suffix?: string;
  className?: string;
  /** Easing curve — Math.pow(x, .5) is sqrt for slow-end snap */
  easing?: (t: number) => number;
};

/**
 * Animated counter that triggers on scroll-into-view. Uses requestAnimationFrame
 * for smooth interpolation. Mono font baked in for the "Bloomberg terminal × museum
 * poster" stats aesthetic from the brief.
 *
 * `prefers-reduced-motion`: snaps to final value, no animation.
 */
export default function CountUp({
  to,
  from = 0,
  duration = 1100,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  easing = (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  // Generous margin so animation triggers slightly BEFORE the user scrolls
  // to it — by the time they read the stat, it's already at final value.
  const inView = useInView(ref, { once: true, margin: '200px 0px 200px 0px' });
  const reduced = useReducedMotion();
  const [val, setVal] = useState(reduced ? to : from);

  useEffect(() => {
    if (!inView || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easing(t);
      setVal(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, from, to, duration, easing]);

  const display = decimals > 0
    ? val.toFixed(decimals)
    : Math.round(val).toLocaleString();

  return (
    <motion.span
      ref={ref}
      className={`stat-number ${className}`.trim()}
      aria-label={`${prefix}${decimals > 0 ? to.toFixed(decimals) : Math.round(to).toLocaleString()}${suffix}`}
    >
      {prefix}{display}{suffix}
    </motion.span>
  );
}
