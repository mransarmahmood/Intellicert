import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Search, X, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type Domain = { id: string; number: number; name: string };
type Topic = {
  id: number;
  topic_key: string;
  domain_id: string;
  name: string;
  subtitle: string | null;
  icon: string | null;
  overview: string | null;
  image_url: string | null;
  sort_order: number;
  domain?: Domain;
};

export default function TopicsPage() {
  const qc = useQueryClient();
  const [domainFilter, setDomainFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [editing, setEditing] = useState<Topic | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Topic | null>(null);

  const domainsQ = useQuery({
    queryKey: ['domains'],
    queryFn: () => api<{ domains: Domain[] }>('/domains'),
  });

  const topicsQ = useQuery({
    queryKey: ['topics', domainFilter, debounced],
    queryFn: () =>
      api<{ topics: Topic[]; total: number }>('/topics', {
        params: { domain_id: domainFilter || undefined, search: debounced || undefined },
      }),
  });

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebounced(search);
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ['topics'] });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Topics</h1>
          <p className="mt-1 text-[14px] text-ink-dim">
            {topicsQ.data ? `${topicsQ.data.total} total` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="btn btn-primary btn-md"
          disabled={!domainsQ.data?.domains.length}
        >
          <Plus size={16} /> New topic
        </button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="input max-w-xs"
        >
          <option value="">All domains</option>
          {domainsQ.data?.domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.number}. {d.name}
            </option>
          ))}
        </select>
        <form onSubmit={onSearchSubmit} className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or key..."
              className="input pl-9"
            />
          </div>
          <button type="submit" className="btn btn-ghost btn-md">Search</button>
        </form>
      </div>

      {!domainsQ.isLoading && !domainsQ.data?.domains.length && (
        <div className="card mb-5 p-5 text-[13px] text-ink-body">
          <strong className="text-ink">No domains found.</strong> Seed at least one domain
          (table <code className="rounded bg-surface px-1 py-0.5">domains</code>) before creating topics.
        </div>
      )}

      <div className="card overflow-hidden">
        {topicsQ.isLoading ? (
          <div className="grid place-items-center py-16 text-ink-dim"><Loader2 className="animate-spin" /></div>
        ) : topicsQ.data?.topics.length ? (
          <table className="w-full text-left text-[13.5px]">
            <thead className="border-b border-ink-line bg-surface text-[11px] font-bold uppercase tracking-wider text-ink-dim">
              <tr>
                <th className="px-5 py-3">Topic</th>
                <th className="px-5 py-3">Domain</th>
                <th className="px-5 py-3">Key</th>
                <th className="px-5 py-3 w-20">Order</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {topicsQ.data.topics.map((t) => (
                <tr key={t.id} className="hover:bg-surface">
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/topics/${t.id}`}
                      className="font-semibold text-ink hover:text-brand-600"
                    >
                      {t.name}
                    </Link>
                    {t.subtitle && (
                      <div className="mt-0.5 truncate text-[12px] text-ink-dim">{t.subtitle}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {t.domain ? (
                      <span className="badge badge-brand">{t.domain.number}. {t.domain.name}</span>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-surface px-1.5 py-0.5 text-[12px] text-ink-body">{t.topic_key}</code>
                  </td>
                  <td className="px-5 py-3.5 text-ink-dim">{t.sort_order}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <Link to={`/topics/${t.id}`} className="btn btn-ghost btn-sm" title="Open">
                        <ExternalLink size={13} />
                      </Link>
                      <button onClick={() => setEditing(t)} className="btn btn-ghost btn-sm" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => setDeleting(t)}
                        className="btn btn-ghost btn-sm hover:!border-red-300 hover:!bg-red-50 hover:!text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-[13px] text-ink-dim">No topics found</div>
        )}
      </div>

      {creating && domainsQ.data && (
        <TopicFormModal
          mode="create"
          domains={domainsQ.data.domains}
          onClose={() => setCreating(false)}
          onSuccess={() => { setCreating(false); refresh(); }}
        />
      )}
      {editing && domainsQ.data && (
        <TopicFormModal
          mode="edit"
          topic={editing}
          domains={domainsQ.data.domains}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); refresh(); }}
        />
      )}
      {deleting && (
        <DeleteModal
          topic={deleting}
          onClose={() => setDeleting(null)}
          onSuccess={() => { setDeleting(null); refresh(); }}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────

function TopicFormModal({
  mode,
  topic,
  domains,
  onClose,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  topic?: Topic;
  domains: Domain[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    domain_id: topic?.domain_id ?? domains[0]?.id ?? '',
    topic_key: topic?.topic_key ?? '',
    name: topic?.name ?? '',
    subtitle: topic?.subtitle ?? '',
    icon: topic?.icon ?? '',
    overview: topic?.overview ?? '',
    image_url: topic?.image_url ?? '',
    sort_order: topic?.sort_order ?? 0,
  });
  const [err, setErr] = useState('');

  const m = useMutation({
    mutationFn: () =>
      mode === 'create'
        ? api('/topics', { method: 'POST', body: JSON.stringify(form) })
        : api(`/topics/${topic!.id}`, { method: 'PATCH', body: JSON.stringify(form) }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  return (
    <Modal title={mode === 'create' ? 'New topic' : `Edit: ${topic?.name}`} onClose={onClose} wide>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setErr('');
          m.mutate();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Domain *</label>
            <select className="input" value={form.domain_id} onChange={(e) => set('domain_id', e.target.value)} required>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.number}. {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Topic key *</label>
            <input
              className="input"
              value={form.topic_key}
              onChange={(e) => set('topic_key', e.target.value)}
              placeholder="hazard-recognition"
              required
            />
          </div>
        </div>
        <div>
          <label className="label">Name *</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Subtitle</label>
          <input className="input" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Icon (Font Awesome)</label>
            <input
              className="input"
              value={form.icon}
              onChange={(e) => set('icon', e.target.value)}
              placeholder="fa-shield-halved"
            />
          </div>
          <div>
            <label className="label">Sort order</label>
            <input
              type="number"
              className="input"
              value={form.sort_order}
              onChange={(e) => set('sort_order', Number(e.target.value))}
            />
          </div>
        </div>
        <div>
          <label className="label">Image URL</label>
          <input className="input" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
        </div>
        <div>
          <label className="label">Overview</label>
          <textarea
            className="input min-h-[100px] resize-y"
            value={form.overview}
            onChange={(e) => set('overview', e.target.value)}
          />
        </div>
        {err && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            {mode === 'create' ? 'Create topic' : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteModal({
  topic,
  onClose,
  onSuccess,
}: {
  topic: Topic;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: () => api(`/topics/${topic.id}`, { method: 'DELETE' }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });
  return (
    <Modal title="Delete topic?" onClose={onClose}>
      <p className="text-[14px] text-ink-body">
        This will permanently delete <strong className="text-ink">{topic.name}</strong> and cascade-delete its
        concepts and extras. This cannot be undone.
      </p>
      {err && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
        <button onClick={() => m.mutate()} className="btn btn-danger btn-md" disabled={m.isPending}>
          {m.isPending && <Loader2 size={14} className="animate-spin" />}
          Delete topic
        </button>
      </div>
    </Modal>
  );
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`card w-full ${wide ? 'max-w-2xl' : 'max-w-md'} my-8 p-6`}>
        <div className="mb-5 flex items-start justify-between">
          <h3 className="font-display text-[18px] font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
