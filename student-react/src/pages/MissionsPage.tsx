import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

type Mission = {
  id: number;
  mission_id: number;
  name: string;
  type: 'daily' | 'weekly';
  xp_reward: number;
  progress_count: number;
  target_count: number;
  status: 'active' | 'completed' | 'claimed';
};

export default function MissionsPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['gamification-missions'],
    queryFn: () => api<{ missions: Mission[] }>('/gamification/missions'),
  });
  const claim = useMutation({
    mutationFn: (id: number) => api(`/gamification/missions/${id}/claim`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gamification-missions'] });
      qc.invalidateQueries({ queryKey: ['gamification-profile'] });
    },
  });

  return (
    <div className="wrap py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink">Missions</h1>
      <p className="mt-2 text-[14px] text-ink-body">Daily and weekly certification-focused mission goals.</p>
      <div className="mt-6 space-y-3">
        {(q.data?.missions ?? []).map((m) => {
          const pct = Math.round((m.progress_count / Math.max(1, m.target_count)) * 100);
          return (
            <div key={m.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-[16px] font-bold text-ink">{m.name}</div>
                  <div className="text-[12px] text-ink-dim capitalize">{m.type} mission · +{m.xp_reward} XP</div>
                </div>
                {m.status === 'completed' ? (
                  <button onClick={() => claim.mutate(m.id)} className="btn btn-primary btn-sm">Claim reward</button>
                ) : (
                  <span className="badge badge-slate capitalize">{m.status}</span>
                )}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-brand-600" style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <div className="mt-1 text-[12px] text-ink-dim">{m.progress_count}/{m.target_count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
