import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import { api } from '../../lib/api';

export default function StreakBanner() {
  const q = useQuery({
    queryKey: ['gamification-streak'],
    queryFn: () => api<{ streak: { current: number; longest: number } }>('/gamification/streak'),
  });
  const s = q.data?.streak;
  if (!s || s.current <= 0) return null;
  return (
    <div className="mb-6 rounded-xl border border-orange-300 bg-orange-50 px-4 py-3 text-orange-900">
      <div className="text-[12px] font-bold"><Flame size={14} className="mr-1 inline" /> {s.current}-day streak active</div>
      <div className="text-[12px]">Longest streak: {s.longest} days</div>
    </div>
  );
}
