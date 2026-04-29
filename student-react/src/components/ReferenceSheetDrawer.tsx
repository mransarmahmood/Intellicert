import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, X, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

type Formula = {
  id: number;
  name: string;
  formula: string;
  description: string | null;
  units: string | null;
  category: string | null;
};

/**
 * Track 4 — On-screen formula reference sheet for exam mode.
 *
 * Pulls from the existing /api/formula-guide endpoint (already populated
 * with TRIR/DART, NIOSH lifting, ventilation, decibel, etc.). The real
 * BCSP CSP exam allows a printed reference sheet — this matches that.
 */
export default function ReferenceSheetDrawer() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['formula-reference-sheet'],
    queryFn: () => api<{ guide: { categories: Array<{ id: string; name: string; formulas: Formula[] }> } }>('/formula-guide'),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const allFormulas = (data?.guide.categories ?? []).flatMap((c) =>
    c.formulas.map((f) => ({ ...f, category: f.category ?? c.name }))
  );
  const filtered = search
    ? allFormulas.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allFormulas;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-20 z-30 grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
        aria-label="Open formula reference sheet"
        title="Reference sheet"
      >
        <BookOpen size={20} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Formula reference sheet"
        >
          <div
            className="flex-1 bg-black/30"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="flex w-full max-w-md flex-col border-l border-ink-line bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-ink-line px-5 py-4">
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-ink-dim">Reference</div>
                <h2 className="font-display text-lg font-bold text-ink">Formula sheet</h2>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close reference sheet" className="rounded p-1.5 text-ink-dim hover:bg-slate-100">
                <X size={18} aria-hidden="true" />
              </button>
            </header>
            <div className="border-b border-ink-line px-5 py-3">
              <input
                type="search"
                placeholder="Search formulas (e.g. TRIR, NIOSH)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                aria-label="Search formulas"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {isLoading && (
                <div className="grid place-items-center py-12 text-ink-dim">
                  <Loader2 className="animate-spin" size={20} aria-hidden="true" />
                </div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="text-[13px] text-ink-dim">No formulas match.</div>
              )}
              <ul className="space-y-3">
                {filtered.map((f) => (
                  <li key={f.id} className="rounded-lg border border-ink-line bg-slate-50 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-display text-[14px] font-bold text-ink">{f.name}</div>
                      {f.category && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-dim ring-1 ring-ink-line">
                          {f.category}
                        </span>
                      )}
                    </div>
                    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-white p-2 font-mono text-[12.5px] text-ink ring-1 ring-ink-line">{f.formula}</pre>
                    {f.description && <p className="mt-1 text-[12px] text-ink-body">{f.description}</p>}
                    {f.units && <p className="mt-0.5 text-[11px] text-ink-dim">Units: {f.units}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
