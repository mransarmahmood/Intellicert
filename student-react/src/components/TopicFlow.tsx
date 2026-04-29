// Horizontal SVG roadmap that visualizes the entire learning path of a topic.
// Renders the icon for each concept in the order they appear, connected by
// arrows. Wraps to multiple rows when there are more than 6 concepts.

import { pickConceptIcon } from './ConceptIcon';
import { Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

type ConceptLite = { id: number; title: string };

export default function TopicFlow({
  concepts,
  topicId,
  onSelect,
}: {
  concepts: ConceptLite[];
  topicId?: number;
  onSelect?: (id: number) => void;
}) {
  if (!concepts || concepts.length === 0) return null;

  return (
    <div className="card mt-6 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-line bg-gradient-to-br from-brand-50/40 to-white px-5 py-3">
        <Workflow size={14} className="text-brand-600" />
        <span className="font-display text-[13px] font-bold text-ink">Learning roadmap</span>
        <span className="ml-1 text-[11px] text-ink-dim">{concepts.length} concepts in order</span>
      </div>
      <div className="overflow-x-auto p-5">
        <div className="flex flex-wrap items-start gap-x-2 gap-y-4">
          {concepts.map((c, i) => {
            const meta = pickConceptIcon(c.title);
            const Icon = meta.icon;
            return (
              <div key={c.id} className="flex items-center gap-2">
                <a
                  href={`#concept-${c.id}`}
                  onClick={() => onSelect?.(c.id)}
                  className="group flex w-[124px] flex-col items-center gap-1.5 rounded-xl border border-transparent px-1.5 py-1 transition hover:border-brand-200 hover:bg-brand-50/40"
                  title={`Point ${i + 1}: ${c.title}`}
                >
                  <div className="relative">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-2xl text-white shadow-sm transition-transform group-hover:scale-110"
                      style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)` }}
                    >
                      <Icon size={18} strokeWidth={2.4} />
                    </div>
                    <span
                      className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white font-display text-[9px] font-bold ring-1 ring-ink-line"
                      style={{ color: meta.color }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <div className="line-clamp-2 min-h-[30px] text-center text-[11px] font-semibold leading-tight text-ink">
                    {c.title}
                  </div>
                </a>
                {topicId && (
                  <Link
                    to={`/topics/${topicId}/learn?concept=${c.id}`}
                    className="hidden text-[10px] font-semibold text-brand-700 hover:underline sm:inline"
                    title={`Open point ${i + 1} in 10-step flow`}
                  >
                    Open
                  </Link>
                )}
                {i < concepts.length - 1 && (
                  <svg width="22" height="14" viewBox="0 0 22 14" className="shrink-0 text-ink-muted">
                    <path d="M 0 7 L 18 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M 14 3 L 18 7 L 14 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
