import { NavLink, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/api';

type Domain = {
  id: string;
  number: number;
  name: string;
  short_name?: string | null;
  weight: number;
  color_hex: string;
};
type Topic = { id: number; name: string; domain_id: string; sort_order?: number | null };

function groupTopicsByDomain(topics: Topic[]): Map<string, Topic[]> {
  const byDomain = new Map<string, Topic[]>();
  for (const t of topics) {
    const arr = byDomain.get(t.domain_id) ?? [];
    arr.push(t);
    byDomain.set(t.domain_id, arr);
  }
  for (const arr of byDomain.values()) {
    arr.sort((a, b) => {
      const ao = a.sort_order ?? 0;
      const bo = b.sort_order ?? 0;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
  }
  return byDomain;
}

export default function SidebarDomainNav() {
  const location = useLocation();

  const domainsQ = useQuery({
    queryKey: ['domains'],
    queryFn: () => api<{ domains: Domain[] }>('/domains'),
  });
  const topicsQ = useQuery({
    queryKey: ['topics-all'],
    queryFn: () => api<{ topics: Topic[] }>('/topics'),
  });

  const topicsByDomain = topicsQ.data?.topics ? groupTopicsByDomain(topicsQ.data.topics) : new Map<string, Topic[]>();

  const topicIdFromPath = (): number | null => {
    const m = location.pathname.match(/^\/topics\/(\d+)/);
    return m ? Number(m[1]) : null;
  };

  const domainIsActive = (domainId: string): boolean => {
    if (location.pathname.startsWith(`/domains/${domainId}`)) return true;
    const tid = topicIdFromPath();
    if (tid == null) return false;
    const topic = topicsQ.data?.topics.find((t) => t.id === tid);
    return topic?.domain_id === domainId;
  };

  if (domainsQ.isLoading || topicsQ.isLoading) {
    return (
      <div className="mb-2 flex items-center gap-2 px-3 py-2 text-[12px] text-ink-muted">
        <Loader2 className="animate-spin" size={14} /> Loading domains…
      </div>
    );
  }

  if (domainsQ.error || topicsQ.error) {
    return null;
  }

  const domains = domainsQ.data?.domains ?? [];

  return (
    <div className="mb-1">
      <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">Domains</div>
      <div className="space-y-3">
        {domains.map((d) => {
          const accent = d.color_hex || '#6366f1';
          const topics = topicsByDomain.get(d.id) ?? [];
          const domActive = domainIsActive(d.id);
          return (
            <div key={d.id}>
              <NavLink
                to={`/domains/${d.id}`}
                className={() =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                    domActive ? 'bg-brand-50 text-brand-700' : 'text-ink-body hover:bg-slate-50 hover:text-ink'
                  }`
                }
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: accent }} />
                <span className="min-w-0 flex-1 truncate">{d.short_name || d.name}</span>
                <span className="shrink-0 text-[10px] font-bold text-ink-muted">{d.weight}%</span>
              </NavLink>
              {topics.length > 0 && (
                <div className="ml-2 mt-0.5 space-y-0 border-l border-ink-line/60 pl-2">
                  {topics.map((t) => {
                    const topicActive =
                      location.pathname === `/topics/${t.id}` ||
                      location.pathname.startsWith(`/topics/${t.id}/`);
                    return (
                      <NavLink
                        key={t.id}
                        to={`/topics/${t.id}`}
                        className={() =>
                          `block rounded-md py-1.5 pl-2 pr-1 text-[11.5px] leading-snug transition-colors ${
                            topicActive
                              ? 'bg-slate-100 font-semibold text-ink'
                              : 'text-ink-muted hover:bg-slate-50 hover:text-ink-body'
                          }`
                        }
                        title={t.name}
                      >
                        <span className="line-clamp-2">{t.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
