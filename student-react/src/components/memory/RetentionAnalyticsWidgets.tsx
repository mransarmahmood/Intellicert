import { useQuery } from '@tanstack/react-query';
import { PieChart } from 'lucide-react';
import { api } from '../../lib/api';

type Resp = {
  summary: {
    retention_score: number;
    mastered_concepts: number;
    weak_concepts: number;
    due_today: number;
    overdue: number;
    review_streak: number;
  };
  risk_counts: Record<string, number>;
};

export default function RetentionAnalyticsWidgets() {
  const q = useQuery({
    queryKey: ['memory-retention-analytics'],
    queryFn: () => api<Resp>('/memory/retention-analytics'),
  });
  const risks = q.data?.risk_counts ?? {};
  const total = Object.values(risks).reduce((a, b) => a + b, 0);
  if (!q.data) return null;

  return (
    <div className="card p-5">
      <div className="mb-3 text-[12px] font-bold text-ink"><PieChart size={14} className="mr-1 inline" /> Forgetting Risk Breakdown</div>
      <div className="grid gap-2 sm:grid-cols-4">
        {['low', 'moderate', 'high', 'critical'].map((k) => {
          const c = risks[k] ?? 0;
          const pct = total > 0 ? Math.round((c / total) * 100) : 0;
          return (
            <div key={k} className="rounded-lg border border-ink-line bg-surface px-3 py-2">
              <div className="text-[10px] font-bold uppercase text-ink-dim">{k}</div>
              <div className="font-display text-lg font-extrabold text-ink">{c}</div>
              <div className="text-[11px] text-ink-dim">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
