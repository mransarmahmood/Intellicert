import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Loader2, ArrowRight, Image as ImageIconLucide } from 'lucide-react';
import ImageOcclusion, { type OcclusionRegion } from '../components/ImageOcclusion';

type Item = {
  id: number;
  concept_id: number | null;
  flashcard_id: number | null;
  status: 'pending' | 'completed' | 'skipped';
  concept?: { title: string };
  flashcard?: { front: string };
};

type OcclusionCard = {
  id: number;
  topic_id: number;
  topic_name: string;
  image_url: string | null;
  alt: string;
  regions: OcclusionRegion[];
};

export default function DailyRevisionQueuePage() {
  const q = useQuery({
    queryKey: ['memory-daily-queue'],
    queryFn: () => api<{ queue: Item[]; total: number }>('/memory/daily-queue'),
  });

  // Track 5 — Image occlusion drill section.
  const occlusionsQ = useQuery({
    queryKey: ['memory-occlusions'],
    queryFn: () => api<{ cards: OcclusionCard[]; total: number }>('/memory/occlusion-cards'),
  });

  if (q.isLoading) return <div className="grid min-h-[60vh] place-items-center text-ink-dim"><Loader2 className="animate-spin" /></div>;

  const occlusions = (occlusionsQ.data?.cards ?? []).filter((c) => c.image_url && c.regions.length > 0);

  return (
    <div className="wrap py-10">
      <h1 className="font-display text-3xl font-extrabold text-ink">Daily Revision Queue</h1>
      <p className="mt-2 text-[14px] text-ink-body">Your due memory reviews for today.</p>

      <div className="mt-6 space-y-2">
        {(q.data?.queue ?? []).map((it) => (
          <div key={it.id} className="card flex items-center justify-between p-4">
            <div>
              <div className="font-semibold text-ink">{it.concept?.title ?? it.flashcard?.front ?? 'Review item'}</div>
              <div className="text-[12px] text-ink-dim capitalize">{it.status}</div>
            </div>
            {it.flashcard_id ? (
              <Link to={`/memory/flashcards/${it.flashcard_id}`} className="btn btn-primary btn-sm">Review <ArrowRight size={13} aria-hidden="true" /></Link>
            ) : (
              <span className="btn btn-ghost btn-sm opacity-70">Concept-linked</span>
            )}
          </div>
        ))}
      </div>

      {/* Track 5 — Image occlusion drills */}
      {occlusions.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <ImageIconLucide size={18} className="text-purple-700" aria-hidden="true" />
            <h2 className="font-display text-xl font-bold text-ink">Diagram drills</h2>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
              {occlusions.length} {occlusions.length === 1 ? 'card' : 'cards'}
            </span>
          </div>
          <p className="mb-4 text-[13.5px] text-ink-body">
            Tap each blurred region to recall what's hidden. Image occlusion turns
            your visuals into active retrieval cards — most effective right before sleep.
          </p>
          <div className="space-y-6">
            {occlusions.map((card) => (
              <div key={card.id} className="card p-4">
                <div className="mb-2 flex items-baseline justify-between">
                  <Link to={`/topics/${card.topic_id}`} className="font-display text-[14px] font-bold text-ink hover:underline">
                    {card.topic_name}
                  </Link>
                  <span className="text-[11px] text-ink-dim">{card.regions.length} regions</span>
                </div>
                <ImageOcclusion
                  imageUrl={card.image_url!}
                  alt={card.alt}
                  regions={card.regions}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
