import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { easeStandard, dur } from '../../lib/motion';

type AccordionItemProps = {
  id: string;
  question: string;
  /** Initially open */
  defaultOpen?: boolean;
  children: ReactNode;
  /** Controlled mode — pass `open` and `onOpenChange` from parent for single-open behaviour */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Single accordion item. Uses Framer's height auto + AnimatePresence for
 * smooth height-animated reveal (Radix-style without the dependency).
 *
 * Keyboard:
 *   - Enter / Space toggles
 *   - Tab moves to next focusable
 */
export function AccordionItem({
  id,
  question,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  children,
}: AccordionItemProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const toggle = () => {
    if (isControlled) onOpenChange?.(!open);
    else setUncontrolledOpen((prev) => !prev);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-line bg-white">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={`accordion-panel-${id}`}
        id={`accordion-trigger-${id}`}
        className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:px-6 sm:py-5"
      >
        <span className="font-display">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: dur.standard, ease: easeStandard }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-line bg-surface-sunken text-ink-dim group-hover:border-brand-500 group-hover:text-brand-600"
        >
          <ChevronDown size={16} aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`accordion-panel-${id}`}
            role="region"
            aria-labelledby={`accordion-trigger-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: dur.standard, ease: easeStandard }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink-line px-5 py-4 text-sm text-ink-body sm:px-6 sm:py-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type AccordionProps = {
  /** "single" lets only one item open at a time; "multiple" allows several */
  type?: 'single' | 'multiple';
  /** ID of initially open item (single mode) */
  defaultValue?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Accordion container. Manages open-state if type="single".
 * Children must be AccordionItem with stable `id` prop.
 */
export default function Accordion({
  type = 'single',
  defaultValue,
  children,
  className = '',
}: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultValue ?? null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (type === 'multiple') return; // not relevant
  }, [type]);

  if (type === 'multiple') {
    // Children manage their own state via defaultOpen / uncontrolled.
    return (
      <div ref={containerRef} className={`space-y-3 ${className}`}>
        {children}
      </div>
    );
  }

  // Single mode — wrap children to inject controlled open state.
  return (
    <div ref={containerRef} className={`space-y-3 ${className}`}>
      {Array.isArray(children) ? children.map((child: any, i) => {
        if (!child?.props?.id) return child;
        const id = child.props.id;
        return {
          ...child,
          key: id ?? i,
          props: {
            ...child.props,
            open: openId === id,
            onOpenChange: (next: boolean) => setOpenId(next ? id : null),
          },
        };
      }) : children}
    </div>
  );
}
