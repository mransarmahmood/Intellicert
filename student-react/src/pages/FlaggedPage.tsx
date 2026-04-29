import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Flag, Check, Trash2 } from 'lucide-react';
import { api } from '../lib/api';

type FlaggedQuiz = {
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
  note: string | null;
  flagged_at: string;
};

export default function FlaggedPage() {
  const qc = useQueryClient();
  const flaggedQ = useQuery({
    queryKey: ['flagged'],
    queryFn: () => api<{ quizzes: FlaggedQuiz[]; total: number }>('/flagged'),
  });

  const unflag = useMutation({
    mutationFn: (id: number) => api(`/flagged/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flagged'] }),
  });

  return (
    <div className="wrap py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-700 ring-1 ring-purple-500/20">
          <Flag size={12} /> Exam prep
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink sm:text-4xl">Flagged questions</h1>
        <p className="mt-2 text-[15px] text-ink-body">
          Questions you've flagged for later review during a quiz session.
        </p>
      </div>

      {flaggedQ.isLoading ? (
        <div className="grid place-items-center py-20 text-ink-dim"><Loader2 className="animate-spin" /></div>
      ) : !flaggedQ.data?.quizzes.length ? (
        <div className="card grid place-items-center py-16 text-center">
          <Flag size={28} className="mb-3 text-ink-muted" />
          <div className="font-display text-[14px] font-semibold text-ink">Nothing flagged yet</div>
          <p className="mt-1 max-w-sm text-[13px] text-ink-dim">
            Open a quiz, hit the flag icon next to a tricky question, and it will appear here for focused review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {flaggedQ.data.quizzes.map((q) => {
            const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
            return (
              <div key={q.id} className="card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-surface px-1.5 py-0.5 text-[11px] text-ink-dim">{q.quiz_key}</code>
                      <span className="badge badge-slate">{q.domain_id}</span>
                    </div>
                    <p className="mt-3 font-semibold text-ink">{q.question}</p>
                  </div>
                  <button
                    onClick={() => unflag.mutate(q.id)}
                    className="btn btn-ghost btn-sm hover:!border-red-300 hover:!bg-red-50 hover:!text-red-700"
                    title="Unflag"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-1.5">
                  {opts.map((opt, i) => {
                    const isCorrect = i === q.correct_index;
                    return (
                      <div
                        key={i}
                        className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] ${
                          isCorrect ? 'bg-green-50 text-green-800 ring-1 ring-green-500/20' : 'text-ink-body'
                        }`}
                      >
                        {isCorrect && <Check size={13} className="mt-0.5 shrink-0 text-green-600" />}
                        <span className="font-bold uppercase text-ink-dim">{String.fromCharCode(65 + i)}.</span>
                        <span className="line-clamp-2">{opt}</span>
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="mt-3 rounded-lg border border-ink-line bg-surface p-3 text-[12.5px] text-ink-body">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-ink-dim">Detail Understanding</div>
                    <p className="mt-1">{q.explanation}</p>
                  </div>
                )}
                {q.note && (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[12px] text-ink-body">
                    <strong className="text-amber-700">Your note: </strong>{q.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
