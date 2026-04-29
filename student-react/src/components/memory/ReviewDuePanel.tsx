import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock3, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

type DueProfile = {
  topic_id: number;
  concept_id: number;
  concept?: { title: string };
  forgetting_risk: 'low' | 'moderate' | 'high' | 'critical';
  next_review_at?: string | null;
};

export default function ReviewDuePanel() {
  const q = useQuery({
    queryKey: ['memory-due-reviews'],
    queryFn: () => api<{ profiles: DueProfile[]; total: number }>('/memory/due-reviews'),
  });
  const items = q.data?.profiles ?? [];
  if (!items.length) return null;

  return (
    <div className="card mb-8 overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-line bg-surface/50 px-5 py-3">
        <div className="text-[12px] font-bold text-ink"><Clock3 size={14} className="mr-1 inline" /> Reviews due now</div>
        <Link to="/memory/revision-queue" className="text-[12px] font-semibold text-brand-600">Open queue</Link>
      </div>
      <div className="divide-y divide-ink-line">
        {items.slice(0, 5).map((p) => (
          <Link key={p.concept_id} to={`/topics/${p.topic_id}/learn?concept=${p.concept_id}`} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-surface/40">
            <div>
              <div className="font-semibold text-ink">{p.concept?.title ?? `Concept ${p.concept_id}`}</div>
              <div className="text-xs text-ink-dim capitalize">{p.forgetting_risk} risk</div>
            </div>
            <ArrowRight size={14} className="text-ink-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
