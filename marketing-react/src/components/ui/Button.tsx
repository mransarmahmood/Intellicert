import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'ghost-dark' | 'link';
type Size    = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Show a leading icon */
  leadingIcon?: ReactNode;
  /** Show a trailing icon (e.g. ArrowRight) */
  trailingIcon?: ReactNode;
  /** Render a subtle shimmer overlay on hover (premium accent — use sparingly) */
  shimmer?: boolean;
};

/**
 * Primary button primitive — fully wired states (rest, hover, focus,
 * active, disabled). Used by the Hero, Pricing, Final CTA.
 *
 * Variants:
 *   primary    — brand orange, lifted, used on light backgrounds
 *   ghost      — bordered ghost, light-bg
 *   ghost-dark — bordered glass ghost, dark-bg
 *   link       — text-only with underline-on-hover
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    trailingIcon,
    shimmer = false,
    children,
    className = '',
    ...rest
  },
  ref,
) {
  const variantClass = {
    primary:      'btn-primary',
    ghost:        'btn-ghost',
    'ghost-dark': 'btn-ghost-dark',
    link:         'btn-link',
  }[variant];

  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }[size];

  // Link variant has no .btn base padding/radius; everything else uses .btn.
  const baseClass = variant === 'link' ? '' : `btn ${variantClass} ${sizeClass}`;

  return (
    <button
      ref={ref}
      className={`${baseClass} ${className} ${shimmer ? 'group relative overflow-hidden' : ''}`.trim()}
      {...rest}
    >
      {leadingIcon}
      <span className="relative z-10">{children}</span>
      {trailingIcon}
      {shimmer && (
        <span
          aria-hidden="true"
          className="shimmer-overlay pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 ease-ease-standard group-hover:translate-x-full"
        />
      )}
    </button>
  );
});

export default Button;
