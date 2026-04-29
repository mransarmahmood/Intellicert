import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Activity, Filter } from 'lucide-react';
import { api } from '../lib/api';

type Log = {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: number | null;
  details: string | null;
  created_at: string;
};
type Resp = { logs: Log[]; total: number; entity_types: string[]; actions: string[] };

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700 ring-green-500/20',
  update: 'bg-blue-100 text-blue-700 ring-blue-500/20',
  delete: 'bg-red-100 text-red-700 ring-red-500/20',
  login:  'bg-purple-100 text-purple-700 ring-purple-500/20',
  logout: 'bg-slate-100 text-slate-700 ring-slate-500/20',
};

export default function ActivityLogPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');

  const logsQ = useQuery({
    queryKey: ['activity-log', entityType, action],
    queryFn: () => api<Resp>('/activity-log', {
      params: { entity_type: entityType || undefined, action: action || undefined, limit: 200 },
    }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Activity log</h1>
          <p className="mt-1 text-[14px] text-ink-dim">
            {logsQ.data ? `${logsQ.data.total} most-recent events` : 'Loading...'}
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter size={14} className="text-ink-dim" />
        <select value={action} onChange={(e) => setAction(e.target.value)} className="input max-w-xs">
          <option value="">All actions</option>
          {logsQ.data?.actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="input max-w-xs">
          <option value="">All entity types</option>
          {logsQ.data?.entity_types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {logsQ.isLoading ? (
          <div className="grid place-items-center py-16 text-ink-dim"><Loader2 className="animate-spin" /></div>
        ) : !logsQ.data?.logs.length ? (
          <div className="grid place-items-center py-16 text-center">
            <Activity size={28} className="mb-3 text-ink-muted" />
            <p className="text-[13px] text-ink-dim">No activity yet</p>
          </div>
        ) : (
          <table className="w-full text-left text-[13.5px]">
            <thead className="border-b border-ink-line bg-surface text-[11px] font-bold uppercase tracking-wider text-ink-dim">
              <tr>
                <th className="px-5 py-3 w-16">ID</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
                <th className="px-5 py-3">Details</th>
                <th className="px-5 py-3 w-44">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {logsQ.data.logs.map((l) => (
                <tr key={l.id} className="hover:bg-surface">
                  <td className="px-5 py-3 font-mono text-[11.5px] text-ink-dim">#{l.id}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${ACTION_COLORS[l.action] ?? 'badge-slate'}`}>{l.action}</span>
                  </td>
                  <td className="px-5 py-3">
                    {l.entity_type ? (
                      <span className="font-mono text-[12px] text-ink-body">
                        {l.entity_type}{l.entity_id != null && <span className="text-ink-dim">#{l.entity_id}</span>}
                      </span>
                    ) : <span className="text-ink-muted">—</span>}
                  </td>
                  <td className="px-5 py-3 text-ink-body">{l.details ?? <span className="text-ink-muted">—</span>}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-dim">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
