import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

type Profile = {
  mastery_percent: number;
  forgetting_risk: 'low' | 'moderate' | 'high' | 'critical';
};

export default function ConceptMemoryBadge({ conceptId }: { conceptId: number }) {
  const q = useQuery({
    queryKey: ['memory-concept-profile', conceptId],
    queryFn: () => api<{ profile: Profile }>(`/memory/concepts/${conceptId}/profile`),
    retry: false,
  });
  const p = q.data?.profile;
  if (!p) return <span className="badge badge-slate">Memory: new</span>;
  return (
    <span className="badge badge-brand" title={`Risk: ${p.forgetting_risk}`}>
      Memory {p.mastery_percent}%
    </span>
  );
}
