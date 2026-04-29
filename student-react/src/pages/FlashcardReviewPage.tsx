import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2 } from 'lucide-react';

type Card = { id: number; front: string; back: string };

export default function FlashcardReviewPage() {
  const { flashcardId } = useParams();
  const id = Number(flashcardId);
  const qc = useQueryClient();
  const [showBack, setShowBack] = useState(false);

  const q = useQuery({
    queryKey: ['memory-card', id],
    queryFn: () => api<{ flashcards: Card[]; total: number }>('/flashcards'),
  });

  const card = useMemo(() => (q.data?.flashcards ?? []).find((c) => c.id === id), [q.data, id]);
  const m = useMutation({
    mutationFn: (quality: 'again' | 'hard' | 'good' | 'easy') =>
      api(`/memory/flashcards/${id}/review`, { method: 'POST', body: JSON.stringify({ quality }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memory-daily-queue'] });
      qc.invalidateQueries({ queryKey: ['memory-dashboard'] });
      setShowBack(false);
    },
  });

  if (q.isLoading) return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;
  if (!card) return <div className="wrap py-10"><div className="card p-6 text-ink-dim">Flashcard not found.</div></div>;

  return (
    <div className="wrap py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink">Flashcard Review</h1>
      <div className="card mt-6 p-6">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ink-dim">Front</div>
        <div className="mt-2 text-[18px] font-semibold text-ink">{card.front}</div>
        {showBack && (
          <>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-ink-dim">Back</div>
            <div className="mt-2 text-[15px] text-ink-body">{card.back}</div>
          </>
        )}
        {!showBack ? (
          <button onClick={() => setShowBack(true)} className="btn btn-primary btn-md mt-5">Reveal answer</button>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => m.mutate('again')} className="btn btn-ghost btn-sm">Again</button>
            <button onClick={() => m.mutate('hard')} className="btn btn-ghost btn-sm">Hard</button>
            <button onClick={() => m.mutate('good')} className="btn btn-primary btn-sm">Good</button>
            <button onClick={() => m.mutate('easy')} className="btn btn-primary btn-sm">Easy</button>
          </div>
        )}
      </div>
    </div>
  );
}
