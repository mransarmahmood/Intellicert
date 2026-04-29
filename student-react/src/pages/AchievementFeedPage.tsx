import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

type Ev = { id: number; title: string; description?: string; xp_delta: number; occurred_at: string };

export default function AchievementFeedPage() {
  const q = useQuery({
    queryKey: ['gamification-achievements'],
    queryFn: () => api<{ events: Ev[] }>('/gamification/achievements'),
  });
  return (
    <div className="wrap py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink">Achievement Feed</h1>
      <div className="mt-6 space-y-2">
        {(q.data?.events ?? []).map((e) => (
          <div key={e.id} className="card flex items-center justify-between p-4">
            <div>
              <div className="font-semibold text-ink">{e.title}</div>
              {e.description && <div className="text-[12px] text-ink-dim">{e.description}</div>}
            </div>
            <div className="text-[12px] font-bold text-emerald-700">{e.xp_delta >= 0 ? `+${e.xp_delta}` : e.xp_delta} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
}
