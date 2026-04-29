import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Search, Pencil, Trash2, Check, Upload } from 'lucide-react';
import { api } from '../lib/api';
import Modal from '../components/Modal';
import ImportModal from '../components/ImportModal';

type Domain = { id: string; number: number; name: string };
type Quiz = {
  id: number;
  quiz_key: string;
  domain_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  explanation: string | null;
  domain?: Domain;
};

export default function QuizzesPage() {
  const qc = useQueryClient();
  const [domainFilter, setDomainFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [deleting, setDeleting] = useState<Quiz | null>(null);
  const [showImport, setShowImport] = useState(false);

  const domainsQ = useQuery({ queryKey: ['domains'], queryFn: () => api<{ domains: Domain[] }>('/domains') });

  const quizzesQ = useQuery({
    queryKey: ['quizzes', domainFilter, debounced],
    queryFn: () =>
      api<{ quizzes: Quiz[]; total: number }>('/quizzes', {
        params: { domain_id: domainFilter || undefined, search: debounced || undefined },
      }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['quizzes'] });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-ink">Quizzes</h1>
          <p className="mt-1 text-[14px] text-ink-dim">{quizzesQ.data ? `${quizzesQ.data.total} total` : 'Loading...'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="btn btn-ghost btn-md">
            <Upload size={16} /> Import CSV
          </button>
          <button onClick={() => setCreating(true)} className="btn btn-primary btn-md" disabled={!domainsQ.data?.domains.length}>
            <Plus size={16} /> New quiz
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="input max-w-xs">
          <option value="">All domains</option>
          {domainsQ.data?.domains.map((d) => (
            <option key={d.id} value={d.id}>{d.number}. {d.name}</option>
          ))}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); setDebounced(search); }} className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search question or key..." className="input pl-9" />
          </div>
          <button type="submit" className="btn btn-ghost btn-md">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {quizzesQ.isLoading ? (
          <div className="grid place-items-center py-16 text-ink-dim"><Loader2 className="animate-spin" /></div>
        ) : quizzesQ.data?.quizzes.length ? (
          <div className="divide-y divide-ink-line">
            {quizzesQ.data.quizzes.map((q) => {
              const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
              return (
                <div key={q.id} className="p-5 hover:bg-surface">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-ink-dim">{q.quiz_key}</code>
                        {q.domain && <span className="badge badge-brand">{q.domain.number}. {q.domain.name}</span>}
                      </div>
                      <div className="mt-2 font-semibold text-ink">{q.question}</div>
                      <div className="mt-3 grid grid-cols-2 gap-1.5">
                        {opts.map((opt, i) => (
                          <div
                            key={i}
                            className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] ${
                              i === q.correct_index ? 'bg-green-50 text-green-800 ring-1 ring-green-500/20' : 'text-ink-body'
                            }`}
                          >
                            {i === q.correct_index && <Check size={13} className="mt-0.5 shrink-0 text-green-600" />}
                            <span className="font-bold uppercase text-ink-dim">{String.fromCharCode(65 + i)}.</span>
                            <span className="line-clamp-2">{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button onClick={() => setEditing(q)} className="btn btn-ghost btn-sm"><Pencil size={12} /></button>
                      <button onClick={() => setDeleting(q)} className="btn btn-ghost btn-sm hover:!border-red-300 hover:!bg-red-50 hover:!text-red-700"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-[13px] text-ink-dim">No quizzes found</div>
        )}
      </div>

      {showImport && (
        <ImportModal
          config={{
            title: 'Import quizzes from CSV',
            importPath: '/bulk-import/quizzes',
            requiredColumns: [
              'quiz_key', 'domain_id', 'question',
              'option_a', 'option_b', 'option_c', 'option_d',
              'correct_index (0-3)', 'explanation (optional)',
            ],
            hint: 'Required columns:',
            templateRows: 'quiz_key,domain_id,question,option_a,option_b,option_c,option_d,correct_index,explanation\nq1,d3,What is PtD?,Prevention through Design,...,...,...,0,',
          }}
          onClose={() => setShowImport(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ['quizzes'] })}
        />
      )}
      {(creating || editing) && domainsQ.data && (
        <QuizForm
          mode={creating ? 'create' : 'edit'}
          quiz={editing ?? undefined}
          domains={domainsQ.data.domains}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSuccess={() => { setCreating(false); setEditing(null); refresh(); }}
        />
      )}
      {deleting && (
        <DeleteQuizModal quiz={deleting} onClose={() => setDeleting(null)} onSuccess={() => { setDeleting(null); refresh(); }} />
      )}
    </div>
  );
}

function QuizForm({
  mode, quiz, domains, onClose, onSuccess,
}: {
  mode: 'create' | 'edit';
  quiz?: Quiz;
  domains: Domain[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    quiz_key: quiz?.quiz_key ?? '',
    domain_id: quiz?.domain_id ?? domains[0]?.id ?? '',
    question: quiz?.question ?? '',
    option_a: quiz?.option_a ?? '',
    option_b: quiz?.option_b ?? '',
    option_c: quiz?.option_c ?? '',
    option_d: quiz?.option_d ?? '',
    correct_index: quiz?.correct_index ?? 0,
    explanation: quiz?.explanation ?? '',
  });
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: () =>
      mode === 'create'
        ? api('/quizzes', { method: 'POST', body: JSON.stringify(form) })
        : api(`/quizzes/${quiz!.id}`, { method: 'PATCH', body: JSON.stringify(form) }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <Modal title={mode === 'create' ? 'New quiz' : 'Edit quiz'} onClose={onClose} size="lg">
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); m.mutate(); }} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Quiz key *</label>
            <input className="input" value={form.quiz_key} onChange={(e) => setForm({ ...form, quiz_key: e.target.value })} required />
          </div>
          <div>
            <label className="label">Domain *</label>
            <select className="input" value={form.domain_id} onChange={(e) => setForm({ ...form, domain_id: e.target.value })} required>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.number}. {d.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Question *</label>
          <textarea className="input min-h-[70px] resize-y" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['a', 'b', 'c', 'd'] as const).map((letter, i) => {
            const key = `option_${letter}` as 'option_a' | 'option_b' | 'option_c' | 'option_d';
            return (
              <div key={letter}>
                <label className="label flex items-center gap-2">
                  <input
                    type="radio"
                    checked={form.correct_index === i}
                    onChange={() => setForm({ ...form, correct_index: i })}
                    className="cursor-pointer accent-brand-600"
                  />
                  Option {letter.toUpperCase()} {form.correct_index === i && <span className="text-green-600">(correct)</span>}
                </label>
                <input className="input" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
              </div>
            );
          })}
        </div>
        <div>
          <label className="label">Detail Understanding</label>
          <textarea className="input min-h-[70px] resize-y" value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
        </div>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
          <button type="submit" className="btn btn-primary btn-md" disabled={m.isPending}>
            {m.isPending && <Loader2 size={14} className="animate-spin" />}
            {mode === 'create' ? 'Create' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteQuizModal({ quiz, onClose, onSuccess }: { quiz: Quiz; onClose: () => void; onSuccess: () => void }) {
  const [err, setErr] = useState('');
  const m = useMutation({
    mutationFn: () => api(`/quizzes/${quiz.id}`, { method: 'DELETE' }),
    onSuccess,
    onError: (e: Error) => setErr(e.message),
  });
  return (
    <Modal title="Delete quiz?" onClose={onClose}>
      <p className="text-[14px] text-ink-body">Permanently delete <strong className="text-ink">{quiz.quiz_key}</strong>?</p>
      {err && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{err}</div>}
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="btn btn-ghost btn-md">Cancel</button>
        <button onClick={() => m.mutate()} className="btn btn-danger btn-md" disabled={m.isPending}>
          {m.isPending && <Loader2 size={14} className="animate-spin" />} Delete
        </button>
      </div>
    </Modal>
  );
}
