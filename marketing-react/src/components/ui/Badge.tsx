import type { HTMLAttributes, ReactNode } from 'react';

type Variant = 'brand' | 'amber' | 'success' | 'navy' | 'neutral' | 'glass';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
  /** Optional leading icon (Lucide etc.) */
  icon?: ReactNode;
  children?: ReactNode;
};

/**
 * Badge / pill primitive. Uppercase, tracked, small caps style.
 * Used for eyebrows, "Most Popular", "Free 7-day trial", domain tags.
 */
export default function Badge({
  variant = 'brand',
  icon,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  const variantClass = {
    brand:   'border-brand-500/20 bg-brand-50 text-brand-600',
    amber:   'border-amber-500/30 bg-amber-500/10 text-amber-600',
    success: 'border-success-500/30 bg-success-500/10 text-success-500',
    navy:    'border-navy-700/40 bg-navy-900 text-white',
    neutral: 'border-ink-line bg-surface-alt text-ink-dim',
    glass:   'border-white/15 bg-white/10 text-white backdrop-blur',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-2xs font-semibold uppercase tracking-[0.14em] ${variantClass} ${className}`.trim()}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
