import { useState } from 'react';
import { Eye, EyeOff, RotateCw } from 'lucide-react';

export type OcclusionRegion = {
  /** percentage 0-100 of image natural width */
  x: number;
  y: number;
  w: number;
  h: number;
  answer: string;
  /** optional grouping — regions in the same group reveal together */
  group?: string;
};

type Props = {
  imageUrl: string;
  alt: string;
  regions: OcclusionRegion[];
  /** When true, all masks start hidden (study mode). When false (review mode),
   *  start hidden and reveal on tap. Default: review mode. */
  startHidden?: boolean;
  /** Called when the learner reveals all regions. Used for SRS grading. */
  onAllRevealed?: () => void;
};

/**
 * Track 5 — Image occlusion card.
 *
 * Renders an image with rectangular masks. Each mask hides a labeled region
 * of the diagram; tapping it reveals the answer. After the learner has
 * revealed every mask, the consumer (DailyRevisionQueuePage etc.) can grade
 * recall and feed the result back into the SRS.
 *
 * Coordinates are stored as percentages so the same regions survive
 * arbitrary image scaling.
 */
export default function ImageOcclusion({
  imageUrl,
  alt,
  regions,
  startHidden = true,
  onAllRevealed,
}: Props) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const reveal = (idx: number) => {
    setRevealed((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      // Reveal grouped regions together.
      const targetGroup = regions[idx].group;
      regions.forEach((r, i) => {
        if (i === idx) next.add(i);
        else if (targetGroup && r.group === targetGroup) next.add(i);
      });
      if (next.size === regions.length) onAllRevealed?.();
      return next;
    });
  };
  const reset = () => setRevealed(new Set());
  const revealAll = () => {
    setRevealed(new Set(regions.map((_, i) => i)));
    onAllRevealed?.();
  };

  return (
    <div className="space-y-3">
      <div
        className="relative w-full overflow-hidden rounded-xl border border-ink-line bg-white"
        role="img"
        aria-label={alt}
      >
        <img src={imageUrl} alt={alt} className="block w-full select-none" draggable={false} />
        {regions.map((r, i) => {
          const isRevealed = revealed.has(i) || !startHidden;
          return (
            <button
              key={i}
              type="button"
              onClick={() => reveal(i)}
              aria-label={isRevealed ? `Region ${i + 1}: ${r.answer}` : `Hidden region ${i + 1}, tap to reveal`}
              aria-pressed={isRevealed}
              className={`absolute grid place-items-center text-center font-semibold transition-all ${
                isRevealed
                  ? 'cursor-default rounded-md bg-emerald-500/85 text-white shadow-sm'
                  : 'cursor-pointer rounded-md bg-slate-700/85 text-white/95 hover:bg-slate-600/90 active:scale-95'
              }`}
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                width: `${r.w}%`,
                height: `${r.h}%`,
                fontSize: 'clamp(10px, 1.4vw, 14px)',
                padding: '2px 4px',
              }}
            >
              {isRevealed ? r.answer : '?'}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 text-[12.5px]">
        <div className="text-ink-dim">
          {revealed.size} / {regions.length} revealed
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn btn-ghost btn-sm" aria-label="Hide all masks">
            <EyeOff size={12} aria-hidden="true" /> Hide all
          </button>
          <button onClick={revealAll} className="btn btn-ghost btn-sm" aria-label="Reveal all masks">
            <Eye size={12} aria-hidden="true" /> Show all
          </button>
          <button onClick={reset} className="btn btn-ghost btn-sm" aria-label="Reset and try again">
            <RotateCw size={12} aria-hidden="true" /> Retry
          </button>
        </div>
      </div>
    </div>
  );
}
