import type { HTMLAttributes, ReactNode } from 'react';

type Variant = 'default' | 'glass' | 'glass-dark' | 'lifted' | 'flush';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  /** Lift on hover (translateY -4 + shadow bloom) */
  hover?: boolean;
  children?: ReactNode;
};

/**
 * Card primitive. Five variants:
 *   default    — white bg, border, soft card shadow
 *   glass      — translucent white over rich background, subtle blur
 *   glass-dark — translucent navy over hero gradient
 *   lifted     — same as default but pre-lifted (used for the featured pricing tier)
 *   flush      — no border or shadow (used inside larger composed cards)
 */
export default function Card({
  variant = 'default',
  hover = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const variantClass = {
    default:      'card',
    glass:        'glass rounded-2xl',
    'glass-dark': 'glass-dark rounded-2xl',
    lifted:       'card shadow-cardHover -translate-y-0.5',
    flush:        'rounded-2xl',
  }[variant];

  const hoverClass = hover ? 'card-hover' : '';

  return (
    <div className={`${variantClass} ${hoverClass} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
