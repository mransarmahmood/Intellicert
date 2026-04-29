import { motion, useReducedMotion } from 'framer-motion';

type Props = {
  /** Diameter in pixels (becomes a circle of `size × size`) */
  size?: number;
  /** Tailwind color class without bg- prefix, e.g. 'brand-500' or 'navy-600' */
  color?: string;
  /** Position (CSS) — default top-left of parent */
  className?: string;
  /** Drift duration in seconds */
  duration?: number;
  /** Blur in pixels */
  blur?: number;
  /** Opacity 0-1 */
  opacity?: number;
};

/**
 * Ambient gradient orb that drifts slowly. Used as background atmosphere
 * behind the hero and final CTA. No noise, no spinning — just a soft drift.
 *
 * Combine 2-3 of these with different colors, sizes, and positions to build
 * a depth-rich gradient mesh background.
 */
export default function GradientOrb({
  size = 600,
  color = 'brand-500',
  className = '',
  duration = 14,
  blur = 100,
  opacity = 0.3,
}: Props) {
  const reduced = useReducedMotion();

  const colorMap: Record<string, string> = {
    'brand-500':  '#F97316',
    'brand-600':  '#EA580C',
    'brand-400':  '#FB923C',
    'navy-600':   '#1A3557',
    'navy-500':   '#23487A',
    'amber-500':  '#F59E0B',
  };
  const fill = colorMap[color] ?? '#F97316';

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${fill} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        opacity,
      }}
      animate={reduced ? undefined : {
        x: [0, 30, -20, 10, 0],
        y: [0, -20, 25, -10, 0],
        scale: [1, 1.1, 0.95, 1.05, 1],
      }}
      transition={reduced ? undefined : {
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
