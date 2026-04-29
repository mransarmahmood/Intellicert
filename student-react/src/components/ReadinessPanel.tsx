import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

type ReadinessResp = {
  readiness: {
    composite_score: number;
    pass_probability: number;
    breakdown: {
      weighted_mastery: number;
      exam_simulation: number;
      recency: number;
      srs_strength: number;
    };
    per_domain: Array<{ domain_id: string; name: string; weight: number; mastery: number }>;
    weakest_domain: { domain_id: string; name: string; mastery: number } | null;
    computed_at: string;
  };
};

/**
 * Track 3 — calibrated readiness panel.
 *
 * Replaces the simple "Readiness: X%" tile with a pass-probability +
 * per-domain breakdown + a "what to study next" CTA. Suitable for both
 * HomePage and StatsPage.
 */
export default function ReadinessPanel({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['readiness'],
    queryFn: () => api<ReadinessResp>('/study/readiness'),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center p-8 text-ink-dim">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="card p-4 text-[13px] text-ink-dim">
        Readiness unavailable right now.
      </div>
    );
  }

  const r = data.readiness;
  const passPct = Math.round(r.pass_probability * 100);
  const composite = r.composite_score;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-dim">
            <Target size={12} aria-hidden="true" /> Exam readiness
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <div className="font-display text-4xl font-extrabold text-ink">
              {composite}<span className="text-xl text-ink-dim">/100</span>
            </div>
            <div className="text-[13px] font-semibold text-brand-700">
              {passPct}% predicted pass probability
            </div>
          </div>
        </div>
        {r.weakest_domain && (
          <Link
            to={`/domains/${r.weakest_domain.domain_id}`}
            className="btn btn-primary btn-sm whitespace-nowrap"
            aria-label={`Study weakest domain: ${r.weakest_domain.name}`}
          >
            Study {r.weakest_domain.name} <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {!compact && r.per_domain.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-dim">
            <TrendingUp size={12} aria-hidden="true" /> Per-domain readiness
          </div>
          <ul className="space-y-2">
            {r.per_domain.map((d) => {
              const pct = Math.max(0, Math.min(100, Math.round(d.mastery)));
              const color =
                pct >= 80 ? 'bg-emerald-500'
                : pct >= 60 ? 'bg-amber-500'
                : 'bg-red-500';
              return (
                <li key={d.domain_id}>
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-ink-body">{d.name}</span>
                    <span className="tabular-nums text-ink-dim">
                      {pct}% <span className="opacity-60">· wt {Math.round(d.weight)}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {!compact && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { label: 'Weighted mastery', value: `${r.breakdown.weighted_mastery}%` },
              { label: 'Exam simulation', value: `${r.breakdown.exam_simulation}%` },
              { label: 'Recency', value: `${Math.round(r.breakdown.recency * 100)}%` },
              { label: 'SRS strength', value: `${Math.round(r.breakdown.srs_strength * 100)}%` },
            ] as const
          ).map((item) => (
            <div key={item.label} className="rounded-lg border border-ink-line bg-white p-3">
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink-dim">{item.label}</div>
              <div className="mt-0.5 font-display text-[20px] font-bold text-ink">{item.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
