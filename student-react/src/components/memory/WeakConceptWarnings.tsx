import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';

type WeakConcept = {
  concept_id: number;
  topic_id: number;
  mastery_percent: number;
  forgetting_risk: string;
  concept?: { title: string };
};

export default function WeakConceptWarnings() {
  const q = useQuery({
    queryKey: ['memory-weak-concepts'],
    queryFn: () => api<{ concepts: WeakConcept[]; total: number }>('/memory/weak-concepts'),
  });
  const items = q.data?.concepts ?? [];
  if (!items.length) return null;

  return (
    <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div className="mb-2 text-[12px] font-bold text-amber-800"><AlertTriangle size={14} className="mr-1 inline" /> Weak concepts need attention</div>
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 6).map((c) => (
          <Link key={c.concept_id} to={`/topics/${c.topic_id}/learn?concept=${c.concept_id}`} className="rounded-full border border-amber-300 bg-white px-3 py-1 text-[12px] font-semibold text-amber-800">
            {c.concept?.title ?? `Concept ${c.concept_id}`} · {c.mastery_percent}%
          </Link>
        ))}
      </div>
    </div>
  );
}
