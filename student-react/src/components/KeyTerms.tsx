// A clickable chip cloud of key concepts (NOT random extracted words).
// Each chip is a real concept with a short definition that opens in a
// popover on click. Driven by a structured `terms` prop, not text parsing.

import { useEffect, useRef, useState } from 'react';
import { Tags, X, ArrowRight } from 'lucide-react';
import { pickConceptIcon } from './ConceptIcon';

export type KeyTerm = {
  id?: number | string;
  term: string;
  definition?: string | null;
  href?: string;
};

const COLORS = [
  { bg: '#DBEAFE', text: '#1E40AF', ring: '#60A5FA' },
  { bg: '#DCFCE7', text: '#166534', ring: '#34D399' },
  { bg: '#FFEDD5', text: '#9A3412', ring: '#FB923C' },
  { bg: '#EDE9FE', text: '#5B21B6', ring: '#A78BFA' },
  { bg: '#CFFAFE', text: '#155E75', ring: '#22D3EE' },
  { bg: '#FCE7F3', text: '#9D174D', ring: '#F472B6' },
  { bg: '#FECACA', text: '#991B1B', ring: '#F87171' },
  { bg: '#FEF3C7', text: '#92400E', ring: '#FBBF24' },
  { bg: '#E0E7FF', text: '#3730A3', ring: '#818CF8' },
  { bg: '#D1FAE5', text: '#065F46', ring: '#34D399' },
];

export default function KeyTerms({
  terms,
  title = 'Key concepts',
  compact = false,
}: {
  terms: KeyTerm[];
  title?: string;
  compact?: boolean;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Click outside closes the popover
  useEffect(() => {
    if (openIdx === null) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenIdx(null);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [openIdx]);

  if (!terms || terms.length === 0) return null;

  return (
    <div ref={wrapRef} className={compact ? 'mt-3' : 'mt-4'}>
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-dim">
        <Tags size={11} /> {title} <span className="text-ink-muted">· click for definitions</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {terms.map((t, i) => {
          const c = COLORS[i % COLORS.length];
          const isOpen = openIdx === i;
          const meta = pickConceptIcon(t.term);
          const Icon = meta.icon;
          return (
            <div key={t.id ?? t.term + i} className="relative">
              <button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ring-1 transition hover:scale-105"
                style={{
                  background: c.bg,
                  color: c.text,
                  boxShadow: `inset 0 0 0 1px ${c.text}22`,
                }}
              >
                <Icon size={12} />
                {t.term}
              </button>

              {/* Popover with the definition */}
              {isOpen && (
                <div
                  className="absolute left-0 top-full z-30 mt-1.5 w-[320px] rounded-xl border bg-white p-4 shadow-card"
                  style={{ borderColor: c.ring }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white"
                        style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)` }}
                      >
                        <Icon size={13} />
                      </div>
                      <div className="font-display text-[14px] font-bold text-ink">{t.term}</div>
                    </div>
                    <button
                      onClick={() => setOpenIdx(null)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-slate-100"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {t.definition ? (
                    <p className="text-[12.5px] leading-relaxed text-ink-body line-clamp-6">
                      {t.definition}
                    </p>
                  ) : (
                    <p className="text-[12.5px] italic text-ink-dim">No description available</p>
                  )}
                  {t.href && (
                    <a
                      href={t.href}
                      className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand-600 hover:underline"
                    >
                      Open <ArrowRight size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
