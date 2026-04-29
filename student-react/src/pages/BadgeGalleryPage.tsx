import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

type Badge = { id: number; name: string; category: string; description?: string; xp_reward: number };

export default function BadgeGalleryPage() {
  const q = useQuery({
    queryKey: ['gamification-badges'],
    queryFn: () => api<{ badges: Badge[]; owned_badge_ids: number[] }>('/gamification/badges'),
  });
  const owned = new Set(q.data?.owned_badge_ids ?? []);
  return (
    <div className="wrap py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink">Badge Gallery</h1>
      <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(q.data?.badges ?? []).map((b) => (
          <div key={b.id} className={`card p-4 ${owned.has(b.id) ? 'border-emerald-300' : 'opacity-70'}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">{b.category}</div>
            <div className="mt-1 font-display text-[16px] font-bold text-ink">{b.name}</div>
            <div className="mt-1 text-[12px] text-ink-body">{b.description}</div>
            <div className="mt-2 text-[12px] font-semibold text-emerald-700">+{b.xp_reward} XP</div>
          </div>
        ))}
      </div>
    </div>
  );
}
