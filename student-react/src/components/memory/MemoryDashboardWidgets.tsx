import { useQuery } from '@tanstack/react-query';
import { Brain, AlertTriangle, CalendarClock, TrendingUp, Flame, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

type MemorySummary = {
  retention_score: number;
  mastered_concepts: number;
  weak_concepts: number;
  due_today: number;
  overdue: number;
  review_streak: number;
};

export default function MemoryDashboardWidgets() {
  const q = useQuery({
    queryKey: ['memory-dashboard'],
    queryFn: () => api<{ memory: MemorySummary }>('/memory/dashboard'),
  });
  const m = q.data?.memory;
  if (!m) return null;

  const items = [
    { label: 'Retention', value: `${m.retention_score}%`, icon: Brain, tone: 'text-indigo-600' },
    { label: 'Mastered', value: m.mastered_concepts, icon: CheckCircle2, tone: 'text-green-600' },
    { label: 'Weak', value: m.weak_concepts, icon: AlertTriangle, tone: 'text-amber-600' },
    { label: 'Due Today', value: m.due_today, icon: CalendarClock, tone: 'text-brand-600' },
    { label: 'Overdue', value: m.overdue, icon: TrendingUp, tone: 'text-red-600' },
    { label: 'Review Streak', value: `${m.review_streak}d`, icon: Flame, tone: 'text-orange-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {items.map((it) => (
        <div key={it.label} className="card flex items-center gap-3 p-4">
          <div className={`grid h-10 w-10 place-items-center rounded-xl bg-surface ring-1 ring-ink-line ${it.tone}`}>
            <it.icon size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{it.label}</div>
            <div className="font-display text-xl font-extrabold text-ink">{it.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
