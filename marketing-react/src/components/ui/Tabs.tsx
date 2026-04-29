import { useState, createContext, useContext, type ReactNode } from 'react';
import { motion } from 'framer-motion';

type TabsCtx = {
  active: string;
  setActive: (id: string) => void;
  layoutId: string;
};
const Ctx = createContext<TabsCtx | null>(null);

function useTabsCtx(): TabsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('Tabs.* must be used inside <Tabs>');
  return c;
}

type TabsProps = {
  /** Initial active tab id */
  defaultValue: string;
  /** Unique id used for Framer's layoutId animation between tabs */
  id?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Tabs primitive used by the Product Preview bento ("Flashcards" |
 * "Practice Exam" | "AI Explainer" | "Voice Mode" | "Progress Dashboard").
 *
 * Animation: pill background slides between tabs via Framer's `layoutId`.
 */
export default function Tabs({ defaultValue, id = 'tabs', className = '', children }: TabsProps) {
  const [active, setActive] = useState(defaultValue);
  return (
    <Ctx.Provider value={{ active, setActive, layoutId: `${id}-active-pill` }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

type TabsListProps = { children: ReactNode; className?: string };
export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`inline-flex flex-wrap items-center gap-1 rounded-pill border border-ink-line bg-surface-card p-1 shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

type TabsTriggerProps = {
  value: string;
  children: ReactNode;
  icon?: ReactNode;
};
export function TabsTrigger({ value, children, icon }: TabsTriggerProps) {
  const { active, setActive, layoutId } = useTabsCtx();
  const isActive = active === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`tab-panel-${value}`}
      id={`tab-trigger-${value}`}
      onClick={() => setActive(value)}
      className={`relative flex items-center gap-2 rounded-pill px-4 py-2 text-sm font-semibold transition-colors duration-200 ease-ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 ${
        isActive ? 'text-white' : 'text-ink-dim hover:text-ink'
      }`}
    >
      {isActive && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-pill bg-ink"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {icon}
        {children}
      </span>
    </button>
  );
}

type TabsContentProps = {
  value: string;
  children: ReactNode;
  className?: string;
};
export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const { active } = useTabsCtx();
  const isActive = active === value;
  return (
    <div
      role="tabpanel"
      id={`tab-panel-${value}`}
      aria-labelledby={`tab-trigger-${value}`}
      hidden={!isActive}
      className={className}
    >
      {isActive && children}
    </div>
  );
}
