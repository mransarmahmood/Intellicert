import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Hash, Search } from 'lucide-react';
import { api } from '../lib/api';

type CritNum = {
  id: number;
  category: string;
  number: string;
  label: string;
  domain_id: string | null;
  standard: string | null;
  memory: string | null;
};

const CATEGORY_META: Record<string, { label: string; color: string }> = {
  distances:      { label: 'Distances',          color: 'from-blue-400 to-blue-600' },
  time:           { label: 'Time limits',        color: 'from-purple-400 to-purple-600' },
  concentrations: { label: 'Concentrations',     color: 'from-emerald-400 to-emerald-600' },
  weights:        { label: 'Weights & loads',    color: 'from-amber-400 to-orange-500' },
  temperatures:   { label: 'Temperatures',       color: 'from-red-400 to-red-600' },
  noise:          { label: 'Noise',              color: 'from-indigo-400 to-indigo-600' },
  pressures:      { label: 'Pressures',          color: 'from-cyan-400 to-blue-600' },
  rates:          { label: 'Rates & ratios',     color: 'from-pink-400 to-fuchsia-600' },
  misc:           { label: 'Other',              color: 'from-slate-400 to-slate-600' },
};

export default function NumberBoardPage() {
  const numsQ = useQuery({
    queryKey: ['critical-numbers'],
    queryFn: () => api<{ numbers: CritNum[]; total: number }>('/critical-numbers'),
  });

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');

  const filtered = useMemo(() => {
    const all = numsQ.data?.numbers ?? [];
    return all.filter((n) => {
      if (category && n.category !== category) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return n.label.toLowerCase().includes(q)
        || n.number.toLowerCase().includes(q)
        || (n.standard ?? '').toLowerCase().includes(q);
    });
  }, [numsQ.data, search, category]);

  const cats = useMemo(() => {
    const set = new Set((numsQ.data?.numbers ?? []).map((n) => n.category));
    return Array.from(set);
  }, [numsQ.data]);

  return (
    <div className="wrap py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700 ring-1 ring-blue-500/20">
          <Hash size={12} /> Memory tools
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">Number Board</h1>
        <p className="mt-2 text-[15px] text-ink-body">
          The critical numbers, distances, and limits the CSP exam loves to test. Each one comes with a memory hook.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search number, label or standard..."
            className="input pl-9"
          />
        </div>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input max-w-xs">
          <option value="">All categories</option>
          {cats.map((c) => (
            <option key={c} value={c}>{CATEGORY_META[c]?.label ?? c}</option>
          ))}
        </select>
      </div>

      {numsQ.isLoading ? (
        <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card grid place-items-center py-16 text-[13px] text-ink-dim">No matches</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((n) => {
            const meta = CATEGORY_META[n.category] ?? { label: n.category, color: 'from-slate-400 to-slate-600' };
            return (
              <div key={n.id} className="card p-5 transition-all hover:-translate-y-0.5 hover:shadow-cardHover">
                <div className="flex items-start gap-3">
                  <div className={`grid min-h-12 min-w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${meta.color} px-2.5 py-1.5 text-center font-display text-[14px] font-extrabold text-white shadow-sm`}>
                    {n.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{meta.label}</div>
                    <div className="mt-0.5 font-semibold text-ink">{n.label}</div>
                    {n.standard && <div className="mt-1 font-mono text-[11px] text-ink-dim">{n.standard}</div>}
                  </div>
                </div>
                {n.memory && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-2.5 text-[11.5px] text-ink-body">
                    <span className="font-bold text-amber-700">Memory: </span>{n.memory}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
