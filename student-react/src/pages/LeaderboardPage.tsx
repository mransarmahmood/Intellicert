import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

type Row = { user_id: number; name: string; total_xp: number; current_level: number; level_title: string };

export default function LeaderboardPage() {
  const q = useQuery({
    queryKey: ['gamification-leaderboard'],
    queryFn: () => api<{ leaderboard: Row[] }>('/gamification/leaderboard'),
  });
  return (
    <div className="wrap py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink">Leaderboard</h1>
      <div className="mt-6 space-y-2">
        {(q.data?.leaderboard ?? []).map((r, i) => (
          <div key={r.user_id} className="card flex items-center justify-between p-4">
            <div>
              <div className="font-display text-[16px] font-bold text-ink">#{i + 1} {r.name ?? `User ${r.user_id}`}</div>
              <div className="text-[12px] text-ink-dim">Level {r.current_level} · {r.level_title}</div>
            </div>
            <div className="font-display text-xl font-extrabold text-ink">{r.total_xp} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
}
