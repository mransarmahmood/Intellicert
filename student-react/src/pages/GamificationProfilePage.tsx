import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import GamificationDashboardWidgets from '../components/gamification/GamificationDashboardWidgets';
import StreakBanner from '../components/gamification/StreakBanner';

export default function GamificationProfilePage() {
  const xpQ = useQuery({
    queryKey: ['gamification-xp-history'],
    queryFn: () => api<{ events: { id: number; event_type: string; xp_awarded: number; occurred_at: string }[] }>('/gamification/xp-history'),
  });

  return (
    <div className="wrap py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink">Gamification Profile</h1>
      <p className="mt-2 text-[14px] text-ink-body">Track XP, level progress, streak and achievement growth.</p>
      <div className="mt-6"><StreakBanner /></div>
      <GamificationDashboardWidgets />
      <div className="mt-6 card p-5">
        <h3 className="font-display text-lg font-bold text-ink">XP History</h3>
        <div className="mt-3 space-y-2">
          {(xpQ.data?.events ?? []).slice(0, 20).map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-ink-line bg-surface px-3 py-2 text-sm">
              <span className="text-ink">{e.event_type.replace(/_/g, ' ')}</span>
              <span className="font-semibold text-emerald-700">+{e.xp_awarded} XP</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
