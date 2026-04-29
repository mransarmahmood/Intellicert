import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Loader2, CheckCircle2, XCircle, Activity, ArrowRight, Filter, AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api';

type TopicRow = {
  id: number;
  topic_key: string;
  domain_id: string;
  name: string;
  has_overview: boolean;
  concepts: number;
  flashcards: number;
  quizzes: number;
  mnemonics: number;
  formulas: number;
  regulations: number;
  examtips: number;
  learning_steps: number;
  has_image: boolean;
  has_discussion: boolean;
  score: number;
  max_score: number;
  percent: number;
};

type Resp = { topics: TopicRow[]; total: number; avg_percent: number };

const DOMAIN_LABELS: Record<string, string> = {
  domain1: 'D1 · Safety Principles',
  domain2: 'D2 · Program Mgmt',
  domain3: 'D3 · Risk Mgmt',
  domain4: 'D4 · Emergency Mgmt',
  domain5: 'D5 · Environmental',
  domain6: 'D6 · Occupational Health',
  domain7: 'D7 · Training',
};

export default function TopicCompletenessPage() {
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [minPct, setMinPct] = useState<number>(0);
  const [maxPct, setMaxPct] = useState<number>(100);

  const { data, isLoading } = useQuery({
    queryKey: ['topic-completeness'],
    queryFn: () => api<Resp>('/admin/topics/completeness'),
  });

  const filtered = useMemo(() => {
    return (data?.topics || []).filter(
      (t) => (!domainFilter || t.domain_id === domainFilter) &&
             t.percent >= minPct && t.percent <= maxPct
    );
  }, [data, domainFilter, minPct, maxPct]);

  const buckets = useMemo(() => {
    const list = data?.topics || [];
    return {
      empty: list.filter((t) => t.percent <= 25).length,
      starter: list.filter((t) => t.percent > 25 && t.percent <= 50).length,
      partial: list.filter((t) => t.percent > 50 && t.percent <= 75).length,
      ready: list.filter((t) => t.percent > 75).length,
    };
  }, [data]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Topic Completeness</h1>
          <p className="mt-1 text-[14px] text-ink-dim">
            See at a glance which topics are missing concepts, quizzes, flashcards, or extras.
          </p>
        </div>
        {data && (
          <div className="text-right">
            <div className="font-display text-3xl font-extrabold text-brand-600">{data.avg_percent}%</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">Avg coverage</div>
          </div>
        )}
      </div>

      {/* Bucket counts */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BucketCard label="Empty (≤25%)"   value={buckets.empty}   tone="red"    onClick={() => { setMinPct(0); setMaxPct(25); }} />
        <BucketCard label="Starter (26–50%)" value={buckets.starter} tone="amber"  onClick={() => { setMinPct(26); setMaxPct(50); }} />
        <BucketCard label="Partial (51–75%)" value={buckets.partial} tone="blue"   onClick={() => { setMinPct(51); setMaxPct(75); }} />
        <BucketCard label="Ready (>75%)"    value={buckets.ready}   tone="green"  onClick={() => { setMinPct(76); setMaxPct(100); }} />
      </div>

      {/* Filters */}
      <div className="card mb-5 flex flex-wrap items-center gap-3 px-4 py-3">
        <Filter size={14} className="text-ink-dim" />
        <select className="input max-w-xs py-1.5 text-[13px]" value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
          <option value="">All domains</option>
          {Object.entries(DOMAIN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <span className="text-[12px] text-ink-dim">{minPct}% – {maxPct}%</span>
        {(domainFilter || minPct !== 0 || maxPct !== 100) && (
          <button onClick={() => { setDomainFilter(''); setMinPct(0); setMaxPct(100); }}
            className="text-[11px] font-bold uppercase tracking-wider text-ink-dim hover:text-ink ml-auto">
            Clear filters
          </button>
        )}
        <span className="text-[11px] text-ink-dim ml-auto">{filtered.length} of {data?.total || 0} topics</span>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20"><Loader2 className="animate-spin text-ink-dim" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-ink-dim">
          <Activity size={42} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-ink">No topics match the current filters</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-ink-line bg-surface text-[10.5px] font-bold uppercase tracking-wider text-ink-dim">
              <tr>
                <th className="px-4 py-3">Topic</th>
                <th className="px-3 py-3 w-16 text-center" title="Overview">OV</th>
                <th className="px-3 py-3 w-12 text-center" title="Concepts">CN</th>
                <th className="px-3 py-3 w-12 text-center" title="Flashcards">FL</th>
                <th className="px-3 py-3 w-12 text-center" title="Quizzes">QZ</th>
                <th className="px-3 py-3 w-12 text-center" title="Mnemonics">MN</th>
                <th className="px-3 py-3 w-12 text-center" title="Formulas/Regulations/Tips">FR</th>
                <th className="px-3 py-3 w-12 text-center" title="Learning steps">LS</th>
                <th className="px-3 py-3 w-12 text-center" title="Image">IM</th>
                <th className="px-3 py-3 w-24 text-right">Score</th>
                <th className="px-3 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-line">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-surface">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink truncate max-w-[260px]">{t.name}</div>
                    <div className="text-[11px] text-ink-dim">{DOMAIN_LABELS[t.domain_id] || t.domain_id}</div>
                  </td>
                  <CheckCell ok={t.has_overview} />
                  <CountCell n={t.concepts} threshold={3} />
                  <CountCell n={t.flashcards} threshold={5} />
                  <CountCell n={t.quizzes} threshold={3} />
                  <CountCell n={t.mnemonics} threshold={1} />
                  <CountCell n={t.formulas + t.regulations + t.examtips} threshold={1} />
                  <CountCell n={t.learning_steps} threshold={3} />
                  <CheckCell ok={t.has_image} />
                  <td className="px-3 py-3 text-right">
                    <ScoreBar percent={t.percent} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link to={`/topics/${t.id}`} className="grid h-7 w-7 place-items-center rounded text-ink-dim hover:bg-slate-100 hover:text-ink ml-auto">
                      <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11.5px] text-ink-dim">
        <span><strong className="font-bold text-ink">OV</strong> = Overview</span>
        <span><strong className="font-bold text-ink">CN</strong> = Concepts (≥3)</span>
        <span><strong className="font-bold text-ink">FL</strong> = Flashcards (≥5)</span>
        <span><strong className="font-bold text-ink">QZ</strong> = Quizzes (≥3)</span>
        <span><strong className="font-bold text-ink">MN</strong> = Mnemonic</span>
        <span><strong className="font-bold text-ink">FR</strong> = Formula/Reg/Tip</span>
        <span><strong className="font-bold text-ink">LS</strong> = Learning steps (≥3)</span>
        <span><strong className="font-bold text-ink">IM</strong> = Image</span>
      </div>
    </div>
  );
}

function CheckCell({ ok }: { ok: boolean }) {
  return (
    <td className="px-3 py-3 text-center">
      {ok ? (
        <CheckCircle2 size={15} className="text-emerald-600 mx-auto" />
      ) : (
        <XCircle size={15} className="text-rose-400 mx-auto" />
      )}
    </td>
  );
}

function CountCell({ n, threshold }: { n: number; threshold: number }) {
  const pass = n >= threshold;
  return (
    <td className="px-3 py-3 text-center">
      <span className={`inline-block min-w-6 rounded px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
        pass ? 'bg-emerald-50 text-emerald-700' : n === 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
      }`}>
        {n}
      </span>
    </td>
  );
}

function ScoreBar({ percent }: { percent: number }) {
  const tone =
    percent > 75 ? 'bg-emerald-500'
    : percent > 50 ? 'bg-blue-500'
    : percent > 25 ? 'bg-amber-500'
    : 'bg-rose-500';
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full ${tone}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="font-display text-[12px] font-bold tabular-nums text-ink min-w-9 text-right">{percent}%</span>
    </div>
  );
}

function BucketCard({
  label, value, tone, onClick,
}: { label: string; value: number; tone: 'red' | 'amber' | 'blue' | 'green'; onClick: () => void }) {
  const toneMap = {
    red:    { bg: 'bg-rose-50',    text: 'text-rose-700',    icon: <AlertTriangle className="text-rose-500" size={18} /> },
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: <Activity className="text-amber-600" size={18} /> },
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: <Activity className="text-blue-600" size={18} /> },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckCircle2 className="text-emerald-600" size={18} /> },
  } as const;
  const t = toneMap[tone];
  return (
    <button onClick={onClick} className={`${t.bg} card border-0 px-4 py-3 text-left hover:-translate-y-0.5 transition-transform`}>
      <div className="flex items-center justify-between mb-1">
        {t.icon}
        <div className={`font-display text-2xl font-extrabold ${t.text}`}>{value}</div>
      </div>
      <div className={`text-[11px] font-bold uppercase tracking-wider ${t.text}`}>{label}</div>
    </button>
  );
}
