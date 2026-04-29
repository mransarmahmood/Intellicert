import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Loader2, BookOpen, Printer } from 'lucide-react';
import { api } from '../lib/api';

type Domain = { id: string; number: number; name: string; description: string | null; weight: number; color_hex: string };
type Topic = {
  id: number;
  topic_key: string;
  domain_id: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  sort_order: number;
  domain?: Pick<Domain, 'id' | 'name' | 'number'>;
};

export default function DomainPage() {
  const { id } = useParams();

  const domainsQ = useQuery({
    queryKey: ['domains'],
    queryFn: () => api<{ domains: Domain[] }>('/domains'),
  });
  const topicsQ = useQuery({
    queryKey: ['topics', id],
    queryFn: () => api<{ topics: Topic[] }>('/topics', { params: { domain_id: id } }),
    enabled: !!id,
  });

  const domain = domainsQ.data?.domains.find((d) => d.id === id);
  const accent = domain?.color_hex || '#EA580C';

  return (
    <div className="wrap py-10">
      <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-dim hover:text-ink">
        <ArrowLeft size={14} /> Back to home
      </Link>

      {domain && (
        <div className="card mb-8 overflow-hidden">
          <div className="relative p-7" style={{ background: `linear-gradient(135deg, ${accent}15, transparent)` }}>
            <div className="flex items-center gap-3">
              <span
                className="grid h-12 w-12 place-items-center rounded-xl font-display text-[16px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)` }}
              >
                {String(domain.number).padStart(2, '0')}
              </span>
              <span className="badge badge-slate">{domain.weight}% of exam</span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">{domain.name}</h1>
            {domain.description && <p className="mt-2 max-w-2xl text-[14.5px] text-ink-body">{domain.description}</p>}
            <div className="no-print mt-4">
              <Link to={`/domains/${domain.id}/study-guide`} className="btn btn-primary btn-sm">
                <Printer size={13} /> Study Guide PDF
              </Link>
            </div>
          </div>
        </div>
      )}

      <h2 className="mb-5 font-display text-2xl font-extrabold text-ink">Topics</h2>

      {topicsQ.isLoading ? (
        <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>
      ) : !topicsQ.data?.topics.length ? (
        <div className="card grid place-items-center py-16">
          <div className="text-center">
            <BookOpen size={26} className="mx-auto text-ink-muted" />
            <div className="mt-3 text-[14px] font-semibold text-ink">No topics yet in this domain</div>
            <p className="mt-1 text-[13px] text-ink-dim">Check back soon — we're adding more content.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {topicsQ.data.topics.map((t, i) => (
            <Link
              key={t.id}
              to={`/topics/${t.id}`}
              className="group flex items-center gap-5 rounded-2xl border border-ink-line bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-cardHover"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 font-display text-[14px] font-bold text-brand-700 ring-1 ring-brand-500/15">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[16px] font-bold text-ink">{t.name}</div>
                {t.subtitle && <div className="mt-0.5 truncate text-[13px] text-ink-dim">{t.subtitle}</div>}
              </div>
              <ArrowRight size={16} className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-1 group-hover:text-brand-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
