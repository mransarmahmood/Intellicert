import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BookOpenCheck, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';

type Domain = { id: string; number: number; name: string; description: string | null; weight: number; color_hex: string };

export default function StudyGuidesPage() {
  const domainsQ = useQuery({ queryKey: ['domains'], queryFn: () => api<{ domains: Domain[] }>('/domains') });

  if (domainsQ.isLoading) {
    return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  }

  const domains = domainsQ.data?.domains ?? [];

  return (
    <div className="wrap py-10">
      <div className="mb-7">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700 ring-1 ring-brand-500/20">
          <BookOpenCheck size={12} /> Study Guides
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">Unit / Domain Study Guides</h1>
        <p className="mt-2 text-[14.5px] text-ink-body">Open any unit guide and use Print to save as PDF.</p>
      </div>

      <div className="space-y-3">
        {domains.map((d) => (
          <Link
            key={d.id}
            to={`/domains/${d.id}/study-guide`}
            className="group flex items-center justify-between rounded-2xl border border-ink-line bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-cardHover"
          >
            <div className="min-w-0">
              <div className="font-display text-[17px] font-bold text-ink">
                Unit {d.number}. {d.name}
              </div>
              <div className="mt-0.5 text-[12.5px] text-ink-dim">Exam weight: {d.weight}%</div>
            </div>
            <ArrowRight size={16} className="text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
          </Link>
        ))}
      </div>
    </div>
  );
}

