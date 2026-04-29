import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import LevelProgressBar from './LevelProgressBar';

type Profile = {
  total_xp: number;
  current_level: number;
  level_title: string;
  xp_to_next_level: number;
  level_progress_percent: number;
  current_streak_days: number;
  readiness_score: number;
};

export default function GamificationDashboardWidgets() {
  const q = useQuery({
    queryKey: ['gamification-profile'],
    queryFn: () => api<{ profile: Profile }>('/gamification/profile'),
  });
  const p = q.data?.profile;
  if (!p) return null;
  return (
    <div className="space-y-3">
      <LevelProgressBar
        level={p.current_level}
        title={p.level_title}
        progress={p.level_progress_percent}
        xpToNext={p.xp_to_next_level}
      />
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Total XP" value={p.total_xp} />
        <Stat label="Streak" value={`${p.current_streak_days}d`} />
        <Stat label="Readiness" value={`${p.readiness_score}%`} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{label}</div>
      <div className="font-display text-xl font-extrabold text-ink">{value}</div>
    </div>
  );
}
